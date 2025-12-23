'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStockQuote, getBatchQuotes, StockQuote, POPULAR_STOCKS } from '@/lib/finnhub';

/**
 * Market Data Manager - Handles caching and auto-refresh for stock data
 * Updates every minute to stay within rate limits
 */
export class MarketDataManager {
    private cache = new Map<string, { data: StockQuote; timestamp: number }>();
    private updateInterval = 60000; // 1 minute
    private subscribers = new Set<() => void>();

    /**
     * Get stock data with caching
     */
    async getStockData(symbol: string): Promise<StockQuote | null> {
        const cached = this.cache.get(symbol);
        const now = Date.now();

        // Return cached if fresh (less than 1 minute old)
        if (cached && now - cached.timestamp < this.updateInterval) {
            return cached.data;
        }

        // Fetch fresh data
        const data = await getStockQuote(symbol);
        if (data) {
            this.cache.set(symbol, { data, timestamp: now });
            this.notifySubscribers();
        }

        return data;
    }

    /**
     * Batch fetch multiple stocks
     */
    async getBatchData(symbols: string[]): Promise<Record<string, StockQuote | null>> {
        const now = Date.now();
        const toFetch: string[] = [];
        const results: Record<string, StockQuote | null> = {};

        // Check cache first
        for (const symbol of symbols) {
            const cached = this.cache.get(symbol);
            if (cached && now - cached.timestamp < this.updateInterval) {
                results[symbol] = cached.data;
            } else {
                toFetch.push(symbol);
            }
        }

        // Fetch missing data
        if (toFetch.length > 0) {
            const freshData = await getBatchQuotes(toFetch);

            for (const [symbol, data] of Object.entries(freshData)) {
                if (data) {
                    this.cache.set(symbol, { data, timestamp: now });
                    results[symbol] = data;
                }
            }

            this.notifySubscribers();
        }

        return results;
    }

    /**
     * Subscribe to data updates
     */
    subscribe(callback: () => void) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    /**
     * Notify subscribers of updates
     */
    private notifySubscribers() {
        this.subscribers.forEach(callback => callback());
    }

    /**
     * Clear cache for a symbol
     */
    clearCache(symbol?: string) {
        if (symbol) {
            this.cache.delete(symbol);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Get cache size
     */
    getCacheSize(): number {
        return this.cache.size;
    }
}

// Singleton instance
export const marketDataManager = new MarketDataManager();

/**
 * React Hook - Use real-time stock data
 */
export function useStockData(symbol: string) {
    const [data, setData] = useState<StockQuote | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const quote = await marketDataManager.getStockData(symbol);
            setData(quote);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
        } finally {
            setLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        fetchData();

        // Subscribe to updates
        const unsubscribe = marketDataManager.subscribe(fetchData);

        // Auto-refresh every minute
        const interval = setInterval(fetchData, 60000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}

/**
 * React Hook - Use multiple stocks with batch fetching
 */
export function useBatchStockData(symbols: string[]) {
    const [data, setData] = useState<Record<string, StockQuote | null>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const quotes = await marketDataManager.getBatchData(symbols);
            setData(quotes);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
        } finally {
            setLoading(false);
        }
    }, [symbols.join(',')]);

    useEffect(() => {
        fetchData();

        // Subscribe to updates
        const unsubscribe = marketDataManager.subscribe(fetchData);

        // Auto-refresh every minute
        const interval = setInterval(fetchData, 60000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
