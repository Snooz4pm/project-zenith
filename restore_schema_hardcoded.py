
import psycopg2
import os

# Hardcoded valid connection string from your earlier message
# postgresql://neondb_owner:npg_r2SjAQEbg3De@ep-morning-frost-addvv38i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
DB_URL = "postgresql://neondb_owner:npg_r2SjAQEbg3De@ep-morning-frost-addvv38i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

SCHEMA_FILE = 'neon_schema.txt'

def restore_schema():
    print("🔄 Restoring Database Schema (using hardcoded credentials)...")
    
    try:
        # Connect to DB
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # Read schema file
        with open(SCHEMA_FILE, 'r') as f:
            schema_sql = f.read()
            
        # Execute schema
        cur.execute(schema_sql)
        conn.commit()
        
        print("✅ Schema restored successfully!")
        
        # Verify tables
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = cur.fetchall()
        print("📊 Tables now appearing:", [t[0] for t in tables])
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error restoring schema: {e}")

if __name__ == "__main__":
    restore_schema()
