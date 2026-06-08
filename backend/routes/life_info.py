from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.deps import get_db
from backend.models.content import Contest, RealEstate, Scholarship, UniversityNotice
from backend.models.place import Place

router = APIRouter(prefix="/api/life-info", tags=["Life Info"])

OFFICIAL_LINKS = {
    "accessibility": [
        {"label": "천안시청 복지", "url": "https://www.cheonan.go.kr/"},
        {"label": "공공데이터포털", "url": "https://www.data.go.kr/"},
    ],
    "high-school": [
        {"label": "천안시청소년재단", "url": "https://cayf.or.kr/"},
        {"label": "천안교육지원청", "url": "https://www.cncae.go.kr/"},
    ],
    "medical": [
        {"label": "천안시 동남구보건소", "url": "https://www.cheonan.go.kr/dhealth.do"},
        {"label": "응급의료포털 E-Gen", "url": "https://www.e-gen.or.kr/"},
    ],
    "foreign-life": [
        {"label": "천안시청", "url": "https://www.cheonan.go.kr/"},
        {"label": "다누리 포털", "url": "https://www.liveinkorea.kr/"},
    ],
    "single-household": [
        {"label": "복지로", "url": "https://www.bokjiro.go.kr/"},
        {"label": "천안시청", "url": "https://www.cheonan.go.kr/"},
    ],
}


def _place_item(place: Place) -> dict:
    return {
        "id": place.id,
        "title": place.name,
        "subtitle": place.category,
        "description": place.address,
        "meta": f"평점 {place.rating_naver or place.rating_kakao or 4.5}",
        "image_url": place.image_url,
    }


def _notice_item(notice: UniversityNotice) -> dict:
    return {
        "id": notice.id,
        "title": notice.title,
        "subtitle": notice.university,
        "description": notice.category,
        "meta": notice.published_at.strftime("%Y.%m.%d") if notice.published_at else None,
        "url": notice.url,
    }


def _estate_address(item: RealEstate) -> str:
    return " ".join(v for v in [item.district, item.dong, item.title] if v) or item.address or "천안시"


def _estate_price(item: RealEstate) -> str:
    if item.deal_type == "월세":
        return f"보증금 {item.deposit or '-'}만원 / 월 {item.monthly_rent or '-'}만원"
    if item.deal_type == "전세":
        return f"전세 {item.deposit or item.price or '-'}만원"
    return f"{item.price or item.deposit or '-'}만원"


def _estate_item(item: RealEstate) -> dict:
    return {
        "id": item.id,
        "title": _estate_address(item),
        "subtitle": item.deal_type,
        "description": f"{item.property_type or '주거'} · {item.area_sqm or '-'}㎡ · {item.floor or '-'}층",
        "meta": _estate_price(item),
    }


@router.get("/{section}")
def get_life_info(section: str, db: Session = Depends(get_db)):
    latest_notices = (
        db.query(UniversityNotice)
        .order_by(UniversityNotice.published_at.desc().nullslast())
        .limit(6)
        .all()
    )
    contests = db.query(Contest).order_by(Contest.deadline.asc().nullslast()).limit(4).all()
    scholarships = db.query(Scholarship).order_by(Scholarship.deadline.asc().nullslast()).limit(4).all()
    affordable_homes = (
        db.query(RealEstate)
        .filter(RealEstate.deal_type.in_(["월세", "전세"]))
        .order_by(RealEstate.deal_date.desc().nullslast())
        .limit(6)
        .all()
    )
    cafe_food = (
        db.query(Place)
        .filter(Place.category.in_(["카페", "분식", "한식", "음식점", "패스트푸드"]))
        .order_by(Place.updated_at.desc().nullslast())
        .limit(6)
        .all()
    )
    mapped_places = (
        db.query(Place)
        .filter(Place.latitude.isnot(None), Place.longitude.isnot(None))
        .order_by(Place.updated_at.desc().nullslast())
        .limit(6)
        .all()
    )

    common_stats = [
        {"label": "맛집/카페", "value": db.query(Place).count()},
        {"label": "대학 공지", "value": db.query(UniversityNotice).count()},
        {"label": "주거 거래", "value": db.query(RealEstate).count()},
    ]

    payloads = {
        "accessibility": {
            "status": "데이터 연동",
            "stats": common_stats,
            "sections": [
                {
                    "title": "좌표 확인 가능한 생활시설",
                    "caption": "무장애 세부 속성은 추가 API 연동 전까지 위치 기반 후보로 표시합니다.",
                    "items": [_place_item(p) for p in mapped_places],
                },
                {
                    "title": "우선 보강할 무장애 속성",
                    "items": [
                        {"title": "휠체어 출입", "description": "출입구 단차/경사로/엘리베이터 여부"},
                        {"title": "장애인 화장실", "description": "층별 위치와 운영 시간"},
                        {"title": "저상버스·주차", "description": "정류장·주차장 접근 거리"},
                    ],
                },
            ],
        },
        "high-school": {
            "status": "데이터 연동",
            "stats": common_stats,
            "sections": [
                {"title": "최신 학교/대학 공지", "items": [_notice_item(n) for n in latest_notices]},
                {
                    "title": "청소년 참여 정보",
                    "items": [
                        {"title": c.title, "subtitle": c.organizer, "description": c.category, "meta": str(c.deadline) if c.deadline else "상시", "url": c.url}
                        for c in contests
                    ],
                },
            ],
        },
        "medical": {
            "status": "공식 링크 연동",
            "stats": common_stats,
            "sections": [
                {
                    "title": "긴급/야간 확인 경로",
                    "caption": "운영 시간은 수시 변동되므로 방문 전 공식 포털 또는 전화 확인이 필요합니다.",
                    "items": [
                        {"title": "응급상황", "subtitle": "119", "description": "즉시 119 또는 응급의료포털 E-Gen에서 응급실을 확인하세요.", "meta": "24시간"},
                        {"title": "동남구보건소", "subtitle": "공식 보건소", "description": "의료기관/약국 현황 및 보건 안내", "meta": "공식"},
                        {"title": "서북구보건소", "subtitle": "공식 보건소", "description": "예방접종·보건민원·지역 의료 안내", "meta": "공식"},
                    ],
                },
                {"title": "대기 중인 의료 데이터", "items": [{"title": "병원/약국 상세 목록", "description": "공공데이터 상세 API 키 확보 후 자동 수집 예정"}]},
            ],
        },
        "foreign-life": {
            "status": "생활 정보 연동",
            "stats": common_stats,
            "sections": [
                {
                    "title": "외국인 생활 핵심 안내",
                    "items": [
                        {"title": "다국어 생활상담", "subtitle": "다누리", "description": "한국 생활, 가족, 체류 상담 다국어 지원", "meta": "1577-1366"},
                        {"title": "천안시 행정 민원", "subtitle": "민원/생활", "description": "전입, 세금, 쓰레기 배출, 교통카드 등 생활 행정 확인", "meta": "공식"},
                        {"title": "외국인 친화 맛집 후보", "subtitle": "지도/리뷰 기반", "description": "카페·한식·분식 위주로 먼저 탐색 가능", "meta": f"{len(cafe_food)}곳 표시"},
                    ],
                },
                {"title": "추천 장소", "items": [_place_item(p) for p in cafe_food[:4]]},
            ],
        },
        "single-household": {
            "status": "데이터 연동",
            "stats": common_stats,
            "sections": [
                {"title": "최근 1인 주거 후보", "items": [_estate_item(e) for e in affordable_homes]},
                {"title": "혼밥/카페 추천", "items": [_place_item(p) for p in cafe_food]},
                {
                    "title": "안전/지원 체크리스트",
                    "items": [
                        {"title": "안심 귀가/위급 상황", "description": "긴급 상황은 112/119, 생활 안전 정보는 천안시 공지 확인"},
                        {"title": "주거 지원", "description": "청년·1인가구 주거 정책은 복지로/천안시 공고와 함께 확인"},
                    ],
                },
            ],
        },
    }
    result = payloads.get(section, payloads["accessibility"])
    result["source_links"] = OFFICIAL_LINKS.get(section, [])
    return result
