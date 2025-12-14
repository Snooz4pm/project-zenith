import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def view_regime_data():
    db_url = os.getenv("NEON_DATABASE_URL")
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT date, regime, vix_value, spy_sma_200, updated_at 
            FROM market_regime 
            ORDER BY date DESC 
            LIMIT 10;
        """)
        
        rows = cursor.fetchall()
        print("\n=== Market Regime History ===")
        for row in rows:
            print(f"Date: {row[0]} | Regime: {row[1]} | VIX: {row[2]} | SMA: {row[3]:.2f} | Updated: {row[4]}")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    view_regime_data()
