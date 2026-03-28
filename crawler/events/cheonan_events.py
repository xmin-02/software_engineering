from typing import Any

import requests
from sqlalchemy.orm import Session

from backend.config import settings
from backend.models.content import Event
from crawler.base import BaseCrawler
from crawler.common.rate_limiter import RateLimiter

API_URL = "https://api.odcloud.kr/api/15154738/v1/uddi:5ea13293-d4d8-4b14-b121-af439da37e9e"


class CheonanEventsCrawler(BaseCrawler):
    """천안시 관광/행사 정보 크롤러 (data.go.kr API)"""

    def __init__(self, per_page: int = 100):
        super().__init__(source="data_go_kr")
        self.per_page = per_page
        self.rate_limiter = RateLimiter(min_interval=0.5)

    def _fetch_page(self, page: int) -> tuple[list[dict], int]:
        """API 한 페이지 호출, (items, total) 반환"""
        self.rate_limiter.wait()
        params = {
            "page": page,
            "perPage": self.per_page,
            "serviceKey": settings.data_go_kr_api_key,
        }
        resp = requests.get(API_URL, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", []), data.get("totalCount", 0)

    def crawl(self) -> list[dict[str, Any]]:
        """전체 페이지 순회하며 행사 정보 수집"""
        results: list[dict[str, Any]] = []
        page = 1

        while True:
            items, total = self._fetch_page(page)
            if not items:
                break

            for item in items:
                title = item.get("컨텐츠 제목", "")
                if not title:
                    continue

                tags = item.get("컨텐츠 관련 태그", "")
                category = tags.split("+")[0] if tags else ""

                results.append({
                    "title": title,
                    "description": tags,
                    "location": item.get("주소", ""),
                    "url": item.get("홈페이지 URL", ""),
                    "source": self.source,
                    "category": category,
                })

            if page * self.per_page >= total:
                break
            page += 1

        return results

    def save(self, data: list[dict[str, Any]], db: Session) -> int:
        """DB 저장 (제목+주소 조합으로 중복 체크)"""
        saved = 0
        for item in data:
            exists = (
                db.query(Event.id)
                .filter_by(title=item["title"], location=item.get("location", ""))
                .first()
            )
            if exists:
                continue
            event = Event(**item)
            db.add(event)
            saved += 1
        return saved
