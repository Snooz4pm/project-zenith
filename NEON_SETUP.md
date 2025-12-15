# 🗄️ NEON DATABASE SETUP GUIDE

Complete guide to setting up and using the News Signal database with Neon.

---

## 🚀 Quick Start

### 1. **Install Dependencies**

```bash
pip install psycopg2-binary==2.9.9
```

Or install all requirements:
```bash
pip install -r requirements.txt
```

---

### 2. **Create Neon Database**

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project (or use existing)
3. Create a new database: `news_signal`
4. Copy your connection details

---

### 3. **Add Environment Variables**

Add these to your `.env` file:

```env
# Neon Database Configuration
NEON_HOST=your-project.neon.tech
NEON_DATABASE=news_signal
NEON_USER=your_username
NEON_PASSWORD=your_password
NEON_PORT=5432
```

**Example:**
```env
NEON_HOST=ep-cool-darkness-123456.us-east-2.aws.neon.tech
NEON_DATABASE=news_signal
NEON_USER=alex
NEON_PASSWORD=AbCdEfGhIjKlMnOp123456
NEON_PORT=5432
```

---

### 4. **Create Database Schema**

Run the SQL schema in your Neon console:

```bash
# Copy contents of neon_schema.txt and paste into Neon SQL Editor
# Or connect via psql:
psql "postgresql://user:pass@host/database?sslmode=require" -f neon_schema.txt
```

This creates:
- ✅ `articles` table (main storage)
- ✅ `categories` table (category metadata)
- ✅ `source_stats` table (source tracking)
- ✅ Indexes for performance
- ✅ Views for analytics
- ✅ Full-text search capabilities

---

### 5. **Test Connection**

```bash
python news_database.py
```

Expected output:
```
✅ Connected to Neon database
Total articles in database: 0
```

---

## 📝 Usage Examples

### **Collect News (Batch Mode)**

Scrape all configured URLs and store in database:

```bash
python collect_news.py
```

Output:
```
🚀 NEWS SIGNAL COLLECTOR
📡 Scraping 11 news sources...
✅ Stored: BBC Technology News (ID: 1)
✅ Stored: TechCrunch Latest (ID: 2)
...
📊 Batch complete: 11 stored, 0 duplicates
```

---

### **Single URL Mode**

Scrape and store a single URL:

```bash
python collect_news.py "https://www.bbc.com/news/business"
```

---

### **View Statistics**

```python
from news_database import NewsDB

with NewsDB() as db:
    db.print_stats()
```

Output:
```
📊 DATABASE STATISTICS
━━━━━━━━━━━━━━━━━━━━━
📰 Total Articles: 47

🏷️  By Category:
   Technology      18 articles (avg confidence: 0.67)
   Business        12 articles (avg confidence: 0.58)
   Sports           9 articles (avg confidence: 0.82)
   Politics         5 articles (avg confidence: 0.71)
   World            3 articles (avg confidence: 0.54)

🏢 Top Sources:
   bbc.com                        23 articles (avg: 0.65)
   techcrunch.com                  8 articles (avg: 0.76)
   espn.com                        7 articles (avg: 0.89)
```

---

### **Query Recent Articles**

```python
from news_database import NewsDB

with NewsDB() as db:
    # Get recent Technology articles
    articles = db.get_recent_articles(category="Technology", limit=5)
    
    for article in articles:
        aid, title, source, category, conf, fetched = article
        print(f"{title} ({source})")
```

---

### **Search Articles**

```python
from news_database import NewsDB

with NewsDB() as db:
    results = db.search_articles("artificial intelligence", limit=10)
    
    for result in results:
        aid, title, source, category, fetched = result
        print(f"[{category}] {title}")
```

---

## 🗃️ Database Schema Overview

### **articles** table

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `hash` | VARCHAR(64) | SHA-256 hash for deduplication |
| `title` | TEXT | Article title |
| `article` | TEXT | Full article content |
| `url` | TEXT | Source URL |
| `source` | VARCHAR(255) | Domain name |
| `category` | VARCHAR(50) | Detected category |
| `category_confidence` | DECIMAL(3,2) | Confidence score (0-1) |
| `matched_keywords` | JSONB | Array of matched keywords |
| `word_count` | INTEGER | Article word count |
| `sentiment_score` | DECIMAL(3,2) | Future: sentiment (-1 to +1) |
| `importance_score` | DECIMAL(3,2) | Future: AI importance |
| `fetched_at` | TIMESTAMP | When scraped |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

---

## 🔍 Useful SQL Queries

### Get articles by category
```sql
SELECT title, source, category_confidence
FROM articles
WHERE category = 'Technology'
ORDER BY fetched_at DESC
LIMIT 10;
```

### Find high-confidence articles
```sql
SELECT title, category, category_confidence
FROM articles
WHERE category_confidence > 0.7
ORDER BY category_confidence DESC;
```

### Category distribution
```sql
SELECT category, COUNT(*) as count
FROM articles
GROUP BY category
ORDER BY count DESC;
```

### Full-text search
```sql
SELECT title, source
FROM articles
WHERE to_tsvector('english', title || ' ' || article) 
      @@ plainto_tsquery('english', 'artificial intelligence')
ORDER BY fetched_at DESC
LIMIT 10;
```

### Recent articles with keywords
```sql
SELECT title, category, matched_keywords
FROM articles
WHERE matched_keywords @> '["ai"]'::jsonb
ORDER BY fetched_at DESC
LIMIT 10;
```

---

## 🔄 Automation

### **Daily Collection (Cron/Scheduler)**

Add to your cron jobs or task scheduler:

```bash
# Run every hour
0 * * * * cd /path/to/project && python collect_news.py

# Run every 6 hours
0 */6 * * * cd /path/to/project && python collect_news.py

# Run daily at 9 AM
0 9 * * * cd /path/to/project && python collect_news.py
```

---

## 🧪 Testing

### Test database connection:
```bash
python news_database.py
```

### Test scraper integration:
```bash
python collect_news.py "https://www.bbc.com/news/technology"
```

### Test full collection:
```bash
python collect_news.py
```

---

## 🔧 Troubleshooting

### **Connection Error**
```
❌ Database connection error: connection refused
```
**Fix:** Check your `.env` file has correct Neon credentials

### **SSL Error**
```
❌ SSL connection error
```
**Fix:** Neon requires SSL. Ensure `sslmode='require'` in connection

### **Duplicate Key Error**
```
❌ duplicate key value violates unique constraint "articles_hash_key"
```
**Fix:** This is normal! Article already exists (deduplication working)

### **Missing Table Error**
```
❌ relation "articles" does not exist
```
**Fix:** Run the schema SQL (`neon_schema.txt`) in Neon console

---

## 📊 Performance Tips

1. **Batch Processing:** Use `store_articles_batch()` for multiple articles
2. **Indexes:** The schema includes optimized indexes
3. **Connection Pooling:** For production, use `psycopg2.pool`
4. **Rate Limiting:** Add delays between scrapes (already implemented)

---

## 🎯 Next Steps

1. ✅ **Set up Neon database** (Create project + database)
2. ✅ **Add credentials to `.env`**
3. ✅ **Run schema** (`neon_schema.txt`)
4. ✅ **Test connection** (`python news_database.py`)
5. ✅ **Collect first batch** (`python collect_news.py`)
6. 🔄 **Set up automation** (cron job or scheduler)
7. 📈 **Monitor & analyze** (use views and queries)

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `neon_schema.txt` | Database schema (SQL) |
| `news_database.py` | Database connection module |
| `collect_news.py` | News collection script |
| `enhanced_scraper.py` | Article scraper with categorization |
| `NEON_SETUP.md` | This guide |

---

## 🎉 You're Ready!

Your News Signal Database is ready to collect and analyze news! 🚀

Run `python collect_news.py` to start building your news intelligence database.
