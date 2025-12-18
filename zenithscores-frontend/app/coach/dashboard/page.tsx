'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
    ArrowLeft, Brain, Zap, Target, TrendingUp, Award, Lock,
    ChevronRight, AlertTriangle, CheckCircle, XCircle, Flame,
    Crown, Infinity as InfinityIcon, BarChart2, Shield, Clock, Star
} from 'lucide-react';
import {
    getRankFromXp, getRankColor, getNextRank, RANKS,
    type UserCoachStats, type CoachMemoryItem
} from '@/lib/coach-engine';

// ===== QUOTA DISPLAY COMPONENT =====
function QuotaCard({ used, total, isPremium }: { used: number; total: number; isPremium: boolean }) {
    const remaining = total - used;
    const percentage = (used / total) * 100;

    if (isPremium) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-xl p-5"
            >
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Crown className="text-yellow-400" size={20} />
                        Unlimited Coaching
                    </h3>
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">
                        PREMIUM
                    </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        className="text-4xl text-yellow-400"
                    >
                        <InfinityIcon size={48} />
                    </motion.div>
                    <div>
                        <p className="text-white font-medium">Unlimited trade analysis today.</p>
                        <p className="text-yellow-400/80 text-sm">Exploit the edge.</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-5"
        >
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Flame className="text-orange-400" size={20} />
                Coaching Usage
            </h3>

            {/* Dot System */}
            <div className="flex gap-2 mb-3">
                {Array.from({ length: total }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`w-4 h-4 rounded-full ${i < used
                            ? 'bg-gradient-to-br from-cyan-400 to-blue-500'
                            : 'bg-white/10 border border-white/20'
                            }`}
                    />
                ))}
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-black/40 rounded-full overflow-hidden mb-3">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full rounded-full ${remaining <= 1 ? 'bg-red-500' :
                        remaining <= 2 ? 'bg-yellow-500' :
                            'bg-gradient-to-r from-cyan-500 to-blue-500'
                        }`}
                />
            </div>

            <p className="text-gray-300 mb-4">
                You've used <span className="text-white font-bold">{used} of {total}</span> AI trade reviews today.
            </p>

            {remaining === 0 ? (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                    <p className="text-red-400 text-sm font-medium">
                        Daily AI limit reached. Upgrade to continue receiving feedback.
                    </p>
                </div>
            ) : null}

            <Link
                href="/profile#premium"
                className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
                <Lock size={16} />
                Unlock Unlimited Coaching
            </Link>

            <p className="text-center text-gray-500 text-xs mt-3">
                Serious traders don't ration feedback.
            </p>
        </motion.div>
    );
}

// ===== COACH MEMORY COMPONENT =====
function CoachMemoryCard({ memories }: { memories: CoachMemoryItem[] }) {
    if (memories.length === 0) {
        return (
            <div className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <Brain className="text-purple-400" size={20} />
                    Coach Memory
                </h3>
                <p className="text-gray-500 text-sm italic">
                    The coach will remember your patterns after you trade.
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-5"
        >
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Brain className="text-purple-400" size={20} />
                Coach Memory
            </h3>

            <div className="space-y-2">
                {memories.slice(0, 4).map((memory, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                        {memory.type === 'warning' && (
                            <XCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                        )}
                        {memory.type === 'praise' && (
                            <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                        )}
                        {memory.type === 'pattern' && (
                            <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-gray-300">{memory.message}</span>
                    </div>
                ))}
            </div>

            <p className="text-gray-500 text-xs mt-4 italic">
                The coach adapts to your behavior over time.
            </p>
        </motion.div>
    );
}

// ===== DISCIPLINE STREAK COMPONENT =====
function DisciplineStreakCard({ current, best }: { current: number; best: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-5"
        >
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Flame className="text-orange-400" size={20} />
                Discipline Streak
            </h3>

            <div className="flex items-center gap-6">
                <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">Current</p>
                    <p className="text-3xl font-black text-white">
                        {current}
                        <span className="text-sm text-gray-500 ml-1">trades</span>
                    </p>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">Best</p>
                    <p className="text-2xl font-bold text-yellow-400">{best}</p>
                </div>
            </div>

            <p className="text-gray-500 text-xs mt-4">
                Break the streak → coach gets harsher.<br />
                Maintain it → higher grades & XP.
            </p>
        </motion.div>
    );
}

// ===== PREMIUM COMPARISON COMPONENT =====
function PremiumComparisonCard() {
    const features = [
        { feature: 'Daily Reviews', free: '5', premium: '∞' },
        { feature: 'Brutal Coach', free: 'Limited', premium: 'Full' },
        { feature: 'Coach Memory', free: '❌', premium: '✅' },
        { feature: 'XP Boost', free: '❌', premium: '+30%' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-5"
        >
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-gray-500 text-xs uppercase">
                        <th className="text-left pb-3">Feature</th>
                        <th className="text-center pb-3">Free</th>
                        <th className="text-center pb-3 text-yellow-400">Premium</th>
                    </tr>
                </thead>
                <tbody>
                    {features.map((row, i) => (
                        <tr key={i} className="border-t border-white/5">
                            <td className="py-2 text-gray-300">{row.feature}</td>
                            <td className="py-2 text-center text-gray-500">{row.free}</td>
                            <td className="py-2 text-center text-yellow-400 font-medium">{row.premium}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Link
                href="/profile#premium"
                className="mt-4 w-full py-2 rounded-lg border border-yellow-500/30 text-yellow-400 font-medium text-sm flex items-center justify-center gap-2 hover:bg-yellow-500/10 transition-colors"
            >
                Upgrade to Trade Like a Pro
            </Link>
        </motion.div>
    );
}

// ===== LOCKED INSIGHT TEASE =====
function LockedInsightCard() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-5 overflow-hidden"
        >
            <div className="absolute inset-0 backdrop-blur-sm bg-black/30 z-10 flex items-center justify-center">
                <div className="text-center p-4">
                    <Lock size={24} className="text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm font-medium">Premium Feature</p>
                </div>
            </div>

            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                <AlertTriangle className="text-yellow-400" size={20} />
                Advanced Mistake Pattern
            </h3>
            <p className="text-gray-400 text-sm">
                You repeat the same error after green trades.
            </p>
        </motion.div>
    );
}

// ===== QUICK INSIGHTS COMPONENT =====
function QuickInsightsCard({ tradesAnalyzed, avgGrade, topAsset }: {
    tradesAnalyzed: number;
    avgGrade: string;
    topAsset: string | null
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-5"
        >
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <BarChart2 className="text-cyan-400" size={16} />
                Quick Insights
            </h3>

            <div className="space-y-3">
                <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Trades analyzed</span>
                    <span className="text-white font-medium">{tradesAnalyzed}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Avg grade</span>
                    <span className="text-white font-medium">{avgGrade || '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Top asset</span>
                    <span className="text-white font-medium">{topAsset || '-'}</span>
                </div>
            </div>
        </motion.div>
    );
}

// ===== EMPTY STATE COMPONENT =====
function EmptyStateCoach() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-900/60 to-black border border-white/10 rounded-2xl p-8 text-center"
        >
            <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center"
            >
                <Brain size={40} className="text-cyan-400" />
            </motion.div>

            <h2 className="text-2xl font-black text-white mb-2">
                Your Coach Is Waiting for Data
            </h2>
            <p className="text-gray-400 mb-6">
                This is a <span className="text-cyan-400 font-medium">Live AI Engine</span>, not a course.<br />
                Log trades. Get judged. Improve.
            </p>

            <div className="bg-black/30 rounded-xl p-5 text-left mb-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="text-yellow-400" size={16} />
                    How to Activate the Coach
                </h3>
                <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                        <div>
                            <p className="text-white font-medium">Start a Trading Session</p>
                            <p className="text-gray-500 text-xs">Trade in paper mode or log a real trade</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                        <div>
                            <p className="text-white font-medium">Log Your Execution</p>
                            <p className="text-gray-500 text-xs">Entry, exit, position size, stop-loss</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                        <div>
                            <p className="text-white font-medium">Get AI Feedback</p>
                            <p className="text-gray-500 text-xs">Each analysis uses 1 AI credit</p>
                        </div>
                    </li>
                </ol>
            </div>

            <div className="bg-black/30 rounded-xl p-5 text-left mb-6">
                <h3 className="text-sm font-bold text-white mb-3">What Will Appear Here</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                        <Flame size={14} className="text-orange-400" />
                        Live Trade Analysis
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <Brain size={14} className="text-purple-400" />
                        Discipline Score
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <BarChart2 size={14} className="text-cyan-400" />
                        Quick Insights
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <Zap size={14} className="text-yellow-400" />
                        XP & Streaks
                    </div>
                </div>
            </div>

            <Link
                href="/trading"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:opacity-90 transition-opacity"
            >
                Start Trading Session
                <ChevronRight size={18} />
            </Link>
        </motion.div>
    );
}

// ===== XP & RANK DISPLAY =====
function XpRankCard({ xp, rank }: { xp: number; rank: string }) {
    const rankColor = getRankColor(rank as any);
    const nextRank = getNextRank(xp);
    const currentRankData = RANKS.find(r => r.name === rank);
    const progressToNext = nextRank
        ? ((xp - (currentRankData?.xpRequired || 0)) / (nextRank.xpNeeded + (xp - (currentRankData?.xpRequired || 0)))) * 100
        : 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-5"
        >
            <div className="flex items-center gap-4 mb-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${rankColor}20` }}
                >
                    <Award size={24} style={{ color: rankColor }} />
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase">Your Rank</p>
                    <p className="text-xl font-black" style={{ color: rankColor }}>{rank}</p>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-xs text-gray-500">Total XP</p>
                    <p className="text-lg font-bold text-white">{xp.toLocaleString()}</p>
                </div>
            </div>

            {nextRank && (
                <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress to {nextRank.rank}</span>
                        <span>{nextRank.xpNeeded} XP needed</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressToNext}%` }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: rankColor }}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// ===== MAIN PAGE =====
export default function CoachDashboardPage() {
    const { data: session } = useSession();
    const [isPremium, setIsPremium] = useState(false);
    const [quotaUsed, setQuotaUsed] = useState(0);
    const [hasTradeHistory, setHasTradeHistory] = useState(false);

    const [stats, setStats] = useState<UserCoachStats>({
        totalXp: 0,
        currentRank: 'Rookie',
        disciplineScore: 100,
        currentStreak: 0,
        bestStreak: 0,
        tradesAnalyzed: 0,
        avgGrade: '',
        topAsset: null,
        coachMemory: []
    });

    useEffect(() => {
        const savedStats = localStorage.getItem('coach_stats');
        if (savedStats) {
            const parsed = JSON.parse(savedStats);
            setStats(parsed);
            setHasTradeHistory(parsed.tradesAnalyzed > 0);
        }

        const premiumStatus = localStorage.getItem('zenith_premium') === 'true';
        setIsPremium(premiumStatus);

        const quotaData = localStorage.getItem('ai_quota');
        if (quotaData) {
            const { used, date } = JSON.parse(quotaData);
            const today = new Date().toDateString();
            if (date === today) {
                setQuotaUsed(used);
            }
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
            {/* Header */}
            <div className="sticky top-14 md:top-16 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="container mx-auto px-4 md:px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/trading" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold flex items-center gap-2">
                                    <Brain className="text-cyan-400" size={24} />
                                    Trading Coach
                                    <span className="px-2 py-0.5 text-xs font-bold bg-green-500/20 text-green-400 rounded-full">
                                        Active
                                    </span>
                                </h1>
                                <p className="text-xs text-gray-500">Your personalized trading feedback</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-gray-500">Discipline</p>
                                <p className={`text-lg font-bold ${stats.disciplineScore >= 80 ? 'text-green-400' :
                                    stats.disciplineScore >= 60 ? 'text-yellow-400' :
                                        'text-red-400'
                                    }`}>
                                    {stats.disciplineScore}%
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                                <Shield size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {hasTradeHistory ? (
                            <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border border-cyan-500/20 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4">Recent Analysis</h3>
                                <p className="text-gray-400">Your trade analyses will appear here after you complete trading sessions.</p>
                            </div>
                        ) : (
                            <EmptyStateCoach />
                        )}

                        {/* What the Coach Cares About */}
                        <div className="bg-gradient-to-br from-gray-900/60 to-black border border-white/10 rounded-xl p-5">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <AlertTriangle className="text-yellow-400" size={16} />
                                What the Coach Cares About
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-white font-medium mb-1">Cut Losses Early</p>
                                    <p className="text-gray-500 text-xs">Hold losers → expect harsher feedback.</p>
                                </div>
                                <div>
                                    <p className="text-white font-medium mb-1">Small Wins Compound</p>
                                    <p className="text-gray-500 text-xs">0.5–1% beats hero trades.</p>
                                </div>
                                <div>
                                    <p className="text-white font-medium mb-1">No Revenge Trading</p>
                                    <p className="text-gray-500 text-xs">Emotional trades trigger brutal penalties.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <QuotaCard used={quotaUsed} total={5} isPremium={isPremium} />
                        <XpRankCard xp={stats.totalXp} rank={stats.currentRank} />
                        <CoachMemoryCard memories={stats.coachMemory} />
                        <DisciplineStreakCard current={stats.currentStreak} best={stats.bestStreak} />
                        <QuickInsightsCard
                            tradesAnalyzed={stats.tradesAnalyzed}
                            avgGrade={stats.avgGrade}
                            topAsset={stats.topAsset}
                        />
                        {!isPremium && <PremiumComparisonCard />}
                        {!isPremium && stats.tradesAnalyzed > 3 && <LockedInsightCard />}
                    </div>
                </div>
            </div>
        </div>
    );
}
