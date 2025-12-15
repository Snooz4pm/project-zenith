
# backend/app/models.py
from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.db import Base
from datetime import datetime

class ProductOutcome(Base):
    __tablename__ = "product_outcomes"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, index=True)
    avg_price = Column(Float)
    supplier_count = Column(Integer)
    listing_count = Column(Integer)
    predicted_opportunity = Column(Float)
    
    # New Metrics
    confidence = Column(String) # HIGH, MEDIUM, LOW
    is_red_ocean = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
