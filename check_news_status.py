from news_database import NewsDB
from datetime import datetime, timedelta

with NewsDB() as db:
    print(f"Total articles: {db.get_total_articles()}")
    db.cur.execute("SELECT category, COUNT(*), MAX(fetched_at) FROM articles GROUP BY category")
    rows = db.cur.fetchall()
    print("\nCategory Distribution:")
    for row in rows:
        print(f"  {row[0]}: {row[1]} articles, last fetched: {row[2]}")
    
    # Check last 48 hours
    cutoff = datetime.utcnow() - timedelta(hours=48)
    db.cur.execute("SELECT COUNT(*) FROM articles WHERE fetched_at >= %s", (cutoff,))
    recent_count = db.cur.fetchone()[0]
    print(f"\nArticles from last 48h: {recent_count}")

    # Check last 7 days
    cutoff_7d = datetime.utcnow() - timedelta(days=7)
    db.cur.execute("SELECT COUNT(*) FROM articles WHERE fetched_at >= %s", (cutoff_7d,))
    count_7d = db.cur.fetchone()[0]
    print(f"Articles from last 7 days: {count_7d}")
