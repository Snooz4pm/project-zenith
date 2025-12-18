'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Award, BarChart3, Activity } from 'lucide-react';
import AnimatedValue from './AnimatedValue';

interface StatsCardsProps {
    currentValue: number;
    totalPnl: number;
    totalTrades: number;
    winRate: number;
    bestTrade?: { symbol: string; pnl: number; percent: number };
    dayHigh: number;
    dayLow: number;
}

export default function StatsCards({
    currentValue,
    totalPnl,
    totalTrades,
    winRate,
    bestTrade,
    dayHigh,
    dayLow
}: StatsCardsProps) {
    const isPositive = totalPnl >= 0;
    const pnlPercent = ((totalPnl / 10000) * 100); // Assuming 10k starting balance
    const currentInRange = dayHigh > dayLow
        ? ((currentValue - dayLow) / (dayHigh - dayLow)) * 100
        : 50;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Portfolio Value Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-4"
            >
                <div className="flex items-center gap-2 mb-2">
                    <Activity size={14} className="text-cyan-400" />
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Portfolio Value</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                    <AnimatedValue value={currentValue} decimals={0} duration={1.5} />
                </div>
            </motion.div>

            {/* ROI Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`bg-gradient-to-br ${isPositive ? 'from-emerald-900/30 to-emerald-950/50' : 'from-red-900/30 to-red-950/50'} border ${isPositive ? 'border-emerald-500/20' : 'border-red-500/20'} rounded-xl p-4`}
            >
                <div className="flex items-center gap-2 mb-2">
                    {isPositive ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
                    <span className="text-xs text-gray-500 uppercase tracking-wide">ROI Today</span>
                </div>
                <div className={`text-2xl font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{pnlPercent.toFixed(1)}%
                </div>
                <div className={`text-sm font-mono ${isPositive ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                    <AnimatedValue value={totalPnl} prefix={isPositive ? '+$' : '-$'} decimals={0} />
                </div>
            </motion.div>

            {/* 24H Range Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-4"
            >
                <div className="flex items-center gap-2 mb-2">
                    <BarChart3 size={14} className="text-blue-400" />
                    <span className="text-xs text-gray-500 uppercase tracking-wide">24H Range</span>
                </div>
                <div className="flex justify-between text-xs mb-2">
                    <span className="text-red-400">${dayLow.toLocaleString()}</span>
                    <span className="text-emerald-400">${dayHigh.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden relative">
                    <div
                        className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 opacity-30"
                        style={{ width: '100%' }}
                    />
                    <motion.div
                        initial={{ left: '0%' }}
                        animate={{ left: `${Math.min(100, Math.max(0, currentInRange))}%` }}
                        className="absolute top-0 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] transform -translate-x-1/2"
                    />
                </div>
            </motion.div>

            {/* Win Rate / Best Trade Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-900/30 to-purple-950/50 border border-purple-500/20 rounded-xl p-4"
            >
                <div className="flex items-center gap-2 mb-2">
                    <Award size={14} className="text-purple-400" />
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Win Rate</span>
                </div>
                <div className="text-2xl font-bold font-mono text-purple-400">
                    {winRate.toFixed(0)}%
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Target size={12} />
                    <span>{totalTrades} trades</span>
                </div>

                {/* Win rate bar */}
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-2">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${winRate}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    />
                </div>
            </motion.div>
        </div>
    );
}
