import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    # Try different env var names used in the project
    database_url = os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL")
    
    if database_url:
        return psycopg2.connect(database_url)
    
    host = os.getenv("NEON_HOST")
    database = os.getenv("NEON_DATABASE")
    user = os.getenv("NEON_USER")
    password = os.getenv("NEON_PASSWORD")
    
    if host and database and user and password:
        conn_string = f"postgresql://{user}:{password}@{host}/{database}?sslmode=require"
        return psycopg2.connect(conn_string)
    
    raise ValueError("Database credentials not found in environment")

def migrate():
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        print("🔧 Migrating database for premium columns...")
        
        # Check and add columns to 'users'
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP")
        
        # Check and add columns to 'trading_users'
        cur.execute("ALTER TABLE trading_users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE")
        cur.execute("ALTER TABLE trading_users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP")
        cur.execute("ALTER TABLE trading_users ADD COLUMN IF NOT EXISTS encrypted_gemini_key TEXT")
        
        conn.commit()
        print("✅ Migration successful!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    migrate()
