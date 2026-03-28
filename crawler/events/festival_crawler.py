"""한국관광공사 축제/행사 크롤러 (KorService2 API)"""
from datetime import date, datetime
from typing import Any

import requests
from sqlalchemy.orm import Session

from backend.models.content import Event
from crawler.base import BaseCrawler
from crawler.common.rate_limiter import RateLimiter

API_URL = "https://apis.data.go.kr/B551011/KorService2/searchFestival2"

# 충남 천안시 지역코드
AREA_CODE = 34  # 충남
SIGUNGU_CODE = 4  # 천안시


class FestivalCrawler(BaseCrawler):
    """한국관광공사 축제/행사 정보 크롤러"""

    def __init__(self, api_key: str, per_page: int = 50):
        super().__init__(source="tour_api")
        self.api_key = api_key
        self.per_page = per_page
        self.rate_limiter = RateLimiter(min_interval=0.5)

    def _parse_date(self, date_str: str | None) -> date | None:
        """YYYYMMDD → date 변환"""
        if not date_str or len(date_str) < 8:
            return None
        try:
            return datetime.strptime(date_str[:8], "%Y%m%d").date()
        except ValueError:
            return None

    def _fetch_page(self, page: int) -> tuple[list[dict], int]:
        """API 한 페이지 호출"""
        self.rate_limiter.wait()
        params = {
            "serviceKey": self.api_key,
            "numOfRows": self.per_page,
            "pageNo": page,
            "MobileOS": "ETC",
            "MobileApp": "CheonanDashboard",
            "_type": "json",
            "eventStartDate": date.today().strftime("%Y%m%d"),
            "areaCode": AREA_CODE,
            "sigunguCode": SIGUNGU_CODE,
        }
        resp = requests.get(API_URL, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        body = data.get("response", {}).get("body", {})
        total = body.get("totalCount", 0)
        items_data = body.get("items", "")

        if not items_data or items_data == "":
            return [], total

        items = items_data.get("item", [])
        if isinstance(items, dict):
            items = [items]

        return items, total

    def crawl(self) -> list[dict[str, Any]]:
        """전체 페이지 순회하며 축제/행사 정보 수집"""
        results: list[dict[str, Any]] = []
        page = 1

        while True:
            items, total = self._fetch_page(page)
            if not items:
                break

            for item in items:
                title = item.get("title", "")
                if not title:
                    continue

                results.append({
                    "title": title,
                    "description": item.get("tel", ""),
                    "location": item.get("addr1", ""),
                    "start_date": self._parse_date(item.get("eventstartdate")),
                    "end_date": self._parse_date(item.get("eventenddate")),
                    "url": f"https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid={item.get('contentid', '')}",
                    "source": self.source,
                    "category": "축제",
                })

            if page * self.per_page >= total:
                break
            page += 1

        return results

    def save(self, data: list[dict[str, Any]], db: Session) -> int:
        """DB 저장 (제목+시작일 조합으로 중복 체크)"""
        saved = 0
        for item in data:
            exists = (
                db.query(Event.id)
                .filter_by(title=item["title"], start_date=item.get("start_date"))
                .first()
            )
            if exists:
                continue
            event = Event(**item)
            db.add(event)
            saved += 1
        return saved
