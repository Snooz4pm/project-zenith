'use client';

import { useState, useEffect, useCallback } from 'react';
import type { OHLCV, Timeframe, DataRange, AssetType, OHLCVResponse } from '@/lib/market-data/types';

interface UseOHLCVParams {
    symbol: string;
    timeframe?: Timeframe;
    range?: DataRange;
    assetType?: AssetType;
    enabled?: boolean;
}

interface UseOHLCVResult {
    data: OHLCV[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    provider: string | null;
    fetchedAt: number | null;
}

/**
 * Hook to fetch OHLCV data from the unified market-data API
 * Uses the new getOHLCV resolver under the hood
 */
export function useOHLCV({
    symbol,
    timeframe = '1D',
    range = '1M',
    assetType,
    enabled = true,
}: UseOHLCVParams): UseOHLCVResult {
    const [data, setData] = useState<OHLCV[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [provider, setProvider] = useState<string | null>(null);
    const [fetchedAt, setFetchedAt] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        if (!symbol || !enabled) return;

        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                symbol,
                timeframe,
                range,
            });

            if (assetType) {
                params.set('assetType', assetType);
            }

            const response = await fetch(`/api/market-data/ohlcv?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status}`);
            }

            const result: OHLCVResponse = await response.json();

            setData(result.data);
            setProvider(result.provider);
            setFetchedAt(result.fetchedAt);

        } catch (err) {
            console.error('[useOHLCV] Error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch market data');
            setData([]);
        } finally {
            setIsLoading(false);
        }
    }, [symbol, timeframe, range, assetType, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        isLoading,
        error,
        refetch: fetchData,
        provider,
        fetchedAt,
    };
}

/**
 * Get the latest price from OHLCV data
 */
export function getLatestPrice(data: OHLCV[]): number {
    if (data.length === 0) return 0;
    return data[data.length - 1].close;
}

/**
 * Calculate price change from OHLCV data
 */
export function getPriceChange(data: OHLCV[]): { change: number; changePercent: number } {
    if (data.length < 2) return { change: 0, changePercent: 0 };

    const first = data[0].open;
    const last = data[data.length - 1].close;
    const change = last - first;
    const changePercent = (change / first) * 100;

    return { change, changePercent };
}
