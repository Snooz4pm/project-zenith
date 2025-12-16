
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Use the NEON credentials from .env
# Construct the connection string properly
DB_URL = f"postgresql://{os.getenv('NEON_USER')}:{os.getenv('NEON_PASSWORD')}@{os.getenv('NEON_HOST')}/{os.getenv('NEON_DATABASE')}?sslmode=require"

SCHEMA_FILE = 'neon_schema.txt'

def restore_schema():
    print("🔄 Restoring Database Schema...")
    
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
