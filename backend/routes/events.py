from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.deps import get_db
from backend.models.content import Event
from backend.schemas.content import EventResponse

router = APIRouter(prefix="/api/events", tags=["Events"])


@router.get("", response_model=list[EventResponse])
def list_events(
    category: str | None = None,
    upcoming: bool = True,
    db: Session = Depends(get_db),
):
    query = db.query(Event)
    if category:
        query = query.filter(Event.category == category)
    if upcoming:
        # end_date가 null이면 상시 운영으로 간주
        query = query.filter(
            or_(Event.end_date >= date.today(), Event.end_date.is_(None))
        )
    return query.order_by(Event.start_date.asc().nulls_last()).limit(50).all()
