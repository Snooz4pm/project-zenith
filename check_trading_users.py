
import psycopg2

DATABASE_URL = "postgresql://neondb_owner:npg_r2SjAQEbg3De@ep-morning-frost-addvv38i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

def check_trading_users():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        try:
            cur.execute("SELECT is_premium, premium_expires_at FROM trading_users LIMIT 1")
            print("trading_users table and premium columns exist")
        except Exception as e:
            conn.rollback()
            print(f"Error checking trading_users: {e}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    check_trading_users()
