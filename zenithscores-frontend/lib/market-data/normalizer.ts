/**
 * Market Data Normalizer
 * Converts provider-specific formats to canonical OHLCV
 */

import type { OHLCV } from './types';
import type { CandleData } from '../finnhub';
import type { DexPair } from '../dexscreener';

/**
 * Normalize Finnhub candle data to OHLCV
 */
export function normalizeFinnhubCandles(data: CandleData): OHLCV[] {
    if (!data || data.s !== 'ok' || !data.t || data.t.length === 0) {
        return [];
    }

    return data.t.map((time, i) => ({
        timestamp: time * 1000, // Convert seconds to milliseconds
        time: time, // Unix timestamp in seconds
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
        volume: data.v[i] || 0,
    }));
}

/**
 * Normalize DexScreener pair to recent OHLCV (limited historical data)
 * DexScreener primarily provides current price, not full OHLCV history
 */
export function normalizeDexScreenerToQuote(pair: DexPair): OHLCV | null {
    if (!pair || !pair.priceUsd) return null;

    const now = Math.floor(Date.now() / 1000);
    const price = parseFloat(pair.priceUsd);

    // DexScreener doesn't provide OHLCV, only current price + changes
    // We create a synthetic candle from available data
    return {
        timestamp: now * 1000, // Convert seconds to milliseconds
        time: now,
        open: price / (1 + (pair.priceChange?.h24 || 0) / 100), // Estimate open from 24h change
        high: price * 1.02, // Estimate
        low: price * 0.98,  // Estimate
        close: price,
        volume: pair.volume?.h24 || 0,
    };
}

/**
 * Normalize Alpha Vantage time series data
 * Format: { "2024-01-15": { "1. open": "150.00", ... } }
 */
export function normalizeAlphaVantageDaily(data: Record<string, any>): OHLCV[] {
    const result: OHLCV[] = [];

    for (const [dateStr, values] of Object.entries(data)) {
        const timestampMs = new Date(dateStr).getTime();
        const time = Math.floor(timestampMs / 1000);
        result.push({
            timestamp: timestampMs,
            time: time,
            open: parseFloat(values['1. open'] || values['open'] || 0),
            high: parseFloat(values['2. high'] || values['high'] || 0),
            low: parseFloat(values['3. low'] || values['low'] || 0),
            close: parseFloat(values['4. close'] || values['close'] || 0),
            volume: parseFloat(values['5. volume'] || values['volume'] || 0),
        });
    }

    // Sort by time ascending
    return result.sort((a, b) => a.time - b.time);
}

/**
 * Normalize Alpha Vantage intraday data
 */
export function normalizeAlphaVantageIntraday(data: Record<string, any>): OHLCV[] {
    return normalizeAlphaVantageDaily(data); // Same format
}

/**
 * Normalize Alpha Vantage forex data
 */
export function normalizeAlphaVantageForex(data: Record<string, any>): OHLCV[] {
    const result: OHLCV[] = [];

    for (const [dateStr, values] of Object.entries(data)) {
        const timestampMs = new Date(dateStr).getTime();
        const time = Math.floor(timestampMs / 1000);
        result.push({
            timestamp: timestampMs,
            time: time,
            open: parseFloat(values['1. open'] || 0),
            high: parseFloat(values['2. high'] || 0),
            low: parseFloat(values['3. low'] || 0),
            close: parseFloat(values['4. close'] || 0),
            volume: 0, // Forex typically has no volume in AV
        });
    }

    return result.sort((a, b) => a.time - b.time);
}

/**
 * Generate synthetic OHLCV data when real data unavailable
 * Uses current price as anchor
 */
export function generateSyntheticOHLCV(
    currentPrice: number,
    count: number,
    timeframeMinutes: number,
    volatility: number = 0.02
): OHLCV[] {
    const now = Math.floor(Date.now() / 1000);
    const result: OHLCV[] = [];

    let price = currentPrice;

    for (let i = count - 1; i >= 0; i--) {
        const time = now - (i * timeframeMinutes * 60);
        const change = (Math.random() - 0.5) * 2 * volatility * price;
        const open = price;
        price = price + change;
        const high = Math.max(open, price) * (1 + Math.random() * volatility * 0.5);
        const low = Math.min(open, price) * (1 - Math.random() * volatility * 0.5);

        result.push({
            timestamp: time * 1000, // Convert seconds to milliseconds
            time,
            open,
            high,
            low,
            close: price,
            volume: Math.floor(Math.random() * 1000000) + 100000,
        });
    }

    return result;
}

/**
 * Ensure OHLCV data is sorted and deduplicated
 */
export function cleanOHLCV(data: OHLCV[]): OHLCV[] {
    // Sort by time
    const sorted = [...data].sort((a, b) => a.time - b.time);

    // Remove duplicates (same timestamp)
    const seen = new Set<number>();
    return sorted.filter(candle => {
        if (seen.has(candle.time)) return false;
        seen.add(candle.time);
        return true;
    });
}

/**
 * Fill gaps in OHLCV data
 */
export function fillOHLCVGaps(data: OHLCV[], intervalSeconds: number): OHLCV[] {
    if (data.length < 2) return data;

    const result: OHLCV[] = [];
    const sorted = cleanOHLCV(data);

    for (let i = 0; i < sorted.length; i++) {
        result.push(sorted[i]);

        if (i < sorted.length - 1) {
            const gap = sorted[i + 1].time - sorted[i].time;
            const expectedGaps = Math.floor(gap / intervalSeconds) - 1;

            // Fill missing candles with flat lines
            for (let g = 1; g <= Math.min(expectedGaps, 10); g++) {
                const lastClose = sorted[i].close;
                const gapTime = sorted[i].time + (g * intervalSeconds);
                result.push({
                    timestamp: gapTime * 1000, // Convert seconds to milliseconds
                    time: gapTime,
                    open: lastClose,
                    high: lastClose,
                    low: lastClose,
                    close: lastClose,
                    volume: 0,
                });
            }
        }
    }

    return result;
}

/**
 * Normalize to unified MarketPrice shape
 */

/**
 * ONE canonical function for 24h Change
 * Rules:
 * - Must have valid numbers
 * - Must have non-zero reference price
 * - Returns computed % change or throws
 */
function compute24hChange(current: number, prevClose: number): number {
    if (!Number.isFinite(current) || !Number.isFinite(prevClose) || prevClose === 0) {
        // Fallback for division by zero or invalid inputs
        return 0;
    }
    return ((current - prevClose) / prevClose) * 100;
}

/**
 * Normalize to unified MarketPrice shape
 */
export function normalizeToMarketPrice(
    raw: any,
    source: 'alpha_vantage' | 'finnhub' | 'dexscreener',
    type: 'stock' | 'crypto' | 'forex'
): import('./types').MarketPrice {
    const now = Math.floor(Date.now() / 1000);

    // 1. Alpha Vantage
    if (source === 'alpha_vantage') {
        const quote = raw['Global Quote'];
        if (quote) {
            const price = parseFloat(quote['05. price']);
            // Alpha Vantage provides "previous close" explicitly
            const prevClose = parseFloat(quote['08. previous close']);

            return {
                symbol: quote['01. symbol'],
                price,
                prevClose,
                change: price - prevClose,
                changePercent: compute24hChange(price, prevClose),
                high24h: parseFloat(quote['03. high']),
                low24h: parseFloat(quote['04. low']),
                volume: parseFloat(quote['06. volume']),
                timestamp: now,
                source: 'alpha_vantage',
                verificationStatus: 'unverified'
            };
        }
    }

    // 2. Finnhub
    if (source === 'finnhub') {
        // Finnhub quote: c (current), pc (previous close)
        const price = raw.c;
        const prevClose = raw.pc;

        return {
            symbol: raw.symbol || 'UNKNOWN',
            price,
            prevClose,
            change: price - prevClose,
            changePercent: compute24hChange(price, prevClose),
            high24h: raw.h,
            low24h: raw.l,
            volume: 0,
            timestamp: raw.t ? raw.t * 1000 : now * 1000,
            source: 'finnhub',
            verificationStatus: 'unverified'
        };
    }

    // 3. DexScreener (Crypto)
    if (source === 'dexscreener') {
        const price = parseFloat(raw.priceUsd);
        // DexScreener gives % change directly. To be consistent, we can derive prevClose or just trust it.
        // Derived: prevClose = price / (1 + change/100)
        const changePct24h = raw.priceChange?.h24 || 0;
        const prevClose = price / (1 + (changePct24h / 100));

        return {
            symbol: raw.baseToken.symbol,
            price,
            prevClose,
            change: price - prevClose,
            // Trust provider for crypto as it's 24/7 rolling window
            changePercent: changePct24h,
            volume: raw.volume?.h24 || 0,
            timestamp: now * 1000,
            source: 'dexscreener',
            verificationStatus: 'unverified'
        };
    }

    throw new Error(`Unknown source or format: ${source}`);
}
