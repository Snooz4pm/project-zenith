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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
