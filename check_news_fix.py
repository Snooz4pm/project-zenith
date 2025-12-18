
import sys
import os
from datetime import datetime
import json

# Mimic the import logic from merged_api.py
try:
    from news_database import NewsDB
    print("✅ NewsDB imported successfully")
except ImportError as e:
    print(f"❌ NewsDB import failed: {e}")
    sys.exit(1)

def test_fetch():
    print("🔄 Testing database connection and fetch...")
    try:
        with NewsDB() as db:
            # Test getting categories
            print("   Fetching categories...")
            stats = db.get_category_stats()
            print(f"   ✅ Categories found: {len(stats)}")
            
            # Test the exact query causing the crash (get_articles_by_category)
            category = "Technology"
            limit = 5
            min_confidence = 0.0
            order_clause = "category_confidence DESC, fetched_at DESC"
            
            print(f"   Running query for category: {category}...")
            
            # Using the NEW query structure
            db.cur.execute(f"""
                SELECT id, title, article, url, source, category,
                    category_confidence, matched_keywords, word_count,
                    importance_score, sentiment_score, why_it_matters, fetched_at
                FROM articles
                WHERE category = %s AND category_confidence >= %s
                ORDER BY {order_clause} LIMIT %s
            """, (category, min_confidence, limit))
            
            rows = db.cur.fetchall()
            print(f"   ✅ Fetched {len(rows)} articles successfully")
            
            if rows:
                print("   Sample article data:")
                row = rows[0]
                print(f"   - Title: {row[1]}")
                print(f"   - Importance: {row[9]}")
                print(f"   - Sentiment: {row[10]}")
                print(f"   - Why it matters: {row[11]}")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_fetch()
