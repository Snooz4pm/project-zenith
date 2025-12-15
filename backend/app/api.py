
# backend/app/api.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import ProductOutcome

router = APIRouter()

@router.get("/catalog/top10")
def get_top_opportunities(db: Session = Depends(get_db)):
    rows = (
        db.query(ProductOutcome)
        .order_by(ProductOutcome.predicted_opportunity.desc())
        .limit(10)
        .all()
    )

    return {
        "top_opportunities": [
            {
                "keyword": r.keyword,
                "opportunity_score": r.predicted_opportunity,
                "avg_price": round(r.avg_price, 2) if r.avg_price else 0,
                "supplier_count": r.supplier_count,
                "listing_count": r.listing_count,
                "confidence": r.confidence,
                "is_red_ocean": r.is_red_ocean,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in rows
        ]
    }
