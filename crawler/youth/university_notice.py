import re
from datetime import datetime
from typing import Any

import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session

from backend.models.content import UniversityNotice
from crawler.base import BaseCrawler
from crawler.common.rate_limiter import RateLimiter

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
}

# 대학별 설정
UNIVERSITIES = {
    "단국대": {
        "list_url": "https://www.dankook.ac.kr/web/kor/-390",
        "base_url": "https://www.dankook.ac.kr",
        "parser": "_parse_dankook",
    },
    "호서대": {
        "list_url": "https://www.hoseo.ac.kr/Home/BBSList.mbz?action=MAPP_1708240139",
        "base_url": "https://www.hoseo.ac.kr",
        "parser": "_parse_hoseo",
    },
    "백석대": {
        "list_url": "https://www.bu.ac.kr/web/3483/subview.do",
        "base_url": "https://www.bu.ac.kr",
        "parser": "_parse_baekseok",
    },
}

# 게시글 ID 추출 패턴
DANKOOK_ID_PATTERN = re.compile(r"viewMessage\((\d+)")
HOSEO_ID_PATTERN = re.compile(r"fn_viewData\('(\d+)'\)")
BAEKSEOK_ID_PATTERN = re.compile(r"jf_viewArtcl\('web',\s*'(\d+)'\)")


class UniversityNoticeCrawler(BaseCrawler):
    """천안 소재 대학교 공지사항 크롤러 (제목 + 날짜 + 링크)"""

    def __init__(self, university_keys: list[str] | None = None, max_pages: int = 3):
        super().__init__(source="university")
        self.university_keys = university_keys or list(UNIVERSITIES.keys())
        self.max_pages = max_pages
        self.rate_limiter = RateLimiter(min_interval=1.0)
        self.session = requests.Session()
        self.session.headers.update(HEADERS)

    def _parse_date(self, date_str: str | None) -> datetime | None:
        if not date_str:
            return None
        date_str = date_str.strip()
        for fmt in ("%Y-%m-%d", "%Y.%m.%d", "%Y-%m-%d %H:%M:%S"):
            try:
                return datetime.strptime(date_str, fmt)
            except (ValueError, TypeError):
                continue
        return None

    def _parse_dankook(self, page: int) -> list[dict[str, str]]:
        """단국대 공지사항 파싱"""
        self.rate_limiter.wait()
        url = UNIVERSITIES["단국대"]["list_url"]
        params = {
            "p_p_id": "dku_bbs_web_BbsPortlet",
            "_dku_bbs_web_BbsPortlet_cur": page,
        }
        resp = self.session.get(url, params=params, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        results = []
        items = soup.select(".dku-list-body-item:not(.header)")
        for item in items:
            cols = item.select(".dku-list-body-item-col")
            if len(cols) < 4:
                continue

            link = item.select_one("a")
            onclick = link.get("onclick", "") if link else ""
            id_match = DANKOOK_ID_PATTERN.search(onclick)
            article_id = id_match.group(1) if id_match else ""

            category_el = cols[1].select_one("span")
            category = category_el.text.strip() if category_el else ""
            title = cols[1].get_text(strip=True)
            if category:
                title = title.replace(category, "", 1).strip()

            view_url = f"{url}?p_p_id=dku_bbs_web_BbsPortlet&_dku_bbs_web_BbsPortlet_messageId={article_id}" if article_id else ""

            results.append({
                "university": "단국대",
                "title": title,
                "category": category,
                "url": view_url,
                "date": cols[3].get_text(strip=True) if len(cols) > 3 else "",
                "source_id": f"dku_{article_id}",
            })
        return results

    def _parse_hoseo(self, page: int) -> list[dict[str, str]]:
        """호서대 공지사항 파싱"""
        self.rate_limiter.wait()
        url = UNIVERSITIES["호서대"]["list_url"]
        params = {"curPage": page}
        resp = self.session.get(url, params=params, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        results = []
        rows = soup.select("table tbody tr")
        for row in rows:
            tds = row.select("td")
            if len(tds) < 3:
                continue

            link = row.select_one("a")
            if not link:
                continue
            onclick = link.get("href", "")
            id_match = HOSEO_ID_PATTERN.search(onclick)
            article_id = id_match.group(1) if id_match else ""

            title = link.get_text(strip=True)
            # [카테고리] 추출
            cat_match = re.match(r"\[([^\]]+)\]\s*(.*)", title)
            category = cat_match.group(1) if cat_match else ""
            clean_title = cat_match.group(2) if cat_match else title

            view_url = f"https://www.hoseo.ac.kr/Home/BBSView.mbz?action=MAPP_1708240139&schIdx={article_id}" if article_id else ""

            date_text = ""
            for td in tds:
                td_text = td.get_text(strip=True)
                if re.match(r"\d{4}-\d{2}-\d{2}", td_text):
                    date_text = td_text
                    break

            results.append({
                "university": "호서대",
                "title": clean_title,
                "category": category,
                "url": view_url,
                "date": date_text,
                "source_id": f"hoseo_{article_id}",
            })
        return results

    def _parse_baekseok(self, page: int) -> list[dict[str, str]]:
        """백석대 공지사항 파싱"""
        self.rate_limiter.wait()
        url = UNIVERSITIES["백석대"]["list_url"]
        params = {"page": page}
        resp = self.session.get(url, params=params, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        results = []
        rows = soup.select("table tbody tr")
        for row in rows:
            tds = row.select("td")
            if len(tds) < 4:
                continue

            link = row.select_one("a")
            if not link:
                continue

            onclick = link.get("href", "")
            id_match = BAEKSEOK_ID_PATTERN.search(onclick)
            article_id = id_match.group(1) if id_match else ""

            title = tds[1].get_text(strip=True) if len(tds) > 1 else ""
            # [카테고리] 추출
            cat_match = re.match(r"\[([^\]]+)\]\s*(.*)", title)
            category = cat_match.group(1) if cat_match else ""
            clean_title = cat_match.group(2) if cat_match else title

            view_url = f"https://www.bu.ac.kr/bbs/web/788/{article_id}/artclView.do" if article_id else onclick if onclick.startswith("http") else ""

            results.append({
                "university": "백석대",
                "title": clean_title,
                "category": category,
                "url": view_url,
                "date": tds[3].get_text(strip=True) if len(tds) > 3 else "",
                "source_id": f"bu_{article_id}" if article_id else f"bu_{title[:20]}",
            })
        return results

    def crawl(self) -> list[dict[str, Any]]:
        """전체 대학 공지사항 수집"""
        results: list[dict[str, Any]] = []

        for uni_key in self.university_keys:
            uni = UNIVERSITIES.get(uni_key)
            if not uni:
                continue
            parser_method = getattr(self, uni["parser"])

            for page in range(1, self.max_pages + 1):
                items = parser_method(page)
                if not items:
                    break
                for item in items:
                    results.append({
                        "university": item["university"],
                        "title": item["title"],
                        "category": item.get("category", ""),
                        "url": item.get("url", ""),
                        "published_at": self._parse_date(item.get("date")),
                        "source_id": item.get("source_id", ""),
                    })

        return results

    def save(self, data: list[dict[str, Any]], db: Session) -> int:
        """DB 저장 (source_id 기반 중복 체크)"""
        saved = 0
        for item in data:
            if not item.get("source_id"):
                continue
            exists = db.query(UniversityNotice.id).filter_by(source_id=item["source_id"]).first()
            if exists:
                continue
            notice = UniversityNotice(**item)
            db.add(notice)
            saved += 1
        return saved
