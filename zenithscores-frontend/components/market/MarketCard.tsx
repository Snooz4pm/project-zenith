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

    return (
        <Link href={href}>
            <div
                onClick={onClick}
                className="relative rounded-xl bg-neutral-950 border border-neutral-800 p-4 transition hover:translate-y-[-2px] hover:shadow-lg cursor-pointer"
            >
                {/* Regime bar */}
                <div
                    className="absolute top-0 left-0 h-[2px] w-full rounded-t-xl"
                    style={{ backgroundColor: color }}
                />

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-white font-semibold text-sm">
                            {symbol}
                        </div>
                        {name && (
                            <div className="text-xs text-neutral-500">
                                {name}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span
                            className="px-2 py-[2px] text-xs font-semibold rounded-md"
                            style={{ backgroundColor: color + '22', color }}
                        >
                            {confidence}
                        </span>
                        <span
                            className="px-2 py-[2px] text-xs rounded-md capitalize"
                            style={{ backgroundColor: color + '22', color }}
                        >
                            {regime}
                        </span>
                    </div>
                </div>

                {/* Mini chart */}
                <div className="mt-3">
                    <Sparkline candles={candles.slice(-60)} color={color} />
                </div>

                {/* Price row */}
                <div className="mt-3 flex items-end justify-between">
                    <div className="text-lg font-semibold text-white">
                        ${price.toLocaleString()}
                    </div>

                    <div
                        className={`text-sm font-medium ${changePct >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                    >
                        {changePct >= 0 ? '+' : ''}
                        {changePct.toFixed(2)}%
                    </div>
                </div>
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
