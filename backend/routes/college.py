from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import Integer, func, or_
from sqlalchemy.orm import Session

from backend.deps import get_db
from backend.models.content import Contest, Scholarship, RealEstate
from backend.schemas.content import ContestResponse, ScholarshipResponse, RealEstateResponse

router = APIRouter(prefix="/api/college", tags=["College"])


@router.get("/contests", response_model=list[ContestResponse])
def list_contests(
    category: str | None = None,
    upcoming: bool = True,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Contest)
    if category:
        query = query.filter(Contest.category == category)
    if upcoming:
        query = query.filter(
            or_(Contest.deadline >= date.today(), Contest.deadline.is_(None))
        )
    return query.order_by(Contest.deadline.asc().nullslast()).limit(limit).all()


@router.get("/scholarships", response_model=list[ScholarshipResponse])
def list_scholarships(
    upcoming: bool = True,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Scholarship)
    if upcoming:
        query = query.filter(
            or_(Scholarship.deadline >= date.today(), Scholarship.deadline.is_(None))
        )
    return query.order_by(Scholarship.deadline.asc().nullslast()).limit(limit).all()


@router.get("/housing", response_model=list[RealEstateResponse])
def list_housing(
    price_max: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(RealEstate).filter(RealEstate.deal_type.in_(["월세", "전세"]))
    if price_max:
        # deposit은 문자열 컬럼이라 문자열 비교 시 '9000' > '10000'이 되어 잘못된 결과가 나옴.
        # 숫자만 추출해서 Integer로 캐스팅해 비교.
        numeric_deposit = func.nullif(
            func.regexp_replace(RealEstate.deposit, r"[^0-9]", "", "g"), ""
        ).cast(Integer)
        query = query.filter(numeric_deposit <= price_max)
    return query.order_by(RealEstate.deal_date.desc().nullslast()).limit(100).all()
