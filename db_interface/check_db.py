import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def check_tables():
    db_url = os.getenv("NEON_DATABASE_URL")
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        """)
        
        tables = cursor.fetchall()
        print("Tables in DB:", tables)
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    check_tables()
