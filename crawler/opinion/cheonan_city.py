import re
from datetime import datetime
from typing import Any

import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session

from backend.models.post import Post
from crawler.base import BaseCrawler
from crawler.common.rate_limiter import RateLimiter

BASE_URL = "https://www.cheonan.go.kr"

# 크롤링 대상 게시판
BOARDS = {
    "praise": {
        "id": "BBSMSTR_000000000072",
        "name": "칭찬합시다",
    },
    "policy": {
        "id": "BBSMSTR_000000000057",
        "name": "정책연구/정책제안",
    },
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
}

# 게시글 ID 추출 패턴
ARTICLE_ID_PATTERN = re.compile(r"fn_search_detail\('([^']+)'\)")


class CheonanCityCrawler(BaseCrawler):
    """천안시청 시민소통 게시판 크롤러"""

    def __init__(self, max_pages: int = 5, board_keys: list[str] | None = None):
        super().__init__(source="cheonan_city")
        self.max_pages = max_pages
        self.board_keys = board_keys or list(BOARDS.keys())
        self.rate_limiter = RateLimiter(min_interval=1.0)
        self.session = requests.Session()
        self.session.headers.update(HEADERS)

    def _fetch_list_page(self, board_id: str, page: int) -> list[dict[str, str]]:
        """게시판 목록 한 페이지 파싱"""
        self.rate_limiter.wait()
        url = f"{BASE_URL}/bbs/{board_id}/list.do"
        params = {"pageIndex": page}
        resp = self.session.get(url, params=params, timeout=15)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        rows = soup.select("table tbody tr")
        posts = []

        for row in rows:
            num_el = row.select_one(".board__table--count")
            title_btn = row.select_one(".board__link")
            date_el = row.select_one(".board__table--date")
            writer_el = row.select_one(".board__table--writer")

            if not title_btn:
                continue

            onclick = title_btn.get("onclick", "")
            id_match = ARTICLE_ID_PATTERN.search(onclick)
            if not id_match:
                continue

            article_id = id_match.group(1)
            title_text_el = row.select_one(".board__subject-text")
            title = title_text_el.text.strip() if title_text_el else title_btn.text.strip()

            posts.append({
                "article_id": article_id,
                "board_id": board_id,
                "title": title,
                "author": writer_el.text.strip() if writer_el else "",
                "date": date_el.text.strip() if date_el else "",
            })

        return posts

    def _fetch_post_content(self, board_id: str, article_id: str) -> str:
        """게시글 상세 본문"""
        self.rate_limiter.wait()
        url = f"{BASE_URL}/bbs/{board_id}/view.do"
        params = {"nttId": article_id}
        resp = self.session.get(url, params=params, timeout=15)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        content_el = soup.select_one(".board-view__contents-inner")
        if content_el:
            return content_el.get_text(strip=True)
        return ""

    def _parse_date(self, date_str: str | None) -> datetime | None:
        """날짜 파싱 (2026-03-16 등)"""
        if not date_str:
            return None
        for fmt in ("%Y-%m-%d", "%Y.%m.%d", "%Y-%m-%d %H:%M:%S"):
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except (ValueError, TypeError):
                continue
        return None

    def crawl(self) -> list[dict[str, Any]]:
        """전체 게시판 순회하며 게시글 수집"""
        results: list[dict[str, Any]] = []

        for board_key in self.board_keys:
            board = BOARDS[board_key]
            board_id = board["id"]

            for page in range(1, self.max_pages + 1):
                post_list = self._fetch_list_page(board_id, page)
                if not post_list:
                    break

                for post_info in post_list:
                    source_id = f"ca_{post_info['article_id']}"
                    content = self._fetch_post_content(board_id, post_info["article_id"])
                    if not content:
                        continue

                    view_url = f"{BASE_URL}/bbs/{board_id}/view.do?nttId={post_info['article_id']}"

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
        """DB 저장 (중복 건너뜀)"""
        saved = 0
        for item in data:
            exists = db.query(Post.id).filter_by(source_id=item["source_id"]).first()
            if exists:
                continue
            post = Post(**item)
            db.add(post)
            saved += 1
        return saved
