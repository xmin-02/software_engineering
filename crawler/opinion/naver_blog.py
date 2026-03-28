import re
from datetime import datetime
from typing import Any

import requests
from sqlalchemy.orm import Session

from backend.config import settings
from backend.models.post import Post
from crawler.base import BaseCrawler
from crawler.common.rate_limiter import RateLimiter

# 검색 키워드
SEARCH_QUERIES = ["천안", "천안시", "안서동", "천안 맛집", "천안 카페"]

# 네이버 검색 API 엔드포인트
API_URL = "https://openapi.naver.com/v1/search/blog.json"

# HTML 태그 제거 패턴
HTML_TAG_PATTERN = re.compile(r"<[^>]+>")


class NaverBlogCrawler(BaseCrawler):
    """네이버 블로그 검색 API 기반 크롤러"""

    def __init__(
        self,
        queries: list[str] | None = None,
        display: int = 100,
        max_start: int = 1000,
    ):
        super().__init__(source="naver_blog")
        self.queries = queries or SEARCH_QUERIES
        self.display = display
        self.max_start = max_start
        self.rate_limiter = RateLimiter(min_interval=1.0)
        self.headers = {
            "X-Naver-Client-Id": settings.naver_client_id,
            "X-Naver-Client-Secret": settings.naver_client_secret,
        }

    def _clean_html(self, text: str) -> str:
        """HTML 태그 및 특수문자 제거"""
        text = HTML_TAG_PATTERN.sub("", text)
        text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
        text = text.replace("&quot;", '"').replace("&#39;", "'")
        return text.strip()

    def _parse_date(self, date_str: str) -> datetime | None:
        """네이버 API 날짜 형식(yyyymmdd) 파싱"""
        try:
            return datetime.strptime(date_str, "%Y%m%d")
        except (ValueError, TypeError):
            return None

    def _fetch_page(self, query: str, start: int) -> list[dict[str, Any]]:
        """API 한 페이지 호출"""
        self.rate_limiter.wait()
        params = {
            "query": query,
            "display": self.display,
            "start": start,
            "sort": "date",
        }
        resp = requests.get(API_URL, headers=self.headers, params=params, timeout=10)
        resp.raise_for_status()
        return resp.json().get("items", [])

    def crawl(self) -> list[dict[str, Any]]:
        """전체 키워드에 대해 블로그 게시글 수집"""
        results: list[dict[str, Any]] = []
        seen_links: set[str] = set()

        for query in self.queries:
            for start in range(1, self.max_start, self.display):
                items = self._fetch_page(query, start)
                if not items:
                    break

                for item in items:
                    link = item.get("link", "")
                    if link in seen_links:
                        continue
                    seen_links.add(link)

                    results.append({
                        "source": self.source,
                        "source_id": link,
                        "title": self._clean_html(item.get("title", "")),
                        "content": self._clean_html(item.get("description", "")),
                        "author": item.get("bloggername", ""),
                        "url": link,
                        "published_at": self._parse_date(item.get("postdate")),
                    })

        return results

    def save(self, data: list[dict[str, Any]], db: Session) -> int:
        """DB에 저장 (중복 source_id 건너뜀)"""
        saved = 0
        for item in data:
            exists = db.query(Post.id).filter_by(source_id=item["source_id"]).first()
            if exists:
                continue
            post = Post(**item)
            db.add(post)
            saved += 1
        return saved
