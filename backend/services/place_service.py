from datetime import datetime, time

from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from backend.models.place import Place, PlaceReview, PlaceTag


def is_open_now(business_hours: dict | None) -> bool:
    """영업시간 JSON과 현재 시간 비교"""
    if not business_hours:
        return False

    day_names = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    now = datetime.now()
    today_key = day_names[now.weekday()]
    today_hours = business_hours.get(today_key)

    if not today_hours:
        return False

    try:
        open_str, close_str = today_hours.split("-")
        open_time = time.fromisoformat(open_str.strip())
        close_time = time.fromisoformat(close_str.strip())
        current_time = now.time()

        if close_time < open_time:
            return current_time >= open_time or current_time <= close_time
        return open_time <= current_time <= close_time
    except (ValueError, AttributeError):
        return False


def _build_place_response(place: Place, stats: dict | None = None) -> dict:
    """Place ORM → 응답 dict 변환"""
    return {
        "id": place.id,
        "name": place.name,
        "category": place.category,
        "address": place.address,
        "rating_naver": place.rating_naver,
        "rating_kakao": place.rating_kakao,
        "latitude": place.latitude,
        "longitude": place.longitude,
        "business_hours": place.business_hours,
        "has_parking": place.has_parking,
        "price_range": place.price_range,
        "is_open_now": is_open_now(place.business_hours),
        "tags": [t.tag for t in place.tags] if place.tags else [],
        "avg_sentiment_score": stats.get("avg_score") if stats else None,
        "review_count": stats.get("review_count", 0) if stats else 0,
    }


AGE_GROUP_FILTERS = {
    "youth": {"exclude_categories": ["술집", "주점"], "prefer_tags": ["가성비"]},
    "college": {"prefer_tags": ["가성비", "카공", "데이트", "단체석"]},
    "early_career": {"prefer_tags": ["가성비"]},
    "worker": {},
    "family": {"exclude_tags": ["노키즈존"], "prefer_tags": ["가족", "키즈시설"]},
}


def get_places(
    db: Session,
    category: str | None = None,
    tags: str | None = None,
    open_now: bool = False,
    age_group: str | None = None,
    sort_by: str = "sentiment_score",
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[dict], int]:
    """장소 목록 (필터/정렬/페이지네이션)"""
    query = db.query(Place).options(selectinload(Place.tags))

    if category:
        query = query.filter(Place.category == category)
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        query = query.join(PlaceTag).filter(PlaceTag.tag.in_(tag_list))

    # 연령별 필터
    if age_group and age_group in AGE_GROUP_FILTERS:
        ag = AGE_GROUP_FILTERS[age_group]
        if "exclude_categories" in ag:
            query = query.filter(~Place.category.in_(ag["exclude_categories"]))
        if "exclude_tags" in ag:
            exclude_ids = (
                db.query(PlaceTag.place_id)
                .filter(PlaceTag.tag.in_(ag["exclude_tags"]))
                .subquery()
            )
            query = query.filter(~Place.id.in_(exclude_ids))
        if "prefer_tags" in ag and not tags:
            prefer_ids = (
                db.query(PlaceTag.place_id)
                .filter(PlaceTag.tag.in_(ag["prefer_tags"]))
                .subquery()
            )
            query = query.filter(Place.id.in_(prefer_ids))

    total = query.count()
    places = query.offset(offset).limit(limit).all()

    # 리뷰 통계 일괄 조회
    place_ids = [p.id for p in places]
    stats_rows = (
        db.query(
            PlaceReview.place_id,
            func.avg(PlaceReview.sentiment_score).label("avg_score"),
            func.count(PlaceReview.id).label("review_count"),
        )
        .filter(PlaceReview.place_id.in_(place_ids))
        .group_by(PlaceReview.place_id)
        .all()
    )
    stats_map = {
        row.place_id: {"avg_score": float(row.avg_score) if row.avg_score else None, "review_count": row.review_count}
        for row in stats_rows
    }

    items = [_build_place_response(p, stats_map.get(p.id)) for p in places]

    # open_now 필터 (후처리)
    if open_now:
        items = [i for i in items if i["is_open_now"]]

    # 정렬
    if sort_by == "sentiment_score":
        items.sort(key=lambda x: x.get("avg_sentiment_score") or 0, reverse=True)
    elif sort_by == "rating":
        items.sort(key=lambda x: x.get("rating_naver") or 0, reverse=True)
    elif sort_by == "review_count":
        items.sort(key=lambda x: x.get("review_count") or 0, reverse=True)

    return items, total


def get_place_detail(db: Session, place_id: int) -> dict | None:
    """장소 상세 (리뷰 포함, eager loading)"""
    place = (
        db.query(Place)
        .options(selectinload(Place.reviews), selectinload(Place.tags))
        .filter(Place.id == place_id)
        .first()
    )

    if not place:
        return None

    # 리뷰 통계
    stats_row = (
        db.query(
            func.avg(PlaceReview.sentiment_score).label("avg_score"),
            func.count(PlaceReview.id).label("review_count"),
        )
        .filter(PlaceReview.place_id == place_id)
        .one()
    )
    stats = {
        "avg_score": float(stats_row.avg_score) if stats_row.avg_score else None,
        "review_count": stats_row.review_count,
    }

    return {
        "place": _build_place_response(place, stats),
        "reviews": [
            {
                "id": r.id,
                "source": r.source,
                "review_text": r.review_text,
                "review_url": r.review_url,
                "sentiment": r.sentiment,
                "sentiment_score": r.sentiment_score,
                "keywords": r.keywords,
                "published_at": r.published_at,
            }
            for r in place.reviews
        ],
    }


def get_ranking(
    db: Session,
    category: str | None = None,
    limit: int = 10,
) -> list[dict]:
    """감성 점수 기준 TOP N 장소"""
    query = (
        db.query(
            Place,
            func.avg(PlaceReview.sentiment_score).label("avg_score"),
            func.count(PlaceReview.id).label("review_count"),
        )
        .join(PlaceReview, Place.id == PlaceReview.place_id)
        .group_by(Place.id)
        .having(func.count(PlaceReview.id) >= 2)
        .order_by(func.avg(PlaceReview.sentiment_score).desc())
    )

    if category:
        query = query.filter(Place.category == category)

    rows = query.limit(limit).all()

    return [
        {
            "id": place.id,
            "name": place.name,
            "category": place.category,
            "address": place.address,
            "avg_sentiment_score": float(avg_score) if avg_score else None,
            "review_count": review_count,
            "rating_naver": place.rating_naver,
            "rating_kakao": place.rating_kakao,
        }
        for place, avg_score, review_count in rows
    ]
