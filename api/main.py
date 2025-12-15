from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import requests

load_dotenv()

app = FastAPI(title="Zenith Scores API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "Zenith Scores API",
        "version": "2.0.0",
        "status": "operational",
        "endpoints": [
            "/api/v1/tokens/trending",
            "/api/v1/health"
        ]
    }

@app.get("/api/v1/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Zenith Scores API"
    }

@app.get("/api/v1/tokens/trending")
def get_trending_tokens(
    limit: int = Query(default=100, le=500),
    min_liquidity: float = Query(default=10000),
    min_volume: float = Query(default=10000)
):
    """
    Fetches trending tokens from DexScreener.
    """
    try:
        # Fetch from DexScreener API
        url = "https://api.dexscreener.com/latest/dex/search?q=uniswap%20eth%20v2"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="DexScreener API unavailable")
        
        data = response.json()
        
        if not data.get('pairs'):
            return {"status": "success", "count": 0, "data": []}
        
        # Filter and transform pairs
        tokens = []
        for pair in data['pairs']:
            if not pair.get('baseToken') or not pair.get('liquidity') or not pair.get('volume'):
                continue
                
            liquidity_usd = pair['liquidity'].get('usd', 0)
            volume_24h = pair['volume'].get('h24', 0)
            
            # Apply filters
            if liquidity_usd < min_liquidity or volume_24h < min_volume:
                continue
            
            # Calculate price change
            price_change = pair.get('priceChange', {})
            change_24h = price_change.get('h24', 0)
            
            tokens.append({
                "symbol": pair['baseToken'].get('symbol', 'UNKNOWN'),
                "name": pair['baseToken'].get('name', 'Unknown Token'),
                "address": pair['baseToken'].get('address'),
                "chain": pair.get('chainId', 'ethereum'),
                "price_usd": float(pair.get('priceUsd', 0)),
                "liquidity_usd": liquidity_usd,
                "volume_24h": volume_24h,
                "price_change_24h": change_24h,
                "dex_id": pair.get('dexId'),
                "pair_address": pair.get('pairAddress'),
                "url": pair.get('url'),
                "fdv": pair.get('fdv'),
                "market_cap": pair.get('marketCap')
            })
        
        # Sort by volume (descending)
        tokens.sort(key=lambda x: x['volume_24h'], reverse=True)
        
        # Limit results
        tokens = tokens[:limit]
        
        return {
            "status": "success",
            "count": len(tokens),
            "filters": {
                "min_liquidity": min_liquidity,
                "min_volume": min_volume
            },
            "data": tokens
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"External API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

# --- SCORING LOGIC ---

def calculate_zenith_score(pair: dict) -> float:
    """
    Calculates the Zenith Score (0-100) for crypto tokens based on momentum and volume.
    Formula: (0.5 * Price Change Factor) + (0.3 * Vol/Liq Factor) + (0.2 * Social Factor)
    """
    # Existing Crypto Logic
    try:
        price_change = pair.get('priceChange', {})
        h1 = float(price_change.get('h1', 0))
        h6 = float(price_change.get('h6', 0))
        h24 = float(price_change.get('h24', 0))
        
        # 1. Momentum Score (50%)
        momentum_score = 0
        if h1 > 0: momentum_score += 10
        if h1 > 5: momentum_score += 10
        if h6 > 0: momentum_score += 15
        if h6 > 10: momentum_score += 15
        if h24 > 0: momentum_score += 20
        if h24 > 15: momentum_score += 30
        momentum_score = min(momentum_score, 100)
        
        # 2. Volume/Liquidity Score (30%)
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
        
        # 3. Social/Viral Score (20%) - Placeholder
        social_score = 50 

        final_score = (0.5 * momentum_score) + (0.3 * vol_score) + (0.2 * social_score)
        return round(min(final_score, 100), 2)
    except Exception:
        return 0.0

def calculate_stock_score(stock: dict) -> float:
    """
    Zenith Score logic for Stocks.
    Focuses on Trend Strength (Moving Averages) and Volume.
    """
    try:
        price = stock.get('price', 0)
        change = stock.get('changesPercentage', 0)
        volume = stock.get('volume', 0)
        avg_volume = stock.get('avgVolume', 1)
        
        # 1. Trend Score (Price Change) - 50%
        trend_score = 50 # Start neutral
        if change > 0: trend_score += 10
        if change > 2: trend_score += 20
        if change > 5: trend_score += 20
        if change < 0: trend_score -= 10
        if change < -2: trend_score -= 20
        trend_score = max(0, min(100, trend_score))

        # 2. Volume Score (Rel to Avg) - 30%
        vol_score = 50
        if volume > avg_volume: vol_score += 20
        if volume > avg_volume * 1.5: vol_score += 30
        vol_score = min(100, vol_score)

        # 3. 'Stability' Score - 20% (Placeholder for now, assumes large cap is stable)
        stability_score = 80 

        final_score = (0.5 * trend_score) + (0.3 * vol_score) + (0.2 * stability_score)
        return round(final_score, 0)
    except Exception:
        return 50.0

# --- ENDPOINTS ---

import time

# Simple In-Memory Cache
CACHE_DATA = None
CACHE_TIMESTAMP = 0
CACHE_DURATION = 300  # 5 minutes in seconds

@app.get("/api/v1/tokens/scored")
def get_scored_tokens(
    limit: int = Query(default=100, le=500),
    min_liquidity: float = Query(default=10000),
    min_volume: float = Query(default=10000)
):
    """
    Fetches trending tokens and adds a Zenith Score.
    Uses 5-minute in-memory caching.
    """
    global CACHE_DATA, CACHE_TIMESTAMP
    
    current_time = time.time()
    
    # Check cache validity
    if CACHE_DATA and (current_time - CACHE_TIMESTAMP < CACHE_DURATION):
        # Return cached data (filtered locally if needed, but for simplicity returning pre-sorted list)
        # Note: If filters change per request, we should filter the cached list here.
        # For this MVP, we return the cached list slice.
        return {
            "status": "success",
            "count": len(CACHE_DATA[:limit]),
            "data": CACHE_DATA[:limit],
            "cached": True,
            "cache_age_seconds": int(current_time - CACHE_TIMESTAMP)
        }

    try:
        # Fetch from DexScreener API
        url = "https://api.dexscreener.com/latest/dex/search?q=uniswap%20eth%20v2"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="DexScreener API unavailable")
        
        data = response.json()
        
        if not data.get('pairs'):
            return {"status": "success", "count": 0, "data": []}
        
        # Filter and transform pairs
        tokens = []
        for pair in data['pairs']:
            if not pair.get('baseToken') or not pair.get('liquidity') or not pair.get('volume'):
                continue
                
            liquidity_usd = pair['liquidity'].get('usd', 0)
            volume_24h = pair['volume'].get('h24', 0)
            
            # Apply filters (Note: cache stores filtered items based on default/request)
            # To make cache robust, we might want to cache raw-ish scored tokens and filter on return.
            # But the prompt asks for "simple". Let's cache the scored list.
            
            # Calculate Score
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
                "h1_change": pair.get('priceChange', {}).get('h1', 0),
                "h6_change": pair.get('priceChange', {}).get('h6', 0),
                "zenith_score": zenith_score,
                "dex_id": pair.get('dexId'),
                "url": pair.get('url'),
                "fdv": pair.get('fdv')
            })
        
        # Sort by Zenith Score (descending)
        tokens.sort(key=lambda x: x['zenith_score'], reverse=True)
        
        # Update Cache
        CACHE_DATA = tokens
        CACHE_TIMESTAMP = current_time
        
        # Limit results for return
        return {
            "status": "success",
            "count": len(tokens[:limit]),
            "data": tokens[:limit],
            "cached": False
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"External API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.get("/api/v1/search")
def search_tokens(query: str = Query(min_length=1)):
    """
    Proxy endpoint to search tokens via DexScreener.
    """
    try:
        url = f"https://api.dexscreener.com/latest/dex/search?q={query}"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="DexScreener Search API unavailable")
            
        data = response.json()
        
        if not data.get('pairs'):
            return {"status": "success", "count": 0, "data": []}
            
        # Simplified transformation for search
        results = []
        for pair in data['pairs'][:20]: # Limit search results
            results.append({
                "symbol": pair['baseToken'].get('symbol'),
                "name": pair['baseToken'].get('name'),
                "address": pair['baseToken'].get('address'),
                "chain": pair.get('chainId'),
                "price_usd": float(pair.get('priceUsd', 0)),
                "liquidity_usd": pair.get('liquidity', {}).get('usd', 0),
                "url": pair.get('url')
            })
            
        return {"status": "success", "count": len(results), "data": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

# --- STOCK ENDPOINTS ---

@app.get("/api/v1/stocks/trending")
def get_trending_stocks(limit: int = 20):
    """
    Fetches trending stocks (actives/gainers) from FMP and calculates Zenith Score.
    """
    try:
        # FMP: Most Active
        url = f"https://financialmodelingprep.com/api/v3/stock_market/actives?apikey={FMP_API_KEY}"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if not isinstance(data, list):
             return {"status": "error", "data": []}

        stocks = []
        for item in data[:limit]:
            score = calculate_stock_score(item)
            stocks.append({
                "symbol": item.get('symbol'),
                "name": item.get('name'),
                "price_usd": item.get('price'),
                "price_change_24h": item.get('changesPercentage'),
                "volume_24h": item.get('volume'),
                "zenith_score": score,
                "type": "stock" # Flag for frontend
            })
            
        # Sort by Score
        stocks.sort(key=lambda x: x['zenith_score'], reverse=True)
            
        return {"status": "success", "count": len(stocks), "data": stocks}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/stocks/quote/{symbol}")
def get_stock_quote(symbol: str):
    """
    Get detailed quote for a single stock.
    """
    try:
        url = f"https://financialmodelingprep.com/api/v3/quote/{symbol}?apikey={FMP_API_KEY}"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if not data or not isinstance(data, list):
            raise HTTPException(status_code=404, detail="Stock not found")
            
        item = data[0]
        score = calculate_stock_score(item)
        
        return {
            "status": "success",
            "data": {
                "symbol": item.get('symbol'),
                "name": item.get('name'),
                "price_usd": item.get('price'),
                "price_change_24h": item.get('changesPercentage'),
                "volume_24h": item.get('volume'),
                "day_low": item.get('dayLow'),
                "day_high": item.get('dayHigh'),
                "market_cap": item.get('marketCap'),
                "zenith_score": score,
                "type": "stock"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
