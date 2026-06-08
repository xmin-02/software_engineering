"""대학 공지 기반 공모전/장학금 파생 콘텐츠 크롤러."""

import logging
import re
from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models.content import Contest, Scholarship, UniversityNotice
from crawler.base import BaseCrawler

logger = logging.getLogger(__name__)

CONTEST_KEYWORDS = ("공모전", "공모", "경진대회", "해커톤", "콘테스트")
SCHOLARSHIP_KEYWORDS = ("장학", "학자금", "등록금", "희망사다리", "국가근로")
EXCLUDE_CONTEST_KEYWORDS = ("입주기업 모집", "직원 채용", "시간표", "버스")
EXCLUDE_SCHOLARSHIP_KEYWORDS = ("통학버스", "셔틀버스", "버스", "교통", "시간표")


class NoticeContentCrawler(BaseCrawler):
    """수집된 대학 공지를 공모전/장학금 콘텐츠로 정규화한다."""

    def __init__(self, limit: int = 500):
        super().__init__(source="university_notice")
        self.limit = limit

    def crawl(self) -> list[dict[str, Any]]:
        """university_notices 테이블에서 대학생 콘텐츠 후보를 추출한다."""
        db = SessionLocal()
        try:
            notices = (
                db.query(UniversityNotice)
                .order_by(UniversityNotice.published_at.desc().nullslast())
                .limit(self.limit)
                .all()
            )
            data = [item for notice in notices for item in self._map_notice(notice)]
            logger.info("대학 공지 파생 콘텐츠 추출 완료: %d건", len(data))
            return data
        finally:
            db.close()

    def _map_notice(self, notice: UniversityNotice) -> list[dict[str, Any]]:
        """공지 1건을 공모전/장학금 후보로 변환한다."""
        title = notice.title or ""
        category = notice.category or ""
        text = f"{title} {category}"
        items: list[dict[str, Any]] = []

        if _is_scholarship_notice(title, category):
            items.append(
                {
                    "kind": "scholarship",
                    "title": title,
                    "organization": notice.university,
                    "amount": _infer_amount(title),
                    "deadline": _extract_deadline(title),
                    "eligibility": category or "대학 공지 확인",
                    "url": notice.url,
                    "source": self.source,
                }
            )

        if _contains_any(text, CONTEST_KEYWORDS) and not _contains_any(
            text, EXCLUDE_CONTEST_KEYWORDS
        ):
            items.append(
                {
                    "kind": "contest",
                    "title": title,
                    "organizer": notice.university,
                    "deadline": _extract_deadline(title),
                    "url": notice.url,
                    "category": _infer_contest_category(title, category),
                    "source": self.source,
                }
            )

        return items

    def save(self, data: list[dict[str, Any]], db: Session) -> int:
        """공모전/장학금 테이블에 URL 또는 제목 기준 중복 없이 저장한다."""
        saved = 0
        for item in data:
            kind = item.pop("kind", None)
            if kind == "scholarship":
                if _scholarship_exists(db, item):
                    continue
                db.add(Scholarship(**item))
                saved += 1
            elif kind == "contest":
                if _contest_exists(db, item):
                    continue
                db.add(Contest(**item))
                saved += 1
        return saved


def _is_scholarship_notice(title: str, category: str) -> bool:
    """장학/학자금 공지만 선별하고 행정부서명 오분류를 줄인다."""
    text = f"{title} {category}"
    if _contains_any(title, EXCLUDE_SCHOLARSHIP_KEYWORDS):
        return False
    if _contains_any(title, SCHOLARSHIP_KEYWORDS):
        return True
    return category in {"국가장학", "학자금대출", "취업팀"} and _contains_any(text, SCHOLARSHIP_KEYWORDS)


def _contains_any(text: str, keywords: tuple[str, ...]) -> bool:
    """텍스트에 키워드가 하나라도 포함되는지 확인한다."""
    return any(keyword in text for keyword in keywords)


def _extract_deadline(title: str) -> date | None:
    """공지 제목에서 ~4/8, ~04.01 같은 마감일을 추출한다."""
    patterns = [
        r"~\s*(\d{1,2})[./](\d{1,2})",
        r"(\d{1,2})[./](\d{1,2})\s*까지",
        r"(\d{1,2})월\s*(\d{1,2})일",
    ]
    for pattern in patterns:
        match = re.search(pattern, title)
        if not match:
            continue
        month = int(match.group(1))
        day = int(match.group(2))
        try:
            parsed = date(date.today().year, month, day)
        except ValueError:
            return None
        if parsed < date.today().replace(month=1, day=1):
            try:
                return date(date.today().year + 1, month, day)
            except ValueError:
                return parsed
        return parsed
    return None


def _infer_amount(title: str) -> str | None:
    """제목에서 장학금 금액 힌트를 추출한다."""
    match = re.search(r"(\d+[,.]?\d*)\s*(만\s*)?원", title)
    if not match:
        return None
    return match.group(0).replace(" ", "")


def _infer_contest_category(title: str, category: str) -> str:
    """공모전 카테고리를 제목/원 카테고리에서 추정한다."""
    text = f"{title} {category}"
    if any(keyword in text for keyword in ["영상", "디자인", "애니메이션", "콘텐츠"]):
        return "디자인/콘텐츠"
    if any(keyword in text for keyword in ["AI", "SW", "해커톤", "프로그래밍", "데이터"]):
        return "IT/AI"
    if any(keyword in text for keyword in ["창업", "아이디어", "캡스톤"]):
        return "아이디어/창업"
    return category or "공모전"


def _scholarship_exists(db: Session, item: dict[str, Any]) -> bool:
    """장학금 중복 여부를 URL 우선으로 확인한다."""
    query = db.query(Scholarship.id)
    url = item.get("url")
    if url and query.filter(Scholarship.url == url).first():
        return True
    return bool(
        query.filter(
            Scholarship.title == item.get("title"),
            Scholarship.organization == item.get("organization"),
        ).first()
    )


def _contest_exists(db: Session, item: dict[str, Any]) -> bool:
    """공모전 중복 여부를 URL 우선으로 확인한다."""
    query = db.query(Contest.id)
    url = item.get("url")
    if url and query.filter(Contest.url == url).first():
        return True
    return bool(
        query.filter(
            Contest.title == item.get("title"),
            Contest.organizer == item.get("organizer"),
        ).first()
    )
