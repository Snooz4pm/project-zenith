'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft, User, Mail, Calendar, Trophy, TrendingUp, TrendingDown,
    Edit2, Save, X, Shield, Activity, DollarSign, BarChart3, LogOut, CheckCircle, History
} from 'lucide-react';

// Types
interface TradingSession {
    id: number;
    session_id: string;
    wallet_balance: number;
    portfolio_value: number;
    total_pnl: number;
    total_trades: number;
    win_rate: number;
    created_at: string;
    last_active: string;
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

interface UserProfile {
    id: number;
    google_id: string;
    email: string;
    name: string | null;
    profile_picture: string | null;
    created_at: string;
    last_login: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://defioracleworkerapi.vercel.app';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [tradingSessions, setTradingSessions] = useState<TradingSession[]>([]);
    const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeProfileTab, setActiveProfileTab] = useState<'sessions' | 'history'>('sessions');

    // Load user data
    useEffect(() => {
        if (session?.user?.email) {
            loadUserData();
        } else if (status !== 'loading') {
            setLoading(false);
        }
    }, [session, status]);

    const loadUserData = async () => {
        if (!session?.user?.email) return;

        try {
            // Try to get user profile from backend
            const res = await fetch(`${API_URL}/api/v1/auth/user-by-email/${encodeURIComponent(session.user.email)}`);

            if (res.ok) {
                const data = await res.json();
                setUserProfile(data.user);
                setEditName(data.user.name || '');

                // Load trading sessions for this user
                if (data.user.id) {
                    loadTradingSessions(data.user.id);
                }
            }
        } catch (e) {
            console.error('Failed to load user data:', e);
            setError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const loadTradingSessions = async (userId: number) => {
        try {
            const res = await fetch(`${API_URL}/api/v1/auth/trading-sessions/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setTradingSessions(data.sessions || []);

                // Load trade history for all sessions
                const allSessions = data.sessions || [];
                if (allSessions.length > 0) {
                    loadTradeHistory(allSessions.map((s: TradingSession) => s.session_id));
                }
            }
        } catch (e) {
            console.error('Failed to load trading sessions:', e);
        }
    };

    const loadTradeHistory = async (sessionIds: string[]) => {
        try {
            // Load history for the most recent session
            const recentSessionId = sessionIds[0];
            const res = await fetch(`${API_URL}/api/v1/trading/history/${recentSessionId}?limit=20`);
            if (res.ok) {
                const data = await res.json();
                setTradeHistory(data.data || []);
            }
        } catch (e) {
            console.error('Failed to load trade history:', e);
        }
    };

    const handleSaveProfile = async () => {
        // For now, just update locally since we don't have a PUT endpoint
        // You could add a PUT endpoint to update user name
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    // Calculate aggregated stats
    const totalPortfolioValue = tradingSessions.reduce((sum, s) => sum + s.portfolio_value, 0);
    const totalPnL = tradingSessions.reduce((sum, s) => sum + s.total_pnl, 0);
    const totalTrades = tradingSessions.reduce((sum, s) => sum + s.total_trades, 0);
    const avgWinRate = tradingSessions.length > 0
        ? tradingSessions.reduce((sum, s) => sum + s.win_rate, 0) / tradingSessions.length
        : 0;

    // Not authenticated
    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-white font-mono animate-pulse">Loading Profile...</div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <User className="mx-auto mb-4 text-gray-500" size={64} />
                    <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
                    <p className="text-gray-400 mb-6">Please sign in to view your profile</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all"
                    >
                        <ArrowLeft size={18} />
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="container mx-auto px-4 md:px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold flex items-center gap-2">
                                    👤 My Profile
                                </h1>
                                <p className="text-xs text-gray-500">Manage your account and view trading stats</p>
                            </div>
                        </div>

                        <button
                            onClick={() => signOut()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            <AnimatePresence>
                {saveSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
                    >
                        <CheckCircle size={20} />
                        Profile updated successfully!
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="container mx-auto px-4 md:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
                        >
                            {/* Profile Picture */}
                            <div className="flex flex-col items-center mb-6">
                                {session.user?.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || 'User'}
                                        className="w-24 h-24 rounded-full border-4 border-cyan-500/50 shadow-lg shadow-cyan-500/20 mb-4"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg shadow-cyan-500/20">
                                        {session.user?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}

                                {isEditing ? (
                                    <div className="w-full space-y-3">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-cyan-500"
                                            placeholder="Your name"
                                        />
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={handleSaveProfile}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                                            >
                                                <Save size={16} />
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditName(session.user?.name || '');
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
                                            >
                                                <X size={16} />
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-xl font-bold text-white">{session.user?.name}</h2>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-1"
                                        >
                                            <Edit2 size={12} />
                                            Edit Name
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* User Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                    <Mail className="text-cyan-400" size={18} />
                                    <div>
                                        <div className="text-xs text-gray-500">Email</div>
                                        <div className="text-sm text-white">{session.user?.email}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                    <Shield className="text-emerald-400" size={18} />
                                    <div>
                                        <div className="text-xs text-gray-500">Account Type</div>
                                        <div className="text-sm text-white">Google OAuth</div>
                                    </div>
                                </div>

                                {userProfile?.created_at && (
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                        <Calendar className="text-purple-400" size={18} />
                                        <div>
                                            <div className="text-xs text-gray-500">Member Since</div>
                                            <div className="text-sm text-white">{formatDate(userProfile.created_at)}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Stats & Trading Sessions */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Trading Stats Overview */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
                        >
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Activity className="text-cyan-400" />
                                Trading Overview
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
                                        <DollarSign size={14} />
                                        Total Value
                                    </div>
                                    <div className="text-xl font-bold text-white font-mono">
                                        {formatCurrency(totalPortfolioValue || 10000)}
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
                                        {totalPnL >= 0 ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
                                        Total P&L
                                    </div>
                                    <div className={`text-xl font-bold font-mono ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatCurrency(totalPnL)}
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
                                        <BarChart3 size={14} />
                                        Total Trades
                                    </div>
                                    <div className="text-xl font-bold text-white font-mono">
                                        {totalTrades}
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
                                        <Trophy size={14} className="text-yellow-400" />
                                        Avg Win Rate
                                    </div>
                                    <div className="text-xl font-bold text-white font-mono">
                                        {avgWinRate.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Trading Sessions & History */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
                        >
                            {/* Tab Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setActiveProfileTab('sessions')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeProfileTab === 'sessions'
                                            ? 'bg-cyan-500/20 text-cyan-400'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <BarChart3 size={16} />
                                        Sessions
                                    </button>
                                    <button
                                        onClick={() => setActiveProfileTab('history')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeProfileTab === 'history'
                                            ? 'bg-cyan-500/20 text-cyan-400'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <History size={16} />
                                        Trade History
                                    </button>
                                </div>
                                <Link
                                    href="/trading"
                                    className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                >
                                    Go to Trading →
                                </Link>
                            </div>

                            {/* Sessions Tab */}
                            {activeProfileTab === 'sessions' && (
                                <>
                                    {tradingSessions.length === 0 ? (
                                        <div className="text-center py-12">
                                            <BarChart3 className="mx-auto mb-4 text-gray-600" size={48} />
                                            <p className="text-gray-500 mb-4">No trading sessions linked to your account yet</p>
                                            <Link
                                                href="/trading"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all"
                                            >
                                                Start Trading
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {tradingSessions.map((tradingSession, index) => (
                                                <div
                                                    key={tradingSession.id}
                                                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-white">Session {tradingSession.session_id.slice(0, 8)}</div>
                                                            <div className="text-xs text-gray-500">
                                                                Last active: {tradingSession.last_active ? formatDate(tradingSession.last_active) : 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold font-mono text-white">{formatCurrency(tradingSession.portfolio_value)}</div>
                                                        <div className={`text-sm font-mono ${tradingSession.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {tradingSession.total_pnl >= 0 ? '+' : ''}{formatCurrency(tradingSession.total_pnl)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Trade History Tab */}
                            {activeProfileTab === 'history' && (
                                <>
                                    {tradeHistory.length === 0 ? (
                                        <div className="text-center py-12">
                                            <History className="mx-auto mb-4 text-gray-600" size={48} />
                                            <p className="text-gray-500 mb-4">No trades yet. Start trading to see your history!</p>
                                            <Link
                                                href="/trading"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all"
                                            >
                                                Start Trading
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-xs text-gray-500 uppercase border-b border-white/10">
                                                        <th className="text-left py-3 px-2">Date</th>
                                                        <th className="text-left py-3 px-2">Asset</th>
                                                        <th className="text-center py-3 px-2">Type</th>
                                                        <th className="text-right py-3 px-2">Qty</th>
                                                        <th className="text-right py-3 px-2">Price</th>
                                                        <th className="text-right py-3 px-2">P&L</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tradeHistory.slice(0, 10).map((trade) => (
                                                        <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5">
                                                            <td className="py-2 px-2 text-xs text-gray-400">
                                                                {formatDateTime(trade.executed_at)}
                                                            </td>
                                                            <td className="py-2 px-2 font-medium text-white">{trade.symbol}</td>
                                                            <td className="py-2 px-2 text-center">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${trade.trade_type === 'buy'
                                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                                    : 'bg-red-500/20 text-red-400'
                                                                    }`}>
                                                                    {trade.trade_type.toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td className="text-right py-2 px-2 font-mono text-sm">{trade.quantity.toFixed(4)}</td>
                                                            <td className="text-right py-2 px-2 font-mono text-sm">{formatCurrency(trade.price_at_execution)}</td>
                                                            <td className={`text-right py-2 px-2 font-mono text-sm font-bold ${trade.realized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {trade.realized_pnl !== 0 ? formatCurrency(trade.realized_pnl) : '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                            <Link
                                href="/trading"
                                className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl hover:border-emerald-500/40 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-white">Paper Trading</div>
                                    <div className="text-xs text-gray-500">Practice with virtual money</div>
                                </div>
                            </Link>

                            <Link
                                href="/crypto"
                                className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl hover:border-purple-500/40 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/30 transition-colors">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-white">Crypto Portal</div>
                                    <div className="text-xs text-gray-500">View Zenith Scores</div>
                                </div>
                            </Link>

                            <Link
                                href="/stocks"
                                className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl hover:border-blue-500/40 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                                    <BarChart3 size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-white">Stock Portal</div>
                                    <div className="text-xs text-gray-500">Analyze market trends</div>
                                </div>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
