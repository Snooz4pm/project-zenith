/**
 * MarketCard - Clean, Professional Design
 *
 * Features:
 * - Simple SVG sparkline using real close prices
 * - Clean regime color system
 * - Compact, readable layout
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';

// Regime types (SINGLE SOURCE OF TRUTH)
export type Regime = 'trending' | 'breakdown' | 'ranging' | 'uncertain';

// Regime color system (FINAL)
export const REGIME_COLORS: Record<Regime, string> = {
    trending: '#22c55e',   // green
    breakdown: '#ef4444',  // red
    ranging: '#f59e0b',    // amber
    uncertain: '#a855f7'   // violet
};

export interface MarketCardData {
    symbol: string;
    name?: string;
    price: number;
    changePct: number;
    confidence: number;
    regime: Regime;
    candles: Array<{ close: number }>;
    assetType?: 'stock' | 'crypto' | 'forex';
}

interface MarketCardProps extends MarketCardData {
    onClick?: () => void;
}

// Simple SVG Sparkline using real close prices
function Sparkline({
    candles,
    color
}: {
    candles: Array<{ close: number }>;
    color: string;
}) {
    const { points, lastPoint } = useMemo(() => {
        const values = candles.map(c => c.close);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        const pointsStr = values
            .map((v, i) => {
                const x = (i / (values.length - 1)) * 100;
                const y = 100 - ((v - min) / range) * 100;
                return `${x},${y}`;
            })
            .join(' ');

        const lastValue = values[values.length - 1];
        const lastY = 100 - ((lastValue - min) / range) * 100;

        return {
            points: pointsStr,
            lastPoint: { x: 100, y: lastY }
        };
    }, [candles]);

    return (
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-16"
        >
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="1.6"
                points={points}
            />
            <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="1.8"
                fill={color}
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
    candles,
    assetType = 'stock',
    onClick
}: MarketCardProps) {
    const color = REGIME_COLORS[regime];

    const href = assetType === 'crypto'
        ? `/crypto/${symbol}`
        : assetType === 'forex'
            ? `/forex/${symbol}`
            : `/stocks/${symbol}`;

    // Smart price formatting based on asset type
    const formattedPrice = assetType === 'forex'
        ? price.toFixed(symbol.includes('JPY') ? 3 : 5)
        : assetType === 'crypto'
            ? price < 0.01
                ? `$${price.toFixed(6)}`
                : price < 1
                    ? `$${price.toFixed(4)}`
                    : price < 100
                        ? `$${price.toFixed(2)}`
                        : `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <Link href={href}>
            <div
                onClick={onClick}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/50 p-5 transition-all duration-300 hover:scale-[1.02] hover:border-zinc-700 hover:shadow-2xl cursor-pointer"
                style={{
                    boxShadow: `0 4px 20px -4px ${color}15`
                }}
            >
                {/* Regime glow bar */}
                <div
                    className="absolute top-0 left-0 h-[3px] w-full"
                    style={{
                        backgroundColor: color,
                        boxShadow: `0 0 12px ${color}60, 0 0 24px ${color}30`
                    }}
                />

                {/* Subtle gradient overlay on hover */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at top right, ${color}08, transparent 70%)`
                    }}
                />

                {/* Header */}
                <div className="relative flex items-start justify-between mb-4">
                    <div>
                        <div className="text-white font-bold text-base tracking-tight">
                            {symbol}
                        </div>
                        {name && (
                            <div className="text-xs text-zinc-500 mt-0.5">
                                {name}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span
                            className="px-2.5 py-1 text-xs font-bold rounded-lg backdrop-blur-sm"
                            style={{
                                backgroundColor: color + '18',
                                color: color,
                                border: `1px solid ${color}30`
                            }}
                        >
                            {confidence}
                        </span>
                        <span
                            className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-lg backdrop-blur-sm"
                            style={{
                                backgroundColor: color + '12',
                                color: color,
                                border: `1px solid ${color}25`
                            }}
                        >
                            {regime}
                        </span>
                    </div>
                </div>

                {/* Mini chart with glow */}
                <div className="relative mb-4">
                    <div
                        className="opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                            filter: `drop-shadow(0 2px 8px ${color}20)`
                        }}
                    >
                        <Sparkline candles={candles.slice(-60)} color={color} />
                    </div>
                </div>

                {/* Price row with better styling */}
                <div className="relative flex items-baseline justify-between">
                    <div className="text-2xl font-bold text-white tracking-tight">
                        {formattedPrice}
                    </div>

                    <div
                        className={`flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg ${changePct >= 0
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                    >
                        <span className="text-xs">{changePct >= 0 ? '▲' : '▼'}</span>
                        <span>{Math.abs(changePct).toFixed(2)}%</span>
                    </div>
                </div>

                {/* Bottom shine effect on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
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
