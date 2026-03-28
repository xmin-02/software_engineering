from typing import Any

import requests
from sqlalchemy.orm import Session

from backend.config import settings
from backend.models.place import Place
from crawler.base import BaseCrawler
from crawler.common.rate_limiter import RateLimiter

API_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"

SEARCH_QUERIES = [
    "천안 맛집", "천안 카페", "천안 안서동 맛집", "천안 안서동 카페",
    "천안 한식", "천안 양식", "천안 일식", "천안 중식",
    "천안 디저트", "천안 술집", "천안 분식",
]


class KakaoPlaceCrawler(BaseCrawler):
    """카카오 장소 검색 API 기반 장소 메타데이터 수집"""

    def __init__(
        self,
        queries: list[str] | None = None,
        size: int = 15,
        max_page: int = 3,
    ):
        super().__init__(source="kakao_place")
        self.queries = queries or SEARCH_QUERIES
        self.size = size
        self.max_page = max_page
        self.rate_limiter = RateLimiter(min_interval=0.5)
        self.headers = {
            "Authorization": f"KakaoAK {settings.kakao_rest_api_key}",
        }

    def _extract_category(self, category: str) -> tuple[str, str]:
        """카테고리에서 대분류/소분류 추출"""
        parts = [p.strip() for p in category.split(">")]
        main_cat = parts[1] if len(parts) > 1 else parts[0] if parts else ""
        sub_cat = parts[2] if len(parts) > 2 else ""
        return main_cat, sub_cat

    def _is_alcohol_only(self, category: str) -> bool:
        alcohol_keywords = ["술집", "바", "펍", "이자카야", "호프", "맥주", "주점"]
        return any(kw in category for kw in alcohol_keywords)

    def _fetch_page(self, query: str, page: int) -> tuple[list[dict], bool]:
        """API 한 페이지 호출, (documents, has_next) 반환"""
        self.rate_limiter.wait()
        params = {"query": query, "size": self.size, "page": page}
        resp = requests.get(API_URL, headers=self.headers, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        docs = data.get("documents", [])
        is_end = data.get("meta", {}).get("is_end", True)
        return docs, not is_end

    def crawl(self) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []
        seen: set[str] = set()

        for query in self.queries:
            for page in range(1, self.max_page + 1):
                docs, has_next = self._fetch_page(query, page)
                if not docs:
                    break

                for doc in docs:
                    place_name = doc.get("place_name", "")
                    address = doc.get("address_name", "")

                    dedup_key = f"{place_name}_{address}"
                    if dedup_key in seen:
                        continue
                    seen.add(dedup_key)

                    if "천안" not in address:
                        continue

                    category = doc.get("category_name", "")
                    main_cat, sub_cat = self._extract_category(category)

                    lat = float(doc["y"]) if doc.get("y") else None
                    lng = float(doc["x"]) if doc.get("x") else None

                    results.append({
                        "name": place_name,
                        "category": main_cat,
                        "sub_category": sub_cat,
                        "address": address,
                        "phone": doc.get("phone", ""),
                        "latitude": lat,
                        "longitude": lng,
                        "is_alcohol_only": self._is_alcohol_only(category),
                        "kakao_place_id": doc.get("id", ""),
                    })

                if not has_next:
                    break

        return results

    def save(self, data: list[dict[str, Any]], db: Session) -> int:
        """DB 저장 — 기존 장소면 카카오 ID 업데이트, 없으면 신규 저장"""
        saved = 0
        for item in data:
            existing = (
                db.query(Place)
                .filter_by(name=item["name"], address=item["address"])
                .first()
            )
            if existing:
                # 기존 장소에 카카오 정보 보강
                if not existing.kakao_place_id:
                    existing.kakao_place_id = item["kakao_place_id"]
                if not existing.phone and item["phone"]:
                    existing.phone = item["phone"]
                if not existing.latitude and item["latitude"]:
                    existing.latitude = item["latitude"]
                    existing.longitude = item["longitude"]
                continue

            place = Place(**item)
            db.add(place)
            saved += 1
        return saved
