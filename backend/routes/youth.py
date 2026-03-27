from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.deps import get_db
from backend.models.content import UniversityNotice
from backend.schemas.content import UniversityNoticeResponse

router = APIRouter(prefix="/api/youth", tags=["Youth"])


@router.get("/university-notices", response_model=list[UniversityNoticeResponse])
def list_university_notices(
    university: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(UniversityNotice)
    if university:
        query = query.filter(UniversityNotice.university == university)
    if category:
        query = query.filter(UniversityNotice.category == category)
    return query.order_by(UniversityNotice.published_at.desc()).limit(100).all()
