from news_database import NewsDB
from datetime import datetime, timedelta

with NewsDB() as db:
    total = db.get_total_articles()
    db.cur.execute("SELECT fetched_at FROM articles ORDER BY fetched_at DESC LIMIT 1")
    last = db.cur.fetchone()
    last_fetched = last[0] if last else "NONE"
    
    cutoff = datetime.utcnow() - timedelta(hours=48)
    
    db.cur.execute("SELECT AVG(category_confidence), MIN(category_confidence), MAX(category_confidence) FROM articles WHERE fetched_at >= %s", (cutoff,))
    conf_stats = db.cur.fetchone()
    
    db.cur.execute("SELECT COUNT(*) FROM articles WHERE fetched_at >= %s AND category_confidence >= 0.4", (cutoff,))
    count_04 = db.cur.fetchone()[0]
    
    db.cur.execute("SELECT COUNT(*) FROM articles WHERE fetched_at >= %s AND category_confidence >= 0.6", (cutoff,))
    count_06 = db.cur.fetchone()[0]
    
    with open("news_debug.txt", "w") as f:
        f.write(f"TOTAL_ARTICLES: {total}\n")
        f.write(f"LAST_FETCHED: {last_fetched}\n")
        f.write(f"CURRENT_TIME: {datetime.utcnow()}\n")
        f.write(f"CONFIDENCE_STATS (Last 48h):\n")
        f.write(f"  AVG: {conf_stats[0]}\n")
        f.write(f"  MIN: {conf_stats[1]}\n")
        f.write(f"  MAX: {conf_stats[2]}\n")
        f.write(f"  COUNT >= 0.4: {count_04}\n")
        f.write(f"  COUNT >= 0.6: {count_06}\n")
