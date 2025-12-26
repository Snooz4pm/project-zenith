'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ArrowLeft, Activity, Clock } from 'lucide-react';
import Link from 'next/link';
import { useOHLCV, getLatestPrice, getPriceChange } from '@/hooks/useOHLCV';
import IntelligencePanel from '@/components/terminal/IntelligencePanel';
import MarketMovers from '@/components/terminal/MarketMovers';
import type { Timeframe, DataRange, AssetType } from '@/lib/market-data/types';
import type { RegimeType } from '@/lib/types/market';

// Dynamic import for chart to avoid SSR issues
const CandlestickChart = dynamic(() => import('@/components/charts/CandlestickChart'), { ssr: false });

interface TerminalViewProps {
    symbol: string;
    name: string;
    assetType: AssetType;
    backLink: string;
    backLabel: string;
}

// Timeframe options
const TIMEFRAMES: { label: string; timeframe: Timeframe; range: DataRange }[] = [
    { label: '1D', timeframe: '15m', range: '1D' },
    { label: '1W', timeframe: '1H', range: '1W' },
    { label: '1M', timeframe: '1D', range: '1M' },
    { label: '3M', timeframe: '1D', range: '3M' },
    { label: '1Y', timeframe: '1D', range: '1Y' },
];

// Mock market movers (TODO: fetch from API)
const MOCK_MOVERS = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 178.50, change: 2.34, changePercent: 1.33, sparkline: [175, 176, 177, 178, 177.5, 178.5] },
    { symbol: 'MSFT', name: 'Microsoft', price: 374.20, change: -1.20, changePercent: -0.32, sparkline: [376, 375, 374, 373, 374, 374.2] },
    { symbol: 'GOOGL', name: 'Alphabet', price: 141.80, change: 3.45, changePercent: 2.49, sparkline: [138, 139, 140, 141, 141.5, 141.8] },
    { symbol: 'AMZN', name: 'Amazon', price: 154.30, change: 1.10, changePercent: 0.72, sparkline: [152, 153, 153.5, 154, 154.2, 154.3] },
    { symbol: 'NVDA', name: 'NVIDIA', price: 495.20, change: 8.50, changePercent: 1.74, sparkline: [485, 488, 490, 492, 494, 495.2] },
];

/**
 * Detect regime from OHLCV data (simplified)
 */
function detectRegime(data: any[]): RegimeType {
    if (data.length < 20) return 'range';

    const recentCloses = data.slice(-20).map(d => d.close);
    const avg = recentCloses.reduce((a, b) => a + b, 0) / recentCloses.length;
    const lastClose = recentCloses[recentCloses.length - 1];
    const firstClose = recentCloses[0];

    const pctChange = (lastClose - firstClose) / firstClose;

    if (pctChange > 0.05) return 'trend';
    if (pctChange > 0.02) return 'breakout';
    if (pctChange < -0.05) return 'breakdown';
    return 'range';
}

/**
 * Calculate mock factors from data
 */
function calculateFactors(data: any[]) {
    if (data.length < 10) {
        return { momentum: 50, volume: 50, volatility: 50, trend: 50 };
    }

    const recent = data.slice(-10);
    const avgVolume = recent.reduce((a, d) => a + d.volume, 0) / recent.length;
    const priceChange = (recent[9].close - recent[0].close) / recent[0].close;

    return {
        momentum: Math.min(100, Math.max(0, 50 + priceChange * 500)),
        volume: Math.min(100, Math.max(20, avgVolume > 0 ? 60 : 40)),
        volatility: Math.min(100, Math.max(20, 40 + Math.random() * 30)),
        trend: Math.min(100, Math.max(0, 50 + priceChange * 300)),
    };
}

/**
 * TerminalView - The main chart terminal component
 * Implements Phase 4: Terminal View with 3-panel layout
 */
export default function TerminalView({
    symbol,
    name,
    assetType,
    backLink,
    backLabel,
}: TerminalViewProps) {
    const [selectedTimeframe, setSelectedTimeframe] = useState(2); // Default to 1M
    const { timeframe, range } = TIMEFRAMES[selectedTimeframe];

    const { data, isLoading, error, provider, fetchedAt } = useOHLCV({
        symbol,
        timeframe,
        range,
        assetType,
    });

    // Derived values
    const latestPrice = useMemo(() => getLatestPrice(data), [data]);
    const { change, changePercent } = useMemo(() => getPriceChange(data), [data]);
    const regime = useMemo(() => detectRegime(data), [data]);
    const factors = useMemo(() => calculateFactors(data), [data]);
    const isPositive = change >= 0;

    // Conviction score based on factors
    const convictionScore = Math.round((factors.momentum + factors.trend + factors.volume) / 3);

    return (
        <div className="min-h-screen bg-[#0a0a12] text-white">
            {/* Header */}
            <div className="border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-[1800px] mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href={backLink}
                                className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                            >
                                <ArrowLeft size={20} className="text-gray-400" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold">{symbol}</h1>
                                <p className="text-sm text-gray-500">{name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Price */}
                            <div className="text-right">
                                <motion.div
                                    key={latestPrice}
                                    initial={{ opacity: 0.8 }}
                                    animate={{ opacity: 1 }}
                                    className="text-2xl font-bold font-mono"
                                >
                                    ${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </motion.div>
                                <div className={`text-sm font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                                </div>
                            </div>

                            {/* Timeframe Selector */}
                            <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1">
                                {TIMEFRAMES.map((tf, idx) => (
                                    <button
                                        key={tf.label}
                                        onClick={() => setSelectedTimeframe(idx)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${idx === selectedTimeframe
                                            ? 'bg-white/[0.1] text-white'
                                            : 'text-gray-500 hover:text-gray-300'
                                            }`}
                                    >
                                        {tf.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main 3-Panel Layout */}
            <div className="max-w-[1800px] mx-auto px-4 py-4">
                <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">

                    {/* Left Panel: Market Movers */}
                    <div className="col-span-2 overflow-y-auto">
                        <div className="sticky top-0 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                            <MarketMovers
                                title="Market Movers"
                                movers={MOCK_MOVERS}
                                onSelect={(sym: string) => {
                                    if (sym !== symbol) {
                                        window.location.href = `/stocks/${sym}`;
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Center Panel: Chart */}
                    <div className="col-span-7">
                        <div className="h-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col">
                            {/* Chart Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Activity size={16} className="text-gray-500" />
                                    <span className="text-sm text-gray-400">
                                        {assetType.charAt(0).toUpperCase() + assetType.slice(1)} Chart
                                    </span>
                                    {provider && (
                                        <span className="text-[10px] text-gray-600 px-2 py-0.5 bg-white/[0.03] rounded">
                                            via {provider}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-0.5 bg-[#00d4ff]" />
                                        <span>EMA 20</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-0.5 bg-[#ff6b35]" />
                                        <span>EMA 50</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="flex-1 min-h-[400px]">
                                {isLoading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-gray-500">Loading chart data...</div>
                                    </div>
                                ) : error ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-red-400">{error}</div>
                                    </div>
                                ) : (
                                    <CandlestickChart
                                        data={data as any}
                                        regime={regime}
                                        height={500}
                                        showVolume={true}
                                        showEMA={true}
                                    />
                                )}
                            </div>

                            {/* Footer */}
                            {fetchedAt && (
                                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <Clock size={10} />
                                        Updated {new Date(fetchedAt).toLocaleTimeString()}
                                    </span>
                                    <span>{data.length} candles</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Intelligence */}
                    <div className="col-span-3 overflow-y-auto">
                        <IntelligencePanel
                            symbol={symbol}
                            regime={regime}
                            convictionScore={convictionScore}
                            factors={factors}
                            entryZone={latestPrice > 0 ? { min: latestPrice * 0.98, max: latestPrice * 0.995 } : undefined}
                            invalidationLevel={latestPrice > 0 ? latestPrice * 0.95 : undefined}
                            scenarios={{
                                bullish: regime === 'trend' ? 55 : regime === 'breakout' ? 50 : 35,
                                neutral: regime === 'range' ? 50 : 30,
                                bearish: regime === 'breakdown' ? 55 : 20,
                            }}
                            whatBreaks={
                                regime === 'trend'
                                    ? 'Loss of momentum below EMA 50 would invalidate the current structure.'
                                    : regime === 'breakdown'
                                        ? 'Reclaim of key resistance would shift bias.'
                                        : 'Extended consolidation without resolution increases uncertainty.'
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
