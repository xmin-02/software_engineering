from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.deps import get_db
from backend.models.content import RealEstate

router = APIRouter(prefix="/api/family", tags=["Family"])


def _to_int(s):
    if s is None:
        return None
    digits = "".join(ch for ch in str(s) if ch.isdigit())
    return int(digits) if digits else None


def _format_price_text(val):
    if val is None:
        return "-"
    if val >= 10000:
        eok, man = val // 10000, val % 10000
        return f"{eok}억 {man}만원" if man > 0 else f"{eok}억원"
    return f"{val}만원"


def _norm_floor(f):
    s = "" if f is None else str(f).strip()
    return "-" if (not s or s in ("0", "None")) else s


def _compose_address(r: RealEstate) -> str | None:
    if r.address:
        return r.address
    parts = [p for p in (r.district, r.dong, r.title) if p]
    return f"천안시 {' '.join(parts)}" if parts else None


@router.get("/real-estate")
def list_real_estate(
    property_type: str | None = Query(None),
    deal_type: str | None = Query(None),
    limit: int = Query(200, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(RealEstate)
    if property_type:
        q = q.filter(RealEstate.property_type == property_type)
    if deal_type:
        q = q.filter(RealEstate.deal_type == deal_type)
    rows = q.order_by(RealEstate.deal_date.desc().nullslast()).limit(limit).all()

    results = []
    for r in rows:
        price = _to_int(r.price) if r.deal_type == "매매" else _to_int(r.deposit)
        monthly_rent = _to_int(r.monthly_rent)
        results.append({
            "id": r.id,
            "address": _compose_address(r),
            "property_type": r.property_type,
            "deal_type": r.deal_type,
            "price": price,
            "monthly_rent": monthly_rent,
            "display_price": _format_price_text(price),
            "area": int(round(r.area_sqm)) if r.area_sqm is not None else None,
            "floor": _norm_floor(r.floor),
            "transaction_date": r.deal_date.isoformat() if r.deal_date else None,
        })
    return results
