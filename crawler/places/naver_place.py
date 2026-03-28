import re
from typing import Any

import requests
from sqlalchemy.orm import Session

from backend.config import settings
from backend.models.place import Place
from crawler.base import BaseCrawler
from crawler.common.rate_limiter import RateLimiter

API_URL = "https://openapi.naver.com/v1/search/local.json"
HTML_TAG_PATTERN = re.compile(r"<[^>]+>")

# 천안 지역 맛집/카페 검색 키워드
SEARCH_QUERIES = [
    "천안 맛집", "천안 카페", "천안 안서동 맛집", "천안 안서동 카페",
    "천안 한식", "천안 양식", "천안 일식", "천안 중식",
    "천안 디저트", "천안 술집", "천안 분식",
]


class NaverPlaceCrawler(BaseCrawler):
    """네이버 지역 검색 API 기반 장소 메타데이터 수집"""

    def __init__(
        self,
        queries: list[str] | None = None,
        display: int = 5,
        max_start: int = 46,
    ):
        super().__init__(source="naver_place")
        self.queries = queries or SEARCH_QUERIES
        self.display = display
        self.max_start = max_start
        self.rate_limiter = RateLimiter(min_interval=1.0)
        self.headers = {
            "X-Naver-Client-Id": settings.naver_client_id,
            "X-Naver-Client-Secret": settings.naver_client_secret,
        }

    def _clean_html(self, text: str) -> str:
        return HTML_TAG_PATTERN.sub("", text).strip()

    def _convert_coord(self, mapx: str, mapy: str) -> tuple[float | None, float | None]:
        """네이버 좌표 → 일반 위경도 변환 (카텍 → WGS84 근사)"""
        try:
            lng = float(mapx) / 10_000_000
            lat = float(mapy) / 10_000_000
            return lat, lng
        except (ValueError, TypeError):
            return None, None

    def _extract_category(self, category: str) -> tuple[str, str]:
        """카테고리 문자열에서 대분류/소분류 추출"""
        parts = category.split(">")
        main_cat = parts[0].strip() if parts else ""
        sub_cat = parts[1].strip() if len(parts) > 1 else ""
        return main_cat, sub_cat

    def _is_alcohol_only(self, category: str) -> bool:
        """술집/바 카테고리 여부"""
        alcohol_keywords = ["술집", "바", "펍", "이자카야", "호프", "맥주"]
        return any(kw in category for kw in alcohol_keywords)

    def _fetch_page(self, query: str, start: int) -> list[dict[str, Any]]:
        self.rate_limiter.wait()
        params = {"query": query, "display": self.display, "start": start}
        resp = requests.get(API_URL, headers=self.headers, params=params, timeout=10)
        resp.raise_for_status()
        return resp.json().get("items", [])

    def crawl(self) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []
        seen_addresses: set[str] = set()

        for query in self.queries:
            for start in range(1, self.max_start, self.display):
                items = self._fetch_page(query, start)
                if not items:
                    break

                for item in items:
                    name = self._clean_html(item.get("title", ""))
                    address = item.get("address", "")

                    # 주소 기반 중복 제거
                    dedup_key = f"{name}_{address}"
                    if dedup_key in seen_addresses:
                        continue
                    seen_addresses.add(dedup_key)

                    # 천안 지역 필터
                    if "천안" not in address:
                        continue

                    lat, lng = self._convert_coord(
                        item.get("mapx", ""), item.get("mapy", "")
                    )
                    category = item.get("category", "")
                    main_cat, sub_cat = self._extract_category(category)

                    results.append({
                        "name": name,
                        "category": main_cat,
                        "sub_category": sub_cat,
                        "address": address,
                        "phone": item.get("telephone", ""),
                        "latitude": lat,
                        "longitude": lng,
                        "is_alcohol_only": self._is_alcohol_only(category),
                        "naver_place_id": item.get("link", ""),
                    })

        return results

    def save(self, data: list[dict[str, Any]], db: Session) -> int:
        """DB 저장 (이름+주소 조합으로 중복 체크)"""
        saved = 0
        for item in data:
            exists = (
                db.query(Place.id)
                .filter_by(name=item["name"], address=item["address"])
                .first()
            )
            if exists:
                continue
            place = Place(**item)
            db.add(place)
            saved += 1
        return saved
