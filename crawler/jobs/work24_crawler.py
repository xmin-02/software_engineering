"""워크넷(Work24) 채용정보 크롤러 - openapi.work.go.kr XML API"""

import logging
import xml.etree.ElementTree as ET
from datetime import date
from typing import Any

import requests
from sqlalchemy.orm import Session

from backend.config import settings
from backend.models.content import Job
from crawler.base import BaseCrawler
from crawler.common.rate_limiter import RateLimiter

logger = logging.getLogger(__name__)

# 워크넷 오픈 API 엔드포인트
API_URL = "https://openapi.work.go.kr/opi/opi/opia/wantedApi.do"

# 천안시 지역 코드 (충남 천안시 동남구/서북구)
CHEONAN_REGION_CODES = ["44130", "44131"]

# 한 페이지 최대 조회 건수
DEFAULT_DISPLAY = 20


class Work24Crawler(BaseCrawler):
    """워크넷(Work24) 채용정보 크롤러 (천안 지역)"""

    def __init__(self, max_pages: int = 5, display: int = DEFAULT_DISPLAY):
        super().__init__(source="work24")
        self.max_pages = max_pages
        self.display = display
        self.rate_limiter = RateLimiter(min_interval=0.5)

    def _fetch_page(self, region: str, page: int) -> list[dict[str, str]]:
        """API 한 페이지 호출, 파싱된 채용정보 리스트 반환"""
        self.rate_limiter.wait()
        params = {
            "authKey": settings.work24_auth_key,
            "callTp": "L",
            "returnType": "XML",
            "startPage": page,
            "display": self.display,
            "region": region,
            "sort": "pd",  # 최신순
        }
        resp = requests.get(API_URL, params=params, timeout=15)
        resp.raise_for_status()
        return self._parse_xml(resp.text)

    def _parse_xml(self, xml_text: str) -> list[dict[str, str]]:
        """XML 응답 파싱, 에러 시 빈 리스트 반환"""
        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError as e:
            logger.error("XML 파싱 실패: %s", e)
            return []

        # 에러 응답 확인
        message_cd = root.findtext("messageCd", "")
        if message_cd and message_cd != "000":
            message = root.findtext("message", "")
            logger.warning("Work24 API 에러 [%s]: %s", message_cd, message)
            return []

        items = []
        for wanted in root.findall(".//wanted"):
            item = {tag.tag: (tag.text or "").strip() for tag in wanted}
            items.append(item)
        return items

    def _map_to_job(self, item: dict[str, str]) -> dict[str, Any]:
        """API 응답 필드를 Job 모델 형식으로 매핑"""
        # 마감일 파싱 (yyyyMMdd 또는 yyyy-MM-dd 형식)
        deadline = _parse_deadline(item.get("rcptDdln", ""))

        # 채용공고 URL 구성
        source_id = item.get("recrutPblntSn", "")
        url = (
            f"https://www.work24.go.kr/wk/a/b/1200/retriveDtlJbInfo.do"
            f"?recrutPblntSn={source_id}"
            if source_id
            else ""
        )

        return {
            "title": item.get("pblntTtl", ""),
            "company": item.get("instNm", ""),
            "location": item.get("workRgnNmLst", ""),
            "salary": item.get("wageNm", ""),
            "job_type": item.get("empTpNm", ""),
            "experience_level": item.get("acbgCondNmLst", ""),
            "deadline": deadline,
            "url": url,
            "source": self.source,
            "source_id": source_id,
        }

    def crawl(self) -> list[dict[str, Any]]:
        """천안 지역 채용정보 수집"""
        results: list[dict[str, Any]] = []
        seen_ids: set[str] = set()

        for region in CHEONAN_REGION_CODES:
            for page in range(1, self.max_pages + 1):
                try:
                    items = self._fetch_page(region, page)
                except requests.RequestException as e:
                    logger.error(
                        "Work24 API 요청 실패 (region=%s, page=%d): %s",
                        region, page, e,
                    )
                    break

                if not items:
                    # 더 이상 데이터 없음
                    break

                for item in items:
                    job = self._map_to_job(item)
                    source_id = job.get("source_id", "")

                    # 수집 중 중복 제거
                    if not source_id or source_id in seen_ids:
                        continue
                    seen_ids.add(source_id)
                    results.append(job)

                # 마지막 페이지 도달 시 종료
                if len(items) < self.display:
                    break

        logger.info("Work24 수집 완료: %d건", len(results))
        return results

    def save(self, data: list[dict[str, Any]], db: Session) -> int:
        """DB 저장 (source_id 기반 중복 체크)"""
        saved = 0
        for item in data:
            source_id = item.get("source_id")
            if not source_id:
                continue

            exists = (
                db.query(Job.id)
                .filter_by(source_id=source_id)
                .first()
            )
            if exists:
                continue

            job = Job(**item)
            db.add(job)
            saved += 1

        return saved


def _parse_deadline(raw: str) -> date | None:
    """마감일 문자열을 date 객체로 변환"""
    if not raw:
        return None
    raw = raw.strip()
    # 상시채용 등 날짜가 아닌 값 처리
    for fmt in ("%Y%m%d", "%Y-%m-%d", "%Y.%m.%d"):
        try:
            from datetime import datetime
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    return None
