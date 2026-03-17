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

    def _fetch_reviews(self, place_name: str) -> list[dict[str, Any]]:
        """특정 장소의 블로그 리뷰 검색"""
        results = []
        query = f"천안 {place_name} 후기"

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
                results.append({
                    "review_text": self._clean_html(item.get("description", "")),
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
                reviews = self._fetch_reviews(place.name)
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
