
import psycopg2

DATABASE_URL = "postgresql://neondb_owner:npg_r2SjAQEbg3De@ep-morning-frost-addvv38i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

def check_schema():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'articles'
            ORDER BY ordinal_position;
        """)
        columns = cur.fetchall()
        col_string = ", ".join([f"{col[0]} ({col[1]})" for col in columns])
        print(f"SCHEMA_COLUMNS: {col_string}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
