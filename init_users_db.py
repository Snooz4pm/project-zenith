"""
🔐 ZENITH SCORES - USER AUTHENTICATION DATABASE INITIALIZATION
Creates the users table for Google OAuth authentication
Run this once to set up user authentication
"""

import os
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the same directory as this script
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Debug: Print what we loaded
print(f"📂 Loading .env from: {env_path}")

def get_connection():
    """Get database connection"""
    # IMPORTANT: Check NEON_DATABASE_URL first (from .env file)
    # before DATABASE_URL (which might be a system env var)
    database_url = os.getenv("NEON_DATABASE_URL")
    
    if database_url:
        print(f"📊 Using NEON_DATABASE_URL: {database_url[:50]}...")
        return psycopg2.connect(database_url)
    
    # Fall back to DATABASE_URL
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        print(f"📊 Using DATABASE_URL connection")
        return psycopg2.connect(database_url)
    
    # Fall back to individual variables
    host = os.getenv("NEON_HOST")
    database = os.getenv("NEON_DATABASE")
    user = os.getenv("NEON_USER")
    password = os.getenv("NEON_PASSWORD")
    port = os.getenv("NEON_PORT", "5432")
    
    if host:
        print(f"📊 Using NEON_HOST: {host[:30]}...")
        conn_string = f"postgresql://{user}:{password}@{host}/{database}?sslmode=require"
        return psycopg2.connect(conn_string)
    
    raise ValueError("No database connection configured! Set NEON_DATABASE_URL or NEON_HOST in .env")

USERS_SCHEMA = """
-- ═══════════════════════════════════════════════════════
-- USERS TABLE (Google OAuth)
-- Stores authenticated user profiles from Google
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ═══════════════════════════════════════════════════════
-- Link trading_users to authenticated users
-- ═══════════════════════════════════════════════════════

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trading_users' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE trading_users 
        ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_trading_users_user_id ON trading_users(user_id);

-- ═══════════════════════════════════════════════════════
-- USER SESSIONS TABLE
-- Stores active sessions for token validation
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
"""


def init_users_db():
    """Initialize users authentication tables"""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        print("🔧 Creating user authentication tables...")
        
        # Create tables
        cur.execute(USERS_SCHEMA)
        conn.commit()
        print("✅ Users table created successfully")
        
        # Verify tables
        cur.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN ('users', 'user_sessions')
        """)
        tables = cur.fetchall()
        print(f"📋 Verified tables: {[t[0] for t in tables]}")
        
        # Check if trading_users has user_id column
        cur.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'trading_users' AND column_name = 'user_id'
        """)
        if cur.fetchone():
            print("✅ trading_users.user_id column exists")
        else:
            print("⚠️ trading_users.user_id column not found")
        
        # Count existing users
        cur.execute("SELECT COUNT(*) FROM users")
        user_count = cur.fetchone()[0]
        print(f"👥 Total registered users: {user_count}")
        
        print("\n✅ User authentication database initialized successfully!")
        
    except Exception as e:
        print(f"❌ Error initializing users DB: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    init_users_db()
