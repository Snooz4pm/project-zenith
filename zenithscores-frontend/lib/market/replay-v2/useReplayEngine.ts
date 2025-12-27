/**
 * useReplayEngine Hook
 * 
 * REPLAY MODE ONLY - Wraps ReplayEngineV2 with React state.
 * 
 * RULES:
 * - Fetch history ONCE on mount
 * - NO API calls during playback
 * - NO Finnhub imports
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Candle, ReplaySpeed, ReplayStatus } from '@/lib/market/replay-v2/types';
import { ReplayEngineV2 } from '@/lib/market/replay-v2/replay-engine';
import { fetchHistory, HistoryRange } from '@/lib/market/replay-v2/alpha-vantage-history';

interface UseReplayEngineOptions {
    symbol: string;
    assetType: 'stock' | 'forex';
    range?: HistoryRange;
    enabled?: boolean;
}

interface UseReplayEngineReturn {
    // State
    candles: Candle[];
    currentCandle: Candle | null;
    interpolatedPrice: number;
    status: ReplayStatus;
    isLoading: boolean;
    error: string | null;

    // Controls
    play: () => void;
    pause: () => void;
    stop: () => void;
    seek: (index: number) => void;
    setSpeed: (speed: ReplaySpeed) => void;
}

export function useReplayEngine({
    symbol,
    assetType,
    range = '1Y',
    enabled = true,
}: UseReplayEngineOptions): UseReplayEngineReturn {
    const [candles, setCandles] = useState<Candle[]>([]);
    const [currentCandle, setCurrentCandle] = useState<Candle | null>(null);
    const [interpolatedPrice, setInterpolatedPrice] = useState(0);
    const [status, setStatus] = useState<ReplayStatus>({
        isPlaying: false,
        currentIndex: 0,
        total: 0,
        currentTimestamp: 0,
        displayTime: '--',
        progress: 0,
        speed: 1,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const engineRef = useRef<ReplayEngineV2 | null>(null);
    const mountedRef = useRef(true);

    // Tick callback - updates React state from engine
    const handleTick = useCallback((
        candle: Candle,
        price: number,
        _index: number,
        _timestamp: number
    ) => {
        if (!mountedRef.current) return;

        setCurrentCandle(candle);
        setInterpolatedPrice(price);

        if (engineRef.current) {
            setStatus(engineRef.current.getStatus());
        }
    }, []);

    // Load historical data on mount (ONE-TIME)
    useEffect(() => {
        mountedRef.current = true;

        if (!enabled || !symbol) return;

        const loadData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                console.log(`[useReplayEngine] Loading ${symbol} history...`);
                const data = await fetchHistory(symbol, assetType, range);

                if (!mountedRef.current) return;

                if (data.length === 0) {
                    setError('No historical data available');
                    setIsLoading(false);
                    return;
                }

                setCandles(data);

                // Initialize or reload engine
                if (engineRef.current) {
                    engineRef.current.loadData(data);
                } else {
                    engineRef.current = new ReplayEngineV2(data, handleTick);
                }

                // Set initial state
                setCurrentCandle(data[0]);
                setInterpolatedPrice(data[0].close);
                setStatus(engineRef.current.getStatus());
                setIsLoading(false);

                console.log(`[useReplayEngine] Ready with ${data.length} candles`);
            } catch (err) {
                console.error('[useReplayEngine] Load error:', err);
                if (mountedRef.current) {
                    setError('Failed to load historical data');
                    setIsLoading(false);
                }
            }
        };

        loadData();

        return () => {
            mountedRef.current = false;
            if (engineRef.current) {
                engineRef.current.stop();
            }
        };
    }, [symbol, assetType, range, enabled, handleTick]);

    // Control functions
    const play = useCallback(() => {
        engineRef.current?.play();
        if (engineRef.current) {
            setStatus(engineRef.current.getStatus());
        }
    }, []);

    const pause = useCallback(() => {
        engineRef.current?.pause();
        if (engineRef.current) {
            setStatus(engineRef.current.getStatus());
        }
    }, []);

    const stop = useCallback(() => {
        engineRef.current?.stop();
        if (engineRef.current) {
            setStatus(engineRef.current.getStatus());
        }
    }, []);

    const seek = useCallback((index: number) => {
        engineRef.current?.seek(index);
        if (engineRef.current) {
            setStatus(engineRef.current.getStatus());
        }
    }, []);

    const setSpeed = useCallback((speed: ReplaySpeed) => {
        engineRef.current?.setSpeed(speed);
        if (engineRef.current) {
            setStatus(engineRef.current.getStatus());
        }
    }, []);

    return {
        candles,
        currentCandle,
        interpolatedPrice,
        status,
        isLoading,
        error,
        play,
        pause,
        stop,
        seek,
        setSpeed,
    };
}
