/**
 * MarketCard - Premium Asset Card
 * 
 * Features:
 * - Regime-based color system
 * - Mini-chart from real candles
 * - Confidence + regime unification
 * - Price + change display
 * - Volatility indicator
 */

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Regime color system - backbone of visual coherence
export const REGIME_COLORS = {
    trend: '#22c55e',      // calm green
    breakout: '#3b82f6',   // confident blue
    range: '#f59e0b',      // amber
    chaos: '#a855f7',      // violet
    breakdown: '#ef4444'   // red
} as const;

export type Regime = keyof typeof REGIME_COLORS;
export type Volatility = 'low' | 'medium' | 'high';

export interface MarketCardData {
    symbol: string;
    name?: string;
    price: number;
    previousClose?: number;
    changePct: number;
    confidence: number;
    regime: Regime;
    volatility: Volatility;
    candles: Array<{ close: number }>;
    assetType?: 'stock' | 'crypto' | 'forex';
}

interface MarketCardProps extends MarketCardData {
    onClick?: () => void;
}

// Mini sparkline chart
function MiniChart({
    prices,
    color,
    height = 60
}: {
    prices: number[];
    color: string;
    height?: number;
}) {
    const points = useMemo(() => {
        if (prices.length < 2) return '';

        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;

        const normalized = prices.map(p => (p - min) / range);

        const width = 200;
        const stepX = width / (prices.length - 1);

        return normalized
            .map((y, i) => `${i * stepX},${height - (y * height * 0.8) - (height * 0.1)}`)
            .join(' ');
    }, [prices, height]);

    const areaPath = useMemo(() => {
        if (prices.length < 2) return '';

        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;

        const normalized = prices.map(p => (p - min) / range);
        const width = 200;
        const stepX = width / (prices.length - 1);

        const linePoints = normalized
            .map((y, i) => `${i * stepX},${height - (y * height * 0.8) - (height * 0.1)}`)
            .join(' L');

        return `M0,${height} L${linePoints} L${width},${height} Z`;
    }, [prices, height]);

    if (prices.length < 2) return null;

    return (
        <svg
            viewBox={`0 0 200 ${height}`}
            className="w-full"
            preserveAspectRatio="none"
            style={{ height }}
        >
            {/* Gradient fill */}
            <defs>
                <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Area fill */}
            <path
                d={areaPath}
                fill={`url(#grad-${color.replace('#', '')})`}
            />

            {/* Line */}
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function MarketCard({
    symbol,
    name,
    price,
    changePct,
    confidence,
    regime,
    volatility,
    candles,
    assetType = 'stock',
    onClick
}: MarketCardProps) {
    const color = REGIME_COLORS[regime];
    const prices = useMemo(() => candles.map(c => c.close), [candles]);

    // Format price based on asset type
    const formattedPrice = price < 1
        ? `$${price.toFixed(4)}`
        : price < 100
            ? `$${price.toFixed(2)}`
            : `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Only show change if significant
    const showChange = Math.abs(changePct) >= 0.05;
    const changeColor = changePct >= 0 ? 'text-emerald-400' : 'text-red-400';

    const volatilityColor = {
        low: 'text-zinc-500',
        medium: 'text-amber-400',
        high: 'text-red-400'
    }[volatility];

    const href = assetType === 'crypto'
        ? `/crypto/${symbol}`
        : assetType === 'forex'
            ? `/forex/${symbol}`
            : `/stocks/${symbol}`;

    return (
        <Link href={href}>
            <motion.div
                whileHover={{ y: -2, boxShadow: '0 8px 30px -12px rgba(0,0,0,0.8)' }}
                transition={{ duration: 0.2 }}
                onClick={onClick}
                className="relative bg-zinc-900/80 backdrop-blur rounded-xl border border-zinc-800/50 p-4 cursor-pointer overflow-hidden group"
            >
                {/* Top accent bar */}
                <div
                    className="absolute top-0 left-0 h-[2px] w-full"
                    style={{ backgroundColor: color }}
                />

                {/* Header: Symbol + Confidence */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-lg font-bold text-white">{symbol}</h3>
                        {name && (
                            <p className="text-xs text-zinc-500 truncate max-w-[120px]">{name}</p>
                        )}
                    </div>

                    {/* Confidence + Regime pill */}
                    <div className="flex items-center gap-2">
                        <span
                            className="px-2 py-1 rounded-md text-sm font-bold bg-zinc-800 text-white"
                            style={{ borderColor: color, borderWidth: '1px' }}
                        >
                            {confidence}
                        </span>
                        <span
                            className="text-xs capitalize px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: `${color}22`,
                                color: color
                            }}
                        >
                            {regime === 'trend' ? 'Trending' :
                                regime === 'breakout' ? 'Breakout' :
                                    regime === 'breakdown' ? 'Breakdown' :
                                        regime === 'range' ? 'Ranging' :
                                            'Uncertain'}
                        </span>
                    </div>
                </div>

                {/* Mini Chart */}
                <div className="mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
                    <MiniChart prices={prices} color={color} height={50} />
                </div>

                {/* Price + Change */}
                <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-white">
                        {formattedPrice}
                    </span>
                    {showChange && (
                        <span className={`text-sm font-medium ${changeColor}`}>
                            {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}% today
                        </span>
                    )}
                </div>

                {/* Bias + Volatility */}
                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                    <span>
                        Bias: <span className="capitalize">{regime === 'trend' ? 'Bullish' : regime === 'breakdown' ? 'Bearish' : 'Neutral'}</span>
                    </span>
                    <span>·</span>
                    <span>
                        Volatility: <span className={`capitalize ${volatilityColor}`}>{volatility}</span>
                    </span>
                </div>
            </motion.div>
        </Link>
    );
}

// Grid container for cards
export function MarketCardGrid({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children}
        </div>
    );
}
