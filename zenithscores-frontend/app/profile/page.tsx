'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft, User, Mail, Calendar, Trophy, TrendingUp, TrendingDown,
    Edit2, Save, X, Shield, Activity, DollarSign, BarChart3, LogOut,
    CheckCircle, History, Zap, Bell, Heart, MessageCircle, FileText,
    BookOpen, Settings, Users
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';

// Types
interface CommunityEngagement {
    id: string;
    type: 'like' | 'comment';
    postTitle: string;
    fromUser: string;
    timestamp: Date;
    read: boolean;
}

interface Note {
    id: string;
    content: string;
    createdAt: Date;
    symbol?: string;
}

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

const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
};

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [engagements, setEngagements] = useState<CommunityEngagement[]>([]);
    const [portfolioValue, setPortfolioValue] = useState(10000);
    const [totalPnL, setTotalPnL] = useState(0);
    const [totalTrades, setTotalTrades] = useState(0);
    const [learningProgress, setLearningProgress] = useState(0);

    // Load data
    useEffect(() => {
        if (session?.user?.email) {
            loadProfileData();
        } else if (status !== 'loading') {
            setLoading(false);
        }
    }, [session, status]);

    const loadProfileData = async () => {
        try {
            // Load community engagements (likes/comments on my posts)
            const engagementRes = await fetch('/api/community/my-engagements');
            if (engagementRes.ok) {
                const data = await engagementRes.json();
                setEngagements(data.engagements || []);
            }

            // Load saved notes from localStorage
            const savedNotes = localStorage.getItem('zenith_notes');
            if (savedNotes) {
                setNotes(JSON.parse(savedNotes));
            }

            // Load trading stats
            const sessionId = localStorage.getItem('trading_session_id');
            if (sessionId) {
                const statsRes = await fetch(`${API_URL}/api/v1/trading/portfolio/${sessionId}`);
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setPortfolioValue(data.portfolio_value || 10000);
                    setTotalPnL(data.total_pnl || 0);
                    setTotalTrades(data.total_trades || 0);
                }
            }

            // Load learning progress
            const pathScores = localStorage.getItem('zenith_path_scores');
            if (pathScores) {
                const scores = JSON.parse(pathScores);
                const avgProgress = Object.values(scores).reduce((a: number, b: any) => a + (b.score || 0), 0) / Object.keys(scores).length;
                setLearningProgress(Math.round(avgProgress));
            }
        } catch (e) {
            console.error('Failed to load profile data:', e);
        } finally {
            setLoading(false);
        }
    };

    const addNote = () => {
        if (!newNote.trim()) return;
        const note: Note = {
            id: Date.now().toString(),
            content: newNote,
            createdAt: new Date(),
        };
        const updatedNotes = [note, ...notes];
        setNotes(updatedNotes);
        localStorage.setItem('zenith_notes', JSON.stringify(updatedNotes));
        setNewNote('');
    };

    const deleteNote = (id: string) => {
        const updatedNotes = notes.filter(n => n.id !== id);
        setNotes(updatedNotes);
        localStorage.setItem('zenith_notes', JSON.stringify(updatedNotes));
    };

    // Not authenticated
    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-2xl font-bold text-white/50 animate-pulse">Loading Profile...</div>
                </div>
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

    const unreadCount = engagements.filter(e => !e.read).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
            <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">

                    {/* Profile Card - Large */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:col-span-1 md:row-span-2 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
                    >
                        <div className="flex flex-col items-center h-full">
                            {/* Profile Picture */}
                            {session.user?.image ? (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name || 'User'}
                                    className="w-20 h-20 rounded-full border-4 border-cyan-500/50 shadow-lg shadow-cyan-500/20 mb-4"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white mb-4 shadow-lg shadow-cyan-500/20">
                                    {session.user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                            )}

                            <h2 className="text-xl font-bold text-white mb-1">{session.user?.name}</h2>
                            <p className="text-sm text-gray-400 mb-4">{session.user?.email}</p>

                            <div className="w-full space-y-3 mt-auto">
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                    <Shield className="text-emerald-400" size={16} />
                                    <span className="text-sm text-gray-300">Google Account</span>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                                >
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Portfolio Value */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-500/20 rounded-2xl p-5 backdrop-blur-xl"
                    >
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Portfolio Value</div>
                        <div className="text-2xl font-bold font-mono text-white">{formatCurrency(portfolioValue)}</div>
                        <div className={`text-sm ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)} P&L
                        </div>
                    </motion.div>

                    {/* Total Trades */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-xl"
                    >
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Trades</div>
                        <div className="text-2xl font-bold font-mono text-white">{totalTrades}</div>
                        <Link href="/trading" className="text-sm text-purple-400 hover:text-purple-300">
                            View History →
                        </Link>
                    </motion.div>

                    {/* Learning Progress */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/20 rounded-2xl p-5 backdrop-blur-xl"
                    >
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Learning Progress</div>
                        <div className="text-2xl font-bold font-mono text-white">{learningProgress}%</div>
                        <Link href="/learning" className="text-sm text-emerald-400 hover:text-emerald-300">
                            Continue Learning →
                        </Link>
                    </motion.div>

                    {/* Community Engagement / Connectivity */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="md:col-span-2 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Bell className="text-cyan-400" size={20} />
                                Connectivity
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </h3>
                            <span className="text-xs text-gray-500">Community engagement</span>
                        </div>

                        {engagements.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="mx-auto mb-2 text-gray-600" size={32} />
                                <p className="text-gray-500 text-sm">No notifications yet</p>
                                <p className="text-gray-600 text-xs">Likes and comments on your posts will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {engagements.slice(0, 5).map((engagement) => (
                                    <div
                                        key={engagement.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg ${engagement.read ? 'bg-white/5' : 'bg-cyan-500/10 border border-cyan-500/20'}`}
                                    >
                                        {engagement.type === 'like' ? (
                                            <Heart className="text-red-400" size={16} />
                                        ) : (
                                            <MessageCircle className="text-cyan-400" size={16} />
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm text-white">
                                                <span className="font-medium">{engagement.fromUser}</span>
                                                {engagement.type === 'like' ? ' liked ' : ' commented on '}
                                                <span className="text-cyan-400">"{engagement.postTitle}"</span>
                                            </p>
                                            <p className="text-xs text-gray-500">{formatTimeAgo(new Date(engagement.timestamp))}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Notes Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="md:col-span-2 lg:col-span-2 md:row-span-2 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <FileText className="text-amber-400" size={20} />
                                Trading Notes
                            </h3>
                            <span className="text-xs text-gray-500">{notes.length} notes</span>
                        </div>

                        {/* Add Note */}
                        <div className="flex gap-2 mb-4">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Write a trading note, market observation, or reminder..."
                                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
                                rows={2}
                            />
                            <button
                                onClick={addNote}
                                disabled={!newNote.trim()}
                                className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={18} />
                            </button>
                        </div>

                        {/* Notes List */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {notes.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="mx-auto mb-2 text-gray-600" size={32} />
                                    <p className="text-gray-500 text-sm">No notes yet</p>
                                    <p className="text-gray-600 text-xs">Start taking notes about your trades and observations</p>
                                </div>
                            ) : (
                                notes.map((note) => (
                                    <div key={note.id} className="p-3 bg-white/5 rounded-lg group">
                                        <div className="flex items-start justify-between">
                                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{note.content}</p>
                                            <button
                                                onClick={() => deleteNote(note.id)}
                                                className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-gray-500 hover:text-red-400 transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">
                                            {formatTimeAgo(new Date(note.createdAt))}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-xl"
                    >
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Quick Actions</div>
                        <div className="space-y-2">
                            <Link href="/signals" className="flex items-center gap-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-sm">
                                <Zap className="text-yellow-400" size={16} />
                                View Signals
                            </Link>
                            <Link href="/trading?tab=community" className="flex items-center gap-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-sm">
                                <Users className="text-cyan-400" size={16} />
                                Community
                            </Link>
                            <Link href="/learning" className="flex items-center gap-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-sm">
                                <BookOpen className="text-emerald-400" size={16} />
                                Learning
                            </Link>
                        </div>
                    </motion.div>

                    {/* Zenith Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 border border-emerald-500/20 rounded-2xl p-5 backdrop-blur-xl"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
                            <span className="text-sm text-emerald-400 font-medium">Zenith Active</span>
                        </div>
                        <p className="text-xs text-gray-500">
                            Scoring engine connected. Real-time market intelligence active.
                        </p>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
