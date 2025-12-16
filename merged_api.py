"""
🚀 UNIFIED API SERVER (News + Crypto + Stocks)
FastAPI backend serving:
1. News articles (from Neon DB / NewsDB)
2. Zenith Scores (Crypto/Stocks from DexScreener/AlphaVantage + Neon DB)
"""

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
from datetime import datetime, timedelta
import os
import time
import requests
from dotenv import load_dotenv
from pydantic import BaseModel

# Database Imports
from news_database import NewsDB  # For News
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base, Session

load_dotenv()

# ═══════════════════════════════════════════════════════
# DATABASE CONFIGURATION
# ═══════════════════════════════════════════════════════

# 1. SQLAlchemy Setup (for Zenith/Product Outcomes)
DATABASE_URL = os.getenv("DATABASE_URL")

# Auto-construct DATABASE_URL if missing but valid NEON vars exist
if not DATABASE_URL and os.getenv("NEON_HOST"):
    user = os.getenv("NEON_USER")
    password = os.getenv("NEON_PASSWORD")
    host = os.getenv("NEON_HOST")
    dbname = os.getenv("NEON_DATABASE")
    DATABASE_URL = f"postgresql://{user}:{password}@{host}/{dbname}?sslmode=require"

engine = None
SessionLocal = None
Base = declarative_base()

if DATABASE_URL:
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        print("✅ SQLAlchemy Engine Initialized")
    except Exception as e:
        print(f"⚠️ SQLAlchemy Init Failed: {e}")

# SQLAlchemy Dependency
def get_db():
    if SessionLocal is None:
        return None
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 2. SQLAlchemy Models
class ProductOutcome(Base):
    __tablename__ = "product_outcomes"
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, index=True)
    avg_price = Column(Float)
    supplier_count = Column(Integer)
    listing_count = Column(Integer)
    predicted_opportunity = Column(Float)
    confidence = Column(String)
    is_red_ocean = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# ═══════════════════════════════════════════════════════
# FASTAPI APP SETUP
# ═══════════════════════════════════════════════════════

app = FastAPI(
    title="Unified DeFi Oracle API",
    description="Combined News Signal & Zenith Scores API",
    version="2.0.0"
)

# CORS Configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
if not ALLOWED_ORIGINS or ALLOWED_ORIGINS == [""]:
    ALLOWED_ORIGINS = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════
# DATA MODELS (Pydantic)
# ═══════════════════════════════════════════════════════

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

class HealthResponse(BaseModel):
    status: str
    total_articles: int
    database: str
    timestamp: str
    services: list

# ═══════════════════════════════════════════════════════
# HELPER FUNCTIONS (Zenith Scoring)
# ═══════════════════════════════════════════════════════

def calculate_zenith_score(pair: dict) -> float:
    """Zenith Score for Crypto"""
    try:
        price_change = pair.get('priceChange', {})
        h1 = float(price_change.get('h1', 0))
        h6 = float(price_change.get('h6', 0))
        h24 = float(price_change.get('h24', 0))
        
        momentum_score = 0
        if h1 > 0: momentum_score += 10
        if h1 > 5: momentum_score += 10
        if h6 > 0: momentum_score += 15
        if h6 > 10: momentum_score += 15
        if h24 > 0: momentum_score += 20
        if h24 > 15: momentum_score += 30
        momentum_score = min(momentum_score, 100)
        
        liquidity = float(pair.get('liquidity', {}).get('usd', 0))
        volume = float(pair.get('volume', {}).get('h24', 0))
        
        vol_score = 0
        if liquidity > 0:
            vol_ratio = volume / liquidity
            if vol_ratio > 0.1: vol_score += 20
            if vol_ratio > 0.5: vol_score += 30
            if vol_ratio > 1.0: vol_score += 50
        
        if liquidity > 50000: vol_score += 20
        if volume > 100000: vol_score += 30
        vol_score = min(vol_score, 100)
        
        social_score = 50 

        final_score = (0.5 * momentum_score) + (0.3 * vol_score) + (0.2 * social_score)
        return round(min(final_score, 100), 2)
    except Exception:
        return 0.0

def calculate_stock_score(stock: dict) -> float:
    """Zenith Score for Stocks"""
    try:
        price = stock.get('price', 0)
        change = stock.get('changesPercentage', 0)
        volume = stock.get('volume', 0)
        avg_volume = stock.get('avgVolume', 1)
        
        trend_score = 50 
        if change > 0: trend_score += 10
        if change > 2: trend_score += 20
        if change > 5: trend_score += 20
        if change < 0: trend_score -= 10
        if change < -2: trend_score -= 20
        trend_score = max(0, min(100, trend_score))

        vol_score = 50
        if volume > avg_volume: vol_score += 20
        if volume > avg_volume * 1.5: vol_score += 30
        vol_score = min(100, vol_score)

        stability_score = 80 

        final_score = (0.5 * trend_score) + (0.3 * vol_score) + (0.2 * stability_score)
        return round(final_score, 0)
    except Exception:
        return 50.0

# ═══════════════════════════════════════════════════════
# CACHE
# ═══════════════════════════════════════════════════════

CACHE_DATA = None
CACHE_TIMESTAMP = 0
CACHE_DURATION = 300  # 5 minutes

ALPHA_VANTAGE_KEY = "27PTDI7FTSYLQI4F"

# ═══════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════

@app.get("/", response_model=HealthResponse)
async def root():
    """Combined Health Check"""
    total_news = 0
    try:
        with NewsDB() as db:
            total_news = db.get_total_articles()
    except:
        pass
    
    return {
        "status": "healthy",
        "total_articles": total_news,
        "database": "neon",
        "timestamp": datetime.now().isoformat(),
        "services": ["news", "crypto", "stocks", "opportunities"]
    }

@app.get("/api/v1/health")
def health_check_v1():
    """Alias for health check"""
    return {"status": "healthy", "service": "Unified API"}

# --- NEWS ENDPOINTS ---

@app.get("/articles/{category}")
async def get_articles_by_category(
    category: str,
    limit: int = Query(default=10, ge=1, le=100),
    min_confidence: float = Query(default=0.0, ge=0.0, le=1.0),
    sort_by: str = Query(default="confidence", regex="^(confidence|date|importance)$")
):
    try:
        with NewsDB() as db:
            if sort_by == "importance":
                order_clause = "importance_score DESC NULLS LAST, category_confidence DESC"
            elif sort_by == "date":
                order_clause = "fetched_at DESC"
            else:
                order_clause = "category_confidence DESC, fetched_at DESC"
            
            db.cur.execute(f"""
                SELECT id, title, article, url, source, category,
                    category_confidence, matched_keywords, word_count,
                    importance_score, sentiment_score, fetched_at
                FROM articles
                WHERE category = %s AND category_confidence >= %s
                ORDER BY {order_clause} LIMIT %s
            """, (category, min_confidence, limit))
            
            rows = db.cur.fetchall()
            articles = []
            for row in rows:
                articles.append({
                    "id": row[0],
                    "title": row[1],
                    "article": row[2][:500] + "..." if len(row[2]) > 500 else row[2],
                    "url": row[3],
                    "source": row[4],
                    "category": row[5],
                    "category_confidence": float(row[6]) if row[6] else 0.0,
                    "matched_keywords": row[7] if row[7] else [],
                    "word_count": row[8],
                    "ai_importance": float(row[9]) if row[9] else None,
                    "fetched_at": row[11].isoformat() if row[11] else None
                })
            return {"articles": articles, "count": len(articles)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/top-articles")
async def get_top_articles(
    limit: int = Query(default=20, ge=1, le=100),
    hours: int = Query(default=24, ge=1, le=168),
    min_confidence: float = Query(default=0.6, ge=0.0, le=1.0)
):
    try:
        with NewsDB() as db:
            cutoff = datetime.now() - timedelta(hours=hours)
            db.cur.execute("""
                SELECT id, title, article, url, source, category,
                    category_confidence, matched_keywords, word_count,
                    importance_score, fetched_at
                FROM articles
                WHERE fetched_at >= %s AND category_confidence >= %s
                ORDER BY importance_score DESC NULLS LAST, category_confidence DESC, fetched_at DESC
                LIMIT %s
            """, (cutoff, min_confidence, limit))
            
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
                    "matched_keywords": row[7][:5] if row[7] else [],
                    "word_count": row[8],
                    "ai_importance": float(row[9]) if row[9] else None,
                    "fetched_at": row[10].isoformat() if row[10] else None
                })
            return {"articles": articles, "count": len(articles)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/categories")
async def get_categories():
    try:
        with NewsDB() as db:
            stats = db.get_category_stats()
            return {"categories": [{"category": r[0], "article_count": r[1], "avg_confidence": float(r[2]), "last_fetched": r[3].isoformat() if r[3] else None} for r in stats]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/stats")
async def get_stats():
    try:
        with NewsDB() as db:
            return {
                "total_articles": db.get_total_articles(),
                "categories": [
                    {"name": r[0], "count": r[1], "avg_confidence": float(r[2])} 
                    for r in db.get_category_stats()
                ],
                "top_sources": [
                    {"source": r[0], "count": r[1], "avg_confidence": float(r[2])}
                    for r in db.get_source_stats()[:10]
                ]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# --- CRYPTO & STOCK ENDPOINTS ---

@app.get("/api/v1/tokens/scored")
def get_scored_tokens(
    limit: int = Query(default=100, le=500),
    min_liquidity: float = Query(default=10000),
    min_volume: float = Query(default=10000)
):
    global CACHE_DATA, CACHE_TIMESTAMP
    current_time = time.time()
    
    if CACHE_DATA and (current_time - CACHE_TIMESTAMP < CACHE_DURATION):
        return {"status": "success", "count": len(CACHE_DATA[:limit]), "data": CACHE_DATA[:limit], "cached": True}

    try:
        url = "https://api.dexscreener.com/latest/dex/search?q=uniswap%20eth%20v2"
        response = requests.get(url, timeout=10)
        if response.status_code != 200: raise HTTPException(status_code=502, detail="DexScreener Unavailable")
        
        data = response.json()
        if not data.get('pairs'): return {"status": "success", "count": 0, "data": []}
        
        tokens = []
        for pair in data['pairs']:
            if not pair.get('baseToken') or not pair.get('liquidity') or not pair.get('volume'): continue
            
            liquidity_usd = pair['liquidity'].get('usd', 0)
            volume_24h = pair['volume'].get('h24', 0)
            if liquidity_usd < min_liquidity or volume_24h < min_volume: continue
            
            zenith_score = calculate_zenith_score(pair)
            tokens.append({
                "symbol": pair['baseToken'].get('symbol', 'UNKNOWN'),
                "name": pair['baseToken'].get('name', 'Unknown Token'),
                "address": pair['baseToken'].get('address'),
                "chain": pair.get('chainId', 'ethereum'),
                "price_usd": float(pair.get('priceUsd', 0)),
                "liquidity_usd": liquidity_usd,
                "volume_24h": volume_24h,
                "price_change_24h": pair.get('priceChange', {}).get('h24', 0),
                "zenith_score": zenith_score,
                "url": pair.get('url')
            })
        
        tokens.sort(key=lambda x: x['zenith_score'], reverse=True)
        CACHE_DATA = tokens
        CACHE_TIMESTAMP = current_time
        
        return {"status": "success", "count": len(tokens[:limit]), "data": tokens[:limit], "cached": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/tokens/trending")
def get_trending_tokens(limit: int = 20):
    return get_scored_tokens(limit=limit)

@app.get("/api/v1/stocks/trending")
def get_trending_stocks(limit: int = 20):
    try:
        url = f"https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey={ALPHA_VANTAGE_KEY}"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        market_list = []
        if "most_actively_traded" in data: market_list.extend(data["most_actively_traded"])
        if "top_gainers" in data: market_list.extend(data["top_gainers"])
            
        seen = set()
        unique_list = []
        for m in market_list:
            if m['ticker'] not in seen:
                seen.add(m['ticker'])
                unique_list.append(m)
        
        # Fallback Mock
        if not unique_list:
            return {"status": "success", "data": [{"symbol": "NVDA", "name": "NVIDIA", "price_usd": 140.50, "price_change_24h": 4.5, "zenith_score": 92}]}

        stocks = []
        for item in unique_list[:limit]:
            price = float(item.get('price', 0))
            change = float(item.get('change_percentage', '0%').replace('%', ''))
            volume = float(item.get('volume', 0))
            score = calculate_stock_score({'price': price, 'changesPercentage': change, 'volume': volume, 'avgVolume': volume})
            
            stocks.append({
                "symbol": item.get('ticker'),
                "price_usd": price,
                "price_change_24h": change,
                "zenith_score": score,
                "type": "stock"
            })
            
        stocks.sort(key=lambda x: x['zenith_score'], reverse=True)
        return {"status": "success", "count": len(stocks), "data": stocks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- OPPORTUNITY ENDPOINTS ---

@app.get("/catalog/top10")
def get_top_opportunities():
    if SessionLocal is None:
        return {"top_opportunities": [{"keyword": "yoga mat", "opportunity_score": 72.5}]}
    
    db = SessionLocal()
    try:
        rows = db.query(ProductOutcome).order_by(ProductOutcome.predicted_opportunity.desc()).limit(10).all()
        if not rows: return {"top_opportunities": [{"keyword": "yoga mat", "opportunity_score": 72.5}]}
        
        return {
            "top_opportunities": [{
                "keyword": r.keyword,
                "opportunity_score": r.predicted_opportunity,
                "avg_price": r.avg_price,
                "confidence": r.confidence,
                "is_red_ocean": r.is_red_ocean
            } for r in rows]
        }
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
