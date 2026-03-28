from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.deps import get_db
from backend.models.content import RealEstate
from backend.schemas.content import RealEstateResponse

router = APIRouter(prefix="/api/family", tags=["Family"])


@router.get("/real-estate", response_model=list[RealEstateResponse])
def list_real_estate(
    property_type: str | None = None,
    deal_type: str | None = None,
    price_max: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(RealEstate)
    if property_type:
        query = query.filter(RealEstate.property_type == property_type)
    if deal_type:
        query = query.filter(RealEstate.deal_type == deal_type)
    return query.order_by(RealEstate.deal_date.desc()).limit(100).all()
