"""Naver 이미지 검색으로 장소/관광 데이터의 실제 이미지 URL을 보강한다."""

import html
import logging
import re
import sys
import time
from dataclasses import dataclass
from typing import Any
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import requests

from backend.config import settings
from backend.database import SessionLocal
from backend.models.content import Event
from backend.models.place import Place

logger = logging.getLogger(__name__)

NAVER_IMAGE_SEARCH_URL = "https://openapi.naver.com/v1/search/image"
EXCLUDED_HOST_KEYWORDS = ("logo", "icon", "banner", "map")


@dataclass
class ImageCandidate:
    """이미지 검색 후보."""

    url: str
    thumbnail: str
    title: str
    width: int
    height: int


class NaverImageEnricher:
    """Naver 이미지 검색 API 기반 이미지 보강기."""

    def __init__(self, delay: float = 0.12):
        self.delay = delay
        self.headers = {
            "X-Naver-Client-Id": settings.naver_client_id,
            "X-Naver-Client-Secret": settings.naver_client_secret,
        }

    def search(self, query: str, display: int = 8) -> list[ImageCandidate]:
        """검색어에 맞는 이미지 후보를 조회한다."""
        if not settings.naver_client_id or not settings.naver_client_secret:
            raise RuntimeError("Naver API 설정이 없습니다.")
        time.sleep(self.delay)
        response = requests.get(
            NAVER_IMAGE_SEARCH_URL,
            headers=self.headers,
            params={"query": query, "display": display, "sort": "sim"},
            timeout=10,
        )
        response.raise_for_status()
        items = response.json().get("items", [])
        return [self._to_candidate(item) for item in items]

    def _to_candidate(self, item: dict[str, Any]) -> ImageCandidate:
        """Naver API 응답을 후보 객체로 변환한다."""
        return ImageCandidate(
            url=item.get("link", ""),
            thumbnail=item.get("thumbnail", ""),
            title=_clean_text(item.get("title", "")),
            width=_to_int(item.get("sizewidth")),
            height=_to_int(item.get("sizeheight")),
        )

    def pick_best(self, query: str, name: str, prefer_thumbnail: bool = False) -> str | None:
        """검색 후보 중 장소명과 가장 가까운 이미지를 선택한다."""
        candidates = self.search(query)
        if not candidates:
            return None
        scored = sorted(
            candidates,
            key=lambda candidate: _score_candidate(candidate, name),
            reverse=True,
        )
        best = scored[0]
        if prefer_thumbnail:
            return best.thumbnail or best.url or None
        return best.url or best.thumbnail or None


def enrich_places(limit: int | None = None, overwrite: bool = False) -> int:
    """places 테이블의 image_url을 보강한다."""
    db = SessionLocal()
    enricher = NaverImageEnricher()
    updated = 0
    try:
        query = db.query(Place).order_by(Place.id)
        if not overwrite:
            query = query.filter(Place.image_url.is_(None))
        if limit:
            query = query.limit(limit)
        for place in query.all():
            search_query = _place_query(place)
            try:
                image_url = enricher.pick_best(search_query, place.name)
            except requests.RequestException as e:
                logger.warning("장소 이미지 조회 실패(%s): %s", place.name, e)
                continue
            if not image_url:
                continue
            place.image_url = image_url
            place.image_source = "naver_image"
            updated += 1
            if updated % 25 == 0:
                db.commit()
                logger.info("장소 이미지 %d건 저장", updated)
        db.commit()
        return updated
    finally:
        db.close()


def enrich_events(limit: int | None = None, overwrite: bool = False) -> int:
    """events 테이블의 image_url을 보강한다."""
    db = SessionLocal()
    enricher = NaverImageEnricher()
    updated = 0
    try:
        query = db.query(Event).order_by(Event.id)
        if not overwrite:
            query = query.filter(Event.image_url.is_(None))
        if limit:
            query = query.limit(limit)
        for event in query.all():
            search_query = _event_query(event)
            try:
                image_url = enricher.pick_best(search_query, event.title, prefer_thumbnail=True)
            except requests.RequestException as e:
                logger.warning("관광 이미지 조회 실패(%s): %s", event.title, e)
                continue
            if not image_url:
                continue
            event.image_url = image_url
            event.image_source = "naver_image"
            updated += 1
            if updated % 25 == 0:
                db.commit()
                logger.info("관광 이미지 %d건 저장", updated)
        db.commit()
        return updated
    finally:
        db.close()


def _place_query(place: Place) -> str:
    """장소 이미지 검색어를 구성한다."""
    category = place.category or "맛집 카페"
    dong = _extract_dong(place.address or "")
    return " ".join(part for part in ["천안", dong, place.name, category] if part)


def _event_query(event: Event) -> str:
    """관광/행사 이미지 검색어를 구성한다."""
    category = event.category or "관광"
    return f"천안 {event.title} {category}"


def _extract_dong(address: str) -> str | None:
    """주소에서 동/읍/면 단위 힌트를 추출한다."""
    match = re.search(r"([가-힣0-9]+(?:동|읍|면|리))", address)
    return match.group(1) if match else None


def _score_candidate(candidate: ImageCandidate, name: str) -> tuple[int, int, int]:
    """후보 이미지 우선순위를 계산한다."""
    title = candidate.title.replace(" ", "")
    normalized_name = name.replace(" ", "")
    score = 0
    if normalized_name and normalized_name in title:
        score += 6
    if "천안" in title:
        score += 3
    if any(keyword in candidate.url.lower() for keyword in EXCLUDED_HOST_KEYWORDS):
        score -= 2
    if candidate.width >= 300 and candidate.height >= 200:
        score += 2
    if candidate.width >= candidate.height:
        score += 1
    return score, candidate.width * candidate.height, len(candidate.url)


def _clean_text(value: str) -> str:
    """HTML 태그/엔티티와 중복 공백을 제거한다."""
    text = re.sub(r"<[^>]+>", "", value or "")
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def _to_int(value: Any) -> int:
    """정수 변환 실패 시 0을 반환한다."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
    place_count = enrich_places()
    event_count = enrich_events()
    print({"places_updated": place_count, "events_updated": event_count})
