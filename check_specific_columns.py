
import psycopg2

DATABASE_URL = "postgresql://neondb_owner:npg_r2SjAQEbg3De@ep-morning-frost-addvv38i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

def check_columns():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        columns_to_check = ['importance_score', 'sentiment_score', 'why_it_matters', 'matched_keywords']
        for col in columns_to_check:
            try:
                cur.execute(f"SELECT {col} FROM articles LIMIT 1")
                print(f"✅ Column '{col}' exists")
            except Exception:
                conn.rollback()
                print(f"❌ Column '{col}' MISSING")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_columns()
