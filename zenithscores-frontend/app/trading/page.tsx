'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft, TrendingUp, TrendingDown, Wallet, BarChart3,
    Trophy, History, AlertTriangle, CheckCircle, X, RefreshCw,
    DollarSign, Percent, Target, Shield, Activity, Bell
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://defioracleworkerapi.vercel.app';

export default function TradingPage() {
    // Session
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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
    const [activeTab, setActiveTab] = useState<'portfolio' | 'trade' | 'history' | 'leaderboard' | 'analytics'>('portfolio');

    // WebSocket connections
    const wsRef = useRef<WebSocket | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [triggerAlert, setTriggerAlert] = useState<string | null>(null);

    // Initialize session
    useEffect(() => {
        const stored = localStorage.getItem('trading_session_id');
        if (stored) {
            setSessionId(stored);
        } else {
            registerSession();
        }
    }, []);

    // Load data when session is ready
    useEffect(() => {
        if (sessionId) {
            loadAllData();
            connectWebSocket();
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [sessionId]);

    // WebSocket connection for real-time updates
    const connectWebSocket = () => {
        if (!sessionId) return;

        const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
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
            const holding = portfolio.holdings.find(h => h.symbol === selectedAsset?.symbol);
            if (!holding || holding.quantity < qty) {
                return `Insufficient holdings. You have ${holding?.quantity || 0} ${selectedAsset?.symbol}`;
            }
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

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white font-mono animate-pulse">Loading Trading Platform...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="container mx-auto px-4 md:px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold flex items-center gap-2">
                                    📈 Zenith Paper Trading
                                    <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">DEMO</span>
                                </h1>
                                <p className="text-xs text-gray-500">Session: {sessionId}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

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

            {/* Tabs */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { id: 'portfolio', label: 'Portfolio', icon: Wallet },
                        { id: 'trade', label: 'Trade', icon: BarChart3 },
                        { id: 'history', label: 'History', icon: History },
                        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
                        { id: 'analytics', label: 'Analytics', icon: Activity },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-white text-black'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

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
                                    <span className={`text-xs px-2 py-0.5 rounded ${asset.asset_type === 'crypto' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                        }`}>
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
            </div>

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
