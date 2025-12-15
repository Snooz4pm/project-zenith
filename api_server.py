"""
🚀 NEWS SIGNAL API
FastAPI backend serving news articles from Neon database
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from news_database import NewsDB
from pydantic import BaseModel

load_dotenv()

# Initialize FastAPI
app = FastAPI(
    title="News Signal API",
    description="Autonomous news collection and ranking engine",
    version="1.0.0"
)

# CORS Configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
if not ALLOWED_ORIGINS or ALLOWED_ORIGINS == [""]:
    # Development: Allow all origins
    ALLOWED_ORIGINS = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response Models
class Article(BaseModel):
    id: int
    title: str
    article: str
    url: str
    source: str
    category: str
    category_confidence: float
    matched_keywords: list
    word_count: Optional[int]
    ai_importance: Optional[float]
    why_it_matters: Optional[str]
    fetched_at: str

class CategoryStats(BaseModel):
    category: str
    article_count: int
    avg_confidence: float
    last_fetched: str

class HealthResponse(BaseModel):
    status: str
    total_articles: int
    database: str
    timestamp: str


# ═══════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check and API info"""
    try:
        with NewsDB() as db:
            total = db.get_total_articles()
        
        return {
            "status": "healthy",
            "total_articles": total,
            "database": "neon",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/articles/{category}")
async def get_articles_by_category(
    category: str,
    limit: int = Query(default=10, ge=1, le=100),
    min_confidence: float = Query(default=0.0, ge=0.0, le=1.0),
    sort_by: str = Query(default="confidence", regex="^(confidence|date|importance)$")
):
    """
    Get articles by category
    
    Args:
        category: Category name (Technology, Business, etc.)
        limit: Max number of articles (1-100)
        min_confidence: Minimum confidence score (0.0-1.0)
        sort_by: Sort order (confidence, date, or importance)
    """
    try:
        with NewsDB() as db:
            # Build query based on sort preference
            if sort_by == "importance":
                order_clause = "importance_score DESC NULLS LAST, category_confidence DESC"
            elif sort_by == "date":
                order_clause = "fetched_at DESC"
            else:  # confidence
                order_clause = "category_confidence DESC, fetched_at DESC"
            
            db.cur.execute(f"""
                SELECT 
                    id, title, article, url, source, category,
                    category_confidence, matched_keywords, word_count,
                    importance_score, sentiment_score, fetched_at
                FROM articles
                WHERE category = %s AND category_confidence >= %s
                ORDER BY {order_clause}
                LIMIT %s
            """, (category, min_confidence, limit))
            
            rows = db.cur.fetchall()
            
            articles = []
            for row in rows:
                articles.append({
                    "id": row[0],
                    "title": row[1],
                    "article": row[2][:500] + "..." if len(row[2]) > 500 else row[2],  # Truncate for API
                    "url": row[3],
                    "source": row[4],
                    "category": row[5],
                    "category_confidence": float(row[6]) if row[6] else 0.0,
                    "matched_keywords": row[7] if row[7] else [],
                    "word_count": row[8],
                    "ai_importance": float(row[9]) if row[9] else None,
                    "why_it_matters": None,  # Future: store in DB
                    "fetched_at": row[11].isoformat() if row[11] else None
                })
            
            return {"articles": articles, "count": len(articles)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching articles: {str(e)}")


@app.get("/articles/id/{article_id}")
async def get_article_by_id(article_id: int):
    """Get full article by ID"""
    try:
        with NewsDB() as db:
            db.cur.execute("""
                SELECT 
                    id, title, article, url, source, category,
                    category_confidence, matched_keywords, word_count,
                    importance_score, sentiment_score, fetched_at
                FROM articles
                WHERE id = %s
            """, (article_id,))
            
            row = db.cur.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail="Article not found")
            
            return {
                "id": row[0],
                "title": row[1],
                "article": row[2],  # Full article
                "url": row[3],
                "source": row[4],
                "category": row[5],
                "category_confidence": float(row[6]) if row[6] else 0.0,
                "matched_keywords": row[7] if row[7] else [],
                "word_count": row[8],
                "ai_importance": float(row[9]) if row[9] else None,
                "sentiment_score": float(row[10]) if row[10] else None,
                "fetched_at": row[11].isoformat() if row[11] else None
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching article: {str(e)}")


@app.get("/categories")
async def get_categories():
    """Get all categories with statistics"""
    try:
        with NewsDB() as db:
            stats = db.get_category_stats()
            
            categories = []
            for row in stats:
                categories.append({
                    "category": row[0],
                    "article_count": row[1],
                    "avg_confidence": float(row[2]) if row[2] else 0.0,
                    "last_fetched": row[3].isoformat() if row[3] else None
                })
            
            return {"categories": categories}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")


@app.get("/top-articles")
async def get_top_articles(
    limit: int = Query(default=20, ge=1, le=100),
    hours: int = Query(default=24, ge=1, le=168),  # Last 24 hours default
    min_confidence: float = Query(default=0.6, ge=0.0, le=1.0)
):
    """
    Get top ranked articles across all categories
    
    Args:
        limit: Max number of articles
        hours: Time window in hours (default: 24)
        min_confidence: Minimum confidence score
    """
    try:
        with NewsDB() as db:
            cutoff_date = datetime.now() - timedelta(hours=hours)
            
            db.cur.execute("""
                SELECT 
                    id, title, article, url, source, category,
                    category_confidence, matched_keywords, word_count,
                    importance_score, fetched_at
                FROM articles
                WHERE fetched_at >= %s AND category_confidence >= %s
                ORDER BY 
                    importance_score DESC NULLS LAST,
                    category_confidence DESC,
                    fetched_at DESC
                LIMIT %s
            """, (cutoff_date, min_confidence, limit))
            
            rows = db.cur.fetchall()
            
            articles = []
            for row in rows:
                articles.append({
                    "id": row[0],
                    "title": row[1],
                    "article": row[2][:300] + "..." if len(row[2]) > 300 else row[2],
                    "url": row[3],
                    "source": row[4],
                    "category": row[5],
                    "category_confidence": float(row[6]) if row[6] else 0.0,
                    "matched_keywords": row[7][:5] if row[7] else [],  # Top 5 keywords
                    "word_count": row[8],
                    "ai_importance": float(row[9]) if row[9] else None,
                    "fetched_at": row[10].isoformat() if row[10] else None
                })
            
            return {"articles": articles, "count": len(articles), "hours": hours}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching top articles: {str(e)}")


@app.get("/search")
async def search_articles(
    q: str = Query(..., min_length=2),
    limit: int = Query(default=20, ge=1, le=100)
):
    """Full-text search in articles"""
    try:
        with NewsDB() as db:
            results = db.search_articles(q, limit)
            
            articles = []
            for row in results:
                articles.append({
                    "id": row[0],
                    "title": row[1],
                    "source": row[2],
                    "category": row[3],
                    "fetched_at": row[4].isoformat() if row[4] else None
                })
            
            return {"articles": articles, "count": len(articles), "query": q}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


@app.get("/stats")
async def get_stats():
    """Get overall database statistics"""
    try:
        with NewsDB() as db:
            total = db.get_total_articles()
            category_stats = db.get_category_stats()
            source_stats = db.get_source_stats()
            
            return {
                "total_articles": total,
                "categories": [
                    {
                        "name": row[0],
                        "count": row[1],
                        "avg_confidence": float(row[2]) if row[2] else 0.0
                    }
                    for row in category_stats
                ],
                "top_sources": [
                    {
                        "source": row[0],
                        "count": row[1],
                        "avg_confidence": float(row[2]) if row[2] else 0.0
                    }
                    for row in source_stats[:10]
                ]
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")


# ═══════════════════════════════════════════════════════
# RUN SERVER
# ═══════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    
    print(f"\n{'='*70}")
    print(f"🚀 NEWS SIGNAL API SERVER")
    print(f"{'='*70}")
    print(f"\n📡 Starting on http://localhost:{port}")
    print(f"📖 Docs: http://localhost:{port}/docs")
    print(f"🔍 ReDoc: http://localhost:{port}/redoc")
    print(f"\n{'='*70}\n")
    
    uvicorn.run(app, host="0.0.0.0", port=port)
