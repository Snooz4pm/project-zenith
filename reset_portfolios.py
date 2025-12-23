#!/usr/bin/env python3
"""
Reset all paper trading portfolios to $10,000
Run this to clean up corrupted balances from the double-counting bug
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """Get database connection"""
    database_url = os.getenv("DATABASE_URL")
    
    if database_url:
        return psycopg2.connect(database_url)
    else:
        host = os.getenv("NEON_HOST")
        database = os.getenv("NEON_DATABASE")
        user = os.getenv("NEON_USER")
        password = os.getenv("NEON_PASSWORD")
        
        conn_string = f"postgresql://{user}:{password}@{host}/{database}?sslmode=require"
        return psycopg2.connect(conn_string)

def reset_portfolios():
    """Reset all portfolios to $10,000 and clear positions"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        print("🔄 Resetting all portfolios...")
        
        # Reset all user balances to $10,000
        cur.execute("""
            UPDATE trading_users 
            SET 
                wallet_balance = 10000.00,
                available_margin = 10000.00,
                margin_used = 0.00,
                portfolio_value = 10000.00,
                total_pnl = 0.00,
                unrealized_pnl = 0.00,
                realized_pnl = 0.00,
                total_trades = 0,
                winning_trades = 0,
                losing_trades = 0,
                win_rate = 0.00
        """)
        
        users_reset = cur.rowcount
        
        # Clear all holdings
        cur.execute("DELETE FROM trading_holdings")
        holdings_cleared = cur.rowcount
        
        # Clear all trade history
        cur.execute("DELETE FROM trading_trades")
        trades_cleared = cur.rowcount
        
        conn.commit()
        
        print(f"✅ Successfully reset {users_reset} portfolios to $10,000")
        print(f"✅ Cleared {holdings_cleared} holdings")
        print(f"✅ Cleared {trades_cleared} trade records")
        print("\n🎉 All portfolios are now fresh with $10,000!")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 50)
    print("ZENITH PAPER TRADING - PORTFOLIO RESET")
    print("=" * 50)
    print()
    
    confirm = input("⚠️  This will reset ALL portfolios to $10,000. Continue? (yes/no): ")
    
    if confirm.lower() == 'yes':
        reset_portfolios()
    else:
        print("❌ Reset cancelled")
