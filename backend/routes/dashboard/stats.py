from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.deps import get_db
from backend.schemas.dashboard import SentimentStats, TrendPoint, SourceStats
from backend.services import dashboard_service

router = APIRouter()


@router.get("/api/stats/sentiment", response_model=SentimentStats)
def sentiment_stats(
    source: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
):
    return dashboard_service.get_sentiment_stats(
        db, source=source, date_from=date_from, date_to=date_to
    )


@router.get("/api/stats/trend", response_model=list[TrendPoint])
def sentiment_trend(
    interval: str = Query("daily", enum=["daily", "weekly"]),
    source: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
):
    return dashboard_service.get_trend(
        db, interval=interval, source=source, date_from=date_from, date_to=date_to
    )


@router.get("/api/stats/sources", response_model=list[SourceStats])
def source_stats(db: Session = Depends(get_db)):
    return dashboard_service.get_source_stats(db)
