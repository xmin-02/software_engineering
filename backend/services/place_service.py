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

    # 리뷰 통계 서브쿼리 — 정렬 키로 사용 (Place 1행 ↔ subquery 1행 보장)
    stats_subq = (
        db.query(
            PlaceReview.place_id.label("pid"),
            func.avg(PlaceReview.sentiment_score).label("avg_score"),
            func.count(PlaceReview.id).label("review_count"),
        )
        .group_by(PlaceReview.place_id)
        .subquery()
    )
    query = query.outerjoin(stats_subq, Place.id == stats_subq.c.pid)

    # 정렬은 DB 단에서 수행. 페이지마다 결과가 달라지던 후처리 정렬 버그 제거.
    if sort_by == "rating":
        query = query.order_by(Place.rating_naver.desc().nullslast(), Place.id)
    elif sort_by == "review_count":
        query = query.order_by(stats_subq.c.review_count.desc().nullslast(), Place.id)
    else:  # sentiment_score (기본)
        query = query.order_by(stats_subq.c.avg_score.desc().nullslast(), Place.id)

    def _stats_for(p: Place) -> dict | None:
        # outerjoin 결과에서 직접 꺼내려면 entity가 다중이 되므로, 별도 매핑이 단순.
        row = stats_map.get(p.id)
        return row

    # open_now는 business_hours JSON 파싱이 필요해 후처리. 페이지 결과 일관성을 위해
    # 전체를 한 번에 로드하고 필터→슬라이스. 매장 수가 충분히 작다고 가정(<5k).
    if open_now:
        all_rows = query.all()
        stats_rows = db.query(
            stats_subq.c.pid, stats_subq.c.avg_score, stats_subq.c.review_count
        ).all()
        stats_map = {
            r.pid: {
                "avg_score": float(r.avg_score) if r.avg_score is not None else None,
                "review_count": r.review_count,
            }
            for r in stats_rows
        }
        all_items = [_build_place_response(p, _stats_for(p)) for p in all_rows]
        filtered = [i for i in all_items if i["is_open_now"]]
        return filtered[offset:offset + limit], len(filtered)

    # 일반 페이지네이션: DISTINCT count(Place.id)로 tag join 중복 방지.
    # count 쿼리에는 ORDER BY가 따라가면 PG가 GROUP BY 검증에서 실패하므로 제거.
    total = (
        query.order_by(None)
        .with_entities(func.count(func.distinct(Place.id)))
        .scalar()
        or 0
    )
    rows = query.offset(offset).limit(limit).all()

    place_ids = [p.id for p in rows]
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
        row.place_id: {
            "avg_score": float(row.avg_score) if row.avg_score is not None else None,
            "review_count": row.review_count,
        }
        for row in stats_rows
    }

    items = [_build_place_response(p, _stats_for(p)) for p in rows]
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
    min_reviews: int = 2,
) -> list[dict]:
    """감성 점수 기준 TOP N 장소.

    min_reviews를 낮추면 신규 매장(리뷰 1건)도 노출 가능. 기본 2는 신뢰도 위주.
    """
    query = (
        db.query(
            Place,
            func.avg(PlaceReview.sentiment_score).label("avg_score"),
            func.count(PlaceReview.id).label("review_count"),
        )
        .join(PlaceReview, Place.id == PlaceReview.place_id)
        .group_by(Place.id)
        .having(func.count(PlaceReview.id) >= min_reviews)
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
