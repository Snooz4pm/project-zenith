
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = "postgresql://neondb_owner:npg_r2SjAQEbg3De@ep-morning-frost-addvv38i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

def fix_database():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("🔄 Running database migrations...")
        
        # 1. Update community_posts to include likes_count and comments_count
        try:
            cur.execute("ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0")
            cur.execute("ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0")
            print("✅ community_posts table updated with likes_count and comments_count")
        except Exception as e:
            conn.rollback()
            print(f"⚠️ Error updating community_posts: {e}")

        # 2. Ensure all news columns exist
        news_cols = [
            ("importance_score", "DECIMAL(3, 2)"),
            ("sentiment_score", "DECIMAL(3, 2)"),
            ("why_it_matters", "TEXT")
        ]
        for col, dtype in news_cols:
            try:
                cur.execute(f"ALTER TABLE articles ADD COLUMN IF NOT EXISTS {col} {dtype}")
                print(f"✅ articles table updated with {col}")
            except Exception as e:
                conn.rollback()
                print(f"⚠️ Error adding {col} to articles: {e}")
            
        conn.commit()
        cur.close()
        conn.close()
        print("🚀 Database migration complete!")
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")

if __name__ == "__main__":
    fix_database()
