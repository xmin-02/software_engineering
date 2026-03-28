from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.deps import get_db
from backend.schemas.dashboard import KeywordFrequency
from backend.services import dashboard_service

router = APIRouter()


@router.get("/api/keywords", response_model=list[KeywordFrequency])
def keyword_frequencies(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_keyword_frequencies(db, limit=limit)
