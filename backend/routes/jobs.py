from fastapi import APIRouter, Depends
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
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    query = db.query(Job)
    if experience_level:
        query = query.filter(Job.experience_level == experience_level)
    if job_type:
        query = query.filter(Job.job_type == job_type)
    total = query.count()
    items = query.order_by(Job.deadline.asc()).offset(pagination.offset).limit(pagination.size).all()
    return {"items": items, "total": total, "page": pagination.page, "size": pagination.size}
