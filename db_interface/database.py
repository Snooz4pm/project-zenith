import os
import psycopg2
from dotenv import load_dotenv

# Ensure env vars are loaded if this is run standalone
load_dotenv()

CREATE_TABLE_QUERY = """
CREATE TABLE IF NOT EXISTS market_regime (
    date DATE PRIMARY KEY,
    regime VARCHAR(10) NOT NULL,
    vix_value FLOAT,
    spy_sma_200 FLOAT,
    updated_at TIMESTAMP
);
"""

def deploy_schema():
    db_url = os.getenv("NEON_DATABASE_URL")
    if not db_url:
        print("Error: NEON_DATABASE_URL not found.")
        return

    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        cursor.execute(CREATE_TABLE_QUERY)
        conn.commit()
        
        print("Market Regime Table Schema Deployed.")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Database Connection Error: {e}")

if __name__ == "__main__":
    deploy_schema()
