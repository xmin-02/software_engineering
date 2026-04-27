import re
from datetime import datetime
from typing import Any

import requests
from sqlalchemy.orm import Session

from backend.config import settings
from backend.models.place import Place, PlaceReview
from crawler.base import BaseCrawler
from crawler.common.rate_limiter import RateLimiter

API_URL = "https://openapi.naver.com/v1/search/blog.json"
HTML_TAG_PATTERN = re.compile(r"<[^>]+>")

# 지점/동/로로 끝나는 토큰 (지점명 제거용)
BRANCH_PATTERN = re.compile(r"(천안|두정|불당|신부|성정|쌍용|백석|아산|병천)\S*[점동로]$")

# 매장명/주소에서 추출할 지역 토큰
REGION_PATTERN = re.compile(
    r"(천안|두정|불당|신부|성정|쌍용|백석|아산|병천|동남구|서북구|성환|입장|풍세|광덕|봉명|다가|유량|구성)"
)

# 음식점/카페 리뷰가 아닐 가능성이 높은 카테고리 단어
DISALLOW_PATTERN = re.compile(
    r"(미용실|헤어샵|헤어살롱|헤어컬러|탈색|염색|네일아트|네일샵|마사지샵|"
    r"피부과|성형외과|치과의원|안과의원|이비인후과|정형외과|산부인과|약국|두피케어|클리닉)"
)


class BlogReviewCrawler(BaseCrawler):
    """네이버 블로그 검색 API로 맛집/카페 리뷰 수집"""

    def __init__(self, display: int = 10, max_start: int = 11):
        super().__init__(source="blog_review")
        self.display = display
        self.max_start = max_start
        self.rate_limiter = RateLimiter(min_interval=1.0)
        self.headers = {
            "X-Naver-Client-Id": settings.naver_client_id,
            "X-Naver-Client-Secret": settings.naver_client_secret,
        }

    def _clean_html(self, text: str) -> str:
        text = HTML_TAG_PATTERN.sub("", text)
        text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
        text = text.replace("&quot;", '"').replace("&#39;", "'")
        return text.strip()

    def _parse_date(self, date_str: str) -> datetime | None:
        try:
            return datetime.strptime(date_str, "%Y%m%d")
        except (ValueError, TypeError):
            return None

    def _extract_name_keywords(self, place_name: str) -> list[str]:
        """장소명에서 핵심 키워드 추출 (지점명 제외)"""
        words = place_name.split()
        keywords = [w for w in words if not BRANCH_PATTERN.search(w)]
        return keywords if keywords else [words[0]]

    def _extract_region_tokens(self, place_name: str, address: str | None = None) -> set[str]:
        """매장명·주소에서 지역 토큰 추출 (천안/동/구 단위)"""
        tokens = set(REGION_PATTERN.findall(place_name))
        if address:
            tokens.update(REGION_PATTERN.findall(address))
        return tokens

    @staticmethod
    def _compact(s: str) -> str:
        return re.sub(r"\s+", "", s or "")

    def _is_relevant_review(
        self,
        title: str,
        description: str,
        place_name: str,
        address: str | None = None,
    ) -> bool:
        """리뷰가 해당 장소와 관련 있는지 판별 (수집 시 strict 기준)"""
        text = (title or "") + " " + (description or "")
        text_c = self._compact(text)
        name_c = self._compact(place_name)

        # 1) 매장 풀네임(공백 무시) 통째 매치 → 가장 확실
        if name_c and name_c in text_c:
            # 풀네임이 들어 있어도 미용/병원 글이면 차단
            return not DISALLOW_PATTERN.search(text)

        # 2) 핵심 키워드 매치 필수
        keywords = [self._compact(k) for k in self._extract_name_keywords(place_name)]
        keywords = [k for k in keywords if len(k) >= 2]
        if not any(k in text_c for k in keywords):
            return False

        # 3) 지역 토큰 매치 필수 (이름·주소 어느 쪽에서든 추출됐을 때)
        regions = self._extract_region_tokens(place_name, address)
        if regions and not any(r in text_c for r in regions):
            return False

        # 4) 음식점/카페와 무관한 카테고리 단어가 있으면 차단
        if DISALLOW_PATTERN.search(text):
            return False

        return True

    def _is_clearly_irrelevant(
        self,
        title: str,
        description: str,
        place_name: str,
        address: str | None = None,
    ) -> bool:
        """클린업용 보수적 기준 — 확실히 무관한 리뷰만 True.

        '매장명·핵심 키워드도 본문에 없고, 미용/병원/네일 등 카테고리 단어가 있는 글'을
        무관 리뷰로 간주. 정상 리뷰 보존을 우선.
        """
        text = (title or "") + " " + (description or "")
        text_c = self._compact(text)
        name_c = self._compact(place_name)

        if name_c and name_c in text_c:
            return False

        keywords = [self._compact(k) for k in self._extract_name_keywords(place_name)]
        keywords = [k for k in keywords if len(k) >= 2]
        if any(k in text_c for k in keywords):
            return False

        return bool(DISALLOW_PATTERN.search(text))

    def _fetch_reviews(self, place: Place) -> list[dict[str, Any]]:
        """특정 장소의 블로그 리뷰 검색"""
        results = []
        query = f"천안 {place.name} 후기"

        for start in range(1, self.max_start, self.display):
            self.rate_limiter.wait()
            params = {
                "query": query,
                "display": self.display,
                "start": start,
                "sort": "date",
            }
            resp = requests.get(API_URL, headers=self.headers, params=params, timeout=10)
            resp.raise_for_status()
            items = resp.json().get("items", [])
            if not items:
                break

            for item in items:
                title = self._clean_html(item.get("title", ""))
                description = self._clean_html(item.get("description", ""))
                if not self._is_relevant_review(title, description, place.name, place.address):
                    continue
                results.append({
                    "review_text": description,
                    "review_url": item.get("link", ""),
                    "published_at": self._parse_date(item.get("postdate")),
                })

        return results

    def crawl(self) -> list[dict[str, Any]]:
        """DB에 저장된 장소 목록 기반 리뷰 수집"""
        from backend.database import SessionLocal
        db = SessionLocal()
        try:
            places = db.query(Place).all()
            results = []
            for place in places:
                reviews = self._fetch_reviews(place)
                for review in reviews:
                    review["place_id"] = place.id
                    review["source"] = "naver_blog"
                    results.append(review)
            return results
        finally:
            db.close()

    def save(self, data: list[dict[str, Any]], db: Session) -> int:
        """리뷰 저장 (URL 기반 중복 체크)"""
        saved = 0
        for item in data:
            if item.get("review_url"):
                exists = (
                    db.query(PlaceReview.id)
                    .filter_by(review_url=item["review_url"])
                    .first()
                )
                if exists:
                    continue
            review = PlaceReview(**item)
            db.add(review)
            saved += 1
        return saved
