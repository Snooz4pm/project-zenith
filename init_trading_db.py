"""
🚀 ZENITH PAPER TRADING - DATABASE INITIALIZATION
Creates the trading tables in Neon PostgreSQL
Run this once to set up the trading platform
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    """Get database connection"""
    database_url = os.getenv("DATABASE_URL")
    
    if database_url:
        return psycopg2.connect(database_url)
    else:
        host = os.getenv("NEON_HOST")
        database = os.getenv("NEON_DATABASE")
        user = os.getenv("NEON_USER")
        password = os.getenv("NEON_PASSWORD")
        port = os.getenv("NEON_PORT", "5432")
        
        conn_string = f"postgresql://{user}:{password}@{host}/{database}?sslmode=require"
        return psycopg2.connect(conn_string)

TRADING_SCHEMA = """
-- ═══════════════════════════════════════════════════════
-- TRADING USERS TABLE
-- Stores session-based users with virtual wallets
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS trading_users (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50),
    wallet_balance NUMERIC(20,2) DEFAULT 10000.00,
    margin_used NUMERIC(20,2) DEFAULT 0.00,
    available_margin NUMERIC(20,2) DEFAULT 10000.00,
    portfolio_value NUMERIC(20,2) DEFAULT 10000.00,
    total_pnl NUMERIC(20,2) DEFAULT 0.00,
    realized_pnl NUMERIC(20,2) DEFAULT 0.00,
    unrealized_pnl NUMERIC(20,2) DEFAULT 0.00,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate NUMERIC(5,2) DEFAULT 0.00,
    max_leverage INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trading_users_session ON trading_users(session_id);
CREATE INDEX IF NOT EXISTS idx_trading_users_portfolio ON trading_users(portfolio_value DESC);

-- ═══════════════════════════════════════════════════════
-- TRADING ASSETS TABLE
-- Master list of tradeable assets (crypto + stocks)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS trading_assets (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    asset_type VARCHAR(20) NOT NULL,
    current_price NUMERIC(20,8) DEFAULT 0,
    price_change_24h NUMERIC(10,4) DEFAULT 0,
    high_24h NUMERIC(20,8) DEFAULT 0,
    low_24h NUMERIC(20,8) DEFAULT 0,
    volume_24h NUMERIC(20,2) DEFAULT 0,
    market_cap NUMERIC(25,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    max_leverage INTEGER DEFAULT 5
);

CREATE INDEX IF NOT EXISTS idx_trading_assets_symbol ON trading_assets(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_assets_type ON trading_assets(asset_type);

-- ═══════════════════════════════════════════════════════
-- TRADING HOLDINGS TABLE
-- Current portfolio holdings per user (with leverage tracking)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS trading_holdings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES trading_users(id) ON DELETE CASCADE,
    asset_id INTEGER REFERENCES trading_assets(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    quantity NUMERIC(20,8) NOT NULL DEFAULT 0,
    avg_buy_price NUMERIC(20,8) NOT NULL DEFAULT 0,
    leverage INTEGER DEFAULT 1,
    margin_used NUMERIC(20,2) DEFAULT 0,
    entry_value NUMERIC(20,2) DEFAULT 0,
    current_value NUMERIC(20,2) DEFAULT 0,
    unrealized_pnl NUMERIC(20,2) DEFAULT 0,
    unrealized_pnl_percent NUMERIC(10,4) DEFAULT 0,
    stop_loss_price NUMERIC(20,8),
    take_profit_price NUMERIC(20,8),
    liquidation_price NUMERIC(20,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_trading_holdings_user ON trading_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_holdings_asset ON trading_holdings(asset_id);
CREATE INDEX IF NOT EXISTS idx_trading_holdings_sl ON trading_holdings(stop_loss_price) WHERE stop_loss_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trading_holdings_tp ON trading_holdings(take_profit_price) WHERE take_profit_price IS NOT NULL;

-- ═══════════════════════════════════════════════════════
-- TRADING TRADES TABLE
-- Complete trade execution history with all details
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS trading_trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES trading_users(id) ON DELETE CASCADE,
    asset_id INTEGER REFERENCES trading_assets(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    trade_type VARCHAR(10) NOT NULL,
    order_type VARCHAR(20) DEFAULT 'market',
    quantity NUMERIC(20,8) NOT NULL,
    leverage INTEGER DEFAULT 1,
    price_at_execution NUMERIC(20,8) NOT NULL,
    total_value NUMERIC(20,2) NOT NULL,
    margin_cost NUMERIC(20,2) DEFAULT 0,
    stop_loss_price NUMERIC(20,8),
    take_profit_price NUMERIC(20,8),
    realized_pnl NUMERIC(20,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'executed',
    trigger_type VARCHAR(20),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trading_trades_user ON trading_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_trades_time ON trading_trades(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_trades_status ON trading_trades(status);

-- ═══════════════════════════════════════════════════════
-- PENDING ORDERS TABLE
-- For limit orders, stop-loss, take-profit triggers
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS trading_pending_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES trading_users(id) ON DELETE CASCADE,
    asset_id INTEGER REFERENCES trading_assets(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    trade_type VARCHAR(10) NOT NULL,
    quantity NUMERIC(20,8) NOT NULL,
    leverage INTEGER DEFAULT 1,
    trigger_price NUMERIC(20,8) NOT NULL,
    limit_price NUMERIC(20,8),
    stop_loss_price NUMERIC(20,8),
    take_profit_price NUMERIC(20,8),
    margin_reserved NUMERIC(20,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    triggered_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_orders_user ON trading_pending_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_status ON trading_pending_orders(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_pending_orders_trigger ON trading_pending_orders(asset_id, trigger_price) WHERE status = 'pending';

-- ═══════════════════════════════════════════════════════
-- PORTFOLIO HISTORY TABLE
-- For charting portfolio value over time
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS trading_portfolio_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES trading_users(id) ON DELETE CASCADE,
    portfolio_value NUMERIC(20,2) NOT NULL,
    wallet_balance NUMERIC(20,2) NOT NULL,
    total_pnl NUMERIC(20,2) DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portfolio_history_user_time ON trading_portfolio_history(user_id, recorded_at DESC);
"""

DEFAULT_ASSETS = [
    ('BTC', 'Bitcoin', 'crypto', 95000.00),
    ('ETH', 'Ethereum', 'crypto', 3400.00),
    ('SOL', 'Solana', 'crypto', 220.00),
    ('AVAX', 'Avalanche', 'crypto', 45.00),
    ('LINK', 'Chainlink', 'crypto', 25.00),
    ('XRP', 'Ripple', 'crypto', 2.40),
    ('DOGE', 'Dogecoin', 'crypto', 0.40),
    ('ADA', 'Cardano', 'crypto', 1.10),
    ('AAPL', 'Apple Inc.', 'stock', 195.00),
    ('NVDA', 'NVIDIA Corp.', 'stock', 140.00),
    ('TSLA', 'Tesla Inc.', 'stock', 420.00),
    ('MSFT', 'Microsoft Corp.', 'stock', 430.00),
    ('GOOGL', 'Alphabet Inc.', 'stock', 175.00),
    ('AMZN', 'Amazon.com Inc.', 'stock', 220.00),
    ('META', 'Meta Platforms', 'stock', 580.00),
]


def init_trading_db():
    """Initialize trading tables"""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        print("🔧 Creating trading tables...")
        
        # Create tables
        cur.execute(TRADING_SCHEMA)
        conn.commit()
        print("✅ Tables created successfully")
        
        # Insert default assets
        print("📊 Inserting default assets...")
        for symbol, name, asset_type, price in DEFAULT_ASSETS:
            cur.execute("""
                INSERT INTO trading_assets (symbol, name, asset_type, current_price)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (symbol) DO UPDATE SET 
                    current_price = EXCLUDED.current_price,
                    last_updated = CURRENT_TIMESTAMP
            """, (symbol, name, asset_type, price))
        
        conn.commit()
        print(f"✅ Inserted {len(DEFAULT_ASSETS)} assets")
        
        # Verify
        cur.execute("SELECT COUNT(*) FROM trading_assets")
        asset_count = cur.fetchone()[0]
        print(f"📈 Total assets in database: {asset_count}")
        
        cur.execute("SELECT COUNT(*) FROM trading_users")
        user_count = cur.fetchone()[0]
        print(f"👥 Total trading users: {user_count}")
        
        print("\n✅ Trading database initialized successfully!")
        
    except Exception as e:
        print(f"❌ Error initializing trading DB: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()


def reset_trading_db():
    """Reset all trading data (DANGEROUS - use with caution)"""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        print("⚠️ Resetting trading database...")
        
        cur.execute("DROP TABLE IF EXISTS trading_trades CASCADE")
        cur.execute("DROP TABLE IF EXISTS trading_holdings CASCADE")
        cur.execute("DROP TABLE IF EXISTS trading_users CASCADE")
        cur.execute("DROP TABLE IF EXISTS trading_assets CASCADE")
        
        conn.commit()
        print("✅ Trading tables dropped")
        
        # Re-initialize
        init_trading_db()
        
    except Exception as e:
        print(f"❌ Error resetting: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--reset":
        confirm = input("⚠️ This will DELETE all trading data. Type 'YES' to confirm: ")
        if confirm == "YES":
            reset_trading_db()
        else:
            print("Aborted.")
    else:
        init_trading_db()
