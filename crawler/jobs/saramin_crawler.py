"""사람인 공개 지역별 채용 페이지 HTML fallback 크롤러."""

import hashlib
import logging
import re
from datetime import date, datetime
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session

from backend.models.content import Job
from crawler.base import BaseCrawler
from crawler.common.rate_limiter import RateLimiter

logger = logging.getLogger(__name__)

BASE_URL = "https://www.saramin.co.kr"
CHEONAN_URL = f"{BASE_URL}/zf_user/jobs/list/domestic?loc_cd=115130"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
}


class SaraminCrawler(BaseCrawler):
    """사람인 천안 지역 채용정보 fallback 크롤러."""

    def __init__(self, pages: int = 2):
        super().__init__(source="saramin")
        self.pages = pages
        self.rate_limiter = RateLimiter(min_interval=0.8)

    def _fetch_page(self, page: int) -> str:
        """사람인 천안 채용 검색 HTML을 조회한다."""
        self.rate_limiter.wait()
        params = {"loc_cd": "115130", "recruitPage": page}
        response = requests.get(
            f"{BASE_URL}/zf_user/jobs/list/domestic",
            params=params,
            headers=HEADERS,
            timeout=15,
        )
        response.raise_for_status()
        return response.text

    def _parse_page(self, html: str) -> list[dict[str, Any]]:
        """검색 결과 HTML에서 채용 카드 목록을 추출한다."""
        soup = BeautifulSoup(html, "html.parser")
        jobs: list[dict[str, Any]] = []
        for item in soup.select("div.list_item"):
            job = self._parse_item(item)
            if job:
                jobs.append(job)
        return jobs

    def _parse_item(self, item: Any) -> dict[str, Any] | None:
        """사람인 채용 카드 1건을 Job 모델 필드로 매핑한다."""
        title_link = item.select_one(".job_tit a.str_tit")
        if not title_link:
            return None

        href = title_link.get("href", "")
        url = urljoin(BASE_URL, href)
        title = _clean_text(title_link.get_text(" ", strip=True))
        company = _clean_text(
            (item.select_one(".company_nm a.str_tit") or item.select_one(".company_nm"))
            .get_text(" ", strip=True)
            if item.select_one(".company_nm a.str_tit") or item.select_one(".company_nm")
            else ""
        )
        location = _clean_text(_select_text(item, ".work_place"))
        career = _clean_text(_select_text(item, ".career"))
        education = _clean_text(_select_text(item, ".education"))
        sector = _clean_text(_select_text(item, ".job_sector"))
        deadline_text = _clean_text(_select_text(item, ".support_detail .date"))
        deadline = _parse_deadline(deadline_text)
        source_id = _extract_source_id(url) or _stable_source_id(title, company, url)

        return {
            "title": title,
            "company": company,
            "location": location,
            "salary": None,
            "job_type": _normalize_job_type(career, sector, title),
            "experience_level": _normalize_experience(career),
            "deadline": deadline,
            "url": url,
            "source": self.source,
            "source_id": source_id,
        }

    def crawl(self) -> list[dict[str, Any]]:
        """천안 지역 사람인 채용정보를 수집한다."""
        results: list[dict[str, Any]] = []
        seen_ids: set[str] = set()
        for page in range(1, self.pages + 1):
            try:
                page_jobs = self._parse_page(self._fetch_page(page))
            except requests.RequestException as e:
                logger.error("사람인 요청 실패(page=%d): %s", page, e)
                break

            if not page_jobs:
                break
            for job in page_jobs:
                source_id = job.get("source_id", "")
                if not source_id or source_id in seen_ids:
                    continue
                seen_ids.add(source_id)
                results.append(job)
        logger.info("사람인 수집 완료: %d건", len(results))
        return results

    def save(self, data: list[dict[str, Any]], db: Session) -> int:
        """DB 저장 전 source_id 기준으로 중복을 제거한다."""
        saved = 0
        for item in data:
            source_id = item.get("source_id")
            if not source_id:
                continue
            exists = db.query(Job.id).filter_by(source_id=source_id).first()
            if exists:
                continue
            db.add(Job(**item))
            saved += 1
        return saved


def _select_text(item: Any, selector: str) -> str:
    """CSS selector 결과 텍스트를 안전하게 가져온다."""
    element = item.select_one(selector)
    return element.get_text(" ", strip=True) if element else ""


def _clean_text(value: str) -> str:
    """중복 공백과 사람인 UI 보조 텍스트를 정리한다."""
    value = re.sub(r"\s+", " ", value or "").strip()
    return value.replace(" 관심기업 등록", "").replace(" 스크랩", "")


def _extract_source_id(url: str) -> str | None:
    """사람인 공고 URL에서 rec_idx를 추출한다."""
    match = re.search(r"rec_idx=(\d+)", url)
    return f"saramin:{match.group(1)}" if match else None


def _stable_source_id(title: str, company: str, url: str) -> str:
    """rec_idx가 없을 때 사용할 안정적인 해시 source_id를 만든다."""
    digest = hashlib.sha1(f"{title}|{company}|{url}".encode()).hexdigest()[:16]
    return f"saramin:{digest}"


def _parse_deadline(raw: str) -> date | None:
    """~07.03(금), D-3 등 사람인 마감 표기를 date로 변환한다."""
    if not raw or "상시" in raw or "채용시" in raw:
        return None
    match = re.search(r"(\d{1,2})\.(\d{1,2})", raw)
    if not match:
        return None
    year = date.today().year
    month = int(match.group(1))
    day = int(match.group(2))
    try:
        parsed = date(year, month, day)
    except ValueError:
        return None
    if parsed < date.today().replace(month=1, day=1):
        try:
            return date(year + 1, month, day)
        except ValueError:
            return parsed
    return parsed


def _normalize_experience(career: str) -> str | None:
    """프론트 필터와 맞도록 경력 표기를 정규화한다."""
    if not career:
        return None
    if "신입" in career and "경력" not in career:
        return "entry"
    if "경력무관" in career or "신입" in career:
        return "entry"
    match = re.search(r"(\d+)년", career)
    if not match:
        return "mid"
    years = int(match.group(1))
    if years <= 3:
        return "junior"
    if years <= 7:
        return "mid"
    return "senior"


def _normalize_job_type(career: str, sector: str, title: str) -> str | None:
    """프론트 직종 필터와 맞는 대분류를 추정한다."""
    text = f"{career} {sector} {title}"
    if any(keyword in text for keyword in ["개발", "SE", "전산", "IT", "소프트웨어"]):
        return "it"
    if any(keyword in text for keyword in ["디자인", "웹디", "그래픽"]):
        return "design"
    if any(keyword in text for keyword in ["마케팅", "광고", "홍보", "콘텐츠"]):
        return "marketing"
    if any(keyword in text for keyword in ["영업", "판매", "고객관리"]):
        return "sales"
    if any(keyword in text for keyword in ["생산", "제조", "품질", "조립", "검사", "설비", "정비"]):
        return "manufacturing"
    if any(keyword in text for keyword in ["서비스", "상담", "매장", "조리", "카페"]):
        return "service"
    return None
