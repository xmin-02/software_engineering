from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.deps import get_db, PaginationParams
from backend.models.content import Job
from backend.schemas.content import JobResponse
from backend.schemas.common import PaginatedResponse

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.get("", response_model=PaginatedResponse[JobResponse])
def list_jobs(
    experience_level: str | None = None,
    job_type: str | None = None,
    include_expired: bool = False,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    query = db.query(Job)
    if experience_level:
        query = query.filter(Job.experience_level == experience_level)
    if job_type:
        query = query.filter(Job.job_type == job_type)
    # 기본은 마감 지난 채용 제외 (마감일 NULL=상시는 유지)
    if not include_expired:
        query = query.filter(
            or_(Job.deadline >= date.today(), Job.deadline.is_(None))
        )
    total = query.count()
    items = (
        query.order_by(Job.deadline.asc().nullslast())
        .offset(pagination.offset)
        .limit(pagination.size)
        .all()
    )
    return {"items": items, "total": total, "page": pagination.page, "size": pagination.size}
