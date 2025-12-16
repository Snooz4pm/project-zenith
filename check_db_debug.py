import psycopg2
import os

DATABASE_URL = "postgresql://neondb_owner:npg_r2SjAQEbg3De@ep-morning-frost-addvv38i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Check tables
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    tables = cur.fetchall()
    print("✅ Tables found:", [t[0] for t in tables])
    
    # Check if 'articles' table exists and has data
    if ('articles',) in tables:
        cur.execute("SELECT COUNT(*) FROM articles")
        count = cur.fetchone()[0]
        print(f"📰 Article count: {count}")
    else:
        print("❌ 'articles' table MISSING")
        
except Exception as e:
    print(f"❌ Connection failed: {e}")
