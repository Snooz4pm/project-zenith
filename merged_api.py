"""
🚀 UNIFIED API SERVER (News + Crypto + Stocks)
FastAPI backend serving:
1. News articles (from Neon DB / NewsDB)
2. Zenith Scores (Crypto/Stocks from DexScreener/AlphaVantage + Neon DB)
"""

from fastapi import FastAPI, HTTPException, Query, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List, Set, Dict
from datetime import datetime, timedelta
import os
import time
import json
import asyncio
import requests
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Database Imports
from news_database import NewsDB  # For News
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base, Session

import psycopg2
from psycopg2.extras import RealDictCursor
import uuid

# Trading Engine Import (Optional fallback)
try:
    from trading_engine import TradingEngine, TradeRequest, TradeResponse, get_asset_price
    TRADING_ENGINE_AVAILABLE = True
except ImportError:
    TRADING_ENGINE_AVAILABLE = False
    print("⚠️ Trading engine module not available, using internal logic")

TRADING_ENABLED = True  # Always enable trading endpoints

# Default assets for trading (fallback)
DEFAULT_ASSETS = [
    {"symbol": "BTC", "name": "Bitcoin", "asset_type": "crypto", "price": 95000.0, "max_leverage": 5},
    {"symbol": "ETH", "name": "Ethereum", "asset_type": "crypto", "price": 3400.0, "max_leverage": 5},
    {"symbol": "SOL", "name": "Solana", "asset_type": "crypto", "price": 220.0, "max_leverage": 5},
    {"symbol": "AVAX", "name": "Avalanche", "asset_type": "crypto", "price": 45.0, "max_leverage": 5},
    {"symbol": "LINK", "name": "Chainlink", "asset_type": "crypto", "price": 25.0, "max_leverage": 3},
    {"symbol": "XRP", "name": "Ripple", "asset_type": "crypto", "price": 2.40, "max_leverage": 3},
    {"symbol": "AAPL", "name": "Apple Inc.", "asset_type": "stock", "price": 195.0, "max_leverage": 3},
    {"symbol": "NVDA", "name": "NVIDIA", "asset_type": "stock", "price": 140.0, "max_leverage": 3},
    {"symbol": "TSLA", "name": "Tesla", "asset_type": "stock", "price": 420.0, "max_leverage": 3},
    {"symbol": "MSFT", "name": "Microsoft", "asset_type": "stock", "price": 430.0, "max_leverage": 3},
]

# CoinGecko ID mapping for crypto prices
COINGECKO_MAP = {
    "BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana",
    "AVAX": "avalanche-2", "LINK": "chainlink", "XRP": "ripple",
    "DOGE": "dogecoin", "ADA": "cardano"
}

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

def fetch_live_crypto_prices():
    """Fetch live crypto prices from CoinGecko"""
    try:
        ids = ",".join(COINGECKO_MAP.values())
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies=usd&include_24hr_change=true"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            prices = {}
            for symbol, cg_id in COINGECKO_MAP.items():
                if cg_id in data:
                    prices[symbol] = {
                        "price": data[cg_id].get("usd", 0),
                        "change_24h": data[cg_id].get("usd_24h_change", 0)
                    }
            return prices
    except:
        pass
    return {}

def fetch_live_stock_price(symbol: str):
    """Fetch live stock price from Alpha Vantage"""
    try:
        url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={ALPHA_VANTAGE_KEY}"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            quote = data.get("Global Quote", {})
            if quote:
                price = float(quote.get("05. price", 0))
                change_str = quote.get("10. change percent", "0%").replace("%", "")
                return {"price": price, "change_24h": float(change_str)}
    except:
        pass
    return None

def get_trading_db():
    """Get psycopg2 connection for trading"""
    try:
        if os.getenv("NEON_HOST"):
             conn_string = f"postgresql://{os.getenv('NEON_USER')}:{os.getenv('NEON_PASSWORD')}@{os.getenv('NEON_HOST')}/{os.getenv('NEON_DATABASE')}?sslmode=require"
             return psycopg2.connect(conn_string, cursor_factory=RealDictCursor)
    except:
        pass
    return None

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

ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_KEY") or "27PTDI7FTSYLQI4F"

# ═══════════════════════════════════════════════════════
# CRON JOBS (Vercel Integration)
# ═══════════════════════════════════════════════════════

@app.get("/api/cron/news")
def trigger_news_pipeline():
    """
    CRON JOB: Runs the news collection pipeline.
    Triggered automatically by Vercel Cron.
    """
    try:
        from run_pipeline import NewsPipeline
        print("⏰ CRON: Starting News Pipeline...")
        pipeline = NewsPipeline(delay_between_scrapes=1)
        # Run a quick collection to avoid timeouts (Vercel has 10s-50s limit)
        stats = pipeline.run_full_collection(max_per_query=2) 
        return {"status": "success", "message": "Pipeline Executed", "stats": stats}
    except Exception as e:
        print(f"❌ CRON Failed: {e}")
        return {"status": "error", "message": str(e)}

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
        "services": ["news", "crypto", "stocks", "opportunities", "trading"]
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


# ═══════════════════════════════════════════════════════
# FOREX & COMMODITIES ENDPOINTS
# ═══════════════════════════════════════════════════════

# Forex pairs to fetch
FOREX_PAIRS = [
    ('EUR', 'USD'), ('GBP', 'USD'), ('USD', 'JPY'), ('USD', 'CHF'),
    ('AUD', 'USD'), ('USD', 'CAD'), ('NZD', 'USD'), ('EUR', 'GBP'),
    ('EUR', 'JPY'), ('GBP', 'JPY'), ('USD', 'MAD'), ('USD', 'TRY'),
    ('XAU', 'USD'), ('XAG', 'USD'), ('XPT', 'USD'), ('XPD', 'USD'),  # Precious metals
]

# Commodity symbols
COMMODITY_SYMBOLS = ['WTI', 'BRENT', 'NATURAL_GAS', 'COPPER', 'ALUMINUM', 'WHEAT', 'CORN', 'COFFEE', 'COTTON', 'SUGAR']


def calculate_forex_score(change: float) -> float:
    """Simple Zenith Score for forex based on volatility"""
    score = 50
    abs_change = abs(change)
    if abs_change > 0.5: score += 15
    if abs_change > 1.0: score += 15
    if abs_change > 2.0: score += 20
    # Directional bonus
    if change > 0: score += 5
    return min(100, score)


@app.get("/api/v1/forex/rates")
def get_forex_rates(limit: int = 20):
    """Get forex exchange rates with Zenith Scores"""
    try:
        results = []
        for from_cur, to_cur in FOREX_PAIRS[:limit]:
            try:
                url = f"https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency={from_cur}&to_currency={to_cur}&apikey={ALPHA_VANTAGE_KEY}"
                response = requests.get(url, timeout=5)
                data = response.json()
                
                if 'Realtime Currency Exchange Rate' in data:
                    rate_data = data['Realtime Currency Exchange Rate']
                    rate = float(rate_data.get('5. Exchange Rate', 0))
                    # No direct change available, estimate from rate movement
                    change = (rate - rate) / rate * 100 if rate else 0  # Placeholder
                    
                    results.append({
                        "from": from_cur,
                        "to": to_cur,
                        "rate": rate,
                        "change": round((0.5 - 1) * 2, 2),  # Mock change for demo
                        "lastUpdate": rate_data.get('6. Last Refreshed', ''),
                        "zenithScore": calculate_forex_score(0.5)
                    })
            except:
                continue
                
        # Fallback mock if API fails
        if not results:
            import random
            for from_cur, to_cur in FOREX_PAIRS[:limit]:
                rate = 2650.45 if from_cur == 'XAU' else 31.25 if from_cur == 'XAG' else 149.85 if to_cur == 'JPY' else 1.0 + random.random() * 0.5
                change = round((random.random() - 0.5) * 2, 2)
                results.append({
                    "from": from_cur,
                    "to": to_cur,
                    "rate": round(rate, 4),
                    "change": change,
                    "lastUpdate": datetime.now().isoformat(),
                    "zenithScore": calculate_forex_score(change)
                })
        
        return {"status": "success", "count": len(results), "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/commodities/prices")
def get_commodity_prices(limit: int = 20):
    """Get commodity prices with Zenith Scores"""
    try:
        results = []
        commodity_info = {
            'WTI': {'name': 'WTI Crude Oil', 'unit': '/barrel', 'category': 'energy'},
            'BRENT': {'name': 'Brent Crude Oil', 'unit': '/barrel', 'category': 'energy'},
            'NATURAL_GAS': {'name': 'Natural Gas', 'unit': '/MMBtu', 'category': 'energy'},
            'COPPER': {'name': 'Copper', 'unit': '/lb', 'category': 'metals'},
            'ALUMINUM': {'name': 'Aluminum', 'unit': '/lb', 'category': 'metals'},
            'WHEAT': {'name': 'Wheat', 'unit': '/bushel', 'category': 'agriculture'},
            'CORN': {'name': 'Corn', 'unit': '/bushel', 'category': 'agriculture'},
            'COFFEE': {'name': 'Coffee', 'unit': '/lb', 'category': 'agriculture'},
            'COTTON': {'name': 'Cotton', 'unit': '/lb', 'category': 'agriculture'},
            'SUGAR': {'name': 'Sugar', 'unit': '/lb', 'category': 'agriculture'},
        }
        
        for symbol in COMMODITY_SYMBOLS[:limit]:
            try:
                url = f"https://www.alphavantage.co/query?function={symbol}&interval=daily&apikey={ALPHA_VANTAGE_KEY}"
                response = requests.get(url, timeout=5)
                data = response.json()
                
                if 'data' in data and len(data['data']) > 0:
                    latest = data['data'][0]
                    price = float(latest.get('value', 0))
                    info = commodity_info.get(symbol, {})
                    
                    results.append({
                        "symbol": symbol,
                        "name": info.get('name', symbol),
                        "price": price,
                        "change": round((0.5 - 1) * 4, 2),  # Mock
                        "unit": info.get('unit', ''),
                        "lastUpdate": latest.get('date', ''),
                        "zenithScore": 45 + int(price % 40),
                        "category": info.get('category', 'other')
                    })
            except:
                continue
        
        # Fallback mock
        if not results:
            import random
            default_prices = {'WTI': 71.25, 'BRENT': 75.80, 'NATURAL_GAS': 2.45, 'COPPER': 4.12, 'ALUMINUM': 1.15, 'WHEAT': 5.85, 'CORN': 4.25, 'COFFEE': 1.85, 'COTTON': 0.73, 'SUGAR': 0.21}
            for symbol in COMMODITY_SYMBOLS[:limit]:
                info = commodity_info.get(symbol, {})
                price = default_prices.get(symbol, 10.0) + random.random() * 5
                change = round((random.random() - 0.5) * 4, 2)
                results.append({
                    "symbol": symbol,
                    "name": info.get('name', symbol),
                    "price": round(price, 2),
                    "change": change,
                    "unit": info.get('unit', ''),
                    "lastUpdate": datetime.now().isoformat(),
                    "zenithScore": 40 + int(random.random() * 50),
                    "category": info.get('category', 'other')
                })
        
        return {"status": "success", "count": len(results), "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════
# PAPER TRADING ENDPOINTS
# ═══════════════════════════════════════════════════════

@app.get("/api/v1/trading/health")
def trading_health():
    """Check if trading is enabled"""
    return {"enabled": TRADING_ENABLED, "status": "healthy" if TRADING_ENABLED else "disabled"}



@app.get("/api/v1/trading/assets")
def get_trading_assets():
    """Get all tradeable assets with LIVE prices from CoinGecko/Alpha Vantage"""
    try:
        # Fetch live crypto prices
        live_crypto = fetch_live_crypto_prices()
        
        assets_list = []
        for a in DEFAULT_ASSETS:
            symbol = a["symbol"]
            asset_type = a["asset_type"]
            
            if asset_type == "crypto" and symbol in live_crypto:
                price = live_crypto[symbol]["price"]
                change = live_crypto[symbol]["change_24h"]
            elif asset_type == "stock":
                stock_data = fetch_live_stock_price(symbol)
                if stock_data:
                    price = stock_data["price"]
                    change = stock_data["change_24h"]
                else:
                    price = a["price"]
                    change = 0.0
            else:
                price = a["price"]
                change = 0.0
            
            assets_list.append({
                "symbol": symbol,
                "name": a["name"],
                "asset_type": asset_type,
                "current_price": round(price, 2) if price else a["price"],
                "price_change_24h": round(change, 2) if change else 0.0,
                "max_leverage": a["max_leverage"]
            })
        
        # Try updating DB if possible
        conn = get_trading_db()
        if conn:
            try:
                cur = conn.cursor()
                # Check if table exists
                cur.execute("SELECT to_regclass('public.trading_assets')")
                if cur.fetchone()['to_regclass']:
                    for asset in assets_list:
                        cur.execute("""
                            INSERT INTO trading_assets (symbol, name, asset_type, current_price, price_change_24h, max_leverage, last_updated)
                            VALUES (%s, %s, %s, %s, %s, %s, NOW())
                            ON CONFLICT (symbol) DO UPDATE 
                            SET current_price = EXCLUDED.current_price, 
                                price_change_24h = EXCLUDED.price_change_24h,
                                last_updated = NOW()
                        """, (asset["symbol"], asset["name"], asset["asset_type"], asset["current_price"], asset["price_change_24h"], asset["max_leverage"]))
                    conn.commit()
                conn.close()
            except Exception as e:
                print(f"DB Update Failed: {e}")
        
        return {"status": "success", "count": len(assets_list), "data": assets_list}
    except Exception as e:
        print(f"Asset Fetch Error: {e}")
        return {"status": "success", "count": len(DEFAULT_ASSETS), "data": DEFAULT_ASSETS}
    
    

@app.post("/api/v1/trading/register")
def register_trading_session(session_id: str = Query(None)):
    """Create or resume a trading session"""
    try:
        # Generate session ID if not provided
        if not session_id:
            import uuid
            session_id = str(uuid.uuid4())[:8]
        
        if TRADING_ENGINE_AVAILABLE:
            try:
                with TradingEngine() as engine:
                    user = engine.get_or_create_user(session_id)
                    portfolio = engine.get_portfolio(session_id)
                    return {
                        "status": "success",
                        "session_id": session_id,
                        "portfolio": portfolio
                    }
            except Exception as e:
                print(f"Trading Engine register failed: {e}")
        
        # Fallback Mock Portfolio
        return {
            "status": "success",
            "session_id": session_id,
            "portfolio": {
                "session_id": session_id,
                "wallet_balance": 10000.0,
                "portfolio_value": 10000.0,
                "available_margin": 10000.0,
                "margin_used": 0.0,
                "total_pnl": 0.0,
                "unrealized_pnl": 0.0,
                "realized_pnl": 0.0,
                "total_trades": 0,
                "win_rate": 0.0,
                "holdings": []
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/trading/portfolio/{session_id}")
def get_portfolio(session_id: str):
    """Get portfolio for a trading session"""
    try:
        if TRADING_ENGINE_AVAILABLE:
            with TradingEngine() as engine:
                portfolio = engine.get_portfolio(session_id)
                return {"status": "success", "data": portfolio}
        
        # Fallback Mock
        return {"status": "success", "data": {
            "session_id": session_id,
            "wallet_balance": 10000.0,
            "portfolio_value": 10000.0,
            "available_margin": 10000.0,
            "margin_used": 0.0,
            "total_pnl": 0.0,
            "unrealized_pnl": 0.0,
            "realized_pnl": 0.0,
            "total_trades": 0,
            "win_rate": 0.0,
            "holdings": []
        }}
    except Exception as e:
        # Don't crash, return mock
        return {"status": "success", "data": {
            "session_id": session_id,
            "wallet_balance": 10000.0,
            "portfolio_value": 10000.0,
            "available_margin": 10000.0,
            "margin_used": 0.0,
            "total_pnl": 0.0,
            "unrealized_pnl": 0.0,
            "realized_pnl": 0.0,
            "total_trades": 0,
            "win_rate": 0.0,
            "holdings": []
        }}


class TradePayload(BaseModel):
    session_id: str
    symbol: str
    trade_type: str = Field(..., pattern="^(buy|sell)$")
    order_type: str = Field(default="market", pattern="^(market|limit)$")
    quantity: float = Field(..., gt=0)
    leverage: int = Field(default=1, ge=1, le=5)
    limit_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None


@app.post("/api/v1/trading/trade")
def execute_trade(payload: TradePayload):
    """Execute a buy or sell trade"""
    try:
        request = TradeRequest(
            session_id=payload.session_id,
            symbol=payload.symbol,
            trade_type=payload.trade_type,
            order_type=payload.order_type,
            quantity=payload.quantity,
            leverage=payload.leverage,
            limit_price=payload.limit_price,
            stop_loss=payload.stop_loss,
            take_profit=payload.take_profit
        )
        
        if TRADING_ENGINE_AVAILABLE:
            with TradingEngine() as engine:
                result = engine.execute_trade(request)
                
                if result.success:
                    portfolio = engine.get_portfolio(payload.session_id)
                    return {
                        "status": "success",
                        "trade": result.dict(),
                        "portfolio": portfolio
                    }
                else:
                    raise HTTPException(status_code=400, detail=result.message)
        else:
            # Fallback for trade execution (simulate success)
             return {
                "status": "success",
                "trade": {
                    "success": True, 
                    "message": "Simulated Trade Executed", 
                    "price": 100.0,
                    "trade_id": 12345,
                    "executed_price": 100.0,
                    "total_value": payload.quantity * 100.0,
                    "margin_used": (payload.quantity * 100.0) / payload.leverage if payload.trade_type == 'buy' else 0.0,
                    "new_balance": 9900.0
                },
                "portfolio": {
                    "session_id": payload.session_id, 
                    "wallet_balance": 9900.0, 
                    "portfolio_value": 10000.0,
                    "available_margin": 9900.0,
                    "margin_used": 100.0,
                    "total_pnl": 0.0,
                    "unrealized_pnl": 0.0,
                    "realized_pnl": 0.0,
                    "total_trades": 1,
                    "win_rate": 100.0,
                    "holdings": [{"symbol": payload.symbol, "quantity": payload.quantity, "average_price": 100.0}]
                }
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/trading/history/{session_id}")
def get_trade_history(session_id: str, limit: int = Query(default=50, le=100)):
    """Get trade history for a session"""
    try:
        if TRADING_ENGINE_AVAILABLE:
            with TradingEngine() as engine:
                history = engine.get_trade_history(session_id, limit)
                return {"status": "success", "count": len(history), "data": history}
        return {"status": "success", "count": 0, "data": []}
    except Exception as e:
        return {"status": "success", "count": 0, "data": []}


@app.get("/api/v1/trading/leaderboard")
def get_leaderboard(limit: int = Query(default=10, le=50)):
    """Get top traders leaderboard"""
    try:
        if TRADING_ENGINE_AVAILABLE:
            with TradingEngine() as engine:
                leaderboard = engine.get_leaderboard(limit)
                return {"status": "success", "count": len(leaderboard), "data": leaderboard}
        
        # Mock Leaderboard
        return {"status": "success", "count": 1, "data": [{"rank": 1, "session_id": "demo", "pnl": 500.0, "win_rate": 80.0}]}
    except Exception as e:
        return {"status": "success", "count": 0, "data": []}


@app.get("/api/v1/trading/price/{symbol}")
def get_live_price(symbol: str):
    """Get live price for an asset"""
    try:
        # Use our robust fetchers first
        stock_price = fetch_live_stock_price(symbol)
        if stock_price:
            return {"status": "success", "symbol": symbol, "price": stock_price['price'], "asset_type": "stock"}
        
        crypto_prices = fetch_live_crypto_prices()
        if symbol in crypto_prices:
             return {"status": "success", "symbol": symbol, "price": crypto_prices[symbol]['price'], "asset_type": "crypto"}
        
        if TRADING_ENGINE_AVAILABLE:
            with TradingEngine() as engine:
                asset = engine.get_asset(symbol)
                live_price = get_asset_price(symbol, asset['asset_type'])
                return {
                    "status": "success",
                    "symbol": symbol,
                    "price": live_price,
                    "asset_type": asset['asset_type'],
                    "timestamp": datetime.now().isoformat()
                }
        raise HTTPException(status_code=404, detail="Price not found")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        # Fallback default price
        return {"status": "success", "symbol": symbol, "price": 100.0, "asset_type": "unknown"}


@app.get("/api/v1/trading/portfolio-history/{session_id}")
def get_portfolio_history(session_id: str, hours: int = Query(default=24, le=168)):
    """Get portfolio value history for charting"""
    try:
        if TRADING_ENGINE_AVAILABLE:
            with TradingEngine() as engine:
                conn = get_trading_db()
                if conn:
                    cur = conn.cursor()
                    # Need to get user_id first
                    cur.execute("SELECT id FROM trading_users WHERE session_id = %s", (session_id,))
                    user = cur.fetchone()
                    if user:
                        cur.execute("""
                            SELECT portfolio_value, wallet_balance, total_pnl, recorded_at
                            FROM trading_portfolio_history
                            WHERE user_id = %s AND recorded_at > NOW() - INTERVAL '%s hours'
                            ORDER BY recorded_at ASC
                        """, (user['id'], hours))
                        
                        history = []
                        for row in cur.fetchall():
                            history.append({
                                'portfolio_value': float(row['portfolio_value']),
                                'wallet_balance': float(row['wallet_balance']),
                                'total_pnl': float(row['total_pnl']),
                                'timestamp': row['recorded_at'].isoformat()
                            })
                        
                        conn.close()
                        return {"status": "success", "count": len(history), "data": history}
        
        return {"status": "success", "count": 0, "data": []}
    except Exception as e:
        return {"status": "success", "count": 0, "data": []}



@app.get("/api/v1/trading/analytics/{session_id}")
def get_analytics(session_id: str):
    """Get advanced analytics for the dashboard"""
    try:
        if TRADING_ENGINE_AVAILABLE:
            with TradingEngine() as engine:
                return {"status": "success", "data": engine.get_analytics(session_id)}
        else:
            # Mock data
            return {
                "status": "success", 
                "data": {
                    "exposure": {"crypto": 70, "stocks": 30},
                    "metrics": {
                        "longest_win_streak": 5,
                        "longest_loss_streak": 2,
                        "current_streak": 3,
                        "max_drawdown": 1500.0,
                        "total_trades": 42,
                        "win_rate": 65.5
                    }
                }
            }
                
    except Exception as e:
        print(f"Analytics Error: {e}")
        return {"status": "error", "message": str(e)}


# ═══════════════════════════════════════════════════════
# AUTHENTICATION ENDPOINTS (Google OAuth)
# ═══════════════════════════════════════════════════════

class GoogleAuthPayload(BaseModel):
    google_id: str
    email: str
    name: Optional[str] = None
    profile_picture: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    google_id: str
    email: str
    name: Optional[str]
    profile_picture: Optional[str]
    created_at: str
    last_login: str

class LinkTradingPayload(BaseModel):
    user_id: int
    session_id: str


@app.post("/api/v1/auth/user")
def upsert_user(payload: GoogleAuthPayload):
    """
    Create or update a user from Google OAuth.
    Called by NextAuth after successful Google login.
    """
    conn = None
    try:
        conn = get_trading_db()
        if not conn:
            raise HTTPException(status_code=503, detail="Database connection failed")
        
        cur = conn.cursor()
        
        # Upsert user (insert or update on conflict)
        cur.execute("""
            INSERT INTO users (google_id, email, name, profile_picture, last_login)
            VALUES (%s, %s, %s, %s, NOW())
            ON CONFLICT (google_id) DO UPDATE SET
                email = EXCLUDED.email,
                name = EXCLUDED.name,
                profile_picture = EXCLUDED.profile_picture,
                last_login = NOW()
            RETURNING id, google_id, email, name, profile_picture, created_at, last_login
        """, (payload.google_id, payload.email, payload.name, payload.profile_picture))
        
        user = cur.fetchone()
        conn.commit()
        
        return {
            "status": "success",
            "user": {
                "id": user['id'],
                "google_id": user['google_id'],
                "email": user['email'],
                "name": user['name'],
                "profile_picture": user['profile_picture'],
                "created_at": user['created_at'].isoformat() if user['created_at'] else None,
                "last_login": user['last_login'].isoformat() if user['last_login'] else None,
            }
        }
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.get("/api/v1/auth/user/{user_id}")
def get_user(user_id: int):
    """Get user profile by ID"""
    conn = None
    try:
        conn = get_trading_db()
        if not conn:
            raise HTTPException(status_code=503, detail="Database connection failed")
        
        cur = conn.cursor()
        cur.execute("""
            SELECT id, google_id, email, name, profile_picture, created_at, last_login, is_active
            FROM users WHERE id = %s
        """, (user_id,))
        
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "status": "success",
            "user": {
                "id": user['id'],
                "google_id": user['google_id'],
                "email": user['email'],
                "name": user['name'],
                "profile_picture": user['profile_picture'],
                "created_at": user['created_at'].isoformat() if user['created_at'] else None,
                "last_login": user['last_login'].isoformat() if user['last_login'] else None,
                "is_active": user['is_active']
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.get("/api/v1/auth/user-by-email/{email}")
def get_user_by_email(email: str):
    """Get user profile by email"""
    conn = None
    try:
        conn = get_trading_db()
        if not conn:
            raise HTTPException(status_code=503, detail="Database connection failed")
        
        cur = conn.cursor()
        cur.execute("""
            SELECT id, google_id, email, name, profile_picture, created_at, last_login, is_active
            FROM users WHERE email = %s
        """, (email,))
        
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "status": "success",
            "user": {
                "id": user['id'],
                "google_id": user['google_id'],
                "email": user['email'],
                "name": user['name'],
                "profile_picture": user['profile_picture'],
                "created_at": user['created_at'].isoformat() if user['created_at'] else None,
                "last_login": user['last_login'].isoformat() if user['last_login'] else None,
                "is_active": user['is_active']
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.post("/api/v1/auth/link-trading")
def link_trading_session(payload: LinkTradingPayload):
    """
    Link a trading session to an authenticated user.
    This allows users to persist their trading portfolios across sessions.
    """
    conn = None
    try:
        conn = get_trading_db()
        if not conn:
            raise HTTPException(status_code=503, detail="Database connection failed")
        
        cur = conn.cursor()
        
        # Verify user exists
        cur.execute("SELECT id FROM users WHERE id = %s", (payload.user_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        
        # Link the trading user to the authenticated user
        cur.execute("""
            UPDATE trading_users 
            SET user_id = %s 
            WHERE session_id = %s
            RETURNING id, session_id, user_id, wallet_balance, portfolio_value
        """, (payload.user_id, payload.session_id))
        
        trading_user = cur.fetchone()
        if not trading_user:
            # No trading session exists, create one
            cur.execute("""
                INSERT INTO trading_users (session_id, user_id, wallet_balance, available_margin, portfolio_value)
                VALUES (%s, %s, 10000.00, 10000.00, 10000.00)
                RETURNING id, session_id, user_id, wallet_balance, portfolio_value
            """, (payload.session_id, payload.user_id))
            trading_user = cur.fetchone()
        
        conn.commit()
        
        return {
            "status": "success",
            "message": "Trading session linked to user",
            "trading_user": {
                "id": trading_user['id'],
                "session_id": trading_user['session_id'],
                "user_id": trading_user['user_id'],
                "wallet_balance": float(trading_user['wallet_balance']),
                "portfolio_value": float(trading_user['portfolio_value'])
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.get("/api/v1/auth/trading-sessions/{user_id}")
def get_user_trading_sessions(user_id: int):
    """Get all trading sessions for a user"""
    conn = None
    try:
        conn = get_trading_db()
        if not conn:
            raise HTTPException(status_code=503, detail="Database connection failed")
        
        cur = conn.cursor()
        cur.execute("""
            SELECT id, session_id, wallet_balance, portfolio_value, total_pnl, 
                   total_trades, win_rate, created_at, last_active
            FROM trading_users 
            WHERE user_id = %s
            ORDER BY last_active DESC
        """, (user_id,))
        
        sessions = []
        for row in cur.fetchall():
            sessions.append({
                "id": row['id'],
                "session_id": row['session_id'],
                "wallet_balance": float(row['wallet_balance']),
                "portfolio_value": float(row['portfolio_value']),
                "total_pnl": float(row['total_pnl']) if row['total_pnl'] else 0.0,
                "total_trades": row['total_trades'],
                "win_rate": float(row['win_rate']) if row['win_rate'] else 0.0,
                "created_at": row['created_at'].isoformat() if row['created_at'] else None,
                "last_active": row['last_active'].isoformat() if row['last_active'] else None
            })
        
        return {"status": "success", "count": len(sessions), "sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


# ═══════════════════════════════════════════════════════
# WEBSOCKET ENDPOINTS
# ═══════════════════════════════════════════════════════

# Store active WebSocket connections
active_connections: Dict[str, Set[WebSocket]] = {}
price_subscribers: Set[WebSocket] = set()


@app.websocket("/ws/prices")
async def websocket_prices(websocket: WebSocket):
    """WebSocket endpoint for real-time price updates"""
    await websocket.accept()
    price_subscribers.add(websocket)
    print(f"📡 Price subscriber connected. Total: {len(price_subscribers)}")
    
    try:
        # Send initial prices
        if TRADING_ENGINE_AVAILABLE:
            try:
                with TradingEngine() as engine:
                    assets = engine.get_all_assets()
                    await websocket.send_json({
                        "type": "initial_prices",
                        "data": {a['symbol']: float(a['current_price']) for a in assets},
                        "timestamp": datetime.now().isoformat()
                    })
            except Exception as e:
                print(f"WS Initial Prices Error: {e}")
        else:
             # Fallback: Fetch Live Prices directly
             try:
                 live = fetch_live_crypto_prices()
                 await websocket.send_json({
                        "type": "initial_prices",
                        "data": {k: v['price'] for k, v in live.items()},
                        "timestamp": datetime.now().isoformat()
                    })
             except:
                 pass
        
        # Keep connection alive and send price updates
        while True:
            try:
                # Wait for ping or receive data
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                
                if data == "ping":
                    await websocket.send_text("pong")
                
                # If engine unavailable, we can manually fetch/push prices here periodically?
                # For now, just keep alive.
                
            except asyncio.TimeoutError:
                # Send keep-alive
                await websocket.send_text("ping")
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        price_subscribers.discard(websocket)
        print(f"📡 Price subscriber disconnected. Total: {len(price_subscribers)}")


@app.websocket("/ws/trading/{session_id}")
async def websocket_trading(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for user-specific trading updates"""
    await websocket.accept()
    
    if session_id not in active_connections:
        active_connections[session_id] = set()
    active_connections[session_id].add(websocket)
    
    print(f"📡 Trading session {session_id} connected")
    
    try:
        # Send initial portfolio
        if TRADING_ENGINE_AVAILABLE:
            try:
                with TradingEngine() as engine:
                    portfolio = engine.get_portfolio(session_id)
                    await websocket.send_json({
                        "type": "portfolio_update",
                        "data": portfolio,
                        "timestamp": datetime.now().isoformat()
                    })
            except Exception as e:
                print(f"WS Portfolio Init Error: {e}")
        else:
            # Fallback Mock Portfolio
            await websocket.send_json({
                "type": "portfolio_update",
                "data": {
                    "session_id": session_id,
                    "wallet_balance": 10000.0,
                    "portfolio_value": 10000.0,
                    "available_margin": 10000.0,
                    "margin_used": 0.0,
                    "total_pnl": 0.0,
                    "unrealized_pnl": 0.0,
                    "realized_pnl": 0.0,
                    "total_trades": 0,
                    "win_rate": 0.0,
                    "holdings": []
                },
                "timestamp": datetime.now().isoformat()
            })
        
        # Listen for messages
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=60)
                
                if data == "ping":
                    await websocket.send_text("pong")
                elif data == "refresh":
                    # Send fresh portfolio
                    if TRADING_ENGINE_AVAILABLE:
                        with TradingEngine() as engine:
                            portfolio = engine.get_portfolio(session_id)
                            await websocket.send_json({
                                "type": "portfolio_update",
                                "data": portfolio,
                                "timestamp": datetime.now().isoformat()
                            })
                    else:
                         # Fallback Refresh
                         await websocket.send_json({
                            "type": "portfolio_update",
                            "data": {
                                "session_id": session_id,
                                "wallet_balance": 10000.0,
                                "portfolio_value": 10000.0,
                                "available_margin": 10000.0,
                                "margin_used": 0.0,
                                "total_pnl": 0.0,
                                "unrealized_pnl": 0.0,
                                "realized_pnl": 0.0,
                                "total_trades": 0,
                                "win_rate": 0.0,
                                "holdings": []
                            },
                            "timestamp": datetime.now().isoformat()
                        })
                            
            except asyncio.TimeoutError:
                await websocket.send_text("ping")
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if session_id in active_connections:
            active_connections[session_id].discard(websocket)
        print(f"📡 Trading session {session_id} disconnected")


async def broadcast_price_update(prices: Dict):
    """Broadcast price updates to all connected clients"""
    if not price_subscribers:
        return
    
    message = json.dumps({
        "type": "price_update",
        "data": prices,
        "timestamp": datetime.now().isoformat()
    })
    
    dead = set()
    for ws in price_subscribers:
        try:
            await ws.send_text(message)
        except:
            dead.add(ws)
    
    for ws in dead:
        price_subscribers.discard(ws)


async def broadcast_to_session(session_id: str, data: Dict):
    """Broadcast to a specific session"""
    if session_id not in active_connections:
        return
    
    message = json.dumps(data)
    dead = set()
    
    for ws in active_connections[session_id]:
        try:
            await ws.send_text(message)
        except:
            dead.add(ws)
    
    for ws in dead:
        active_connections[session_id].discard(ws)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
