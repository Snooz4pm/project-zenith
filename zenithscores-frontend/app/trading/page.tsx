'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// 🔧 NUCLEAR FIX: Client-only dynamic imports for smooth navigation
const PortfolioChart = dynamic(() => import('@/components/PortfolioChart'), { ssr: false });
const AssetPicker = dynamic(() => import('@/components/AssetPicker'), { ssr: false });

import {
    TrendingUp, TrendingDown, Wallet, BarChart3,
    Trophy, History, Activity, Bell, Users, Share2, CheckCircle,
    ArrowRight, Lock, DollarSign, Shield, Zap, AlertCircle
} from 'lucide-react';

// Types
interface Asset {
    symbol: string;
    name: string;
    asset_type: string;
    current_price: number;
    price_change_24h: number;
    max_leverage: number;
}

interface Holding {
    symbol: string;
    name: string;
    quantity: number;
    avg_buy_price: number;
    current_price: number;
    current_value: number;
    unrealized_pnl: number;
    leverage: number;
    stop_loss_price: number | null;
    take_profit_price: number | null;
}

interface Portfolio {
    session_id: string;
    wallet_balance: number;
    portfolio_value: number;
    available_margin: number;
    margin_used: number;
    total_pnl: number;
    unrealized_pnl: number;
    realized_pnl: number;
    total_trades: number;
    win_rate: number;
    holdings: Holding[];
}

interface Trade {
    id: number;
    symbol: string;
    trade_type: string;
    quantity: number;
    price_at_execution: number;
    total_value: number;
    leverage: number;
    realized_pnl: number;
    executed_at: string;
}

interface LeaderboardEntry {
    display_name: string;
    portfolio_value: number;
    total_pnl: number;
    total_trades: number;
    win_rate: number;
    rank: number;
}

// Helper functions
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';

export default function TradingPage() {
    // NextAuth session
    const { data: authSession, status: authStatus } = useSession();
    const isAuthenticated = authStatus === 'authenticated';
    const isAuthLoading = authStatus === 'loading';

    // Trading Session
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sessionLinked, setSessionLinked] = useState(false);

    // Data
    const [assets, setAssets] = useState<Asset[]>([]);
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);

    // Trade Modal
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
    const [quantity, setQuantity] = useState('');
    const [leverage, setLeverage] = useState(1);
    const [limitPrice, setLimitPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [tradeError, setTradeError] = useState<string | null>(null);
    const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);
    const [executing, setExecuting] = useState(false);

    // View
    const [activeTab, setActiveTab] = useState<'portfolio' | 'trade' | 'history' | 'leaderboard' | 'analytics' | 'community'>('portfolio');

    // WebSocket connections
    const wsRef = useRef<WebSocket | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [triggerAlert, setTriggerAlert] = useState<string | null>(null);

    // Get user ID from backend when authenticated
    useEffect(() => {
        if (isAuthenticated && authSession?.user?.email && !userId) {
            fetchUserId();
        }
    }, [isAuthenticated, authSession]);

    const fetchUserId = async () => {
        if (!authSession?.user?.email) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/auth/user-by-email/${encodeURIComponent(authSession.user.email)}`);
            if (res.ok) {
                const data = await res.json();
                setUserId(data.user.id);
            }
        } catch (e) {
            console.error('Failed to fetch user ID:', e);
        }
    };

    // Initialize session - require auth
    useEffect(() => {
        if (isAuthLoading) return;

        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const stored = localStorage.getItem('trading_session_id');
        if (stored) {
            setSessionId(stored);
        } else {
            registerSession();
        }
    }, [isAuthenticated, isAuthLoading]);

    // Load data when session is ready
    useEffect(() => {
        if (sessionId && isAuthenticated) {
            loadAllData();
            connectWebSocket();

            // Link session to authenticated user
            if (userId && !sessionLinked) {
                linkSessionToUser();
            }
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [sessionId, isAuthenticated, userId]);

    // Link trading session to authenticated user
    const linkSessionToUser = async () => {
        if (!userId || !sessionId) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/auth/link-trading`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, session_id: sessionId })
            });
            if (res.ok) {
                setSessionLinked(true);
            }
        } catch (e) {
            console.error('Failed to link session:', e);
        }
    };

    // WebSocket connection for real-time updates
    const connectWebSocket = () => {
        if (!sessionId) return;

        const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app')
            .replace('http://', 'ws://')
            .replace('https://', 'wss://');

        try {
            const ws = new WebSocket(`${wsUrl}/ws/trading/${sessionId}`);

            ws.onopen = () => {
                setWsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'portfolio_update') {
                        setPortfolio(data.data);
                    } else if (data.type === 'price_update') {
                        setAssets(prev => prev.map(asset => ({
                            ...asset,
                            current_price: data.data[asset.symbol] || asset.current_price
                        })));
                    } else if (data.type === 'trigger_alert') {
                        setTriggerAlert(`${data.trigger_type.toUpperCase()} triggered for ${data.symbol} @ $${data.price.toFixed(2)}`);
                        setTimeout(() => setTriggerAlert(null), 5000);
                        loadPortfolio();
                        loadHistory();
                    }
                } catch (e) {
                    if (event.data === 'ping') {
                        ws.send('pong');
                    }
                }
            };

            ws.onclose = () => {
                setWsConnected(false);
                setTimeout(connectWebSocket, 5000);
            };

            wsRef.current = ws;
        } catch (e) {
            console.error('WebSocket connection failed:', e);
        }
    };

    // Fallback: Auto-refresh
    useEffect(() => {
        if (!sessionId || wsConnected) return;
        const interval = setInterval(() => {
            loadPortfolio();
            loadAssets();
        }, 15000);
        return () => clearInterval(interval);
    }, [sessionId, wsConnected]);

    const registerSession = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/trading/register`, { method: 'POST' });
            const data = await res.json();
            if (data.status === 'success') {
                setSessionId(data.session_id);
                localStorage.setItem('trading_session_id', data.session_id);
                setPortfolio(data.portfolio);
            }
        } catch (e) {
            console.error('Failed to register session:', e);
        }
    };

    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([
            loadAssets(),
            loadPortfolio(),
            loadLeaderboard(),
            loadHistory()
        ]);
        setLoading(false);
    };

    const loadAssets = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/trading/assets`);
            const data = await res.json();
            if (data.status === 'success') {
                setAssets(data.data);
            }
        } catch (e) {
            console.error('Failed to load assets:', e);
        }
    };

    const loadPortfolio = async () => {
        if (!sessionId) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/trading/portfolio/${sessionId}`);
            const data = await res.json();
            if (data.status === 'success') {
                setPortfolio(data.data);
            }
        } catch (e) {
            console.error('Failed to load portfolio:', e);
        }
    };

    const loadLeaderboard = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/trading/leaderboard?limit=10`);
            const data = await res.json();
            if (data.status === 'success') {
                setLeaderboard(data.data);
            }
        } catch (e) {
            console.error('Failed to load leaderboard:', e);
        }
    };

    const loadHistory = async () => {
        if (!sessionId) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/trading/history/${sessionId}?limit=50`);
            const data = await res.json();
            if (data.status === 'success') {
                setTradeHistory(data.data);
            }
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    };

    const openTradeModal = (asset: Asset, type: 'buy' | 'sell') => {
        setSelectedAsset(asset);
        setTradeType(type);
        setQuantity('');
        setLeverage(1);
        setStopLoss('');
        setTakeProfit('');
        setLimitPrice('');
        setTradeError(null);
        setShowConfirmation(false);
        setShowTradeModal(true);
    };

    const executeTrade = async () => {
        if (!sessionId || !selectedAsset) return;
        setExecuting(true);
        setTradeError(null);

        try {
            const res = await fetch(`${API_URL}/api/v1/trading/trade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    symbol: selectedAsset.symbol,
                    trade_type: tradeType,
                    order_type: orderType,
                    quantity: parseFloat(quantity),
                    leverage: leverage,
                    limit_price: orderType === 'limit' ? parseFloat(limitPrice) : null,
                    stop_loss: stopLoss ? parseFloat(stopLoss) : null,
                    take_profit: takeProfit ? parseFloat(takeProfit) : null
                })
            });

            const data = await res.json();

            if (data.status === 'success') {
                setTradeSuccess(`Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${quantity} ${selectedAsset.symbol}!`);
                setPortfolio(data.portfolio);
                setShowTradeModal(false);
                loadHistory();
                loadLeaderboard();
                setTimeout(() => setTradeSuccess(null), 3000);
            } else {
                setTradeError(data.detail || 'Trade failed');
            }
        } catch (e: any) {
            setTradeError(e.message || 'Trade execution failed');
        } finally {
            setExecuting(false);
        }
    };

    if (isAuthLoading || loading) {
        return (
            <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
                <div className="text-[var(--accent-mint)] font-mono animate-pulse flex items-center gap-2">
                    <Activity size={24} className="animate-spin" />
                    Initializing Terminal...
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[var(--void)] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_rgba(0,212,255,0.1),_transparent_50%)]" />
                </div>
                <div className="text-center max-w-md mx-auto px-6 relative z-10">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[rgba(20,241,149,0.1)] flex items-center justify-center border border-[var(--accent-mint)]/20 shadow-[0_0_30px_rgba(20,241,149,0.1)]">
                        <TrendingUp size={40} className="text-[var(--accent-mint)]" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>Zenith Trader</h1>
                    <p className="text-[var(--text-secondary)] mb-8">
                        Sign in to access the institutional-grade paper trading environment.
                        $10,000 virtual capital. Real-time data. Zero risk.
                    </p>

                    <button
                        onClick={() => signIn('google', { callbackUrl: '/trading' })}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[var(--accent-mint)] text-black font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(20,241,149,0.4)] hover:scale-[1.02]"
                    >
                        <Zap size={20} fill="currentColor" />
                        ACCESS TERMINAL
                    </button>

                    <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.05)]">
                            <DollarSign className="mx-auto mb-1 text-[var(--accent-mint)]" size={20} />
                            <div className="text-xs text-[var(--text-secondary)]">$10K Equity</div>
                        </div>
                        <div className="p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.05)]">
                            <Trophy className="mx-auto mb-1 text-[var(--accent-gold)]" size={20} />
                            <div className="text-xs text-[var(--text-secondary)]">Compete</div>
                        </div>
                        <div className="p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.05)]">
                            <Shield className="mx-auto mb-1 text-[var(--accent-cyan)]" size={20} />
                            <div className="text-xs text-[var(--text-secondary)]">Risk Free</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--void)] text-[var(--text-primary)] pt-20">

            {/* WebSocket Status Indicator */}
            <div className="fixed bottom-4 right-4 z-40">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${wsConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-[var(--accent-mint)]' : 'bg-red-500/10 border-red-500/20 text-[var(--accent-danger)]'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-[var(--accent-mint)] animate-pulse' : 'bg-[var(--accent-danger)]'}`} />
                    {wsConnected ? 'SYSTEM ONLINE' : 'DISCONNECTED'}
                </div>
            </div>

            {/* Portfolio Summary Bar */}
            {portfolio && (
                <div className="border-b border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.4)] backdrop-blur-md sticky top-16 z-30">
                    <div className="container mx-auto px-4 py-3">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">Equity</div>
                                <div className="text-lg font-bold text-white font-mono">{formatCurrency(portfolio.portfolio_value)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">Margin Avail</div>
                                <div className="text-lg font-bold text-[var(--accent-mint)] font-mono">{formatCurrency(portfolio.available_margin)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">Total P&L</div>
                                <div className={`text-lg font-bold font-mono ${portfolio.total_pnl >= 0 ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'}`}>
                                    {formatCurrency(portfolio.total_pnl)}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">Win Rate</div>
                                <div className="text-lg font-bold text-[var(--text-primary)] font-mono">{portfolio.win_rate.toFixed(1)}%</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">Trades</div>
                                <div className="text-lg font-bold text-[var(--text-primary)] font-mono">{portfolio.total_trades}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { id: 'portfolio', label: 'Portfolio', icon: Wallet },
                        { id: 'trade', label: 'Trade', icon: BarChart3 },
                        { id: 'history', label: 'History', icon: History },
                        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
                        { id: 'analytics', label: 'Analytics', icon: Activity },
                        { id: 'community', label: 'Community', icon: Users },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-[var(--accent-mint)] text-black'
                                : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white'
                                }`}
                            style={{ fontFamily: "var(--font-body)" }}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'portfolio' && portfolio && (
                    <div className="space-y-6">
                        <div className="glass-panel p-6 rounded-2xl border border-[rgba(255,255,255,0.05)]">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                                <Activity className="text-[var(--accent-mint)]" size={24} />
                                Active Positions
                            </h2>

                            {portfolio.holdings.length === 0 ? (
                                <div className="text-center py-20 border border-dashed border-[rgba(255,255,255,0.1)] rounded-xl">
                                    <Wallet className="mx-auto mb-4 text-[var(--text-muted)]" size={48} />
                                    <p className="text-[var(--text-secondary)] mb-4">No open positions.</p>
                                    <button
                                        onClick={() => setActiveTab('trade')}
                                        className="px-6 py-2 bg-[var(--accent-mint)] text-black font-bold rounded-lg hover:bg-[#00c97b] transition-colors"
                                    >
                                        Execute Order
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-xs text-[var(--text-muted)] uppercase border-b border-[rgba(255,255,255,0.05)]">
                                                <th className="py-4 px-4 pl-6">Asset</th>
                                                <th className="py-4 px-4 text-right">Size</th>
                                                <th className="py-4 px-4 text-right">Entry</th>
                                                <th className="py-4 px-4 text-right">Mark</th>
                                                <th className="py-4 px-4 text-right">Value</th>
                                                <th className="py-4 px-4 text-right">P&L</th>
                                                <th className="py-4 px-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {portfolio.holdings.map((holding) => (
                                                <tr key={holding.symbol} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                                                    <td className="py-4 px-4 pl-6 font-bold text-white">{holding.symbol}</td>
                                                    <td className="py-4 px-4 text-right font-mono text-[var(--text-secondary)]">{holding.quantity}</td>
                                                    <td className="py-4 px-4 text-right font-mono text-[var(--text-secondary)]">{formatCurrency(holding.avg_buy_price)}</td>
                                                    <td className="py-4 px-4 text-right font-mono text-white">{formatCurrency(holding.current_price)}</td>
                                                    <td className="py-4 px-4 text-right font-mono font-bold text-white">{formatCurrency(holding.current_value)}</td>
                                                    <td className={`py-4 px-4 text-right font-mono font-bold ${holding.unrealized_pnl >= 0 ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'}`}>
                                                        {formatCurrency(holding.unrealized_pnl)}
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <button
                                                            onClick={() => {
                                                                const asset = assets.find(a => a.symbol === holding.symbol);
                                                                if (asset) openTradeModal(asset, 'sell');
                                                            }}
                                                            className="px-3 py-1 bg-[var(--accent-danger)]/10 text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/20 rounded font-bold text-xs transition-colors"
                                                        >
                                                            CLOSE
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {sessionId && (
                            <PortfolioChart
                                sessionId={sessionId}
                                currentValue={portfolio.portfolio_value}
                                totalPnl={portfolio.total_pnl}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'trade' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1 min-h-[500px]">
                            <AssetPicker
                                assets={assets}
                                onSelect={(asset) => openTradeModal(asset, 'buy')}
                            />
                        </div>
                        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
                            {assets.map(asset => (
                                <motion.div
                                    key={asset.symbol}
                                    className="glass-panel p-5 rounded-xl border border-[rgba(255,255,255,0.05)] hover:border-[var(--accent-mint)]/30 transition-all cursor-pointer group"
                                    whileHover={{ y: -5 }}
                                    onClick={() => openTradeModal(asset, 'buy')}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="font-bold text-lg text-white" style={{ fontFamily: "var(--font-display)" }}>{asset.symbol}</div>
                                            <div className="text-xs text-[var(--text-secondary)]">{asset.name}</div>
                                        </div>
                                        <div className={`text-xs font-mono px-2 py-1 rounded bg-[rgba(255,255,255,0.05)]`}>
                                            {asset.asset_type.toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="text-2xl font-bold font-mono text-white">{formatCurrency(asset.current_price)}</div>
                                        <div className={`text-sm flex items-center gap-1 font-mono ${asset.price_change_24h >= 0 ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'}`}>
                                            {asset.price_change_24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {formatPercent(asset.price_change_24h)}
                                        </div>
                                    </div>
                                    <button className="w-full py-2 bg-[rgba(255,255,255,0.05)] group-hover:bg-[var(--accent-mint)] group-hover:text-black text-[var(--text-muted)] group-hover:font-bold rounded-lg transition-all text-xs uppercase tracking-wider">
                                        Trade
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Trade Modal */}
            <AnimatePresence>
                {showTradeModal && selectedAsset && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#121218] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
                        >
                            {/* Modal Header */}
                            <div className="p-6 pb-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-b from-white/5 to-transparent">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <span className={`inline-block w-2 h-6 rounded-full ${tradeType === 'buy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        {tradeType === 'buy' ? 'Open Long' : 'Open Short'}
                                        <span className="text-zinc-500 font-medium">/</span>
                                        <span className="text-white">{selectedAsset.symbol}</span>
                                    </h3>
                                    <p className="text-sm text-zinc-400 mt-1 pl-4">Market Price: <span className="text-white font-mono">{formatCurrency(selectedAsset.current_price)}</span></p>
                                </div>
                                <button
                                    onClick={() => setShowTradeModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all"
                                >
                                    <ArrowRight size={20} className="rotate-45" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6">
                                {/* Side Selector */}
                                <div className="grid grid-cols-2 gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5">
                                    <button
                                        onClick={() => setTradeType('buy')}
                                        className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${tradeType === 'buy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <TrendingUp size={16} /> Buy / Long
                                    </button>
                                    <button
                                        onClick={() => setTradeType('sell')}
                                        className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${tradeType === 'sell' ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <TrendingDown size={16} /> Sell / Short
                                    </button>
                                </div>

                                {/* Quantity Input */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Position Size (USD)</label>
                                        <div className="text-xs text-zinc-500">Balance: $12,450.00</div>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">$</span>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-8 pr-4 text-white font-mono text-lg focus:border-white/20 focus:bg-white/10 outline-none transition-all placeholder-zinc-700"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Risk Management */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-400 mb-2 block uppercase tracking-wider">Stop Loss</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={stopLoss}
                                                onChange={(e) => setStopLoss(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white font-mono text-sm focus:border-red-500/50 outline-none transition-all placeholder-zinc-700"
                                                placeholder="Price"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-400 mb-2 block uppercase tracking-wider">Take Profit</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={takeProfit}
                                                onChange={(e) => setTakeProfit(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white font-mono text-sm focus:border-emerald-500/50 outline-none transition-all placeholder-zinc-700"
                                                placeholder="Price"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Summary & Action */}
                                <div className="pt-2">
                                    {tradeError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm"
                                        >
                                            <AlertCircle size={16} />
                                            {tradeError}
                                        </motion.div>
                                    )}

                                    <button
                                        onClick={executeTrade}
                                        disabled={executing}
                                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 ${tradeType === 'buy'
                                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-emerald-500/25 border border-emerald-400/20'
                                            : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-red-500/25 border border-red-400/20'
                                            } ${executing ? 'opacity-80 cursor-wait' : ''}`}
                                    >
                                        {executing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                {tradeType === 'buy' ? 'Confirm Long Order' : 'Confirm Short Order'}
                                                <ArrowRight size={20} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Success Toast */}
            <AnimatePresence>
                {tradeSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[var(--accent-mint)] text-black px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(20,241,149,0.4)] flex items-center gap-2"
                    >
                        <CheckCircle size={20} />
                        {tradeSuccess}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
