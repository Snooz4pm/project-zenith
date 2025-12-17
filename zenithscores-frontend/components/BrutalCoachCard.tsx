'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, AlertTriangle, TrendingUp, TrendingDown, Flame,
    Award, Clock, RefreshCw, ChevronDown, Zap, Shield
} from 'lucide-react';
import { isPremiumUser } from '@/lib/premium';
import {
    generateCoachResponse, calculateDisciplineScore,
    type TradeAnalysis, type CoachResponse, type DisciplineScore, type MistakeType
} from '@/lib/brutal-coach';

interface BrutalCoachCardProps {
    trade?: TradeAnalysis;
    recentTrades?: { symbol: string; pnl: number; timestamp: Date }[];
}

const GRADE_COLORS = {
    'S': 'from-yellow-400 to-orange-400',
    'A': 'from-green-400 to-emerald-400',
    'B': 'from-blue-400 to-cyan-400',
    'C': 'from-yellow-500 to-amber-500',
    'D': 'from-orange-500 to-red-500',
    'F': 'from-red-500 to-red-700',
};

const VERDICT_STYLES = {
    win: { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: TrendingUp, color: 'text-green-400' },
    loss: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: TrendingDown, color: 'text-red-400' },
    breakeven: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: RefreshCw, color: 'text-yellow-400' },
};

export default function BrutalCoachCard({ trade, recentTrades = [] }: BrutalCoachCardProps) {
    const [premium, setPremium] = useState(false);
    const [response, setResponse] = useState<CoachResponse | null>(null);
    const [discipline, setDiscipline] = useState<DisciplineScore | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        setPremium(isPremiumUser());

        async function fetchRoast() {
            if (!trade) {
                // Default demo response
                const demoTrade: TradeAnalysis = {
                    tradeId: 'demo_1',
                    symbol: 'BTC',
                    direction: 'long',
                    entryPrice: 94500,
                    exitPrice: 95200,
                    pnlPercent: 0.74,
                    holdDuration: 45,
                    leverage: 2,
                    wasStop: false,
                    wasTP: true,
                };
                setResponse(generateCoachResponse(demoTrade, []));
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const sessionId = localStorage.getItem('zenith_session_id') || 'demo-user';

                const res = await fetch(`${apiUrl}/api/v1/trading/roast`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...trade,
                        session_id: sessionId
                    })
                });

                const data = await res.json();
                if (data.status === 'success') {
                    setResponse(data.data);
                } else if (data.status === 'locked') {
                    // Premium gating on backend
                    setResponse({
                        verdict: 'loss',
                        grade: 'F',
                        roast: data.soft_roast,
                        lesson: data.message,
                        xpEarned: 0
                    });
                } else {
                    // Fallback to local logic
                    setResponse(generateCoachResponse(trade, recentTrades));
                }
            } catch (e) {
                console.error("Coach API error:", e);
                setResponse(generateCoachResponse(trade, recentTrades));
            }
        }

        fetchRoast();

        // Calculate discipline score
        const mockMistakes = [
            { mistake: 'none' as MistakeType, timestamp: new Date() },
            { mistake: 'none' as MistakeType, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            { mistake: 'paper_hands' as MistakeType, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        ];
        setDiscipline(calculateDisciplineScore(mockMistakes));
    }, [trade, recentTrades, isPremiumUser()]);

    if (!premium) {
        return (
            <div className="relative rounded-2xl border border-white/10 bg-[#1a1a2e]/80 p-5 backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 backdrop-blur-sm bg-black/40 z-10 flex flex-col items-center justify-center">
                    <Bot className="w-8 h-8 text-red-400 mb-2" />
                    <p className="text-sm text-white font-bold">Brutal AI Coach</p>
                    <p className="text-[10px] text-gray-400">Get real feedback on your trades</p>
                </div>
                <div className="blur-sm opacity-40">
                    <div className="h-24 bg-white/5 rounded-xl mb-3" />
                    <div className="h-16 bg-white/5 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!response) return null;

    const verdictStyle = VERDICT_STYLES[response.verdict];
    const VerdictIcon = verdictStyle.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border ${verdictStyle.border} ${verdictStyle.bg} p-5`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white flex items-center gap-2">
                            Brutal Coach
                            <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">Live</span>
                        </h3>
                        <p className="text-xs text-gray-400">Trade Analysis</p>
                    </div>
                </div>

                {/* Grade */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${GRADE_COLORS[response.grade]} flex items-center justify-center`}>
                    <span className="text-2xl font-bold text-white">{response.grade}</span>
                </div>
            </div>

            {/* Verdict Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${verdictStyle.bg} border ${verdictStyle.border} mb-4`}>
                <VerdictIcon size={14} className={verdictStyle.color} />
                <span className={`font-bold uppercase text-sm ${verdictStyle.color}`}>
                    {response.verdict}
                </span>
                {response.xpEarned > 0 && (
                    <span className="text-xs text-cyan-400">+{response.xpEarned} XP</span>
                )}
            </div>

            {/* The Roast */}
            <div className="mb-4 p-4 rounded-xl bg-black/20">
                <p className="text-white text-sm leading-relaxed">
                    "{response.roast}"
                </p>
            </div>

            {/* The Lesson */}
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
                <p className="text-xs text-yellow-400 flex items-center gap-1 mb-1">
                    <Zap size={12} />
                    LESSON
                </p>
                <p className="text-sm text-yellow-200">{response.lesson}</p>
            </div>

            {/* Cooldown Warning */}
            {response.cooldownMinutes && (
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 mb-4"
                >
                    <p className="text-sm text-red-400 flex items-center gap-2">
                        <AlertTriangle size={14} />
                        <span>Arena cooldown: {response.cooldownMinutes} minutes</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Take a break. The market will wait.
                    </p>
                </motion.div>
            )}

            {/* Mistake Badge */}
            {response.mistakeType && response.mistakeType !== 'none' && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 mb-4">
                    <AlertTriangle size={12} className="text-orange-400" />
                    <span className="text-xs text-orange-400 uppercase">{response.mistakeType.replace('_', ' ')}</span>
                </div>
            )}

            {/* Badge Earned */}
            {response.badge && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Award size={12} className="text-purple-400" />
                    <span className="text-xs text-purple-400">Badge: {response.badge}</span>
                </div>
            )}

            {/* Discipline Score (Expandable) */}
            {discipline && (
                <>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <Shield size={14} />
                        Discipline Score
                        <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 rounded-xl bg-white/5 mt-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-gray-400">Discipline Score</span>
                                        <span className={`text-xl font-bold ${discipline.score >= 80 ? 'text-green-400' :
                                            discipline.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                                            }`}>{discipline.score}%</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="text-center p-2 rounded-lg bg-black/20">
                                            <p className="text-lg font-bold text-orange-400">{discipline.streak}</p>
                                            <p className="text-[10px] text-gray-500">Day Streak</p>
                                        </div>
                                        <div className="text-center p-2 rounded-lg bg-black/20">
                                            <p className="text-lg font-bold text-white">{discipline.totalRoasts}</p>
                                            <p className="text-[10px] text-gray-500">Total Roasts</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 text-center">
                                        <span className="text-sm">{discipline.badge}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </motion.div>
    );
}
