'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft, User, Mail, Calendar, Trophy, TrendingUp, TrendingDown,
    Edit2, Save, X, Shield, Activity, DollarSign, BarChart3, LogOut,
    CheckCircle, History, Zap, Bell, Heart, MessageCircle, FileText,
    BookOpen, Settings, Users, ArrowUpRight, Clock, LineChart
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
    id: number;
    content: string;
    sentiment?: string;
    phase?: string;
    asset?: string;
    stressLevel?: number;
    mood?: string;
    snapshotUrl?: string;
    createdAt: Date | string;
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

const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
    const [noteSentiment, setNoteSentiment] = useState<'Bullish' | 'Bearish' | 'Neutral' | null>(null);
    const [notePhase, setNotePhase] = useState<string | null>(null);
    const [noteAsset, setNoteAsset] = useState('');
    const [noteStress, setNoteStress] = useState(3);
    const [noteMood, setNoteMood] = useState('😐');
    const [noteSnapshot, setNoteSnapshot] = useState('');
    const [showAdvancedNotes, setShowAdvancedNotes] = useState(false);

    const [engagements, setEngagements] = useState<CommunityEngagement[]>([]);
    const [portfolioValue, setPortfolioValue] = useState(10000);
    const [totalPnL, setTotalPnL] = useState(0);
    const [totalTrades, setTotalTrades] = useState(0);
    const [learningProgress, setLearningProgress] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

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
            // Load community engagements
            const engagementRes = await fetch('/api/community/my-engagements');
            if (engagementRes.ok) {
                const data = await engagementRes.json();
                setEngagements(data.engagements || []);
            }

            // Load saved notes from Neon DB
            const notesRes = await fetch('/api/notes');
            if (notesRes.ok) {
                const data = await notesRes.json();
                setNotes(data.notes || []);
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

    const addNote = async () => {
        if (!newNote.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newNote,
                    sentiment: noteSentiment,
                    phase: notePhase,
                    asset: noteAsset,
                    stressLevel: noteStress,
                    mood: noteMood,
                    snapshotUrl: noteSnapshot
                })
            });

            if (res.ok) {
                const data = await res.json();
                setNotes([data.note, ...notes]);
                setNewNote('');
                setNoteSentiment(null);
                setNotePhase(null);
                setNoteAsset('');
                setNoteStress(3);
                setNoteMood('😐');
                setNoteSnapshot('');
                setShowAdvancedNotes(false);
            }
        } catch (e) {
            console.error('Failed to add note:', e);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteNote = async (id: number) => {
        try {
            const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setNotes(notes.filter(n => n.id !== id));
            }
        } catch (e) {
            console.error('Failed to delete note:', e);
        }
    };

    const applyTemplate = (type: 'setup' | 'risk' | 'lesson') => {
        let template = '';
        if (type === 'setup') template = "I'm entering because: \n- Setup: \n- Target: \n- Conviction: ";
        if (type === 'risk') template = "My stop loss is at X because: \n- Risk Amount: \n- Invalidated if: ";
        if (type === 'lesson') template = "I messed up today by: \n- Mistake: \n- What I'll do next time: ";

        setNewNote(template + "\n" + newNote);
        setShowAdvancedNotes(true);
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
                        className="md:col-span-2 lg:col-span-2 md:row-span-3 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-xl flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <FileText className="text-amber-400" size={20} />
                                Trading Journal
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{notes.length} entries</span>
                            </div>
                        </div>

                        {/* Templates */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            <button onClick={() => applyTemplate('setup')} className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors flex items-center gap-1.5">
                                <Zap size={12} className="text-yellow-400" /> The Setup
                            </button>
                            <button onClick={() => applyTemplate('risk')} className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors flex items-center gap-1.5">
                                <Shield size={12} className="text-red-400" /> The Risk
                            </button>
                            <button onClick={() => applyTemplate('lesson')} className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors flex items-center gap-1.5">
                                <Trophy size={12} className="text-emerald-400" /> The Lesson
                            </button>
                        </div>

                        {/* Add Note */}
                        <div className="bg-black/20 border border-white/5 rounded-xl p-4 mb-4">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="What's your market observation today?"
                                className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:outline-none focus:ring-0 resize-none mb-2"
                                rows={3}
                            />

                            <AnimatePresence>
                                {showAdvancedNotes && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden border-t border-white/5 pt-4 mt-2 space-y-4"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block">Sentiment</label>
                                                <div className="flex gap-2">
                                                    {['Bullish', 'Bearish', 'Neutral'].map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => setNoteSentiment(s as any)}
                                                            className={`text-[10px] px-2 py-1 rounded border transition-all ${noteSentiment === s ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400'}`}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block">Trade Phase</label>
                                                <select
                                                    value={notePhase || ''}
                                                    onChange={e => setNotePhase(e.target.value)}
                                                    className="w-full text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-cyan-500"
                                                >
                                                    <option value="" disabled>Select Phase</option>
                                                    <option value="Pre-market">Pre-market</option>
                                                    <option value="Entry">Entry</option>
                                                    <option value="Management">Management</option>
                                                    <option value="Post-Mortem">Post-Mortem</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block">Asset Link</label>
                                                <input
                                                    type="text"
                                                    value={noteAsset}
                                                    onChange={e => setNoteAsset(e.target.value)}
                                                    placeholder="$BTC, $AAPL..."
                                                    className="w-full text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-white placeholder-gray-600 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block">Psychology / Mood</label>
                                                <div className="flex gap-1">
                                                    {['🎯', '😐', '😤', '😨', '🚀'].map(m => (
                                                        <button
                                                            key={m}
                                                            onClick={() => setNoteMood(m)}
                                                            className={`p-1 rounded transition-all ${noteMood === m ? 'bg-white/10 scale-110' : 'opacity-40 hover:opacity-100'}`}
                                                        >
                                                            {m}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] uppercase text-gray-500 font-bold">Stress Meter</label>
                                                <span className="text-[10px] text-cyan-400 font-mono">Level {noteStress}</span>
                                            </div>
                                            <input
                                                type="range" min="1" max="5" step="1"
                                                value={noteStress}
                                                onChange={e => setNoteStress(parseInt(e.target.value))}
                                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-3">
                                <button
                                    onClick={() => setShowAdvancedNotes(!showAdvancedNotes)}
                                    className="text-[10px] text-gray-500 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                                >
                                    <Settings size={12} />
                                    {showAdvancedNotes ? 'Hide Details' : 'Advanced Tracking'}
                                </button>
                                <button
                                    onClick={addNote}
                                    disabled={!newNote.trim() || isSaving}
                                    className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Activity className="animate-spin" size={12} /> : <Save size={12} />}
                                    Save Note
                                </button>
                            </div>
                        </div>

                        {/* Notes List */}
                        <div className="space-y-3 overflow-y-auto pr-2 flex-1 scrollbar-hide" style={{ maxHeight: '420px' }}>
                            {notes.length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                    <BookOpen className="mx-auto mb-3 text-gray-600" size={40} />
                                    <p className="text-gray-400 text-sm font-medium">Your journal is empty</p>
                                    <p className="text-gray-500 text-xs mt-1">Institutional traders keep meticulous notes.</p>
                                </div>
                            ) : (
                                notes.map((note) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={note.id}
                                        className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group relative"
                                    >
                                        <button
                                            onClick={() => deleteNote(note.id)}
                                            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all"
                                        >
                                            <X size={12} />
                                        </button>

                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {note.mood && (
                                                <span className="px-2 py-0.5 bg-white/5 rounded text-xs">{note.mood}</span>
                                            )}
                                            {note.sentiment && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${note.sentiment === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    note.sentiment === 'Bearish' ? 'bg-red-500/10 text-red-400' :
                                                        'bg-white/10 text-gray-400'
                                                    }`}>
                                                    {note.sentiment}
                                                </span>
                                            )}
                                            {note.asset && (
                                                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-[10px] font-mono">
                                                    {note.asset.startsWith('$') ? note.asset : `$${note.asset}`}
                                                </span>
                                            )}
                                            {note.phase && (
                                                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[10px]">
                                                    {note.phase}
                                                </span>
                                            )}
                                            {note.stressLevel && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] ${note.stressLevel > 3 ? 'bg-orange-500/10 text-orange-400' : 'bg-white/5 text-gray-500'
                                                    }`}>
                                                    Stress: {note.stressLevel}/5
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{note.content}</p>

                                        <div className="flex items-center justify-between mt-4 text-[10px] text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={10} />
                                                {formatDateTime(note.createdAt.toString())}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Zap size={10} className="text-amber-500/50" />
                                                Zenith Persistence
                                            </div>
                                        </div>
                                    </motion.div>
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
