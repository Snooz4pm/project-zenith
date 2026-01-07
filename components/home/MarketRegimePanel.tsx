'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Zap, Shield, AlertTriangle } from 'lucide-react';
import type { RegimeType } from '@/lib/types/market';

interface MarketRegimePanelProps {
    regime: RegimeType;
    volatilityPercentile: number;
    momentumState: 'bullish' | 'neutral' | 'bearish';
    className?: string;
}

const regimeInsights: Record<RegimeType, {
    title: string;
    description: string;
    icon: typeof TrendingUp;
    color: string;
}> = {
    trend: {
        title: 'Risk-On Expansion',
        description: 'Volatility is contracting while momentum remains elevated. Historically, this favors continuation setups over mean reversion.',
        icon: TrendingUp,
        color: 'emerald',
    },
    breakout: {
        title: 'Volatility Expansion',
        description: 'Markets are breaking out of consolidation with elevated volume. This environment rewards directional conviction but requires tight risk management.',
        icon: Zap,
        color: 'blue',
    },
    range: {
        title: 'Consolidation Phase',
        description: 'Price action is compressing within defined boundaries. This typically precedes a directional move—patience is rewarded here.',
        icon: Activity,
        color: 'amber',
    },
    breakdown: {
        title: 'Risk-Off Rotation',
        description: 'Trend structure has inverted with sustained selling pressure. Defensive positioning typically outperforms in this environment.',
        icon: TrendingDown,
        color: 'red',
    },
    chaos: {
        title: 'Uncertain Structure',
        description: 'Market signals are mixed with no clear directional bias. Reduced position sizing and elevated selectivity are prudent.',
        icon: AlertTriangle,
        color: 'zinc',
    },
};

export default function MarketRegimePanel({
    regime,
    volatilityPercentile,
    momentumState,
    className = '',
}: MarketRegimePanelProps) {
    const insight = regimeInsights[regime];
    const Icon = insight.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/50
        border border-zinc-700/50
        ${className}
      `}
        >
            {/* Gradient Glow */}
            <div
                className="absolute top-0 left-0 w-1/2 h-full opacity-20"
                style={{
                    background: `linear-gradient(135deg, ${insight.color === 'emerald' ? '#10b981' :
                            insight.color === 'blue' ? '#3b82f6' :
                                insight.color === 'amber' ? '#f59e0b' :
                                    insight.color === 'red' ? '#ef4444' :
                                        '#71717a'
                        } 0%, transparent 70%)`
                }}
            />

            <div className="relative z-10 p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className={`
            p-3 rounded-xl
            ${insight.color === 'emerald' ? 'bg-emerald-500/20' :
                            insight.color === 'blue' ? 'bg-blue-500/20' :
                                insight.color === 'amber' ? 'bg-amber-500/20' :
                                    insight.color === 'red' ? 'bg-red-500/20' :
                                        'bg-zinc-700/50'}
          `}>
                        <Icon size={24} className={`
              ${insight.color === 'emerald' ? 'text-emerald-400' :
                                insight.color === 'blue' ? 'text-blue-400' :
                                    insight.color === 'amber' ? 'text-amber-400' :
                                        insight.color === 'red' ? 'text-red-400' :
                                            'text-zinc-400'}
            `} />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">Market Regime Right Now</p>
                        <h2 className="text-xl font-bold text-white">{insight.title}</h2>
                    </div>
                </div>

                {/* Insight Text */}
                <p className="text-sm text-zinc-300 leading-relaxed mb-5">
                    {insight.description}
                </p>

                {/* Quick Stats */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-zinc-500" />
                        <span className="text-xs text-zinc-400">
                            Volatility: <span className={`font-medium ${volatilityPercentile > 70 ? 'text-red-400' :
                                    volatilityPercentile > 40 ? 'text-amber-400' :
                                        'text-emerald-400'
                                }`}>
                                {volatilityPercentile > 70 ? 'Elevated' :
                                    volatilityPercentile > 40 ? 'Normal' :
                                        'Contained'}
                            </span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-zinc-500" />
                        <span className="text-xs text-zinc-400">
                            Momentum: <span className={`font-medium capitalize ${momentumState === 'bullish' ? 'text-emerald-400' :
                                    momentumState === 'bearish' ? 'text-red-400' :
                                        'text-zinc-400'
                                }`}>
                                {momentumState}
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
