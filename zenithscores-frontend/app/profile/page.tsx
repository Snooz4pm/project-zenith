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
import PageLoader from '@/components/ui/PageLoader';

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

            // Load trading stats (Real-time from DB)
            const statsRes = await fetch('/api/user/portfolio');
            if (statsRes.ok) {
                const data = await statsRes.json();
                setPortfolioValue(data.balance || 50000);
                setTotalPnL(data.totalPnL || 0);
                setTotalTrades(data.totalTrades || 0);
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

    // Loading state
    if (status === 'loading' || loading) {
        return <PageLoader pageName="Profile" />;
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
        <div className="min-h-screen bg-[var(--void)] text-[var(--text-primary)]">
            <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">

                {/* Profile Header & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    {/* User Info Card */}
                    <div className="lg:col-span-1 glass-panel rounded-2xl p-6 relative overflow-hidden">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                {session.user?.image ? (
                                    <img src={session.user.image} alt={session.user.name || 'User'} className="w-24 h-24 rounded-full border-2 border-[var(--accent-mint)]/30" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] flex items-center justify-center text-3xl font-bold border border-[var(--accent-mint)]/20">
                                        {session.user?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 p-1 bg-[var(--void)] rounded-full border border-[var(--surface-3)]">
                                    <CheckCircle size={14} className="text-[var(--accent-mint)]" />
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>{session.user?.name}</h2>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">{session.user?.email}</p>

                            <div className="flex gap-2 w-full">
                                <Link href={`/user/${session.user?.id}`} className="flex-1 py-2 text-xs font-bold bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] rounded-lg hover:bg-[var(--accent-mint)]/20 transition-colors border border-[var(--accent-mint)]/20 flex items-center justify-center gap-2">
                                    <User size={14} /> Public Profile
                                </Link>
                                <Link href="/profile/settings" className="py-2 px-3 text-xs font-bold bg-[var(--surface-2)] text-[var(--text-secondary)] rounded-lg hover:text-white transition-colors border border-white/5">
                                    <Settings size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Stats & Badges */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 rounded-xl border-l-2 border-l-[var(--accent-mint)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity size={16} className="text-[var(--accent-mint)]" />
                                    <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Portfolio Value</div>
                                </div>
                                <div className="text-2xl font-bold font-mono text-white">{formatCurrency(portfolioValue)}</div>
                                <div className={`text-xs mt-1 ${totalPnL >= 0 ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'}`}>
                                    {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)} P&L
                                </div>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-5 rounded-xl border-l-2 border-l-[var(--accent-cyan)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <BarChart3 size={16} className="text-[var(--accent-cyan)]" />
                                    <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Total Trades</div>
                                </div>
                                <div className="text-2xl font-bold font-mono text-white">{totalTrades}</div>
                                <div className="text-xs text-[var(--text-secondary)] mt-1">across 3 markets</div>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-5 rounded-xl border-l-2 border-l-[var(--accent-gold)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <BookOpen size={16} className="text-[var(--accent-gold)]" />
                                    <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Learning Score</div>
                                </div>
                                <div className="text-2xl font-bold font-mono text-white">{learningProgress}%</div>
                                <div className="text-xs text-[var(--text-secondary)] mt-1">Zenith Academy</div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Additional Content (Notes & Bento) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Notes (Journal) */}
                    <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                                <FileText className="text-[var(--accent-mint)]" size={20} />
                                Trading Journal
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={() => applyTemplate('setup')} className="text-[10px] px-2 py-1 bg-[var(--surface-3)] border border-white/5 rounded hover:border-[var(--accent-mint)]/50 transition-colors">Setup</button>
                                <button onClick={() => applyTemplate('risk')} className="text-[10px] px-2 py-1 bg-[var(--surface-3)] border border-white/5 rounded hover:border-[var(--accent-danger)]/50 transition-colors">Risk</button>
                                <button onClick={() => applyTemplate('lesson')} className="text-[10px] px-2 py-1 bg-[var(--surface-3)] border border-white/5 rounded hover:border-[var(--accent-gold)]/50 transition-colors">Lesson</button>
                            </div>
                        </div>

                        {/* Add Note Input */}
                        <div className="mb-6">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Log your observations..."
                                className="w-full bg-[var(--surface-1)] border border-white/5 rounded-xl p-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-mint)]/50 transition-colors min-h-[100px]"
                            />
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex gap-2">
                                    {['Bullish', 'Bearish', 'Neutral'].map(s => (
                                        <button key={s} onClick={() => setNoteSentiment(s as any)} className={`text-[10px] px-2 py-1 rounded border transition-colors ${noteSentiment === s ? 'bg-[var(--accent-mint)]/10 border-[var(--accent-mint)] text-[var(--accent-mint)]' : 'bg-[var(--surface-1)] border-white/5 text-[var(--text-muted)]'}`}>{s}</button>
                                    ))}
                                </div>
                                <button onClick={addNote} disabled={!newNote.trim() || isSaving} className="px-4 py-2 bg-[var(--accent-mint)] text-black font-bold text-xs rounded-lg hover:bg-[var(--accent-mint)]/90 transition-colors flex items-center gap-2">
                                    <Save size={14} /> Save Entry
                                </button>
                            </div>
                        </div>

                        {/* Notes List */}
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {notes.length === 0 ? (
                                <div className="text-center py-10 text-[var(--text-muted)]">
                                    <p className="text-sm">No journal entries yet.</p>
                                </div>
                            ) : (
                                notes.map((note) => (
                                    <div key={note.id} className="p-4 bg-[var(--surface-1)] rounded-xl border border-white/5 relative group">
                                        <button onClick={() => deleteNote(note.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                                            <X size={14} />
                                        </button>
                                        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{note.content}</p>
                                        <div className="mt-3 flex items-center gap-4 text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                                            <span className="flex items-center gap-1"><Calendar size={10} /> {formatDateTime(note.createdAt.toString())}</span>
                                            {note.asset && <span className="text-[var(--accent-cyan)]">{note.asset}</span>}
                                            {note.sentiment && <span className={note.sentiment === 'Bullish' ? 'text-[var(--accent-mint)]' : note.sentiment === 'Bearish' ? 'text-[var(--accent-danger)]' : 'text-zinc-500'}>{note.sentiment}</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Actions & Connectivity */}
                    <div className="space-y-6">
                        <div className="glass-panel rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                {[
                                    { icon: Zap, label: 'Signals', href: '/signals', color: 'text-[var(--accent-gold)]' },
                                    { icon: Users, label: 'Community', href: '/trading?tab=community', color: 'text-[var(--accent-cyan)]' },
                                    { icon: BookOpen, label: 'Academy', href: '/learning', color: 'text-[var(--accent-mint)]' },
                                    { icon: TrendingUp, label: 'Trading Engine', href: '/trading', color: 'text-emerald-400' },
                                ].map((action) => (
                                    <Link key={action.label} href={action.href} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-white/5 transition-colors group">
                                        <action.icon size={16} className={action.color} />
                                        <span className="text-sm font-medium text-[var(--text-primary)]">{action.label}</span>
                                        <ArrowUpRight size={14} className="ml-auto text-[var(--text-muted)] group-hover:text-white transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Connectivity Widget */}
                        <div className="glass-panel rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Connectivity</h3>
                                {unreadCount > 0 && <span className="px-2 py-0.5 bg-[var(--accent-danger)] text-white text-[10px] font-bold rounded-full">{unreadCount}</span>}
                            </div>

                            <div className="space-y-3">
                                {engagements.length === 0 ? (
                                    <div className="text-center py-6 text-[var(--text-muted)] text-xs">No recent activity</div>
                                ) : (
                                    engagements.slice(0, 3).map(e => (
                                        <div key={e.id} className="flex gap-3 items-start p-2 rounded-lg hover:bg-white/5 transition-colors">
                                            <div className="mt-1 w-2 h-2 rounded-full bg-[var(--accent-mint)]" />
                                            <div>
                                                <p className="text-xs text-[var(--text-secondary)]">
                                                    <span className="text-white font-bold">{e.fromUser}</span> {e.type === 'like' ? 'liked' : 'commented on'} your post.
                                                </p>
                                                <p className="text-[10px] text-[var(--text-muted)] mt-1">{formatTimeAgo(new Date(e.timestamp))}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
