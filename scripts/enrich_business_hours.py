"""장소 영업시간 기본값 보강 스크립트.

Naver Local/Kakao Keyword 검색 API는 영업시간을 기본 응답으로 제공하지 않는다.
상세 크롤러가 준비되기 전까지 현재 영업중 필터가 빈 결과가 되지 않도록
카테고리별 보수적인 기본 운영시간을 채운다.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.database import SessionLocal
from backend.models.place import Place

DAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")


def _hours_for(category: str | None) -> dict[str, str]:
    category = category or ""
    if any(word in category for word in ["술집", "주점", "바", "호프", "이자카야"]):
        hours = "17:00-02:00"
    elif any(word in category for word in ["카페", "디저트", "베이커리", "식품판매"]):
        hours = "09:00-22:00"
    elif any(word in category for word in ["분식", "패스트푸드"]):
        hours = "10:00-21:30"
    else:
        hours = "10:30-21:30"
    return {day: hours for day in DAYS}


def enrich_business_hours(overwrite: bool = False) -> int:
    db = SessionLocal()
    try:
        query = db.query(Place)
        if not overwrite:
            query = query.filter(Place.business_hours.is_(None))
        updated = 0
        for place in query.all():
            place.business_hours = _hours_for(place.category)
            updated += 1
        db.commit()
        return updated
    finally:
        db.close()


if __name__ == "__main__":
    print({"updated": enrich_business_hours()})
