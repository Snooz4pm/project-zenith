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

                        <div className="space-y-4">
                            {/* Placeholder for active trades list */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">₿</div>
                                        <span className="font-bold text-white">BTC/USD</span>
                                    </div>
                                    <span className="text-green-400 font-medium">+12.5%</span>
                                </div>
                                <div className="flex justify-between text-xs text-zinc-500">
                                    <span>Long • 5x Leverage</span>
                                    <span>PNL: +$1,240</span>
                                </div>
                            </div>
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

                        <div className="space-y-3">
                            {[
                                { label: 'BTC Trend', value: 'Bullish', valueColor: 'text-green-400', icon: '↑' },
                                { label: 'Tech Sector', value: 'Strong', valueColor: 'text-green-400', icon: '📈' },
                                { label: 'USD Index', value: 'Stable', valueColor: 'text-zinc-300', icon: '-' },
                                { label: 'VIX', value: 'Low (14.2)', valueColor: 'text-red-400', icon: '↓' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                    <span className="text-zinc-400 text-sm">{item.label}</span>
                                    <span className={`font-medium text-sm flex items-center gap-2 ${item.valueColor}`}>
                                        {item.icon} {item.value}
                                    </span>
                                </div>
                            ))}
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

                        <div className="space-y-4">
                            {/* Placeholder Mock Signal */}
                            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/20">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white">ETH Breakout</h4>
                                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded">92% Conf</span>
                                </div>
                                <p className="text-zinc-400 text-xs mb-3">Ethereum showing strong momentum above $3,400 resistance.</p>
                                <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors">
                                    View Details
                                </button>
                            </div>
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
                                <div className="text-lg font-bold text-green-400">+$1,247</div>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="text-xs text-zinc-500 mb-1">Win Rate</div>
                                <div className="text-lg font-bold text-white">72%</div>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="text-xs text-zinc-500 mb-1">Streak</div>
                                <div className="text-lg font-bold text-orange-400">🔥 5</div>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="text-xs text-zinc-500 mb-1">Total Trades</div>
                                <div className="text-lg font-bold text-white">142</div>
                            </div>
                        </div>

                        <button
                            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                            onClick={() => router.push('/trading?tab=analytics')}
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
                        <p className="text-zinc-400 text-sm mb-6">3 new notifications</p>

                        <div className="space-y-3 mb-6">
                            {[
                                { icon: '💬', text: '@trader_joe mentioned you: "Nice analysis!"', time: '2m ago' },
                                { icon: '❤️', text: '2 people liked your trade share', time: '15m ago' },
                                { icon: '👤', text: 'New follower: @crypto_whale', time: '1h ago' },
                            ].map((notif, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm">{notif.icon}</div>
                                    <div>
                                        <p className="text-sm text-zinc-300 leading-snug">{notif.text}</p>
                                        <span className="text-xs text-zinc-600">{notif.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                            onClick={() => router.push('/trading?tab=community')}
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

                        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 mb-6">
                            <h3 className="font-bold text-white mb-3">Risk Management Fundamentals</h3>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                                <div className="h-full bg-cyan-400 w-[40%]" />
                            </div>
                            <div className="flex justify-between text-xs text-zinc-400">
                                <span>40% Complete</span>
                                <span>3 lessons remaining</span>
                            </div>
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

                        <div className="space-y-4 mb-6">
                            {[
                                { tag: 'MACRO', title: 'Fed signals potential rate pause amid inflation concerns', color: 'text-blue-400 bg-blue-500/10' },
                                { tag: 'CRYPTO', title: 'BTC ETF sees $500M inflow as institutional interest grows', color: 'text-orange-400 bg-orange-500/10' },
                                { tag: 'EARNINGS', title: 'NVDA beats estimates, guidance drives after-hours surge', color: 'text-green-400 bg-green-500/10' },
                            ].map((item, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.color} mb-1 inline-block`}>
                                        {item.tag}
                                    </span>
                                    <h4 className="text-sm text-zinc-200 group-hover:text-white transition-colors">{item.title}</h4>
                                </div>
                            ))}
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
