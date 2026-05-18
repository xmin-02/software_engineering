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
    period: str = Query("weekly", enum=["today", "weekly"]),
    db: Session = Depends(get_db),
):
    # topic_id는 토픽명 해시(_stable_topic_id)와 일치해야 한다.
    # today 토픽으로 들어와도 매칭되도록 둘 다 시도.
    for p in (period, "today" if period != "today" else "weekly"):
        topics = dashboard_service.get_topics(db, period=p)
        topic = next((t for t in topics if t["id"] == topic_id), None)
        if topic:
            return dashboard_service.get_posts_by_topic(db, topic["name"])
    return []
