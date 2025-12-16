"""
🗄️ NEWS DATABASE MODULE
Handles connection and operations for Neon PostgreSQL database
"""

import psycopg2
from psycopg2.extras import execute_batch, Json
from datetime import datetime
import hashlib
import json
import os
from dotenv import load_dotenv

load_dotenv()

class NewsDatabase:
    def __init__(self):
        """Initialize database connection"""
        self.conn = None
        self.cur = None
        self.connect()
    
    def connect(self):
        """Connect to Neon database"""
        try:
            # Try DATABASE_URL first (full connection string)
            database_url = os.getenv("DATABASE_URL")
            
            if database_url:
                self.conn = psycopg2.connect(database_url)
            else:
                # Construct from individual NEON_* variables
                host = os.getenv("NEON_HOST")
                database = os.getenv("NEON_DATABASE")
                user = os.getenv("NEON_USER")
                password = os.getenv("NEON_PASSWORD")
                port = os.getenv("NEON_PORT", "5432")
                
                # Build connection string
                conn_string = f"postgresql://{user}:{password}@{host}/{database}?sslmode=require"
                self.conn = psycopg2.connect(conn_string)
            
            self.cur = self.conn.cursor()
            print("✅ Connected to Neon database")
        except Exception as e:
            print(f"❌ Database connection error: {e}")
            raise

    
    def close(self):
        """Close database connection"""
        if self.cur:
            self.cur.close()
        if self.conn:
            self.conn.close()
            print("✅ Database connection closed")
    
    def create_hash(self, text):
        """Create SHA-256 hash for deduplication"""
        return hashlib.sha256(text.encode('utf-8')).hexdigest()
    
    def store_article(self, data):
        """
        Store a single article in database
        Returns: (article_id, is_new)
        """
        # Create hash for deduplication
        article_hash = self.create_hash(data['article'])
        
        # Calculate word count
        word_count = len(data['article'].split())
        
        try:
            self.cur.execute("""
                INSERT INTO articles (
                    hash, title, article, url, source, 
                    category, category_confidence, matched_keywords,
                    word_count, fetched_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (hash) DO NOTHING
                RETURNING id
            """, (
                article_hash,
                data['title'],
                data['article'],
                data['url'],
                data['source'],
                data.get('category', 'General'),
                data.get('category_confidence', 0.0),
                Json(data.get('matched_keywords', [])),
                word_count,
                datetime.utcnow()
            ))
            
            result = self.cur.fetchone()
            self.conn.commit()
            
            if result:
                article_id = result[0]
                print(f"✅ Stored: {data['title'][:50]}... (ID: {article_id})")
                return article_id, True
            else:
                print(f"⚠️  Duplicate skipped: {data['title'][:50]}...")
                return None, False
                
        except Exception as e:
            self.conn.rollback()
            print(f"❌ Error storing article: {e}")
            return None, False
    
    def store_articles_batch(self, articles):
        """
        Store multiple articles in batch
        Returns: (stored_count, duplicate_count)
        """
        stored = 0
        duplicates = 0
        
        for article in articles:
            article_id, is_new = self.store_article(article)
            if is_new:
                stored += 1
            else:
                duplicates += 1
        
        print(f"\n📊 Batch complete: {stored} stored, {duplicates} duplicates")
        return stored, duplicates
    
    def get_recent_articles(self, category=None, limit=10):
        """Get recent articles, optionally filtered by category"""
        try:
            if category:
                self.cur.execute("""
                    SELECT id, title, source, category, category_confidence, fetched_at
                    FROM articles
                    WHERE category = %s
                    ORDER BY fetched_at DESC
                    LIMIT %s
                """, (category, limit))
            else:
                self.cur.execute("""
                    SELECT id, title, source, category, category_confidence, fetched_at
                    FROM articles
                    ORDER BY fetched_at DESC
                    LIMIT %s
                """, (limit,))
            
            return self.cur.fetchall()
        except Exception as e:
            print(f"❌ Error fetching articles: {e}")
            return []
    
    def get_category_stats(self):
        """Get statistics by category"""
        try:
            self.cur.execute("""
                SELECT 
                    category,
                    COUNT(*) as count,
                    AVG(category_confidence) as avg_confidence,
                    MAX(fetched_at) as last_fetched
                FROM articles
                GROUP BY category
                ORDER BY count DESC
            """)
            return self.cur.fetchall()
        except Exception as e:
            print(f"❌ Error fetching stats: {e}")
            return []
    
    def get_source_stats(self):
        """Get statistics by source"""
        try:
            self.cur.execute("""
                SELECT 
                    source,
                    COUNT(*) as count,
                    AVG(category_confidence) as avg_confidence
                FROM articles
                GROUP BY source
                ORDER BY count DESC
                LIMIT 20
            """)
            return self.cur.fetchall()
        except Exception as e:
            print(f"❌ Error fetching source stats: {e}")
            return []
    
    def search_articles(self, query, limit=10):
        """Full-text search in title and article"""
        try:
            self.cur.execute("""
                SELECT id, title, source, category, fetched_at
                FROM articles
                WHERE to_tsvector('english', title || ' ' || article) @@ plainto_tsquery('english', %s)
                ORDER BY fetched_at DESC
                LIMIT %s
            """, (query, limit))
            return self.cur.fetchall()
        except Exception as e:
            print(f"❌ Error searching: {e}")
            return []
    
    def get_total_articles(self):
        """Get total article count"""
        try:
            self.cur.execute("SELECT COUNT(*) FROM articles")
            return self.cur.fetchone()[0]
        except Exception as e:
            print(f"❌ Error getting count: {e}")
            return 0
    
    def print_stats(self):
        """Print database statistics"""
        total = self.get_total_articles()
        print(f"\n{'='*60}")
        print(f"📊 DATABASE STATISTICS")
        print(f"{'='*60}")
        print(f"\n📰 Total Articles: {total}")
        
        print(f"\n🏷️  By Category:")
        for row in self.get_category_stats():
            category, count, avg_conf, last = row
            print(f"   {category:15} {count:5} articles (avg confidence: {avg_conf:.2f})")
        
        print(f"\n🏢 Top Sources:")
        for row in self.get_source_stats()[:10]:
            source, count, avg_conf = row
            print(f"   {source:30} {count:5} articles (avg: {avg_conf:.2f})")
        
        print(f"\n{'='*60}\n")


# Context manager support
class NewsDB:
    """Context manager wrapper for NewsDatabase"""
    def __enter__(self):
        self.db = NewsDatabase()
        return self.db
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.db.close()


# Example usage
if __name__ == "__main__":
    # Test connection
    with NewsDB() as db:
        print(f"Total articles in database: {db.get_total_articles()}")
        
        # Get recent articles
        print("\n📰 Recent Articles:")
        for article in db.get_recent_articles(limit=5):
            aid, title, source, category, conf, fetched = article
            print(f"   [{category}] {title[:60]}... ({source})")
        
        # Show stats
        db.print_stats()
