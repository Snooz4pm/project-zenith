'use client';

import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Target, AlertTriangle, Lightbulb, Award, Flame, BarChart3 } from 'lucide-react';
import type { WeeklySummary as WeeklySummaryType } from '@/lib/coaching-engine';

interface WeeklySummaryProps {
    summary: WeeklySummaryType;
}

const GRADE_COLORS = {
    'A': 'from-green-500 to-emerald-500',
    'B': 'from-blue-500 to-cyan-500',
    'C': 'from-yellow-500 to-orange-500',
    'D': 'from-orange-500 to-red-500',
    'F': 'from-red-500 to-red-700',
};

export default function WeeklySummary({ summary }: WeeklySummaryProps) {
    const isProfitable = summary.totalPnl > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6 shadow-xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="text-cyan-400" size={20} />
                        Weekly Performance
                    </h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Calendar size={12} />
                        {summary.period}
                    </p>
                </div>

                {/* Overall Grade */}
                <div className="text-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${GRADE_COLORS[summary.overallGrade]} flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-2xl">{summary.overallGrade}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Weekly Grade</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 rounded-xl bg-white/5">
                    <p className="text-2xl font-bold text-white">{summary.totalTrades}</p>
                    <p className="text-[10px] text-gray-500">Trades</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-green-500/10">
                    <p className="text-2xl font-bold text-green-400">{summary.wins}</p>
                    <p className="text-[10px] text-gray-500">Wins</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-red-500/10">
                    <p className="text-2xl font-bold text-red-400">{summary.losses}</p>
                    <p className="text-[10px] text-gray-500">Losses</p>
                </div>
            </div>

            {/* Win Rate & P&L */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 mb-6">
                <div>
                    <p className="text-xs text-gray-500">Win Rate</p>
                    <p className={`text-xl font-bold ${summary.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {summary.winRate}%
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">Total P&L</p>
                    <p className={`text-xl font-bold font-mono ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                        {isProfitable ? '+' : ''}{summary.totalPnl.toFixed(2)} USD
                    </p>
                </div>
            </div>

            {/* Best / Worst Trades */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {summary.bestTrade && (
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mb-1">
                            <TrendingUp size={10} className="text-green-400" />
                            Best Trade
                        </p>
                        <p className="font-bold text-white">{summary.bestTrade.symbol}</p>
                        <p className="text-sm text-green-400 font-mono">+{summary.bestTrade.pnl.toFixed(2)}</p>
                    </div>
                )}
                {summary.worstTrade && summary.worstTrade.pnl < 0 && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mb-1">
                            <TrendingDown size={10} className="text-red-400" />
                            Worst Trade
                        </p>
                        <p className="font-bold text-white">{summary.worstTrade.symbol}</p>
                        <p className="text-sm text-red-400 font-mono">{summary.worstTrade.pnl.toFixed(2)}</p>
                    </div>
                )}
            </div>

            {/* Patterns */}
            {summary.patterns.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                        <Flame size={12} className="text-orange-400" />
                        Patterns Detected
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {summary.patterns.map((pattern, i) => (
                            <span key={i} className="px-2 py-1 text-xs bg-orange-500/10 text-orange-400 rounded-lg">
                                {pattern}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Lessons */}
            {summary.lessons.length > 0 && (
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-xs text-purple-400 flex items-center gap-1 mb-2">
                        <Lightbulb size={12} />
                        This Week's Lessons
                    </p>
                    <ul className="space-y-1">
                        {summary.lessons.map((lesson, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-cyan-400">→</span>
                                {lesson}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </motion.div>
    );
}
