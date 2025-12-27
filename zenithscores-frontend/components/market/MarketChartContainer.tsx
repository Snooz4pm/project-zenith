/**
 * Market Chart Container
 * 
 * Renders either LIVE or REPLAY chart based on mode.
 * Hard separation - no shared state between modes.
 */

'use client';

import { useState, useCallback } from 'react';
import { MarketMode } from '@/lib/market/live/types';
import { useLivePrice } from '@/lib/market/live/useLivePrice';
import { useReplayEngine } from '@/lib/market/replay-v2/useReplayEngine';
import LivePriceIndicator from './LivePriceIndicator';
import ReplayControls from './ReplayControls';
import MarketModeSwitch from './MarketModeSwitch';

interface MarketChartContainerProps {
    symbol: string;
    assetType: 'stock' | 'forex';
    initialMode?: MarketMode;
}

export default function MarketChartContainer({
    symbol,
    assetType,
    initialMode = MarketMode.LIVE,
}: MarketChartContainerProps) {
    const [mode, setMode] = useState(initialMode);

    // LIVE hook - only active in LIVE mode
    const liveData = useLivePrice({
        symbol,
        assetType,
        enabled: mode === MarketMode.LIVE,
    });

    // REPLAY hook - only active in REPLAY mode
    const replayData = useReplayEngine({
        symbol,
        assetType,
        enabled: mode === MarketMode.REPLAY,
    });

    // Mode switch handler - clean teardown
    const handleModeChange = useCallback((newMode: MarketMode) => {
        console.log(`[MarketChart] Switching from ${mode} to ${newMode}`);

        // Pause replay if switching away
        if (mode === MarketMode.REPLAY) {
            replayData.pause();
        }

        setMode(newMode);
    }, [mode, replayData]);

    return (
        <div className="space-y-4">
            {/* Mode Switch */}
            <div className="flex items-center justify-between">
                <MarketModeSwitch
                    mode={mode}
                    onModeChange={handleModeChange}
                />

                {/* Symbol display */}
                <div className="text-sm text-zinc-500">
                    {assetType === 'forex' ? symbol : `${symbol}`}
                </div>
            </div>

            {/* Price Display - Mode-specific */}
            <div className="min-h-[100px]">
                {mode === MarketMode.LIVE ? (
                    // LIVE MODE
                    <LivePriceIndicator
                        price={liveData.price}
                        previousClose={liveData.previousClose}
                        status={liveData.status}
                        delaySeconds={Math.round(liveData.latencyMs / 1000)}
                        symbol={symbol}
                    />
                ) : (
                    // REPLAY MODE
                    <div className="space-y-4">
                        {replayData.isLoading ? (
                            <div className="text-zinc-500">Loading historical data...</div>
                        ) : replayData.error ? (
                            <div className="text-red-400">{replayData.error}</div>
                        ) : (
                            <>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-lg font-semibold text-zinc-400">{symbol}</span>
                                    <span className="text-3xl font-bold text-white tabular-nums">
                                        ${replayData.interpolatedPrice.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                    <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
                                        REPLAY
                                    </span>
                                </div>

                                <ReplayControls
                                    status={replayData.status}
                                    onPlay={replayData.play}
                                    onPause={replayData.pause}
                                    onStop={replayData.stop}
                                    onSeek={replayData.seek}
                                    onSpeedChange={replayData.setSpeed}
                                />
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Chart Placeholder - TODO: Integrate with actual chart library */}
            <div className="h-64 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-center">
                <span className="text-zinc-600">
                    {mode === MarketMode.LIVE
                        ? 'Live Chart (integrate with lightweight-charts)'
                        : `Replay Chart - Candle ${replayData.status.currentIndex + 1}/${replayData.status.total}`
                    }
                </span>
            </div>
        </div>
    );
}
