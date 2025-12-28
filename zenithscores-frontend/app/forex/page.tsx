'use client';

import Link from 'next/link';
import { Globe } from 'lucide-react';
import { useLivePrice } from '@/lib/market/live';
import {
    REGIME_COLORS,
    deriveRegime,
    deriveVolatility,
    deriveConfidence,
    getRegimeLabel,
    getBias
} from '@/lib/market/regime';

// ALL FOREX PAIRS - Finnhub
const ALL_FOREX = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
    'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'EUR/CHF',
];

// Mini sparkline from simulated candles based on change
function MiniSparkline({ changePct, color }: { changePct: number; color: string }) {
    const trend = changePct >= 0 ? 1 : -1;
    const volatility = Math.min(Math.abs(changePct) / 2, 3);

    // Generate 20 points with noise
    const points = Array.from({ length: 20 }, (_, i) => {
        const base = 50 + (i / 19) * trend * 20;
        const noise = (Math.random() - 0.5) * volatility * 10;
        return Math.max(10, Math.min(90, base + noise));
    });

    const path = points.map((y, i) => `${(i / 19) * 200},${100 - y}`).join(' ');
    const areaPath = `M0,100 L${path} L200,100 Z`;

    return (
        <svg viewBox="0 0 200 100" className="w-full h-12" preserveAspectRatio="none">
            <defs>
                <linearGradient id={`grad-forex-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#grad-forex-${color.replace('#', '')})`} />
            <polyline
                points={path}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ForexCard({ symbol }: { symbol: string }) {
    const data = useLivePrice({ symbol, assetType: 'forex', enabled: true });
    // Convert EUR/USD to EUR-USD for URL
    const urlPair = symbol.replace('/', '-');

    if (data.isLoading) {
        return (
            <div className="relative bg-zinc-900/80 backdrop-blur rounded-xl border border-zinc-800/50 p-4 animate-pulse">
                <div className="h-5 bg-zinc-800 rounded w-20 mb-2" />
                <div className="h-8 bg-zinc-800 rounded w-full mb-2" />
                <div className="h-6 bg-zinc-800 rounded w-28" />
            </div>
        );
    }

    if (data.status === 'DISCONNECTED' && data.price === 0) {
        return (
            <div className="relative bg-zinc-900/80 backdrop-blur rounded-xl border border-red-900/30 p-4">
                <div className="text-sm font-bold text-zinc-400">{symbol}</div>
                <div className="text-xs text-red-400 mt-2">No data available</div>
            </div>
        );
    }

    // Derive market state
    const changePct = data.previousClose > 0
        ? ((data.price - data.previousClose) / data.previousClose) * 100
        : 0;
    const regime = deriveRegime(changePct);
    const volatility = deriveVolatility(changePct);
    const confidence = deriveConfidence(changePct);
    const color = REGIME_COLORS[regime];
    const bias = getBias(regime);

    const showChange = Math.abs(changePct) >= 0.01;

    // Forex prices are typically 4-5 decimal places
    const formattedPrice = data.price.toFixed(symbol.includes('JPY') ? 3 : 5);

    return (
        <Link href={`/forex/${urlPair}`}>
            <div className="relative bg-zinc-900/80 backdrop-blur rounded-xl border border-zinc-800/50 p-4 cursor-pointer overflow-hidden group hover:border-zinc-600 transition-all hover:translate-y-[-2px] hover:shadow-xl">
                {/* Top accent bar */}
                <div
                    className="absolute top-0 left-0 h-[2px] w-full"
                    style={{ backgroundColor: color }}
                />

                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-lg font-bold text-white">{symbol}</h3>
                        <p className="text-xs text-zinc-500">{symbol}</p>
                    </div>

                    {/* Confidence + Regime */}
                    <div className="flex items-center gap-2">
                        <span
                            className="px-2 py-1 rounded-md text-sm font-bold bg-zinc-800 text-white border"
                            style={{ borderColor: color }}
                        >
                            {confidence}
                        </span>
                        <span
                            className="text-xs capitalize px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${color}22`, color }}
                        >
                            {getRegimeLabel(regime)}
                        </span>
                    </div>
                </div>

                {/* Mini Chart */}
                <div className="mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
                    <MiniSparkline changePct={changePct} color={color} />
                </div>

                {/* Price + Change */}
                <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-white">
                        {formattedPrice}
                    </span>
                    {showChange && (
                        <span className={`text-sm font-medium ${changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}% today
                        </span>
                    )}
                </div>

                {/* Bias + Volatility */}
                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                    <span>Bias: <span className="capitalize">{bias}</span></span>
                    <span>·</span>
                    <span>
                        Volatility: <span className={`capitalize ${volatility === 'high' ? 'text-red-400' :
                                volatility === 'medium' ? 'text-amber-400' :
                                    'text-zinc-500'
                            }`}>{volatility}</span>
                    </span>
                </div>
            </div>
        </Link>
    );
}

export default function ForexPage() {
    return (
        <div className="min-h-screen bg-[#0a0a12] text-white pt-20 md:pt-24">
            <main className="container mx-auto px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                        <Globe className="text-amber-400" />
                        Forex
                    </h1>
                    <p className="text-zinc-400 text-sm">
                        {ALL_FOREX.length} currency pairs • Live rates from Finnhub
                    </p>
                </div>

                {/* 2-Column Premium Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ALL_FOREX.map((symbol) => (
                        <ForexCard key={symbol} symbol={symbol} />
                    ))}
                </div>
            </main>
        </div>
    );
}
