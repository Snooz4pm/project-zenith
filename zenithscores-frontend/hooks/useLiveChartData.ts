import { useState, useEffect, useCallback, useRef } from 'react';
import { OHLCPoint, DataSource, DataFreshness, ChartData } from '@/lib/charts/types';
import { fetchOHLCData } from '@/lib/charts/dataAdapters';
import { calculateDataFreshness } from '@/lib/charts/dataFreshness';
import { applySlidingWindow, mergeNewData } from '@/lib/charts/slidingWindow';

interface UseLiveChartDataProps {
  symbol: string;
  source: DataSource;
  interval: string; // '5min', '1h', etc.
  apiKey?: string;
  pollingInterval?: number; // ms between polls (default: 30000 = 30s)
  maxCandles?: number; // sliding window size (default: 100)
}

interface UseLiveChartDataResult {
  data: OHLCPoint[];
  freshness: DataFreshness;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Live Chart Data Hook
 *
 * Manages:
 * - Real-time data fetching from various sources
 * - Sliding window updates
 * - Freshness detection
 * - Honest delay reporting
 *
 * Trust > Beauty: Always shows real data status
 */
export function useLiveChartData({
  symbol,
  source,
  interval,
  apiKey,
  pollingInterval = 30000,
  maxCandles = 100,
}: UseLiveChartDataProps): UseLiveChartDataResult {
  const [data, setData] = useState<OHLCPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPollTime, setLastPollTime] = useState(Date.now());

  const pollingIntervalRef = useRef(pollingInterval);
  const isMountedRef = useRef(true);

  // Calculate freshness based on latest data
  const freshness: DataFreshness = calculateDataFreshness(
    data[data.length - 1] || null,
    lastPollTime,
    pollingInterval
  );

  // Fetch data from source
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const newData = await fetchOHLCData(source, symbol, interval, apiKey);

      if (!isMountedRef.current) return;

      if (newData.length === 0) {
        setError('No data received from source');
        return;
      }

      setData((prevData) => {
        // Merge new data with sliding window
        const windowConfig = { maxCandles, autoScroll: true };

        // If first fetch, use all data
        if (prevData.length === 0) {
          return applySlidingWindow(newData, windowConfig);
        }

        // Otherwise, merge latest point
        const latestNew = newData[newData.length - 1];
        const intervalMs = getIntervalMs(interval);
        const merged = mergeNewData(prevData, latestNew, intervalMs);

        return applySlidingWindow(merged, windowConfig);
      });

      setLastPollTime(Date.now());
      setIsLoading(false);
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsLoading(false);
      console.error('[useLiveChartData] Fetch error:', err);
    }
  }, [source, symbol, interval, apiKey, maxCandles]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  // Polling effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, pollingInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData, pollingInterval]);

  return {
    data,
    freshness,
    isLoading,
    error,
    refetch: fetchData,
  };
}

/**
 * Convert interval string to milliseconds
 */
function getIntervalMs(interval: string): number {
  const match = interval.match(/^(\d+)(min|m|h|d)$/);

  if (!match) {
    console.warn(`Unknown interval format: ${interval}, defaulting to 5min`);
    return 5 * 60 * 1000;
  }

  const [, value, unit] = match;
  const num = parseInt(value, 10);

  switch (unit) {
    case 'min':
    case 'm':
      return num * 60 * 1000;
    case 'h':
      return num * 60 * 60 * 1000;
    case 'd':
      return num * 24 * 60 * 60 * 1000;
    default:
      return 5 * 60 * 1000;
  }
}
