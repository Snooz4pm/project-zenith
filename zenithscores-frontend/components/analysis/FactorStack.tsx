'use client';

import type { FactorStack as FactorStackType, FactorValue } from '@/lib/types/market';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, Droplets, Compass } from 'lucide-react';

interface FactorStackProps {
    factors: FactorStackType;
    className?: string;
}

const factorConfig = {
    momentum: {
        label: 'Momentum',
        icon: TrendingUp,
        description: 'Price strength relative to moving average',
    },
    volatility: {
        label: 'Volatility',
        icon: Activity,
        description: 'Risk-adjusted price range behavior',
    },
    liquidity: {
        label: 'Liquidity',
        icon: Droplets,
        description: 'Volume confirmation and market depth',
    },
    trend: {
        label: 'Trend Structure',
        icon: Compass,
        description: 'Moving average alignment and stability',
    },
};

function FactorMeter({ factor, config }: { factor: FactorValue; config: typeof factorConfig.momentum }) {
    const Icon = config.icon;
    const percentage = Math.round(factor.value * 100);
    const isStrong = factor.percentile > 70;
    const isWeak = factor.percentile < 30;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-zinc-800">
                        <Icon size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-white">{config.label}</h4>
                        <p className="text-xs text-zinc-500">{config.description}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`text-lg font-bold ${isStrong ? 'text-emerald-400' : isWeak ? 'text-red-400' : 'text-zinc-300'
                        }`}>
                        {percentage}
                    </span>
                    <span className="text-xs text-zinc-500 ml-1">/ 100</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${isStrong ? 'bg-emerald-500' : isWeak ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                />
            </div>

            {/* Percentile Badge */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">Historical Percentile</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${factor.percentile > 75 ? 'bg-emerald-500/20 text-emerald-400' :
                        factor.percentile > 50 ? 'bg-blue-500/20 text-blue-400' :
                            factor.percentile > 25 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                    }`}>
                    {factor.percentile}th percentile
                </span>
            </div>

            {/* Interpretation */}
            <p className="text-xs text-zinc-400 leading-relaxed">
                {factor.interpretation}
            </p>
        </motion.div>
    );
}

export default function FactorStack({ factors, className = '' }: FactorStackProps) {
    return (
        <div className={`space-y-4 ${className}`}>
            {/* Section Header */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">Quantitative Breakdown</h3>
                <p className="text-sm text-zinc-400">
                    Factor decomposition explaining the conviction assessment. These metrics are derived from
                    price action and do not constitute a recommendation.
                </p>
            </div>

            {/* Factor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FactorMeter factor={factors.momentum} config={factorConfig.momentum} />
                <FactorMeter factor={factors.volatility} config={factorConfig.volatility} />
                <FactorMeter factor={factors.liquidity} config={factorConfig.liquidity} />
                <FactorMeter factor={factors.trend} config={factorConfig.trend} />
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-zinc-600 mt-4 italic">
                These factors represent an explanatory decomposition based on technical analysis.
                They do not predict future performance. Past performance is not indicative of future results.
            </p>
        </div>
    );
}
