import re
from datetime import datetime
from typing import Any

import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session

from backend.models.post import Post
from crawler.base import BaseCrawler
from crawler.common.rate_limiter import RateLimiter

BASE_URL = "https://gall.dcinside.com"
LIST_URL = f"{BASE_URL}/mgallery/board/lists"
VIEW_URL = f"{BASE_URL}/mgallery/board/view/"
GALLERY_ID = "cheonan"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9",
}


class DCInsideCrawler(BaseCrawler):
    """디시인사이드 천안 마이너갤러리 크롤러"""

    def __init__(self, max_pages: int = 5):
        super().__init__(source="dcinside")
        self.max_pages = max_pages
        self.rate_limiter = RateLimiter(min_interval=1.5)
        self.session = requests.Session()
        self.session.headers.update(HEADERS)

    def _fetch_list_page(self, page: int) -> list[dict[str, str]]:
        """게시글 목록 한 페이지 파싱"""
        self.rate_limiter.wait()
        params = {"id": GALLERY_ID, "page": page}
        resp = self.session.get(LIST_URL, params=params, timeout=30)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        rows = soup.select("tr.ub-content")
        posts = []

        for row in rows:
            num_el = row.select_one(".gall_num")
            if not num_el:
                continue
            num_text = num_el.text.strip()
            # 광고/공지 제외 (숫자가 아닌 것)
            if not num_text.isdigit():
                continue

            title_el = row.select_one(".gall_tit a:not([class])")
            writer_el = row.select_one(".gall_writer")
            date_el = row.select_one(".gall_date")

            if not title_el:
                continue

            href = title_el.get("href", "")
            if not href or href == "javascript:;":
                continue

            posts.append({
                "no": num_text,
                "title": title_el.text.strip(),
                "author": writer_el.get("data-nick", "") if writer_el else "",
                "date": date_el.get("title", "") if date_el else "",
                "href": href,
            })

        return posts

    def _fetch_post_content(self, href: str) -> str:
        """게시글 상세 본문 가져오기"""
        self.rate_limiter.wait()
        url = BASE_URL + href if href.startswith("/") else href
        self.session.headers["Referer"] = LIST_URL + f"?id={GALLERY_ID}"
        resp = self.session.get(url, timeout=30)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        content_el = soup.select_one(".write_div")
        if content_el:
            # 이미지 태그 제거, 텍스트만
            return content_el.get_text(strip=True)
        return ""

    def _parse_date(self, date_str: str) -> datetime | None:
        """날짜 문자열 파싱 (2025-12-10 18:52:16)"""
        try:
            return datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
        except (ValueError, TypeError):
            return None

    def crawl(self) -> list[dict[str, Any]]:
        """목록 순회 → 상세 본문 수집"""
        results: list[dict[str, Any]] = []

        for page in range(1, self.max_pages + 1):
            post_list = self._fetch_list_page(page)
            if not post_list:
                break

            for post_info in post_list:
                source_id = f"dc_{GALLERY_ID}_{post_info['no']}"
                content = self._fetch_post_content(post_info["href"])
                if not content:
                    continue

                view_url = BASE_URL + post_info["href"] if post_info["href"].startswith("/") else post_info["href"]

                results.append({
                    "source": self.source,
                    "source_id": source_id,
                    "title": post_info["title"],
                    "content": content,
                    "author": post_info["author"],
                    "url": view_url,
                    "published_at": self._parse_date(post_info["date"]),
                })

        return results

    def save(self, data: list[dict[str, Any]], db: Session) -> int:
        """DB 저장 (중복 source_id 건너뜀)"""
        saved = 0
        for item in data:
            exists = db.query(Post.id).filter_by(source_id=item["source_id"]).first()
            if exists:
                continue
            post = Post(**item)
            db.add(post)
            saved += 1
        return saved
