from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.deps import get_db
from backend.models.content import Certification
from backend.schemas.content import CertificationResponse

router = APIRouter(prefix="/api/certifications", tags=["Certifications"])


@router.get("", response_model=list[CertificationResponse])
def list_certifications(
    category: str | None = None,
    upcoming: bool = True,
    db: Session = Depends(get_db),
):
    query = db.query(Certification)
    if category:
        query = query.filter(Certification.category == category)
    if upcoming:
        query = query.filter(Certification.exam_date >= date.today())
    return query.order_by(Certification.exam_date.asc()).all()
