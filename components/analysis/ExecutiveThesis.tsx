'use client';

import { motion } from 'framer-motion';
import type { RegimeType } from '@/lib/types/market';
import { getRegimeDisplay } from '@/lib/analysis/regime';
import { TrendingUp, Clock, Target } from 'lucide-react';

interface ExecutiveThesisProps {
    asset: {
        symbol: string;
        name: string;
        regime: RegimeType;
        convictionScore: number;
        price: number;
        change24h?: number;
    };
    className?: string;
}

/**
 * Generate thesis text based on regime and score
 */
function generateThesis(asset: ExecutiveThesisProps['asset']): string {
    const { regime, convictionScore } = asset;

    if (regime === 'trend' && convictionScore >= 80) {
        return `${asset.symbol} is in a confirmed trend regime with stable liquidity and expanding participation. Similar conditions historically precede directional continuation, provided volatility remains contained. The quantitative factors align favorably for this setup.`;
    }

    if (regime === 'trend') {
        return `${asset.symbol} shows sustained directional momentum with aligned moving averages. The trend structure remains intact, though conviction is moderate. Monitoring for continuation signals.`;
    }

    if (regime === 'breakout') {
        return `${asset.symbol} is experiencing volatility expansion with volume confirmation. This breakout environment rewards directional conviction but requires disciplined risk management. Early stage of potential trend development.`;
    }

    if (regime === 'range') {
        return `${asset.symbol} is consolidating within defined boundaries. Volatility compression is building, typically a precursor to directional resolution. Patience is rewarded in this environment.`;
    }

    if (regime === 'breakdown') {
        return `${asset.symbol} has shifted to a bearish structure with sustained selling pressure. Defensive positioning typically outperforms in this environment. Watching for stabilization signals.`;
    }

    return `${asset.symbol} presents mixed signals in the current environment. Elevated selectivity is recommended until clearer structure emerges.`;
}

export default function ExecutiveThesis({ asset, className = '' }: ExecutiveThesisProps) {
    const regimeDisplay = getRegimeDisplay(asset.regime);
    const thesis = generateThesis(asset);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/50
        border border-zinc-700/50 p-6
        ${className}
      `}
        >
            {/* Gradient Glow */}
            <div
                className="absolute top-0 right-0 w-1/2 h-full opacity-10"
                style={{
                    background: `linear-gradient(-135deg, ${regimeDisplay.color} 0%, transparent 70%)`
                }}
            />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Deep Analysis</p>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            {asset.symbol}
                            <span
                                className="text-sm font-medium px-3 py-1 rounded-lg capitalize"
                                style={{
                                    backgroundColor: regimeDisplay.bgColor,
                                    color: regimeDisplay.color
                                }}
                            >
                                {regimeDisplay.label}
                            </span>
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">{asset.name}</p>
                    </div>

                    <div className="text-right">
                        <p className="text-3xl font-bold text-white">
                            ${asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                        {asset.change24h !== undefined && (
                            <p className={`text-sm font-medium ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}% (24h)
                            </p>
                        )}
                    </div>
                </div>

                {/* Thesis Header */}
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Target size={18} className="text-blue-400" />
                        Why This Asset Matters Right Now
                    </h2>
                </div>

                {/* Thesis Text */}
                <p className="text-zinc-300 leading-relaxed text-sm">
                    {thesis}
                </p>

                {/* Quick Stats Row */}
                <div className="flex items-center gap-6 mt-6 pt-4 border-t border-zinc-800">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-zinc-500" />
                        <span className="text-xs text-zinc-400">
                            Conviction: <span className={`font-bold ${asset.convictionScore >= 80 ? 'text-emerald-400' :
                                    asset.convictionScore >= 70 ? 'text-blue-400' :
                                        'text-zinc-400'
                                }`}>{asset.convictionScore}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-zinc-500" />
                        <span className="text-xs text-zinc-400">
                            Updated just now
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
