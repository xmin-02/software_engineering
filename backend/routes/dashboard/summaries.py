from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.deps import get_db
from backend.schemas.dashboard import WeeklySummaryResponse
from backend.services import dashboard_service

router = APIRouter()


@router.get("/api/summaries", response_model=list[WeeklySummaryResponse])
def weekly_summaries(db: Session = Depends(get_db)):
    return dashboard_service.get_summaries(db)
