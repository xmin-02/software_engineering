from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.deps import get_db, PaginationParams
from backend.schemas.common import PaginatedResponse
from backend.schemas.dashboard import PostResponse
from backend.services import dashboard_service

router = APIRouter()


@router.get("/api/posts", response_model=PaginatedResponse[PostResponse])
def list_posts(
    source: str | None = None,
    sentiment: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    items, total = dashboard_service.get_posts(
        db,
        source=source,
        sentiment=sentiment,
        date_from=date_from,
        date_to=date_to,
        offset=pagination.offset,
        limit=pagination.size,
    )
    return {
        "items": items,
        "total": total,
        "page": pagination.page,
        "size": pagination.size,
    }
