'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { RegimeType } from '@/lib/types/market';

interface MarketModeTileProps {
    onClick: () => void;
}

const regimeConfig: Record<RegimeType, {
    icon: string;
    color: string;
    label: string;
    sentiment: string;
    gradient: string;
}> = {
    trend: { icon: '⚡', color: '#22c55e', label: 'Risk-On', sentiment: 'BULLISH', gradient: 'from-emerald-500/20 to-green-500/5' },
    breakout: { icon: '🚀', color: '#3b82f6', label: 'Breakout', sentiment: 'VOLATILE', gradient: 'from-blue-500/20 to-cyan-500/5' },
    range: { icon: '🎯', color: '#f59e0b', label: 'Ranging', sentiment: 'NEUTRAL', gradient: 'from-amber-500/20 to-yellow-500/5' },
    breakdown: { icon: '⚠️', color: '#ef4444', label: 'Risk-Off', sentiment: 'BEARISH', gradient: 'from-red-500/20 to-orange-500/5' },
    chaos: { icon: '❓', color: '#6b7280', label: 'Uncertain', sentiment: 'MIXED', gradient: 'from-gray-500/20 to-slate-500/5' },
};

export default function MarketModeTile({ onClick }: MarketModeTileProps) {
    const [marketData, setMarketData] = useState<{
        regime: RegimeType;
        explanation: string;
        stats: { enteredPicks: number; improved: number; invalidated: number };
    } | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const { getCommandCenterData } = await import('@/lib/api/zenith-adapter');
                const data = await getCommandCenterData('crypto');
                setMarketData({
                    regime: data.marketRegimeSummary.regime,
                    explanation: data.marketRegimeSummary.explanation,
                    stats: data.stats,
                });
            } catch (error) {
                console.error('Failed to load market data:', error);
            }
        }
        loadData();
    }, []);

    const config = marketData ? regimeConfig[marketData.regime] : regimeConfig.chaos;

    return (
        <div
            className="w-full h-full glass-panel rounded-2xl p-5 border border-[rgba(255,255,255,0.05)] hover:border-[var(--accent-mint)]/30 transition-all cursor-pointer group flex flex-col relative overflow-hidden"
            onClick={onClick}
        >
            {/* Dynamic background gradient based on regime */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-20 group-hover:opacity-30 transition-opacity`} />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <span className="font-bold text-white group-hover:text-[var(--accent-mint)] transition-colors">Market Pulse</span>
                </div>
                <button className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] group-hover:text-white transition-colors">
                    <ArrowUpRight size={16} />
                </button>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center relative z-10">
                <motion.div
                    className="flex flex-col items-center mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="text-4xl mb-2">{config.icon}</div>
                    <div
                        className="text-2xl font-bold font-display uppercase tracking-widest drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                        style={{ color: config.color }}
                    >
                        {config.label}
                    </div>
                </motion.div>

                {/* Live Stats */}
                {marketData && (
                    <div className="flex flex-wrap justify-center gap-2 mb-4 w-full">
                        <span className="px-2 py-1 rounded text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {marketData.stats.enteredPicks} picks
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {marketData.stats.improved} improved
                        </span>
                        {marketData.stats.invalidated > 0 && (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                {marketData.stats.invalidated} invalidated
                            </span>
                        )}
                    </div>
                )}

                <div className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-widest mt-auto">
                    Sentiment: <span style={{ color: config.color }}>{config.sentiment}</span>
                </div>
            </div>
        </div>
    );
}
