
from app.seed_keywords import SEED_KEYWORDS
from app.services.alibaba import fetch_listings
from app.services.normalizer import normalize_listings
from app.services.opportunity import score_opportunity, confidence_level, red_ocean
from app.db import SessionLocal
from app.models import ProductOutcome
from datetime import datetime, time

def run_opportunity_engine():
    print("Starting Opportunity Engine Batch...")
    db = SessionLocal()

    # Define "today" as starting from midnight
    today_start = datetime.combine(datetime.utcnow().date(), time.min)

    for keyword in SEED_KEYWORDS:
        print(f"Processing: {keyword}")
        
        try:
            raw = fetch_listings(keyword)
        except Exception as e:
            print(f"Error fetching {keyword}: {e}")
            continue
            
        metrics = normalize_listings(raw)

        score = score_opportunity(
            metrics["avg_price"],
            metrics["supplier_count"],
            metrics["listing_count"]
        )
        
        conf = confidence_level(metrics["listing_count"])
        is_red = red_ocean(metrics["listing_count"], metrics["supplier_count"])

        # Deduplication / Upsert Logic
        existing = (
            db.query(ProductOutcome)
            .filter(
                ProductOutcome.keyword == keyword,
                ProductOutcome.created_at >= today_start
            )
            .first()
        )

        if existing:
            # Update existing record for today
            print(f"  Updating existing record for {keyword}")
            existing.avg_price = metrics["avg_price"]
            existing.supplier_count = metrics["supplier_count"]
            existing.listing_count = metrics["listing_count"]
            existing.predicted_opportunity = score
            existing.confidence = conf
            existing.is_red_ocean = is_red
            existing.created_at = datetime.utcnow() # Update timestamp
        else:
            # Create new record
            print(f"  Creating new record for {keyword}")
            record = ProductOutcome(
                keyword=keyword,
                avg_price=metrics["avg_price"],
                supplier_count=metrics["supplier_count"],
                listing_count=metrics["listing_count"],
                predicted_opportunity=score,
                confidence=conf,
                is_red_ocean=is_red
            )
            db.add(record)
        
        db.commit() # Commit after each processing to save progress
        print(f"  Saved {keyword}: Score {score}, Conf {conf}, RedOcean {is_red}")

    db.close()
    print("Batch Complete.")

if __name__ == "__main__":
    run_opportunity_engine()
