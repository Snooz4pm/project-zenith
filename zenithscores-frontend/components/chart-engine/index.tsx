'use client';

/**
 * ChartEngine - Main chart component wrapper
 * Provides controls for indicators, timeframes, and chart features
 */

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { RegimeType } from '@/lib/types/market';
import type { OHLCV } from '@/lib/market-data/types';

// Dynamic import for performance
const ZenithChartPro = dynamic(() => import('./ZenithChartPro'), { ssr: false });

interface AlgorithmOverlay {
    type: 'entry_zone' | 'invalidation' | 'volatility_compression' | 'support' | 'resistance';
    price?: number;
    min?: number;
    max?: number;
    high?: number;
    low?: number;
    confidence?: number;
    description?: string;
}

interface ChartEngineProps {
    symbol: string;
    data: OHLCV[];
    regime?: RegimeType;
    algorithmOverlays?: AlgorithmOverlay[];
    height?: number;
    onTimeframeChange?: (tf: string) => void;
}

const TIMEFRAMES = ['1m', '5m', '15m', '1H', '4H', '1D', '1W', '1M'];

export default function ChartEngine({
    symbol,
    data,
    regime,
    algorithmOverlays = [],
    height = 500,
    onTimeframeChange,
}: ChartEngineProps) {
    const [showVolume, setShowVolume] = useState(true);
    const [showEMA, setShowEMA] = useState(true);
    const [showBB, setShowBB] = useState(false);
    const [showVolumeProfile, setShowVolumeProfile] = useState(false);
    const [timeframe, setTimeframe] = useState<string>('1D');

    const handleTimeframeChange = (tf: string) => {
        setTimeframe(tf);
        onTimeframeChange?.(tf);
    };

    return (
        <div className="h-full flex flex-col bg-[#0A0A12] rounded-xl overflow-hidden">
            {/* Header Controls */}
            <div className="px-4 py-3 border-b border-gray-800/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-white">{symbol}</h2>
                    <span className="text-sm text-gray-500">
                        {data.length} candles • {timeframe}
                    </span>
                </div>

                {/* Indicator Toggles */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowEMA(!showEMA)}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${showEMA
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        EMA
                    </button>
                    <button
                        onClick={() => setShowBB(!showBB)}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${showBB
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        BB
                    </button>
                    <button
                        onClick={() => setShowVolume(!showVolume)}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${showVolume
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        Vol
                    </button>
                    <button
                        onClick={() => setShowVolumeProfile(!showVolumeProfile)}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${showVolumeProfile
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        Profile
                    </button>
                </div>
            </div>

            {/* Main Chart */}
            <div className="flex-1 relative">
                <ZenithChartPro
                    data={data}
                    regime={regime}
                    algorithmOverlays={algorithmOverlays}
                    height={height - 100}
                    showVolume={showVolume}
                    showEMA={showEMA}
                    showBB={showBB}
                    showVolumeProfile={showVolumeProfile}
                    enableZoom={true}
                    enablePan={true}
                />
            </div>

            {/* Timeframe Bar */}
            <div className="px-4 py-3 border-t border-gray-800/50">
                <div className="flex items-center gap-1">
                    {TIMEFRAMES.map((tf) => (
                        <button
                            key={tf}
                            onClick={() => handleTimeframeChange(tf)}
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${timeframe === tf
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-800/50 text-gray-500 hover:text-white hover:bg-gray-700/50'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
