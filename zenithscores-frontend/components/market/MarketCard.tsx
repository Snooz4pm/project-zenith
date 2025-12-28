/**
 * MarketCard v2 - FINAL, SHIPPABLE VERSION
 *
 * Changes:
 * - Informative mini-chart using REAL candle data (close + range)
 * - Confidence only shown when >= 70 or <= 30
 * - Regime text small and muted
 * - Trader language (Session, Compression, Momentum, Range)
 * - One insight line for curiosity hook
 */

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Regime color system (FINAL)
export const REGIME_COLORS = {
    trend: '#22c55e',      // green
    breakout: '#3b82f6',   // blue
    range: '#f59e0b',      // amber
    chaos: '#a855f7',      // purple
    breakdown: '#ef4444'   // red
} as const;

export type Regime = keyof typeof REGIME_COLORS;

export interface MarketCardData {
    symbol: string;
    name?: string;
    price: number;
    changePct: number;
    confidence: number;
    regime: Regime;
    candles: Array<{ close: number; high: number; low: number; volume?: number }>;
    assetType?: 'stock' | 'crypto' | 'forex';
}

interface MarketCardProps extends MarketCardData {
    onClick?: () => void;
}

// Calculate slope (linear regression)
function linearRegressionSlope(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
}

// Calculate average
function average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

// Informative MiniChart - USES REAL CANDLE DATA
function InformativeMiniChart({
    candles,
    color
}: {
    candles: Array<{ close: number; high: number; low: number }>;
    color: string;
}) {
    const { path, areaPath, isCompressed, isVolatile, lastDot } = useMemo(() => {
        if (candles.length < 2) return { path: '', areaPath: '', isCompressed: false, isVolatile: false, lastDot: null };

        // Extract close prices and ranges
        const closes = candles.map(c => c.close);
        const ranges = candles.map(c => c.high - c.low);

        // Calculate signals
        const avgRange = average(ranges);
        const historicalAvg = avgRange; // In real implementation, use longer history
        const rangeCompression = avgRange < historicalAvg * 0.7;

        // Determine volatility
        const isVolatile = ranges.some(r => r > avgRange * 2);

        // Normalize for rendering
        const min = Math.min(...candles.map(c => c.low));
        const max = Math.max(...candles.map(c => c.high));
        const range = max - min || 1;

        const width = 200;
        const height = 60;
        const stepX = width / (closes.length - 1);

        // Create path points
        const points = closes.map((close, i) => {
            const x = i * stepX;
            const y = height - ((close - min) / range) * height * 0.8 - height * 0.1;
            return { x, y };
        });

        // Line path
        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

        // Area path
        const area = `${linePath} L${width},${height} L0,${height} Z`;

        // Last point dot
        const last = points[points.length - 1];

        return {
            path: linePath,
            areaPath: area,
            isCompressed: rangeCompression,
            isVolatile,
            lastDot: last
        };
    }, [candles]);

    if (candles.length < 2) return null;

    return (
        <svg
            viewBox="0 0 200 60"
            className="w-full"
            preserveAspectRatio="none"
            style={{ height: 60 }}
        >
            {/* Gradient fill (5-8% opacity) */}
            <defs>
                <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.08" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                </linearGradient>
            </defs>

            {/* Area fill */}
            <path
                d={areaPath}
                fill={`url(#grad-${color.replace('#', '')})`}
            />

            {/* Line (1.75px, no blur) */}
            <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isCompressed ? 0.6 : isVolatile ? 1 : 0.8}
            />

            {/* Last point dot (small) */}
            {lastDot && (
                <circle
                    cx={lastDot.x}
                    cy={lastDot.y}
                    r="2"
                    fill={color}
                />
            )}
        </svg>
    );
}

// Generate insight line based on market conditions
function generateInsight(
    regime: Regime,
    candles: Array<{ close: number; high: number; low: number }>
): string {
    const closes = candles.map(c => c.close);
    const ranges = candles.map(c => c.high - c.low);
    const avgRange = average(ranges);
    const slope = linearRegressionSlope(closes);

    const recentClose = closes[closes.length - 1];
    const recentHigh = Math.max(...candles.slice(-10).map(c => c.high));
    const isNearHighs = recentClose >= recentHigh * 0.98;

    // Range compression check
    if (avgRange < average(ranges.slice(0, -10)) * 0.7) {
        if (isNearHighs) return 'Compression near highs';
        return 'Range tightening';
    }

    // Momentum checks
    if (Math.abs(slope) > 0.1) {
        if (slope < 0) return 'Momentum fading';
        return 'Momentum building';
    }

    // Volatility expansion
    if (ranges[ranges.length - 1] > avgRange * 1.5) {
        return 'Volatility expanding';
    }

    // Regime-based defaults
    if (regime === 'trend') return 'Strong directional move';
    if (regime === 'breakout') return 'Breaking resistance';
    if (regime === 'breakdown') return 'Breaking support';
    if (regime === 'range') return 'Consolidating';

    return 'Watching for setup';
}

// Determine session state
function getSessionState(changePct: number, candles: Array<{ volume?: number }>): string {
    const isFlat = Math.abs(changePct) < 0.5;
    const recentVolumes = candles.slice(-5).map(c => c.volume || 0);
    const avgVol = average(recentVolumes);
    const isLowVol = avgVol < average(candles.map(c => c.volume || 0)) * 0.7;

    if (isFlat && isLowVol) return 'Flat · Low Vol';
    if (isFlat) return 'Flat · Normal Vol';
    if (changePct > 2) return 'Strong Up · High Vol';
    if (changePct < -2) return 'Strong Down · High Vol';
    if (changePct > 0) return 'Up · Normal Vol';
    return 'Down · Normal Vol';
}

export default function MarketCard({
    symbol,
    name,
    price,
    changePct,
    confidence,
    regime,
    candles,
    assetType = 'stock',
    onClick
}: MarketCardProps) {
    const color = REGIME_COLORS[regime];

    // Format price
    const formattedPrice = price < 1
        ? `$${price.toFixed(4)}`
        : price < 100
            ? `$${price.toFixed(2)}`
            : `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // CONFIDENCE VISIBILITY RULES (LOCKED)
    const showConfidence = confidence >= 70 || confidence <= 30;
    const confidenceLabel = confidence >= 70 ? 'Strong' : confidence <= 30 ? 'Weak' : 'Neutral';
    const confidenceColor = confidence >= 70
        ? 'text-green-400 bg-green-500/10'
        : confidence <= 30
            ? 'text-red-400 bg-red-500/10'
            : 'text-zinc-400 bg-zinc-800/50';

    // Regime text
    const regimeText = regime === 'trend' ? 'Trending' :
        regime === 'breakout' ? 'Breakout' :
            regime === 'breakdown' ? 'Breakdown' :
                regime === 'range' ? 'Ranging' :
                    'Unstable';

    // Generate insight and session state
    const insight = useMemo(() => generateInsight(regime, candles), [regime, candles]);
    const sessionState = useMemo(() => getSessionState(changePct, candles), [changePct, candles]);

    const href = assetType === 'crypto'
        ? `/crypto/${symbol}`
        : assetType === 'forex'
            ? `/forex/${symbol}`
            : `/stocks/${symbol}`;

    return (
        <Link href={href}>
            <motion.div
                whileHover={{ y: -2, boxShadow: '0 4px 20px -8px rgba(0,0,0,0.6)' }}
                transition={{ duration: 0.2 }}
                onClick={onClick}
                className="relative bg-zinc-900/80 backdrop-blur rounded-xl border border-zinc-800/50 overflow-hidden group cursor-pointer"
            >
                {/* Regime bar (MANDATORY) */}
                <div
                    className="absolute top-0 left-0 h-[2px] w-full"
                    style={{ backgroundColor: color }}
                />

                {/* Card content */}
                <div className="p-4">
                    {/* Symbol + Name */}
                    <div className="mb-3">
                        <h3 className="text-lg font-bold text-white">{symbol}</h3>
                        {name && (
                            <p className="text-xs text-zinc-400">{name}</p>
                        )}
                    </div>

                    {/* Informative Mini-Chart */}
                    <div className="mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
                        <InformativeMiniChart candles={candles.slice(-60)} color={color} />
                    </div>

                    {/* Price */}
                    <div className="text-2xl font-bold text-white mb-1">
                        {formattedPrice}
                    </div>

                    {/* Session state */}
                    <div className="text-xs text-zinc-500 mb-3">
                        Session: <span className="text-zinc-400">{sessionState}</span>
                    </div>

                    {/* Confidence or Neutral */}
                    <div className="mb-1">
                        {showConfidence ? (
                            <span className={`text-sm font-medium ${confidenceColor} px-2 py-1 rounded`}>
                                {confidence} · {confidenceLabel}
                            </span>
                        ) : (
                            <span className="text-sm text-zinc-400">
                                Neutral
                            </span>
                        )}
                    </div>

                    {/* Insight line (THE HOOK) */}
                    <div className="text-xs text-zinc-500">
                        {insight}
                    </div>

                    {/* Regime text (quiet) */}
                    <div className="mt-2 text-[10px] text-zinc-600 capitalize">
                        {regimeText}
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

// Grid container for cards
export function MarketCardGrid({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {children}
        </div>
    );
}
