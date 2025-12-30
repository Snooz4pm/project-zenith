'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Activity, MessageSquare, BookOpen, Newspaper, FileText, X, ArrowRight, ExternalLink } from 'lucide-react';

type PanelType = 'trades' | 'market' | 'signals' | 'performance' | 'community' | 'learning' | 'news' | 'notes' | null;

interface SlideOutPanelProps {
    isOpen: boolean;
    onClose: () => void;
    panelType: PanelType;
}

export default function SlideOutPanel({ isOpen, onClose, panelType }: SlideOutPanelProps) {
    const router = useRouter();
    const [noteText, setNoteText] = useState('');

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const saveNote = () => {
        if (noteText.trim()) {
            localStorage.setItem('zenith_last_note', noteText);
            localStorage.setItem('zenith_last_note_time', 'Just now');
            setNoteText('');
            onClose();
        }
    };

    const getPanelContent = () => {
        switch (panelType) {
            case 'trades':
                return (
                    <>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Active Trades</h2>
                        </div>
                        <p className="text-zinc-400 text-sm mb-6">Manage your open positions and orders</p>

                        <div className="space-y-4 py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <Activity className="w-8 h-8 text-zinc-600 mx-auto mb-3 opacity-20" />
                            <p className="text-zinc-500 text-xs italic">No active positions detected in current session.</p>
                        </div>


                        <div className="mt-8">
                            <button
                                className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                                onClick={() => router.push('/trading')}
                            >
                                Open Trading Dashboard <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                );

            case 'market':
                return (
                    <>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Market Analysis</h2>
                        </div>
                        <p className="text-zinc-400 text-sm mb-6">Current market regime: <span className="text-green-400">Risk-On</span></p>

                        <div className="space-y-3 py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <TrendingUp className="w-8 h-8 text-zinc-600 mx-auto mb-3 opacity-20" />
                            <p className="text-zinc-500 text-xs italic">Scanning market regimes...</p>
                        </div>

                    </>
                );

            case 'signals':
                return (
                    <>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Trading Signals</h2>
                        </div>
                        <p className="text-zinc-400 text-sm mb-6">3 active high-confidence signals</p>

                        <div className="space-y-4 py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <Activity className="w-8 h-8 text-zinc-600 mx-auto mb-3 opacity-20" />
                            <p className="text-zinc-500 text-xs italic">Awaiting high-confidence signals.</p>
                        </div>


                        <div className="mt-6">
                            <button
                                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                                onClick={() => router.push('/signals')}
                            >
                                View All Signals <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                );

            case 'performance':
                return (
                    <>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Performance</h2>
                        </div>
                        <p className="text-zinc-400 text-sm mb-6">Your trading statistics & analytics</p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="text-xs text-zinc-500 mb-1">Today's P&L</div>
                                <div className="text-lg font-bold text-zinc-600">$0.00</div>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="text-xs text-zinc-500 mb-1">Win Rate</div>
                                <div className="text-lg font-bold text-zinc-600">0%</div>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="text-xs text-zinc-500 mb-1">Streak</div>
                                <div className="text-lg font-bold text-zinc-600">0</div>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="text-xs text-zinc-500 mb-1">Total Trades</div>
                                <div className="text-lg font-bold text-zinc-600">0</div>
                            </div>
                        </div>


                        <button
                            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                            onClick={() => router.push('/trading')}
                        >
                            View Full Analytics <ArrowRight className="w-4 h-4" />
                        </button>
                    </>
                );

            case 'community':
                return (
                    <>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Community</h2>
                        </div>
                        <p className="text-zinc-400 text-sm mb-6 italic">No new social activity.</p>

                        <div className="space-y-3 mb-6">
                            {/* Feed would go here */}
                        </div>


                        <button
                            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                            onClick={() => router.push('/community')}
                        >
                            Open Community Feed <ExternalLink className="w-4 h-4" />
                        </button>
                    </>
                );

            case 'learning':
                return (
                    <>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Learning Progress</h2>
                        </div>
                        <p className="text-zinc-400 text-sm mb-6">Continue your education journey</p>

                        <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 mb-6 font-data text-xs text-zinc-500 italic">
                            Initialize a course to track progress.
                        </div>


                        <button
                            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                            onClick={() => router.push('/learning')}
                        >
                            Continue Learning <ArrowRight className="w-4 h-4" />
                        </button>
                    </>
                );

            case 'news':
                return (
                    <>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                <Newspaper className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Latest News</h2>
                        </div>
                        <p className="text-zinc-400 text-sm mb-6">Top market-moving headlines</p>

                        <div className="space-y-4 mb-6 py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <Newspaper className="w-8 h-8 text-zinc-600 mx-auto mb-3 opacity-20" />
                            <p className="text-zinc-500 text-xs italic">No news in feed.</p>
                        </div>


                        <button
                            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                            onClick={() => router.push('/news')}
                        >
                            Read More News <ExternalLink className="w-4 h-4" />
                        </button>
                    </>
                );

            case 'notes':
                return (
                    <>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Quick Notes</h2>
                        </div>
                        <p className="text-zinc-400 text-sm mb-6">Capture your trading thoughts</p>

                        <textarea
                            className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 resize-none transition-all mb-4"
                            placeholder="Write a quick note here..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            autoFocus
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all"
                                onClick={saveNote}
                            >
                                Save Note
                            </button>
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a12] border-l border-white/10 shadow-2xl z-50 flex flex-col"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        <div className="p-4 flex justify-end">
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 pb-8">
                            {getPanelContent()}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
