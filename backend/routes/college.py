from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.deps import get_db
from backend.models.content import Contest, Scholarship, RealEstate
from backend.schemas.content import ContestResponse, ScholarshipResponse, RealEstateResponse

router = APIRouter(prefix="/api/college", tags=["College"])


@router.get("/contests", response_model=list[ContestResponse])
def list_contests(
    category: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Contest)
    if category:
        query = query.filter(Contest.category == category)
    return query.order_by(Contest.deadline.asc()).all()


@router.get("/scholarships", response_model=list[ScholarshipResponse])
def list_scholarships(db: Session = Depends(get_db)):
    return db.query(Scholarship).order_by(Scholarship.deadline.asc()).all()


@router.get("/housing", response_model=list[RealEstateResponse])
def list_housing(
    price_max: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(RealEstate).filter(RealEstate.deal_type.in_(["월세", "전세"]))
    if price_max:
        query = query.filter(RealEstate.deposit <= str(price_max))
    return query.order_by(RealEstate.deal_date.desc()).limit(100).all()
