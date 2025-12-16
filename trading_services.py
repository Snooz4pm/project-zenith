"""
🔄 TRADING BACKGROUND SERVICES
- WebSocket server for real-time updates
- Stop-loss/Take-profit trigger monitoring
- Portfolio history snapshots
"""

import os
import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Set, Dict
from contextlib import asynccontextmanager

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

# ═══════════════════════════════════════════════════════
# DATABASE CONNECTION
# ═══════════════════════════════════════════════════════

def get_db_connection():
    """Get database connection"""
    database_url = os.getenv("DATABASE_URL")
    
    if database_url:
        return psycopg2.connect(database_url, cursor_factory=RealDictCursor)
    
    host = os.getenv("NEON_HOST")
    database = os.getenv("NEON_DATABASE")
    user = os.getenv("NEON_USER")
    password = os.getenv("NEON_PASSWORD")
    port = os.getenv("NEON_PORT", "5432")
    
    conn_string = f"postgresql://{user}:{password}@{host}/{database}?sslmode=require"
    return psycopg2.connect(conn_string, cursor_factory=RealDictCursor)


# ═══════════════════════════════════════════════════════
# PRICE CACHE (shared with main trading engine)
# ═══════════════════════════════════════════════════════

import requests

PRICE_CACHE: Dict[str, tuple] = {}
CACHE_TTL = 5  # seconds

COINGECKO_IDS = {
    'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana',
    'AVAX': 'avalanche-2', 'LINK': 'chainlink', 'XRP': 'ripple',
    'DOGE': 'dogecoin', 'ADA': 'cardano',
}

FALLBACK_PRICES = {
    'BTC': 95000.0, 'ETH': 3400.0, 'SOL': 220.0, 'AVAX': 45.0,
    'LINK': 25.0, 'XRP': 2.40, 'DOGE': 0.40, 'ADA': 1.10,
    'AAPL': 195.0, 'NVDA': 140.0, 'TSLA': 420.0, 'MSFT': 430.0,
    'GOOGL': 175.0, 'AMZN': 220.0, 'META': 580.0
}


async def fetch_crypto_prices() -> Dict[str, float]:
    """Fetch all crypto prices from CoinGecko"""
    try:
        ids = ','.join(COINGECKO_IDS.values())
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies=usd&include_24hr_change=true"
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: requests.get(url, timeout=10))
        
        if response.status_code == 200:
            data = response.json()
            prices = {}
            for symbol, cg_id in COINGECKO_IDS.items():
                if cg_id in data:
                    prices[symbol] = {
                        'price': data[cg_id].get('usd', FALLBACK_PRICES.get(symbol, 100)),
                        'change_24h': data[cg_id].get('usd_24h_change', 0)
                    }
            return prices
    except Exception as e:
        print(f"⚠️ CoinGecko fetch error: {e}")
    
    # Fallback
    return {s: {'price': p, 'change_24h': 0} for s, p in FALLBACK_PRICES.items() if s in COINGECKO_IDS}


def get_asset_price(symbol: str) -> float:
    """Get cached price for an asset"""
    now = time.time()
    if symbol in PRICE_CACHE:
        price, timestamp = PRICE_CACHE[symbol]
        if now - timestamp < CACHE_TTL:
            return price
    return FALLBACK_PRICES.get(symbol, 100.0)


# ═══════════════════════════════════════════════════════
# STOP-LOSS / TAKE-PROFIT TRIGGER ENGINE
# ═══════════════════════════════════════════════════════

async def check_triggers():
    """
    Check all stop-loss and take-profit triggers
    Auto-close positions when triggered
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get all holdings with active triggers
        cur.execute("""
            SELECT h.id, h.user_id, h.asset_id, h.symbol, h.quantity, 
                   h.avg_buy_price, h.leverage, h.margin_used,
                   h.stop_loss_price, h.take_profit_price,
                   a.current_price,
                   u.session_id
            FROM trading_holdings h
            JOIN trading_assets a ON h.asset_id = a.id
            JOIN trading_users u ON h.user_id = u.id
            WHERE h.quantity > 0 
            AND (h.stop_loss_price IS NOT NULL OR h.take_profit_price IS NOT NULL)
        """)
        
        holdings = cur.fetchall()
        triggered_trades = []
        
        for holding in holdings:
            current_price = float(holding['current_price'])
            symbol = holding['symbol']
            
            # Try to get live price
            live_price = get_asset_price(symbol)
            if live_price:
                current_price = live_price
            
            trigger_type = None
            
            # Check stop-loss (price dropped below SL for long positions)
            if holding['stop_loss_price'] and current_price <= float(holding['stop_loss_price']):
                trigger_type = 'stop_loss'
                print(f"🔴 STOP-LOSS triggered for {symbol} @ ${current_price:.2f}")
            
            # Check take-profit (price rose above TP for long positions)
            elif holding['take_profit_price'] and current_price >= float(holding['take_profit_price']):
                trigger_type = 'take_profit'
                print(f"🟢 TAKE-PROFIT triggered for {symbol} @ ${current_price:.2f}")
            
            if trigger_type:
                # Execute the sell trade
                try:
                    await execute_trigger_trade(
                        conn, cur,
                        holding['user_id'],
                        holding['asset_id'],
                        symbol,
                        float(holding['quantity']),
                        current_price,
                        float(holding['avg_buy_price']),
                        holding['leverage'],
                        float(holding['margin_used']),
                        trigger_type
                    )
                    triggered_trades.append({
                        'session_id': holding['session_id'],
                        'symbol': symbol,
                        'trigger_type': trigger_type,
                        'price': current_price
                    })
                except Exception as e:
                    print(f"❌ Trigger execution failed for {symbol}: {e}")
                    conn.rollback()
        
        conn.commit()
        conn.close()
        
        return triggered_trades
        
    except Exception as e:
        print(f"❌ Trigger check error: {e}")
        return []


async def execute_trigger_trade(conn, cur, user_id: int, asset_id: int, symbol: str,
                                 quantity: float, current_price: float, avg_buy_price: float,
                                 leverage: int, margin_used: float, trigger_type: str):
    """Execute an auto-triggered sell trade"""
    
    # Calculate P&L
    price_diff = current_price - avg_buy_price
    realized_pnl = price_diff * quantity * leverage
    total_value = quantity * current_price
    
    # Start transaction
    cur.execute("BEGIN")
    
    try:
        # Delete the holding (full close)
        cur.execute("DELETE FROM trading_holdings WHERE user_id = %s AND asset_id = %s", (user_id, asset_id))
        
        # Return margin + proceeds + P&L to wallet
        proceeds = margin_used + total_value + realized_pnl
        cur.execute("""
            UPDATE trading_users 
            SET wallet_balance = wallet_balance + %s,
                margin_used = margin_used - %s,
                available_margin = available_margin + %s,
                realized_pnl = realized_pnl + %s,
                total_trades = total_trades + 1,
                winning_trades = winning_trades + %s,
                losing_trades = losing_trades + %s
            WHERE id = %s
        """, (
            proceeds, margin_used, margin_used,
            realized_pnl,
            1 if realized_pnl > 0 else 0,
            1 if realized_pnl < 0 else 0,
            user_id
        ))
        
        # Insert trade record
        cur.execute("""
            INSERT INTO trading_trades
            (user_id, asset_id, symbol, trade_type, order_type, quantity,
             leverage, price_at_execution, total_value, margin_cost,
             realized_pnl, status, trigger_type)
            VALUES (%s, %s, %s, 'sell', 'market', %s, %s, %s, %s, 0, %s, 'executed', %s)
        """, (user_id, asset_id, symbol, quantity, leverage, current_price, total_value, realized_pnl, trigger_type))
        
        # Recalculate portfolio value
        cur.execute("""
            SELECT wallet_balance FROM trading_users WHERE id = %s
        """, (user_id,))
        wallet = float(cur.fetchone()['wallet_balance'])
        
        cur.execute("""
            SELECT COALESCE(SUM(h.margin_used + ((a.current_price - h.avg_buy_price) * h.quantity * h.leverage)), 0)
            FROM trading_holdings h
            JOIN trading_assets a ON h.asset_id = a.id
            WHERE h.user_id = %s AND h.quantity > 0
        """, (user_id,))
        holdings_value = float(cur.fetchone()[0] or 0)
        
        portfolio_value = wallet + holdings_value
        total_pnl = portfolio_value - 10000.0  # Starting balance
        
        cur.execute("""
            UPDATE trading_users SET portfolio_value = %s, total_pnl = %s WHERE id = %s
        """, (portfolio_value, total_pnl, user_id))
        
        cur.execute("COMMIT")
        
    except Exception as e:
        cur.execute("ROLLBACK")
        raise e


# ═══════════════════════════════════════════════════════
# PORTFOLIO HISTORY SNAPSHOTS
# ═══════════════════════════════════════════════════════

async def snapshot_portfolios():
    """Take a snapshot of all portfolio values for charting"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get all active users (active in last 24 hours)
        cur.execute("""
            SELECT id, wallet_balance, portfolio_value, total_pnl
            FROM trading_users
            WHERE last_active > NOW() - INTERVAL '24 hours'
        """)
        
        users = cur.fetchall()
        
        for user in users:
            cur.execute("""
                INSERT INTO trading_portfolio_history
                (user_id, portfolio_value, wallet_balance, total_pnl)
                VALUES (%s, %s, %s, %s)
            """, (user['id'], user['portfolio_value'], user['wallet_balance'], user['total_pnl']))
        
        conn.commit()
        conn.close()
        
        print(f"📸 Snapshot saved for {len(users)} portfolios")
        
    except Exception as e:
        print(f"❌ Portfolio snapshot error: {e}")


# ═══════════════════════════════════════════════════════
# PRICE UPDATE SERVICE
# ═══════════════════════════════════════════════════════

async def update_asset_prices():
    """Update all asset prices in database"""
    try:
        prices = await fetch_crypto_prices()
        
        if not prices:
            return
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        for symbol, data in prices.items():
            cur.execute("""
                UPDATE trading_assets 
                SET current_price = %s, price_change_24h = %s, last_updated = NOW()
                WHERE symbol = %s
            """, (data['price'], data['change_24h'], symbol))
            
            # Update cache
            PRICE_CACHE[symbol] = (data['price'], time.time())
        
        conn.commit()
        conn.close()
        
        print(f"💹 Updated prices for {len(prices)} assets")
        
    except Exception as e:
        print(f"❌ Price update error: {e}")


# ═══════════════════════════════════════════════════════
# BACKGROUND SERVICE RUNNER
# ═══════════════════════════════════════════════════════

class TradingBackgroundService:
    """Main background service that runs all jobs"""
    
    def __init__(self):
        self.running = False
        self.websocket_clients: Set = set()
        self.last_snapshot = datetime.now()
    
    async def start(self):
        """Start all background services"""
        self.running = True
        print("🚀 Trading Background Service Started")
        
        # Run tasks concurrently
        await asyncio.gather(
            self.price_update_loop(),
            self.trigger_check_loop(),
            self.snapshot_loop()
        )
    
    def stop(self):
        """Stop the service"""
        self.running = False
        print("🛑 Trading Background Service Stopped")
    
    async def price_update_loop(self):
        """Update prices every 5 seconds"""
        while self.running:
            try:
                await update_asset_prices()
            except Exception as e:
                print(f"Price loop error: {e}")
            await asyncio.sleep(5)
    
    async def trigger_check_loop(self):
        """Check triggers every 3 seconds"""
        while self.running:
            try:
                triggered = await check_triggers()
                if triggered:
                    # In a real implementation, broadcast via WebSocket here
                    for t in triggered:
                        print(f"📢 Alert: {t['trigger_type'].upper()} for {t['symbol']} @ ${t['price']:.2f}")
            except Exception as e:
                print(f"Trigger loop error: {e}")
            await asyncio.sleep(3)
    
    async def snapshot_loop(self):
        """Take portfolio snapshots every 5 minutes"""
        while self.running:
            try:
                await snapshot_portfolios()
            except Exception as e:
                print(f"Snapshot loop error: {e}")
            await asyncio.sleep(300)  # 5 minutes


# ═══════════════════════════════════════════════════════
# WEBSOCKET SERVER (using FastAPI WebSocket)
# ═══════════════════════════════════════════════════════

# WebSocket endpoints are added to merged_api.py
# This module provides the data broadcasting logic

class WebSocketBroadcaster:
    """Manages WebSocket client connections and broadcasting"""
    
    def __init__(self):
        self.clients: Dict[str, Set] = {}  # session_id -> set of websockets
        self.price_subscribers: Set = set()
    
    def add_price_subscriber(self, websocket):
        self.price_subscribers.add(websocket)
    
    def remove_price_subscriber(self, websocket):
        self.price_subscribers.discard(websocket)
    
    def add_client(self, session_id: str, websocket):
        if session_id not in self.clients:
            self.clients[session_id] = set()
        self.clients[session_id].add(websocket)
    
    def remove_client(self, session_id: str, websocket):
        if session_id in self.clients:
            self.clients[session_id].discard(websocket)
    
    async def broadcast_prices(self, prices: Dict):
        """Broadcast price updates to all price subscribers"""
        message = json.dumps({
            'type': 'price_update',
            'data': prices,
            'timestamp': datetime.now().isoformat()
        })
        
        dead_sockets = set()
        for ws in self.price_subscribers:
            try:
                await ws.send_text(message)
            except:
                dead_sockets.add(ws)
        
        for ws in dead_sockets:
            self.price_subscribers.discard(ws)
    
    async def broadcast_to_session(self, session_id: str, data: Dict):
        """Broadcast to a specific session's clients"""
        if session_id not in self.clients:
            return
        
        message = json.dumps(data)
        dead_sockets = set()
        
        for ws in self.clients[session_id]:
            try:
                await ws.send_text(message)
            except:
                dead_sockets.add(ws)
        
        for ws in dead_sockets:
            self.clients[session_id].discard(ws)


# Global broadcaster instance
broadcaster = WebSocketBroadcaster()


# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════

if __name__ == "__main__":
    service = TradingBackgroundService()
    
    try:
        asyncio.run(service.start())
    except KeyboardInterrupt:
        service.stop()
        print("\n👋 Service shutdown complete")
