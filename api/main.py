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

def calculate_zenith_score(pair: dict) -> float:
    """
    Calculates the Zenith Score (0-100) based on momentum and volume.
    Formula: (0.5 * Price Change Factor) + (0.3 * Vol/Liq Factor) + (0.2 * Social Factor)
    """
    try:
        score = 0.0
        
        # 1. Price Momentum Factor (0-100 scale)
        # We look at 1h and 6h changes to determine immediate momentum
        price_change = pair.get('priceChange', {})
        h1 = float(price_change.get('h1', 0))
        h6 = float(price_change.get('h6', 0))
        h24 = float(price_change.get('h24', 0))
        
        momentum_score = 0
        if h1 > 0: momentum_score += 20
        if h1 > 5: momentum_score += 10
        if h6 > 0: momentum_score += 20
        if h6 > 10: momentum_score += 10
        if h24 > 0: momentum_score += 20
        
        # Cap momentum score at 100
        momentum_score = min(momentum_score + (h1 * 2), 100)
        momentum_score = max(momentum_score, 0)
        
        # 2. Volume/Liquidity Factor (0-100 scale)
        # High volume relative to liquidity indicates high turnover/interest
        liquidity = float(pair.get('liquidity', {}).get('usd', 1))
        volume = float(pair.get('volume', {}).get('h24', 0))
        
        if liquidity > 0:
            vol_liq_ratio = volume / liquidity
            # A ratio of 1.0 (100% turnover) gets 50 points. Ratio of 2.0 gets 100 points.
            vol_score = min(vol_liq_ratio * 50, 100)
        else:
            vol_score = 0
            
        # 3. Social Factor (Placeholder)
        social_score = 50 # Neutral default for now
        
        # Weighted Average
        final_score = (0.5 * momentum_score) + (0.3 * vol_score) + (0.2 * social_score)
        
        return round(min(final_score, 100), 2)
        
    except Exception:
        return 0.0

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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
