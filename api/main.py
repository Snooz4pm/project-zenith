from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = FastAPI(title="Machine Alpha API", version="1.0.0")

# CORS configuration for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "Machine Alpha API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/api/v1/market_regime")
def get_market_regime():
    """
    Returns the latest market regime decision from the database.
    """
    db_url = os.getenv("NEON_DATABASE_URL")
    
    if not db_url:
        raise HTTPException(status_code=500, detail="Database configuration missing")
    
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        query = """
            SELECT date, regime, vix_value, spy_sma_200, updated_at 
            FROM market_regime 
            ORDER BY date DESC 
            LIMIT 1;
        """
        
        cursor.execute(query)
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not result:
            raise HTTPException(status_code=404, detail="No regime data found")
        
        # Format response
        return {
            "status": "success",
            "data": {
                "regime": result[1],
                "date": result[0].isoformat() if isinstance(result[0], datetime) else str(result[0]),
                "vix_used": round(result[2], 2) if result[2] else None,
                "sma_200": round(result[3], 2) if result[3] else None,
                "updated_at": result[4].isoformat() if result[4] else None
            }
        }
        
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.get("/api/v1/market_regime/history")
def get_regime_history(limit: int = 30):
    """
    Returns historical market regime data.
    """
    db_url = os.getenv("NEON_DATABASE_URL")
    
    if not db_url:
        raise HTTPException(status_code=500, detail="Database configuration missing")
    
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        query = """
            SELECT date, regime, vix_value, spy_sma_200, updated_at 
            FROM market_regime 
            ORDER BY date DESC 
            LIMIT %s;
        """
        
        cursor.execute(query, (limit,))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        if not results:
            return {"status": "success", "data": []}
        
        # Format response
        history = []
        for row in results:
            history.append({
                "regime": row[1],
                "date": row[0].isoformat() if isinstance(row[0], datetime) else str(row[0]),
                "vix_used": round(row[2], 2) if row[2] else None,
                "sma_200": round(row[3], 2) if row[3] else None,
                "updated_at": row[4].isoformat() if row[4] else None
            })
        
        return {
            "status": "success",
            "count": len(history),
            "data": history
        }
        
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
