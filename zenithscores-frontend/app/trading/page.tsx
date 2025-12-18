'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft, TrendingUp, TrendingDown, Wallet, BarChart3,
    Trophy, History, AlertTriangle, CheckCircle, X, RefreshCw,
    DollarSign, Percent, Target, Shield, Activity, Bell, LogIn, User, GraduationCap,
    Users, MessageSquare, CreditCard
} from 'lucide-react';
import PortfolioChart from '@/components/PortfolioChart';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { OnboardingTour } from '@/components/OnboardingTour';

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
                console.log('✅ Trading session linked to user');
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
                console.log('📡 WebSocket connected');
                setWsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'portfolio_update') {
                        setPortfolio(data.data);
                    } else if (data.type === 'price_update') {
                        // Update asset prices
                        setAssets(prev => prev.map(asset => ({
                            ...asset,
                            current_price: data.data[asset.symbol] || asset.current_price
                        })));
                    } else if (data.type === 'trigger_alert') {
                        // Stop-loss or take-profit triggered
                        setTriggerAlert(`${data.trigger_type.toUpperCase()} triggered for ${data.symbol} @ $${data.price.toFixed(2)}`);
                        setTimeout(() => setTriggerAlert(null), 5000);
                        loadPortfolio();
                        loadHistory();
                    }
                } catch (e) {
                    // Handle ping/pong
                    if (event.data === 'ping') {
                        ws.send('pong');
                    }
                }
            };

            ws.onclose = () => {
                console.log('📡 WebSocket disconnected');
                setWsConnected(false);
                // Reconnect after 5 seconds
                setTimeout(connectWebSocket, 5000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            wsRef.current = ws;
        } catch (e) {
            console.error('WebSocket connection failed:', e);
        }
    };

    // Fallback: Auto-refresh every 15 seconds if WebSocket not connected
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

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadAllData();
        setRefreshing(false);
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

    const calculateTradeValue = () => {
        if (!selectedAsset || !quantity) return 0;
        const qty = parseFloat(quantity) || 0;
        const price = orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : selectedAsset.current_price;
        return qty * price;
    };

    const calculateMarginRequired = () => {
        return calculateTradeValue() / leverage;
    };

    const validateTrade = (): string | null => {
        const qty = parseFloat(quantity) || 0;
        if (qty <= 0) return 'Quantity must be greater than 0';

        const margin = calculateMarginRequired();
        if (tradeType === 'buy' && portfolio && margin > portfolio.available_margin) {
            return `Insufficient margin. Required: ${formatCurrency(margin)}, Available: ${formatCurrency(portfolio.available_margin)}`;
        }

        if (tradeType === 'sell' && portfolio) {
            // For paper trading, allowing selling without holdings to enable shorting.
            // The constraint is primarily on margin/balance which is checked below.
            const holding = portfolio.holdings.find(h => h.symbol === selectedAsset?.symbol);
            // No longer returning error if holding is missing or quantity is less than qty
            // because this will initiate a short position.
        }

        if (stopLoss && selectedAsset) {
            const sl = parseFloat(stopLoss);
            if (tradeType === 'buy' && sl >= selectedAsset.current_price) {
                return 'Stop-loss must be below current price for buy orders';
            }
        }

        if (takeProfit && selectedAsset) {
            const tp = parseFloat(takeProfit);
            if (tradeType === 'buy' && tp <= selectedAsset.current_price) {
                return 'Take-profit must be above current price for buy orders';
            }
        }

        return null;
    };

    const handlePreviewTrade = () => {
        const error = validateTrade();
        if (error) {
            setTradeError(error);
            return;
        }
        setTradeError(null);
        setShowConfirmation(true);
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

                // Clear success after 3 seconds
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

    // Auth loading state
    if (isAuthLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-white font-mono animate-pulse">Loading Trading Platform...</div>
            </div>
        );
    }

    // Not authenticated - show login prompt
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-6">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                        <TrendingUp size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">Zenith Paper Trading</h1>
                    <p className="text-gray-400 mb-8">
                        Sign in to start paper trading with $10,000 virtual money.
                        Track your portfolio, compete on the leaderboard, and sharpen your trading skills!
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={() => signIn('google')}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
                            </svg>
                            Sign in with Google
                        </button>

                        <Link
                            href="/"
                            className="block w-full px-6 py-3 text-gray-400 hover:text-white font-medium rounded-xl bg-white/5 hover:bg-white/10 transition-all text-center"
                        >
                            ← Back to Home
                        </Link>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-white/5 rounded-lg">
                            <DollarSign className="mx-auto mb-1 text-emerald-400" size={20} />
                            <div className="text-xs text-gray-400">$10K Virtual</div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                            <Trophy className="mx-auto mb-1 text-yellow-400" size={20} />
                            <div className="text-xs text-gray-400">Leaderboard</div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg">
                            <Shield className="mx-auto mb-1 text-cyan-400" size={20} />
                            <div className="text-xs text-gray-400">Risk Free</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-20 md:pt-24">

            {/* Success Toast */}
            <AnimatePresence>
                {tradeSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
                    >
                        <CheckCircle size={20} />
                        {tradeSuccess}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger Alert Toast */}
            <AnimatePresence>
                {triggerAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-black px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 font-bold"
                    >
                        <Bell size={20} />
                        {triggerAlert}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* WebSocket Status Indicator */}
            <div className="fixed bottom-4 right-4 z-40">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${wsConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    {wsConnected ? 'Live' : 'Offline'}
                </div>
            </div>

            {/* Portfolio Summary Bar */}
            {portfolio && (
                <div className="border-b border-white/10 bg-black/40">
                    <div className="container mx-auto px-4 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Portfolio Value</div>
                                <div className="text-xl font-bold text-white">{formatCurrency(portfolio.portfolio_value)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Available Margin</div>
                                <div className="text-xl font-bold text-emerald-400">{formatCurrency(portfolio.available_margin)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Total P&L</div>
                                <div className={`text-xl font-bold ${portfolio.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {formatCurrency(portfolio.total_pnl)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Win Rate</div>
                                <div className="text-xl font-bold text-white">{portfolio.win_rate.toFixed(1)}%</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Total Trades</div>
                                <div className="text-xl font-bold text-white">{portfolio.total_trades}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs - Mobile Optimized */}
            <div className="container mx-auto px-0 md:px-4 py-4">
                {/* Scrollable tabs wrapper with proper padding */}
                <div className="overflow-x-auto scrollbar-hide -webkit-overflow-scrolling-touch">
                    <div className="flex gap-2 mb-6 px-4 md:px-0 min-w-max">
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
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                                    ? 'bg-white text-black'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <tab.icon size={16} />
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.length > 6 ? tab.label.slice(0, 4) : tab.label}</span>
                            </button>
                        ))}
                        {/* Coach Tab - Links to separate page */}
                        <Link
                            href="/trading/coach"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30"
                        >
                            <GraduationCap size={16} />
                            <span className="hidden sm:inline">Coach</span>
                            <span className="sm:hidden">Coach</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/30 rounded-full">Pro</span>
                        </Link>
                    </div>
                </div>

                {/* Tab content wrapper with proper padding */}
                <div className="px-4 md:px-0">

                    {/* Portfolio Tab */}
                    {activeTab === 'portfolio' && portfolio && (
                        <div className="space-y-6">
                            {/* Portfolio Chart */}
                            {sessionId && (
                                <PortfolioChart
                                    sessionId={sessionId}
                                    currentValue={portfolio.portfolio_value}
                                    totalPnl={portfolio.total_pnl}
                                />
                            )}

                            <div className="glass-panel rounded-xl p-4">
                                <h2 className="text-lg font-bold mb-4">Your Holdings</h2>
                                {portfolio.holdings.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Wallet className="mx-auto mb-4 opacity-50" size={48} />
                                        <p>No holdings yet. Start trading!</p>
                                        <button
                                            onClick={() => setActiveTab('trade')}
                                            className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                        >
                                            Open Trading
                                        </button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-xs text-gray-500 uppercase border-b border-white/10">
                                                    <th className="text-left py-3 px-2">Asset</th>
                                                    <th className="text-right py-3 px-2">Quantity</th>
                                                    <th className="text-right py-3 px-2">Avg Price</th>
                                                    <th className="text-right py-3 px-2">Current</th>
                                                    <th className="text-right py-3 px-2">Value</th>
                                                    <th className="text-right py-3 px-2">P&L</th>
                                                    <th className="text-right py-3 px-2">Leverage</th>
                                                    <th className="text-center py-3 px-2">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {portfolio.holdings.map((holding) => (
                                                    <tr key={holding.symbol} className="border-b border-white/5 hover:bg-white/5">
                                                        <td className="py-3 px-2">
                                                            <div className="font-bold">{holding.symbol}</div>
                                                            <div className="text-xs text-gray-500">{holding.name}</div>
                                                        </td>
                                                        <td className="text-right py-3 px-2 font-mono">{holding.quantity.toFixed(4)}</td>
                                                        <td className="text-right py-3 px-2 font-mono">{formatCurrency(holding.avg_buy_price)}</td>
                                                        <td className="text-right py-3 px-2 font-mono">{formatCurrency(holding.current_price)}</td>
                                                        <td className="text-right py-3 px-2 font-mono font-bold">{formatCurrency(holding.current_value)}</td>
                                                        <td className={`text-right py-3 px-2 font-mono font-bold ${holding.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {formatCurrency(holding.unrealized_pnl)}
                                                        </td>
                                                        <td className="text-right py-3 px-2">
                                                            <span className={`px-2 py-0.5 rounded text-xs ${holding.leverage > 1 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                                {holding.leverage}x
                                                            </span>
                                                        </td>
                                                        <td className="text-center py-3 px-2">
                                                            <button
                                                                onClick={() => {
                                                                    const asset = assets.find(a => a.symbol === holding.symbol);
                                                                    if (asset) openTradeModal(asset, 'sell');
                                                                }}
                                                                className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-sm"
                                                            >
                                                                Sell
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Trade Tab */}
                    {activeTab === 'trade' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {assets.map(asset => (
                                <motion.div
                                    key={asset.symbol}
                                    className="glass-panel rounded-xl p-4 hover:border-white/20 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-bold text-lg">{asset.symbol}</div>
                                            <div className="text-xs text-gray-500">{asset.name}</div>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${asset.asset_type === 'crypto' ? 'bg-purple-500/20 text-purple-400' :
                                            asset.asset_type === 'stock' ? 'bg-blue-500/20 text-blue-400' :
                                                asset.asset_type === 'commodity' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-emerald-500/20 text-emerald-400'
                                            }`}>
                                            {asset.asset_type === 'commodity' && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                                            {asset.asset_type === 'forex' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                                            {asset.asset_type}
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <div className="text-2xl font-bold font-mono">{formatCurrency(asset.current_price)}</div>
                                        <div className={`text-sm flex items-center gap-1 ${asset.price_change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {asset.price_change_24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {formatPercent(asset.price_change_24h)}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openTradeModal(asset, 'buy')}
                                            className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 font-medium transition-colors"
                                        >
                                            Buy
                                        </button>
                                        <button
                                            onClick={() => openTradeModal(asset, 'sell')}
                                            className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 font-medium transition-colors"
                                        >
                                            Sell
                                        </button>
                                    </div>

                                    <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                                        <Shield size={12} />
                                        Max Leverage: {asset.max_leverage}x
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="glass-panel rounded-xl p-4">
                            <h2 className="text-lg font-bold mb-4">Trade History</h2>
                            {tradeHistory.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <History className="mx-auto mb-4 opacity-50" size={48} />
                                    <p>No trades yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-xs text-gray-500 uppercase border-b border-white/10">
                                                <th className="text-left py-3 px-2">Date</th>
                                                <th className="text-left py-3 px-2">Asset</th>
                                                <th className="text-center py-3 px-2">Type</th>
                                                <th className="text-right py-3 px-2">Quantity</th>
                                                <th className="text-right py-3 px-2">Price</th>
                                                <th className="text-right py-3 px-2">Total</th>
                                                <th className="text-right py-3 px-2">P&L</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tradeHistory.map((trade) => (
                                                <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className="py-3 px-2 text-sm text-gray-400">
                                                        {new Date(trade.executed_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-2 font-bold">{trade.symbol}</td>
                                                    <td className="py-3 px-2 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${trade.trade_type === 'buy'
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                            }`}>
                                                            {trade.trade_type.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="text-right py-3 px-2 font-mono">{trade.quantity.toFixed(4)}</td>
                                                    <td className="text-right py-3 px-2 font-mono">{formatCurrency(trade.price_at_execution)}</td>
                                                    <td className="text-right py-3 px-2 font-mono">{formatCurrency(trade.total_value)}</td>
                                                    <td className={`text-right py-3 px-2 font-mono font-bold ${trade.realized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                                                        }`}>
                                                        {trade.realized_pnl !== 0 ? formatCurrency(trade.realized_pnl) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Leaderboard Tab */}
                    {activeTab === 'leaderboard' && (
                        <div className="glass-panel rounded-xl p-4">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Trophy className="text-yellow-400" />
                                Top Traders
                            </h2>
                            {leaderboard.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Trophy className="mx-auto mb-4 opacity-50" size={48} />
                                    <p>No traders yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {leaderboard.map((entry, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center justify-between p-3 rounded-lg ${index === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' :
                                                index === 1 ? 'bg-gray-400/10 border border-gray-400/20' :
                                                    index === 2 ? 'bg-amber-700/10 border border-amber-700/20' :
                                                        'bg-white/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500 text-black' :
                                                    index === 1 ? 'bg-gray-400 text-black' :
                                                        index === 2 ? 'bg-amber-700 text-white' :
                                                            'bg-white/10 text-gray-400'
                                                    }`}>
                                                    {entry.rank}
                                                </div>
                                                <div>
                                                    <div className="font-bold">{entry.display_name}</div>
                                                    <div className="text-xs text-gray-500">{entry.total_trades} trades • {entry.win_rate.toFixed(1)}% win rate</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold font-mono">{formatCurrency(entry.portfolio_value)}</div>
                                                <div className={`text-sm ${entry.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {formatCurrency(entry.total_pnl)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <AnalyticsDashboard sessionId={sessionId || ''} />
                    )}

                    {/* Community Tab */}
                    {activeTab === 'community' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Community Explanation */}
                                <div className="glass-panel rounded-xl p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                            <Users size={24} />
                                        </div>
                                        <h2 className="text-xl font-bold text-white">The Zenith Circle</h2>
                                    </div>
                                    <p className="text-gray-400 mb-6 leading-relaxed">
                                        You're not just trading against a screen; you're part of a global collective of data-driven traders. The Zenith Circle is where alpha is shared, strategies are tested, and legends are born.
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 bg-blue-500/20 p-1.5 rounded">
                                                <TrendingUp size={14} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">Alpha Sharing</div>
                                                <div className="text-xs text-gray-500">Post your winning signals and rationale to the community feed.</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 bg-purple-500/20 p-1.5 rounded">
                                                <Activity size={14} className="text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">Clone Trading</div>
                                                <div className="text-xs text-gray-500">Enable "Shadow Mode" to automatically follow top-performing traders.</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 bg-yellow-500/20 p-1.5 rounded">
                                                <Trophy size={14} className="text-yellow-400" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">Arena Duels</div>
                                                <div className="text-xs text-gray-500">Challenge other traders to 24-hour P&L showdowns for XP and badges.</div>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full mt-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                        Enter the Feed (Coming Soon)
                                    </button>
                                </div>

                                {/* Premium Glimpse (PayPal Paywall) */}
                                <div className="glass-panel rounded-xl p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <CreditCard size={120} className="-rotate-12" />
                                    </div>

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                            <CreditCard size={24} />
                                        </div>
                                        <h2 className="text-xl font-bold text-white">Zenith Pro</h2>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="text-sm text-purple-300 font-bold uppercase tracking-wider">Unleash the full potential</div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={16} className="text-purple-400" />
                                            <span className="text-sm text-gray-300">Unlimited Brutal AI Coach Roasts</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={16} className="text-purple-400" />
                                            <span className="text-sm text-gray-300">Real-time Commodity & Forex Signals</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={16} className="text-purple-400" />
                                            <span className="text-sm text-gray-300">Priority Leaderboard Placement</span>
                                        </div>
                                    </div>

                                    {/* PayPal Glimpse UI */}
                                    <div className="bg-white/5 rounded-xl block p-4 border border-white/10 mb-6">
                                        <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                                            <span>Subscription Plan</span>
                                            <span className="text-white font-bold">$19.99/mo</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1 h-10 bg-[#0070ba] rounded flex items-center justify-center">
                                                <svg className="h-4" viewBox="0 0 100 32" fill="white">
                                                    <path d="M11 25.5l1.6-9.8c.1-.4.4-.7.8-.7h4.8c4.3 0 6.6-2.1 6.1-5.6-.4-2.8-2.6-4.4-5.8-4.4h-6.8c-.8 0-1.4.6-1.5 1.3l-2.6 17.6c-.1.5.3.9.8.9h2.1c.4-.3.5-.8.5-1.3zM25.7 10.4c.4 2.8-1.5 4.7-4.6 4.7h-3l.8-4.7h3c1.7 0 3.1.6 3.8 0z" />
                                                    <path d="M41 25.5l1.6-9.8c.1-.4.4-.7.8-.7h4.8c4.3 0 6.6-2.1 6.1-5.6-.4-2.8-2.6-4.4-5.8-4.4h-6.8c-.8 0-1.4.6-1.5 1.3l-2.6 17.6c-.1.5.3.9.8.9h2.1c.4-.3.5-.8.5-1.3z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 h-10 bg-black border border-white/20 rounded flex items-center justify-center text-[10px] font-bold">
                                                DEBIT/CREDIT
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href="/profile#premium"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
                                    >
                                        Upgrade to Pro
                                    </Link>
                                </div>
                            </div>

                            {/* Community Activity Glimpse */}
                            <div className="glass-panel rounded-xl p-4 border-white/5">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Active Arena Battles</h3>
                                <div className="space-y-4">
                                    {[
                                        { p1: 'WhaleHunter', p2: 'MoonBoy99', asset: 'BTC', time: '12h left', stakes: '500 XP' },
                                        { p1: 'ZenithAlpha', p2: 'GridBot_X', asset: 'GOLD', time: '4h left', stakes: '1200 XP' },
                                    ].map((battle, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="flex -space-x-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold border-2 border-black">{battle.p1[0]}</div>
                                                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold border-2 border-black">{battle.p2[0]}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold">{battle.p1} vs {battle.p2}</div>
                                                    <div className="text-xs text-gray-500">{battle.asset} P&L Duel</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-mono text-emerald-400">{battle.stakes}</div>
                                                <div className="text-[10px] text-gray-600">{battle.time}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>{/* End tab content wrapper */}
            </div>{/* End tabs container */}

            {/* Trade Modal */}
            <AnimatePresence>
                {showTradeModal && selectedAsset && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setShowTradeModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
                            onClick={e => e.stopPropagation()}
                        >
                            {!showConfirmation ? (
                                <>
                                    {/* Trade Form */}
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold">
                                            {tradeType === 'buy' ? '📈 Buy' : '📉 Sell'} {selectedAsset.symbol}
                                        </h2>
                                        <button onClick={() => setShowTradeModal(false)} className="text-gray-500 hover:text-white">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    {/* Current Price */}
                                    <div className="bg-white/5 rounded-lg p-3 mb-4">
                                        <div className="text-xs text-gray-500">Current Price</div>
                                        <div className="text-2xl font-bold font-mono">{formatCurrency(selectedAsset.current_price)}</div>
                                    </div>

                                    {/* Order Type */}
                                    <div className="mb-4">
                                        <label className="text-xs text-gray-500 uppercase tracking-wider">Order Type</label>
                                        <div className="flex gap-2 mt-1">
                                            {['market', 'limit'].map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => setOrderType(type as any)}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${orderType === type
                                                        ? 'bg-white text-black'
                                                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                                        }`}
                                                >
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Limit Price */}
                                    {orderType === 'limit' && (
                                        <div className="mb-4">
                                            <label className="text-xs text-gray-500 uppercase tracking-wider">Limit Price</label>
                                            <input
                                                type="number"
                                                value={limitPrice}
                                                onChange={e => setLimitPrice(e.target.value)}
                                                className="w-full mt-1 p-3 bg-white/5 border border-white/10 rounded-lg text-white font-mono"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    )}

                                    {/* Quantity */}
                                    <div className="mb-4">
                                        <label className="text-xs text-gray-500 uppercase tracking-wider">Quantity</label>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={e => setQuantity(e.target.value)}
                                            className="w-full mt-1 p-3 bg-white/5 border border-white/10 rounded-lg text-white font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {/* Leverage */}
                                    <div className="mb-4">
                                        <label className="text-xs text-gray-500 uppercase tracking-wider flex justify-between">
                                            <span>Leverage</span>
                                            <span className="text-yellow-400">{leverage}x</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max={selectedAsset.max_leverage}
                                            value={leverage}
                                            onChange={e => setLeverage(parseInt(e.target.value))}
                                            className="w-full mt-2"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>1x</span>
                                            <span>{selectedAsset.max_leverage}x</span>
                                        </div>
                                    </div>

                                    {/* Stop Loss & Take Profit */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                                <Target size={12} className="text-red-400" /> Stop Loss
                                            </label>
                                            <input
                                                type="number"
                                                value={stopLoss}
                                                onChange={e => setStopLoss(e.target.value)}
                                                className="w-full mt-1 p-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm"
                                                placeholder="Optional"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                                <Target size={12} className="text-emerald-400" /> Take Profit
                                            </label>
                                            <input
                                                type="number"
                                                value={takeProfit}
                                                onChange={e => setTakeProfit(e.target.value)}
                                                className="w-full mt-1 p-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm"
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>

                                    {/* Trade Summary */}
                                    {parseFloat(quantity) > 0 && (
                                        <div className="bg-white/5 rounded-lg p-3 mb-4 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Total Value</span>
                                                <span className="font-mono font-bold">{formatCurrency(calculateTradeValue())}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Margin Required</span>
                                                <span className="font-mono">{formatCurrency(calculateMarginRequired())}</span>
                                            </div>
                                            {leverage > 1 && (
                                                <div className="flex justify-between text-sm text-yellow-400">
                                                    <span>Leveraged Position</span>
                                                    <span className="font-mono">{formatCurrency(calculateTradeValue())} @ {leverage}x</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Error */}
                                    {tradeError && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm flex items-start gap-2">
                                            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                            {tradeError}
                                        </div>
                                    )}

                                    {/* Preview Button */}
                                    <button
                                        onClick={handlePreviewTrade}
                                        className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${tradeType === 'buy'
                                            ? 'bg-emerald-500 hover:bg-emerald-600'
                                            : 'bg-red-500 hover:bg-red-600'
                                            }`}
                                    >
                                        Preview {tradeType === 'buy' ? 'Buy' : 'Sell'} Order
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Confirmation */}
                                    <div className="text-center mb-6">
                                        <div className="text-4xl mb-2">⚠️</div>
                                        <h2 className="text-xl font-bold">Confirm Your Trade</h2>
                                    </div>

                                    <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Asset</span>
                                            <span className="font-bold">{selectedAsset.symbol}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Type</span>
                                            <span className={`font-bold ${tradeType === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {tradeType.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Quantity</span>
                                            <span className="font-mono">{quantity}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Price</span>
                                            <span className="font-mono">{formatCurrency(selectedAsset.current_price)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Total Value</span>
                                            <span className="font-mono font-bold">{formatCurrency(calculateTradeValue())}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Leverage</span>
                                            <span className={leverage > 1 ? 'text-yellow-400 font-bold' : ''}>{leverage}x</span>
                                        </div>
                                        {stopLoss && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Stop Loss</span>
                                                <span className="text-red-400 font-mono">{formatCurrency(parseFloat(stopLoss))}</span>
                                            </div>
                                        )}
                                        {takeProfit && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Take Profit</span>
                                                <span className="text-emerald-400 font-mono">{formatCurrency(parseFloat(takeProfit))}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6 text-yellow-400 text-sm">
                                        ⚡ This is paper trading. Your P&L will affect your virtual portfolio only.
                                    </div>

                                    {/* Error */}
                                    {tradeError && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm flex items-start gap-2">
                                            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                            {tradeError}
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowConfirmation(false)}
                                            className="flex-1 py-3 bg-white/10 rounded-lg font-medium hover:bg-white/20 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={executeTrade}
                                            disabled={executing}
                                            className={`flex-1 py-3 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2 ${tradeType === 'buy'
                                                ? 'bg-emerald-500 hover:bg-emerald-600'
                                                : 'bg-red-500 hover:bg-red-600'
                                                } ${executing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {executing ? (
                                                <>
                                                    <RefreshCw size={16} className="animate-spin" />
                                                    Executing...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={16} />
                                                    Confirm {tradeType === 'buy' ? 'Buy' : 'Sell'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <OnboardingTour />
        </div>
    );
}
