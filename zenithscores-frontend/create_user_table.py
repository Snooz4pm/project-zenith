"""
Script to create the User table directly in Neon using psycopg2.
This bypasses Prisma's environment variable loading issues.
"""
import psycopg2
import os

# Direct connection string
DATABASE_URL = "postgresql://neondb_owner:npg_r2SjAQEbg3De@ep-morning-frost-addvv38i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

CREATE_USER_TABLE = """
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    provider TEXT NOT NULL,
    name TEXT,
    avatar TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);
"""

def main():
    print("Connecting to Neon database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("Creating User table...")
        cursor.execute(CREATE_USER_TABLE)
        conn.commit()
        
        print("User table created successfully!")
        
        # Verify table exists
        cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'User';")
        columns = cursor.fetchall()
        print("\\nTable columns:")
        for col in columns:
            print(f"  - {col[0]}: {col[1]}")
        
        cursor.close()
        conn.close()
        print("\\nDone!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
