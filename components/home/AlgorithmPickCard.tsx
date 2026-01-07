'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, TrendingUp, Droplets, Activity } from 'lucide-react';
import type { AssetSnapshot, RegimeType } from '@/lib/types/market';
import { getRegimeDisplay } from '@/lib/analysis/regime';

interface AlgorithmPickCardProps {
    asset: AssetSnapshot;
    insight?: string;
    index?: number;
    className?: string;
}

/**
 * Generate intelligent insight based on regime and factors
 */
function generateInsight(asset: AssetSnapshot): string {
    const { regime, factors } = asset;

    if (regime === 'trend') {
        if (factors.liquidity.value > 0.6) {
            return 'Liquidity remains strong while volatility compresses — a structure often preceding expansion.';
        }
        return 'Trend structure is aligned with sustained momentum. Watching for continuation.';
    }

    if (regime === 'breakout') {
        return 'Volatility expansion confirmed with volume participation. Seeking directional conviction.';
    }

    if (regime === 'range') {
        if (factors.volatility.percentile < 30) {
            return 'Compression phase approaching historical extremes. Expansion likely imminent.';
        }
        return 'Price consolidating within defined boundaries. Awaiting catalyst for resolution.';
    }

    if (regime === 'breakdown') {
        return 'Structure has shifted bearish with sustained selling. Defensive positioning favored.';
    }

    return 'Mixed signals detected. Elevated selectivity recommended.';
}

export default function AlgorithmPickCard({
    asset,
    insight,
    index = 0,
    className = '',
}: AlgorithmPickCardProps) {
    const regimeDisplay = getRegimeDisplay(asset.regime);
    const generatedInsight = insight || generateInsight(asset);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            whileHover={{ scale: 1.01, y: -4 }}
            className={`
        relative group overflow-hidden
        bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-800/40
        border border-zinc-700/50 hover:border-zinc-600
        rounded-2xl transition-all duration-300
        ${className}
      `}
        >
            {/* Gradient Glow on Hover */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `linear-gradient(135deg, ${regimeDisplay.bgColor} 0%, transparent 60%)`
                }}
            />

            <div className="relative z-10 p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white">{asset.symbol}</h3>
                            <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded capitalize"
                                style={{
                                    backgroundColor: regimeDisplay.bgColor,
                                    color: regimeDisplay.color
                                }}
                            >
                                {regimeDisplay.label}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500">{asset.name || asset.symbol}</p>
                    </div>

                    {/* Conviction Score */}
                    <div className="text-right">
                        <div className={`
              text-2xl font-bold
              ${asset.convictionScore >= 80 ? 'text-emerald-400' :
                                asset.convictionScore >= 70 ? 'text-blue-400' :
                                    'text-zinc-400'}
            `}>
                            {asset.convictionScore}
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Score</p>
                    </div>
                </div>

                {/* Price Info */}
                <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-semibold text-white">
                        ${asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    {asset.change24h !== undefined && (
                        <span className={`text-xs font-medium ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                        </span>
                    )}
                </div>

                {/* Insight - THE HOOK */}
                <p className="text-sm text-zinc-300 leading-relaxed mb-4 min-h-[40px]">
                    {generatedInsight}
                </p>

                {/* Quick Factors */}
                <div className="flex items-center gap-3 mb-4 text-[11px]">
                    <div className="flex items-center gap-1 text-zinc-400">
                        <TrendingUp size={12} className={
                            asset.factors.momentum.value > 0.6 ? 'text-emerald-400' : ''
                        } />
                        <span>{asset.factors.momentum.value > 0.6 ? 'Strong' : 'Neutral'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-400">
                        <Droplets size={12} className={
                            asset.factors.liquidity.value > 0.5 ? 'text-blue-400' : ''
                        } />
                        <span>{asset.factors.liquidity.value > 0.5 ? 'Liquid' : 'Normal'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-400">
                        <Activity size={12} className={
                            asset.factors.volatility.percentile < 40 ? 'text-amber-400' : ''
                        } />
                        <span>{asset.factors.volatility.percentile < 40 ? 'Calm' : 'Active'}</span>
                    </div>
                </div>

                {/* CTA */}
                <Link
                    href={`/${asset.market}/${asset.symbol}/analysis`}
                    className="
            flex items-center justify-center gap-2 w-full py-3
            bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
            rounded-xl text-sm font-medium text-white
            transition-all duration-200 group/btn
          "
                >
                    <span>View Analysis</span>
                    <ArrowUpRight
                        size={16}
                        className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                    />
                </Link>
            </div>
        </motion.div>
    );
}
