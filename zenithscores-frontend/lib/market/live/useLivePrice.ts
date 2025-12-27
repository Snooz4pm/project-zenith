/**
 * useLivePrice Hook
 * 
 * LIVE MODE ONLY - Polls Finnhub for real-time price snapshots.
 * 
 * RULES:
 * - Poll every 5-10 seconds
 * - Track latency and set DELAYED status if >15s old
 * - NO replay state access
 * - NO candle data
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    LivePriceState,
    LiveStatus,
    LIVE_POLL_INTERVAL_MS,
    DELAY_THRESHOLD_MS,
    STALE_THRESHOLD_MS
} from '@/lib/market/live/types';
import { fetchLivePrice } from '@/lib/market/live/finnhub-live';

interface UseLivePriceOptions {
    symbol: string;
    assetType: 'stock' | 'forex';
    enabled?: boolean;
}

interface UseLivePriceReturn extends LivePriceState {
    refresh: () => void;
    isLoading: boolean;
}

function determineStatus(
    latencyMs: number,
    lastFetchedAt: number,
    hasError: boolean
): LiveStatus {
    if (hasError) return 'DISCONNECTED';

    const timeSinceLastFetch = Date.now() - lastFetchedAt;
    if (timeSinceLastFetch > STALE_THRESHOLD_MS) return 'DISCONNECTED';
    if (latencyMs > DELAY_THRESHOLD_MS) return 'DELAYED';

    return 'LIVE';
}

export function useLivePrice({
    symbol,
    assetType,
    enabled = true,
}: UseLivePriceOptions): UseLivePriceReturn {
    const [state, setState] = useState<LivePriceState>({
        symbol,
        price: 0,
        previousClose: 0,
        change: 0,
        changePercent: 0,
        timestamp: 0,
        latencyMs: 0,
        status: 'DISCONNECTED',
        lastFetchedAt: 0,
    });

    const [isLoading, setIsLoading] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);

    const fetchData = useCallback(async () => {
        if (!enabled || !symbol) return;

        try {
            const result = await fetchLivePrice(symbol, assetType);

            if (!mountedRef.current) return;

            if (result) {
                const latencyMs = Date.now() - result.timestamp;
                const now = Date.now();

                setState(prev => ({
                    symbol: result.symbol,
                    price: result.price,
                    previousClose: result.previousClose,
                    change: result.price - result.previousClose,
                    changePercent: ((result.price - result.previousClose) / result.previousClose) * 100,
                    timestamp: result.timestamp,
                    latencyMs,
                    status: determineStatus(latencyMs, now, false),
                    lastFetchedAt: now,
                }));

                setIsLoading(false);
            } else {
                setState(prev => ({
                    ...prev,
                    status: 'DISCONNECTED',
                }));
            }
        } catch (error) {
            console.error('[useLivePrice] Error:', error);
            if (mountedRef.current) {
                setState(prev => ({
                    ...prev,
                    status: 'DISCONNECTED',
                }));
            }
        }
    }, [symbol, assetType, enabled]);

    // Initial fetch and polling
    useEffect(() => {
        mountedRef.current = true;

        if (!enabled) {
            // Clean up when disabled
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Initial fetch
        fetchData();

        // Set up polling
        intervalRef.current = setInterval(fetchData, LIVE_POLL_INTERVAL_MS);

        return () => {
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [fetchData, enabled]);

    // Reset when symbol changes
    useEffect(() => {
        setIsLoading(true);
        setState(prev => ({
            ...prev,
            symbol,
            price: 0,
            status: 'DISCONNECTED',
        }));
    }, [symbol]);

    return {
        ...state,
        refresh: fetchData,
        isLoading,
    };
}
