/**
 * FINNHUB LIVE SNAPSHOT FETCHER
 * 
 * RULES:
 * - Fetch latest price ONLY
 * - NO candles
 * - NO history
 * - NO caching (no-store)
 * - Validate timestamp freshness
 */

import { LivePriceResult, DELAY_THRESHOLD_MS } from './types';

const BASE_URL = 'https://finnhub.io/api/v1';

/**
 * Get Finnhub API key - reads dynamically to work on both client and server
 */
function getApiKey(): string | undefined {
    // Try server-side first (without NEXT_PUBLIC prefix)
    return process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
}

/**
 * Fetch LIVE stock price snapshot from Finnhub
 * @param symbol Stock ticker (e.g., 'AAPL', 'MSFT')
 */
export async function fetchLiveStockPrice(symbol: string): Promise<LivePriceResult | null> {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('[LIVE] Finnhub API key not configured (check FINNHUB_API_KEY or NEXT_PUBLIC_FINNHUB_API_KEY)');
        return null;
    }

    try {
        const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;

        const response = await fetch(url, {
            cache: 'no-store',  // CRITICAL: Never cache LIVE data
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`[LIVE] Finnhub error: ${response.status}`);
            return null;
        }

        const data = await response.json();

        // Finnhub quote response: { c, h, l, o, pc, t, d, dp }
        // c = current price, t = timestamp (Unix seconds)
        if (!data || typeof data.c !== 'number' || data.c === 0) {
            console.warn(`[LIVE] No data for ${symbol}:`, data);
            return null;
        }

        const apiTimestamp = data.t * 1000; // Convert to ms
        const now = Date.now();
        const latency = now - apiTimestamp;
        const isDelayed = latency > DELAY_THRESHOLD_MS;

        console.log(`[LIVE] Fetched: ${symbol} @ $${data.c.toFixed(2)}, timestamp: ${data.t}, age: ${Math.round(latency / 1000)}s${isDelayed ? ' (DELAYED)' : ''}`);

        return {
            symbol,
            price: data.c,
            previousClose: data.pc,
            high: data.h,
            low: data.l,
            open: data.o,
            timestamp: apiTimestamp,
            isDelayed,
            delaySeconds: Math.round(latency / 1000),
        };
    } catch (error) {
        console.error(`[LIVE] Fetch error for ${symbol}:`, error);
        return null;
    }
}

/**
 * Fetch LIVE forex rate from Finnhub
 * @param pair Forex pair (e.g., 'EUR/USD' or 'EURUSD')
 */
export async function fetchLiveForexPrice(pair: string): Promise<LivePriceResult | null> {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('[LIVE] Finnhub API key not configured');
        return null;
    }

    try {
        // Normalize pair format: EUR/USD -> EUR, USD
        const normalized = pair.replace('/', '');
        const base = normalized.slice(0, 3);
        const quote = normalized.slice(3, 6) || 'USD';

        const url = `${BASE_URL}/forex/rates?base=${base}&token=${apiKey}`;

        const response = await fetch(url, {
            cache: 'no-store',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`[LIVE] Finnhub forex error: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data || !data.quote || typeof data.quote[quote] !== 'number') {
            console.warn(`[LIVE] No forex data for ${pair}:`, data);
            return null;
        }

        const price = data.quote[quote];
        const now = Date.now();

        // Forex rates don't have individual timestamps, use fetch time
        console.log(`[LIVE] Fetched forex: ${base}/${quote} @ ${price.toFixed(5)}`);

        return {
            symbol: `${base}/${quote}`,
            price,
            previousClose: price, // Forex doesn't have "previous close" concept
            high: price,
            low: price,
            open: price,
            timestamp: now,
            isDelayed: false,
            delaySeconds: 0,
        };
    } catch (error) {
        console.error(`[LIVE] Forex fetch error for ${pair}:`, error);
        return null;
    }
}

/**
 * Unified LIVE price fetcher
 */
export async function fetchLivePrice(
    symbol: string,
    assetType: 'stock' | 'forex'
): Promise<LivePriceResult | null> {
    if (assetType === 'forex') {
        return fetchLiveForexPrice(symbol);
    }
    return fetchLiveStockPrice(symbol);
}
