from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.deps import get_db, PaginationParams
from backend.schemas.place import PlaceResponse, PlaceDetail, PlaceRanking
from backend.schemas.common import PaginatedResponse
from backend.services import place_service

router = APIRouter(prefix="/api/places", tags=["Places"])


@router.get("", response_model=PaginatedResponse[PlaceResponse])
def list_places(
    category: str | None = None,
    tags: str | None = None,
    open_now: bool = False,
    age_group: str | None = None,
    sort_by: str = Query("sentiment_score", enum=["sentiment_score", "rating", "review_count"]),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    items, total = place_service.get_places(
        db, category=category, tags=tags, open_now=open_now,
        age_group=age_group, sort_by=sort_by,
        offset=pagination.offset, limit=pagination.size,
    )
    return {"items": items, "total": total, "page": pagination.page, "size": pagination.size}


@router.get("/ranking", response_model=list[PlaceRanking])
def place_ranking(
    category: str | None = None,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    return place_service.get_ranking(db, category=category, limit=limit)


@router.get("/{place_id}", response_model=PlaceDetail)
def place_detail(place_id: int, db: Session = Depends(get_db)):
    result = place_service.get_place_detail(db, place_id)
    if not result:
        raise HTTPException(status_code=404, detail="Place not found")
    return result
