from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.deps import get_db
from backend.schemas.dashboard import TopicResponse, PostResponse
from backend.services import dashboard_service

router = APIRouter()


@router.get("/api/topics", response_model=list[TopicResponse])
def list_topics(
    period: str = Query("today", enum=["today", "weekly"]),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_topics(db, period=period)


@router.get("/api/topics/{topic_id}/posts", response_model=list[PostResponse])
def posts_by_topic(
    topic_id: int,
    db: Session = Depends(get_db),
):
    topics = dashboard_service.get_topics(db, period="weekly")
    topic = next((t for t in topics if t["id"] == topic_id), None)
    if not topic:
        return []
    return dashboard_service.get_posts_by_topic(db, topic["name"])
