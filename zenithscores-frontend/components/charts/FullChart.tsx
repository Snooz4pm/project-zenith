'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { OHLCV } from '@/lib/market-data/types';
import type { OHLCV as OHLCVLegacy, RegimeType, ChartZone, IndicatorType } from '@/lib/types/market';
import { getRegimeDisplay } from '@/lib/analysis/regime';
import { Clock, TrendingUp, Activity, Target, XCircle } from 'lucide-react';

// Dynamic imports
const ZenithChartPro = dynamic(() => import('@/components/chart-engine/ZenithChartPro'), { ssr: false });
const VolumeChart = dynamic(() => import('./VolumeChart'), { ssr: false });

interface FullChartProps {
    ohlcv: OHLCVLegacy[]; // Legacy type with 'timestamp'
    regime: RegimeType;
    entryZone?: { min: number; max: number };
    invalidationLevel?: number;
    className?: string;
}

type Timeframe = '1D' | '1W' | '1M' | '3M' | 'ALL';

export default function FullChart({
    ohlcv,
    regime,
    entryZone,
    invalidationLevel,
    className = '',
}: FullChartProps) {
    const [timeframe, setTimeframe] = useState<Timeframe>('1M');
    const [showVolume, setShowVolume] = useState(true);

    const regimeDisplay = getRegimeDisplay(regime);

    // Filter data based on timeframe
    const getFilteredData = (): OHLCVLegacy[] => {
        const now = Date.now();
        const msPerDay = 24 * 60 * 60 * 1000;

        switch (timeframe) {
            case '1D':
                return ohlcv.filter(d => d.timestamp > now - msPerDay);
            case '1W':
                return ohlcv.filter(d => d.timestamp > now - 7 * msPerDay);
            case '1M':
                return ohlcv.filter(d => d.timestamp > now - 30 * msPerDay);
            case '3M':
                return ohlcv.filter(d => d.timestamp > now - 90 * msPerDay);
            case 'ALL':
            default:
                return ohlcv;
        }
    };

    const chartData = getFilteredData();
    const latestPrice = chartData[chartData.length - 1]?.close ?? 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden ${className}`}
        >
            {/* Chart Header */}
            <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between flex-wrap gap-3">
                {/* Regime Badge */}
                <div className="flex items-center gap-3">
                    <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: regimeDisplay.bgColor }}
                    >
                        <div
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: regimeDisplay.color }}
                        />
                        <span
                            className="text-sm font-medium capitalize"
                            style={{ color: regimeDisplay.color }}
                        >
                            {regimeDisplay.label} Regime
                        </span>
                    </div>

                    <span className="text-lg font-bold text-white">
                        ${latestPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                </div>

                {/* Timeframe Toggle */}
                <div className="flex items-center bg-zinc-800/50 rounded-lg p-1">
                    {(['1D', '1W', '1M', '3M', 'ALL'] as Timeframe[]).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1 text-xs font-medium rounded transition-all ${timeframe === tf
                                ? 'bg-blue-500 text-white'
                                : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Zone Legend */}
            {(entryZone || invalidationLevel) && (
                <div className="px-4 py-2 border-b border-zinc-800/50 flex items-center gap-4 text-xs">
                    {entryZone && (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                            <Target size={12} />
                            <span>Entry Zone: ${entryZone.min.toFixed(2)} - ${entryZone.max.toFixed(2)}</span>
                        </div>
                    )}
                    {invalidationLevel && (
                        <div className="flex items-center gap-1.5 text-red-400">
                            <XCircle size={12} />
                            <span>Invalidation: ${invalidationLevel.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Main Chart */}
            <div className="p-4">
                <div className="h-[350px] w-full">
                    <ZenithChartPro
                        data={chartData.map(d => ({
                            time: Math.floor(d.timestamp / 1000), // Convert ms to seconds
                            open: d.open,
                            high: d.high,
                            low: d.low,
                            close: d.close,
                            volume: d.volume
                        }))}
                    />
                </div>
            </div>

            {/* Volume Chart */}
            {showVolume && (
                <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity size={12} className="text-zinc-500" />
                        <span className="text-xs text-zinc-500">Volume</span>
                    </div>
                    <VolumeChart data={chartData} height={80} />
                </div>
            )}

            {/* Chart Controls */}
            <div className="p-3 border-t border-zinc-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowVolume(!showVolume)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${showVolume
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-zinc-800 text-zinc-500 hover:text-white'
                            }`}
                    >
                        <Activity size={12} />
                        Volume
                    </button>
                </div>

                <span className="text-[10px] text-zinc-600">
                    {chartData.length} candles · Last updated just now
                </span>
            </div>
        </motion.div>
    );
}
