"""
🚀 ZENITH PAPER TRADING API
Complete trading backend with leverage, stop-loss, take-profit, and real-time updates
No crashes - all operations are transactional
"""

import os
import uuid
import time
import requests
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, List
from pydantic import BaseModel, Field

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

# ═══════════════════════════════════════════════════════
# DATABASE CONNECTION
# ═══════════════════════════════════════════════════════

def get_db_connection():
    """Get database connection with error handling"""
    database_url = os.getenv("DATABASE_URL")
    
    if database_url:
        return psycopg2.connect(database_url, cursor_factory=RealDictCursor)
    else:
        host = os.getenv("NEON_HOST")
        database = os.getenv("NEON_DATABASE")
        user = os.getenv("NEON_USER")
        password = os.getenv("NEON_PASSWORD")
        port = os.getenv("NEON_PORT", "5432")
        
        conn_string = f"postgresql://{user}:{password}@{host}/{database}?sslmode=require"
        return psycopg2.connect(conn_string, cursor_factory=RealDictCursor)


# ═══════════════════════════════════════════════════════
# PYDANTIC MODELS
# ═══════════════════════════════════════════════════════

class TradeRequest(BaseModel):
    session_id: str
    symbol: str
    trade_type: str = Field(..., pattern="^(buy|sell)$")
    order_type: str = Field(default="market", pattern="^(market|limit)$")
    quantity: float = Field(..., gt=0)
    leverage: int = Field(default=1, ge=1, le=5)
    limit_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None

class TradeResponse(BaseModel):
    success: bool
    message: str
    trade_id: Optional[int] = None
    executed_price: Optional[float] = None
    total_value: Optional[float] = None
    margin_used: Optional[float] = None
    new_balance: Optional[float] = None

class PortfolioResponse(BaseModel):
    session_id: str
    wallet_balance: float
    portfolio_value: float
    available_margin: float
    margin_used: float
    total_pnl: float
    unrealized_pnl: float
    realized_pnl: float
    total_trades: int
    win_rate: float
    holdings: List[dict]


# ═══════════════════════════════════════════════════════
# PRICE FETCHING (from APIs)
# ═══════════════════════════════════════════════════════

PRICE_CACHE = {}
CACHE_TTL = 10  # seconds


def get_asset_price(symbol: str, asset_type: str = "crypto") -> float:
    """Get current price for an asset with caching"""
    cache_key = f"{symbol}_{asset_type}"
    now = time.time()
    
    # Check cache
    if cache_key in PRICE_CACHE:
        price, timestamp = PRICE_CACHE[cache_key]
        if now - timestamp < CACHE_TTL:
            return price
    
    price = None
    try:
        if asset_type == "crypto":
            price = get_dexscreener_price(symbol)
        else:
            price = get_alpha_vantage_price(symbol)
            
        if price:
            PRICE_CACHE[cache_key] = (price, now)
            return price
            
    except Exception as e:
        print(f"Price fetch error for {symbol}: {e}")
    
    # Fallback to DB or Hardcoded
    return get_fallback_price(symbol)


def get_dexscreener_price(symbol: str) -> Optional[float]:
    """Fetch price from DexScreener"""
    try:
        # Search for the token
        url = f"https://api.dexscreener.com/latest/dex/search?q={symbol}"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            pairs = data.get('pairs', [])
            if pairs:
                # Get priceUsd from the most liquid pair
                return float(pairs[0].get('priceUsd', 0))
    except Exception as e:
        print(f"DexScreener error: {e}")
    return None


def get_alpha_vantage_price(symbol: str) -> Optional[float]:
    """Fetch price from Alpha Vantage"""
    api_key = os.getenv("ALPHA_VANTAGE_KEY", "27PTDI7FTSYLQI4F")
    try:
        url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={api_key}"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            quote = data.get('Global Quote', {})
            if quote:
                return float(quote.get('05. price', 0))
    except Exception as e:
        print(f"Alpha Vantage error: {e}")
    return None


def get_fallback_price(symbol: str) -> float:
    """Fallback prices if API fails"""
    prices = {
        'BTC': 95000.0, 'ETH': 3400.0, 'SOL': 220.0, 'AVAX': 45.0,
        'LINK': 25.0, 'XRP': 2.40, 'DOGE': 0.40, 'ADA': 1.10,
        'AAPL': 225.0, 'NVDA': 140.0, 'TSLA': 420.0, 'MSFT': 430.0,
        'GOOGL': 175.0, 'AMZN': 220.0, 'META': 580.0
    }
    return prices.get(symbol.upper(), 100.0)


# ═══════════════════════════════════════════════════════
# TRADING ENGINE
# ═══════════════════════════════════════════════════════

class TradingEngine:
    """Core trading engine with transaction safety"""
    
    STARTING_BALANCE = Decimal("10000.00")
    MAX_LEVERAGE = 5
    
    def __init__(self):
        self.conn = None
        self.cur = None
    
    def __enter__(self):
        self.conn = get_db_connection()
        self.cur = self.conn.cursor()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.conn:
            if exc_type:
                self.conn.rollback()
            self.conn.close()
    
    # ─────────────────────────────────────────────────────
    # USER MANAGEMENT
    # ─────────────────────────────────────────────────────
    
    def get_or_create_user(self, session_id: str) -> dict:
        """Get existing user or create new one with $10,000"""
        self.cur.execute("""
            INSERT INTO trading_users (session_id, wallet_balance, available_margin, portfolio_value)
            VALUES (%s, 10000.00, 10000.00, 10000.00)
            ON CONFLICT (session_id) DO UPDATE SET last_active = CURRENT_TIMESTAMP
            RETURNING *
        """, (session_id,))
        user = dict(self.cur.fetchone())
        self.conn.commit()
        return user
    
    def get_user_with_lock(self, session_id: str) -> dict:
        """Get user with row lock for safe transactions"""
        self.cur.execute("""
            SELECT * FROM trading_users WHERE session_id = %s FOR UPDATE
        """, (session_id,))
        row = self.cur.fetchone()
        if not row:
            raise ValueError("User not found")
        return dict(row)
    
    # ─────────────────────────────────────────────────────
    # ASSET MANAGEMENT
    # ─────────────────────────────────────────────────────
    
    def get_asset(self, symbol: str) -> dict:
        """Get asset by symbol"""
        self.cur.execute("""
            SELECT * FROM trading_assets WHERE symbol = %s AND is_active = TRUE
        """, (symbol.upper(),))
        row = self.cur.fetchone()
        if not row:
            raise ValueError(f"Asset {symbol} not found")
        return dict(row)
    
    def get_all_assets(self) -> List[dict]:
        """Get all tradeable assets with current prices"""
        self.cur.execute("""
            SELECT symbol, name, asset_type, current_price, price_change_24h, max_leverage
            FROM trading_assets WHERE is_active = TRUE
            ORDER BY asset_type, symbol
        """)
        return [dict(row) for row in self.cur.fetchall()]
    
    def update_asset_price(self, symbol: str, price: float):
        """Update asset price in database"""
        self.cur.execute("""
            UPDATE trading_assets SET current_price = %s, last_updated = CURRENT_TIMESTAMP
            WHERE symbol = %s
        """, (price, symbol.upper()))
        self.conn.commit()
    
    # ─────────────────────────────────────────────────────
    # HOLDINGS MANAGEMENT
    # ─────────────────────────────────────────────────────
    
    def get_holding(self, user_id: int, asset_id: int) -> Optional[dict]:
        """Get specific holding"""
        self.cur.execute("""
            SELECT * FROM trading_holdings WHERE user_id = %s AND asset_id = %s
        """, (user_id, asset_id))
        row = self.cur.fetchone()
        return dict(row) if row else None
    
    def get_user_holdings(self, user_id: int) -> List[dict]:
        """Get all holdings for a user with current values"""
        self.cur.execute("""
            SELECT h.*, a.current_price, a.name, a.asset_type,
                   (h.quantity * a.current_price) as current_value,
                   ((a.current_price - h.avg_buy_price) * h.quantity * h.leverage) as unrealized_pnl
            FROM trading_holdings h
            JOIN trading_assets a ON h.asset_id = a.id
            WHERE h.user_id = %s AND h.quantity > 0
            ORDER BY (h.quantity * a.current_price) DESC
        """, (user_id,))
        return [dict(row) for row in self.cur.fetchall()]
    
    # ─────────────────────────────────────────────────────
    # TRADE EXECUTION (The Core)
    # ─────────────────────────────────────────────────────
    
    def execute_trade(self, request: TradeRequest) -> TradeResponse:
        """
        Execute a trade with full validation and transaction safety
        This is the CORE function - must never crash
        """
        try:
            # Begin transaction
            self.conn.autocommit = False
            
            # 1. Lock user row
            user = self.get_user_with_lock(request.session_id)
            user_id = user['id']
            
            # 2. Get asset
            asset = self.get_asset(request.symbol)
            asset_id = asset['id']
            
            # 3. Get current price (use live price for market orders)
            if request.order_type == "market":
                current_price = float(asset['current_price'])
                # Try to get live price
                live_price = get_asset_price(request.symbol, asset['asset_type'])
                if live_price:
                    current_price = live_price
            else:
                current_price = request.limit_price or float(asset['current_price'])
            
            # 4. Calculate trade values
            quantity = Decimal(str(request.quantity))
            price = Decimal(str(current_price))
            leverage = min(request.leverage, asset.get('max_leverage', 5), self.MAX_LEVERAGE)
            
            total_value = quantity * price
            margin_required = total_value / Decimal(str(leverage))
            
            # 5. VALIDATION
            wallet_balance = Decimal(str(user['wallet_balance']))
            available_margin = Decimal(str(user['available_margin']))
            
            if request.trade_type == "buy":
                # Check margin
                if margin_required > available_margin:
                    return TradeResponse(
                        success=False,
                        message=f"Insufficient margin. Required: ${margin_required:.2f}, Available: ${available_margin:.2f}"
                    )
                
                # Validate stop-loss (must be below current price for buy)
                if request.stop_loss and request.stop_loss >= current_price:
                    return TradeResponse(
                        success=False,
                        message="Stop-loss must be below current price for buy orders"
                    )
                
                # Validate take-profit (must be above current price for buy)
                if request.take_profit and request.take_profit <= current_price:
                    return TradeResponse(
                        success=False,
                        message="Take-profit must be above current price for buy orders"
                    )
            
            else:  # sell
                # Check holdings
                holding = self.get_holding(user_id, asset_id)
                if not holding or Decimal(str(holding['quantity'])) < quantity:
                    current_qty = Decimal(str(holding['quantity'])) if holding else Decimal("0")
                    return TradeResponse(
                        success=False,
                        message=f"Insufficient holdings. You have {current_qty} {request.symbol}"
                    )
            
            # 6. EXECUTE TRADE
            if request.trade_type == "buy":
                trade_id = self._execute_buy(
                    user_id, asset_id, request.symbol,
                    quantity, price, leverage, margin_required,
                    request.stop_loss, request.take_profit
                )
                new_balance = wallet_balance  # Wallet stays same, margin is used
                self._update_user_margin(user_id, margin_required, add=True)
                
            else:  # sell
                realized_pnl = self._execute_sell(
                    user_id, asset_id, request.symbol,
                    quantity, price, leverage
                )
                # Wallet is already updated in _execute_sell, just retrieve current balance
                self.cur.execute("SELECT wallet_balance FROM trading_users WHERE id = %s", (user_id,))
                new_balance = Decimal(str(self.cur.fetchone()['wallet_balance']))
                trade_id = self._insert_trade(
                    user_id, asset_id, request.symbol, "sell", "market",
                    quantity, leverage, price, total_value, Decimal("0"),
                    None, None, realized_pnl
                )
            
            # 7. Update portfolio value
            self._recalculate_portfolio(user_id)
            
            # 8. Commit transaction
            self.conn.commit()
            
            return TradeResponse(
                success=True,
                message=f"Successfully {'bought' if request.trade_type == 'buy' else 'sold'} {quantity} {request.symbol}",
                trade_id=trade_id,
                executed_price=float(price),
                total_value=float(total_value),
                margin_used=float(margin_required) if request.trade_type == "buy" else 0,
                new_balance=float(new_balance)
            )
            
        except Exception as e:
            self.conn.rollback()
            return TradeResponse(success=False, message=f"Trade failed: {str(e)}")
        finally:
            self.conn.autocommit = True
    
    def _execute_buy(self, user_id: int, asset_id: int, symbol: str,
                     quantity: Decimal, price: Decimal, leverage: int,
                     margin: Decimal, stop_loss: Optional[float],
                     take_profit: Optional[float]) -> int:
        """Execute buy order - update holdings"""
        
        holding = self.get_holding(user_id, asset_id)
        
        if holding:
            # Update existing holding (average price)
            old_qty = Decimal(str(holding['quantity']))
            old_avg = Decimal(str(holding['avg_buy_price']))
            old_margin = Decimal(str(holding['margin_used']))
            
            new_qty = old_qty + quantity
            new_avg = ((old_avg * old_qty) + (price * quantity)) / new_qty
            new_margin = old_margin + margin
            
            self.cur.execute("""
                UPDATE trading_holdings 
                SET quantity = %s, avg_buy_price = %s, margin_used = %s,
                    leverage = %s, stop_loss_price = COALESCE(%s, stop_loss_price),
                    take_profit_price = COALESCE(%s, take_profit_price),
                    entry_value = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                float(new_qty), float(new_avg), float(new_margin),
                leverage, stop_loss, take_profit, float(new_qty * new_avg),
                holding['id']
            ))
        else:
            # Create new holding
            self.cur.execute("""
                INSERT INTO trading_holdings 
                (user_id, asset_id, symbol, quantity, avg_buy_price, leverage,
                 margin_used, entry_value, stop_loss_price, take_profit_price)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id, asset_id, symbol, float(quantity), float(price),
                leverage, float(margin), float(quantity * price),
                stop_loss, take_profit
            ))
        
        # Insert trade record
        return self._insert_trade(
            user_id, asset_id, symbol, "buy", "market",
            quantity, leverage, price, quantity * price, margin,
            stop_loss, take_profit, Decimal("0")
        )
    
    def _execute_sell(self, user_id: int, asset_id: int, symbol: str,
                      quantity: Decimal, current_price: Decimal,
                      leverage: int) -> Decimal:
        """Execute sell order - update holdings and calculate P&L"""
        
        holding = self.get_holding(user_id, asset_id)
        if not holding:
            raise ValueError("No holdings to sell")
        
        old_qty = Decimal(str(holding['quantity']))
        avg_buy_price = Decimal(str(holding['avg_buy_price']))
        hold_leverage = holding['leverage']
        
        # Calculate realized P&L with leverage
        price_diff = current_price - avg_buy_price
        realized_pnl = price_diff * quantity * Decimal(str(hold_leverage))
        
        # Calculate margin to release
        margin_to_release = Decimal(str(holding['margin_used'])) * (quantity / old_qty)
        
        new_qty = old_qty - quantity
        
        if new_qty <= Decimal("0"):
            # Close entire position
            self.cur.execute("DELETE FROM trading_holdings WHERE id = %s", (holding['id'],))
        else:
            # Partial sell
            new_margin = Decimal(str(holding['margin_used'])) - margin_to_release
            self.cur.execute("""
                UPDATE trading_holdings 
                SET quantity = %s, margin_used = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (float(new_qty), float(new_margin), holding['id']))
        
        # Release margin and add proceeds + P&L to wallet
        self._update_user_wallet(user_id, margin_to_release + (quantity * current_price) + realized_pnl)
        self._update_user_margin(user_id, margin_to_release, add=False)
        self._update_user_pnl(user_id, realized_pnl)
        
        return realized_pnl
    
    def _insert_trade(self, user_id: int, asset_id: int, symbol: str,
                      trade_type: str, order_type: str, quantity: Decimal,
                      leverage: int, price: Decimal, total_value: Decimal,
                      margin: Decimal, stop_loss: Optional[float],
                      take_profit: Optional[float], realized_pnl: Decimal) -> int:
        """Insert trade record"""
        self.cur.execute("""
            INSERT INTO trading_trades
            (user_id, asset_id, symbol, trade_type, order_type, quantity,
             leverage, price_at_execution, total_value, margin_cost,
             stop_loss_price, take_profit_price, realized_pnl, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'executed')
            RETURNING id
        """, (
            user_id, asset_id, symbol, trade_type, order_type,
            float(quantity), leverage, float(price), float(total_value),
            float(margin), stop_loss, take_profit, float(realized_pnl)
        ))
        
        trade_id = self.cur.fetchone()['id']
        
        # Update trade count
        self.cur.execute("""
            UPDATE trading_users SET total_trades = total_trades + 1 WHERE id = %s
        """, (user_id,))
        
        return trade_id
    
    def _update_user_margin(self, user_id: int, amount: Decimal, add: bool = True):
        """Update user margin"""
        op = "+" if add else "-"
        self.cur.execute(f"""
            UPDATE trading_users 
            SET margin_used = margin_used {op} %s,
                available_margin = available_margin {'-' if add else '+'} %s
            WHERE id = %s
        """, (float(amount), float(amount), user_id))
    
    def _update_user_wallet(self, user_id: int, amount: Decimal):
        """Add amount to wallet"""
        self.cur.execute("""
            UPDATE trading_users SET wallet_balance = wallet_balance + %s WHERE id = %s
        """, (float(amount), user_id))
    
    def _update_user_pnl(self, user_id: int, pnl: Decimal):
        """Update realized P&L"""
        win = 1 if pnl > 0 else 0
        lose = 1 if pnl < 0 else 0
        self.cur.execute("""
            UPDATE trading_users 
            SET realized_pnl = realized_pnl + %s,
                winning_trades = winning_trades + %s,
                losing_trades = losing_trades + %s
            WHERE id = %s
        """, (float(pnl), win, lose, user_id))
    
    def _recalculate_portfolio(self, user_id: int):
        """Recalculate total portfolio value"""
        # Get wallet balance
        self.cur.execute("SELECT wallet_balance FROM trading_users WHERE id = %s", (user_id,))
        wallet = Decimal(str(self.cur.fetchone()['wallet_balance']))
        
        # Get holdings value with leverage P&L
        self.cur.execute("""
            SELECT COALESCE(SUM(
                h.margin_used + ((a.current_price - h.avg_buy_price) * h.quantity * h.leverage)
            ), 0) as holdings_value,
            COALESCE(SUM(
                (a.current_price - h.avg_buy_price) * h.quantity * h.leverage
            ), 0) as unrealized_pnl
            FROM trading_holdings h
            JOIN trading_assets a ON h.asset_id = a.id
            WHERE h.user_id = %s AND h.quantity > 0
        """, (user_id,))
        
        row = self.cur.fetchone()
        holdings_value = Decimal(str(row['holdings_value']))
        unrealized_pnl = Decimal(str(row['unrealized_pnl']))
        
        portfolio_value = wallet + holdings_value
        total_pnl = portfolio_value - self.STARTING_BALANCE
        
        # Update win rate
        self.cur.execute("SELECT winning_trades, losing_trades FROM trading_users WHERE id = %s", (user_id,))
        stats = self.cur.fetchone()
        total_closed = stats['winning_trades'] + stats['losing_trades']
        win_rate = (stats['winning_trades'] / total_closed * 100) if total_closed > 0 else 0
        
        self.cur.execute("""
            UPDATE trading_users 
            SET portfolio_value = %s, total_pnl = %s, unrealized_pnl = %s, win_rate = %s
            WHERE id = %s
        """, (float(portfolio_value), float(total_pnl), float(unrealized_pnl), win_rate, user_id))
    
    # ─────────────────────────────────────────────────────
    # PORTFOLIO & LEADERBOARD
    # ─────────────────────────────────────────────────────
    
    def get_portfolio(self, session_id: str) -> dict:
        """Get complete portfolio for a user"""
        user = self.get_or_create_user(session_id)
        holdings = self.get_user_holdings(user['id'])
        
        return {
            "session_id": session_id,
            "wallet_balance": float(user['wallet_balance']),
            "portfolio_value": float(user['portfolio_value']),
            "available_margin": float(user['available_margin']),
            "margin_used": float(user['margin_used']),
            "total_pnl": float(user['total_pnl']),
            "unrealized_pnl": float(user['unrealized_pnl']),
            "realized_pnl": float(user['realized_pnl']),
            "total_trades": user['total_trades'],
            "win_rate": float(user['win_rate']),
            "holdings": holdings
        }
    
    def get_leaderboard(self, limit: int = 10) -> List[dict]:
        """Get top traders by portfolio value"""
        self.cur.execute("""
            SELECT 
                COALESCE(username, 'Trader #' || id) as display_name,
                portfolio_value,
                total_pnl,
                total_trades,
                win_rate,
                RANK() OVER (ORDER BY portfolio_value DESC) as rank
            FROM trading_users
            WHERE portfolio_value > 0
            ORDER BY portfolio_value DESC
            LIMIT %s
        """, (limit,))
        return [dict(row) for row in self.cur.fetchall()]
    
    def get_trade_history(self, session_id: str, limit: int = 50) -> List[dict]:
        """Get trade history for a user"""
        user = self.get_or_create_user(session_id)
        self.cur.execute("""
            SELECT t.*, a.name as asset_name
            FROM trading_trades t
            JOIN trading_assets a ON t.asset_id = a.id
            WHERE t.user_id = %s
            ORDER BY t.executed_at DESC
            LIMIT %s
        """, (user['id'], limit))
        return [dict(row) for row in self.cur.fetchall()]

    def get_analytics(self, session_id: str) -> dict:
        """Get advanced analytics for a user"""
        user = self.get_or_create_user(session_id)
        user_id = user['id']
        
        # 1. Exposure Analysis
        self.cur.execute("""
            SELECT a.asset_type, SUM(h.quantity * a.current_price) as total_value
            FROM trading_holdings h
            JOIN trading_assets a ON h.asset_id = a.id
            WHERE h.user_id = %s AND h.quantity > 0
            GROUP BY a.asset_type
        """, (user_id,))
        exposure_rows = self.cur.fetchall()
        
        total_holdings_value = sum(float(row['total_value']) for row in exposure_rows) or 1.0
        exposure = {
            row['asset_type']: (float(row['total_value']) / total_holdings_value) * 100 
            for row in exposure_rows
        }
        
        # 2. Streak Analysis & Max Drawdown
        self.cur.execute("""
            SELECT realized_pnl, total_value 
            FROM trading_trades 
            WHERE user_id = %s AND status = 'executed'
            ORDER BY executed_at ASC
        """, (user_id,))
        trades = self.cur.fetchall()
        
        current_streak = 0
        longest_win_streak = 0
        longest_loss_streak = 0
        
        # Simplified Peak-to-Valley Drawdown on Portfolio Value
        peak_pnl = 0.0
        current_pnl = 0.0
        max_drawdown = 0.0
        
        for trade in trades:
            pnl = float(trade['realized_pnl'])
            
            # Streak Logic
            if pnl > 0:
                if current_streak >= 0:
                    current_streak += 1
                else:
                    current_streak = 1
                longest_win_streak = max(longest_win_streak, current_streak)
            elif pnl < 0:
                if current_streak <= 0:
                    current_streak -= 1
                else:
                    current_streak = -1
                longest_loss_streak = max(longest_loss_streak, abs(current_streak))
            
            # Drawdown Logic
            current_pnl += pnl
            peak_pnl = max(peak_pnl, current_pnl)
            # This is drawdown on PnL, reasonable proxy for portfolio value drop relative to peak
            dd = peak_pnl - current_pnl
            max_drawdown = max(max_drawdown, dd)

        return {
            "session_id": session_id,
            "exposure": exposure,
            "metrics": {
                "longest_win_streak": longest_win_streak,
                "longest_loss_streak": longest_loss_streak,
                "current_streak": current_streak,
                "max_drawdown": max_drawdown,
                "total_trades": len(trades),
                "win_rate": float(user['win_rate'])
            }
        }


# ═══════════════════════════════════════════════════════
# STOP-LOSS / TAKE-PROFIT ENGINE
# ═══════════════════════════════════════════════════════

def check_triggers():
    """
    Check all stop-loss and take-profit triggers
    Run this in a background job every 5 seconds
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get all holdings with triggers
        cur.execute("""
            SELECT h.*, a.current_price, u.session_id
            FROM trading_holdings h
            JOIN trading_assets a ON h.asset_id = a.id
            JOIN trading_users u ON h.user_id = u.id
            WHERE h.quantity > 0 
            AND (h.stop_loss_price IS NOT NULL OR h.take_profit_price IS NOT NULL)
        """)
        
        for holding in cur.fetchall():
            current_price = float(holding['current_price'])
            
            # Check stop-loss (price dropped below SL)
            if holding['stop_loss_price'] and current_price <= float(holding['stop_loss_price']):
                print(f"⚠️ STOP-LOSS triggered for {holding['symbol']}")
                with TradingEngine() as engine:
                    engine.execute_trade(TradeRequest(
                        session_id=holding['session_id'],
                        symbol=holding['symbol'],
                        trade_type="sell",
                        order_type="market",
                        quantity=float(holding['quantity']),
                        leverage=1
                    ))
            
            # Check take-profit (price rose above TP)
            elif holding['take_profit_price'] and current_price >= float(holding['take_profit_price']):
                print(f"✅ TAKE-PROFIT triggered for {holding['symbol']}")
                with TradingEngine() as engine:
                    engine.execute_trade(TradeRequest(
                        session_id=holding['session_id'],
                        symbol=holding['symbol'],
                        trade_type="sell",
                        order_type="market",
                        quantity=float(holding['quantity']),
                        leverage=1
                    ))
        
        conn.close()
        
    except Exception as e:
        print(f"Trigger check error: {e}")


# ═══════════════════════════════════════════════════════
# TEST
# ═══════════════════════════════════════════════════════

if __name__ == "__main__":
    # Test the trading engine
    with TradingEngine() as engine:
        # Create/get user
        user = engine.get_or_create_user("test-session-123")
        print(f"User: {user}")
        
        # Get assets
        assets = engine.get_all_assets()
        print(f"Assets: {len(assets)}")
        
        # Get portfolio
        portfolio = engine.get_portfolio("test-session-123")
        print(f"Portfolio: {portfolio}")
