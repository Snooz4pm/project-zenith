
import psycopg2

DATABASE_URL = "postgresql://neondb_owner:npg_r2SjAQEbg3De@ep-morning-frost-addvv38i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

def check_all_columns():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        cols = ['id', 'title', 'article', 'url', 'source', 'category', 'category_confidence', 'matched_keywords', 'word_count', 'importance_score', 'sentiment_score', 'fetched_at']
        for col in cols:
            try:
                cur.execute(f"SELECT {col} FROM articles LIMIT 1")
                # print(f"COL_{col}_OK")
            except Exception:
                conn.rollback()
                print(f"COL_{col}_MISSING")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_all_columns()
