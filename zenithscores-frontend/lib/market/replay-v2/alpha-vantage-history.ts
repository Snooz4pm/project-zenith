/**
 * ALPHA VANTAGE HISTORY FETCHER
 * 
 * REPLAY MODE ONLY - Fetches historical OHLCV data ONCE.
 * 
 * RULES:
 * - Fetch once per symbol/range
 * - NO polling
 * - NO auto-refresh
 * - Data is frozen after fetch
 * - NO Finnhub imports
 */

import { Candle } from './types';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

export type HistoryRange = '1M' | '3M' | '6M' | '1Y' | '5Y';

interface AlphaVantageTimeSeries {
    [date: string]: {
        '1. open': string;
        '2. high': string;
        '3. low': string;
        '4. close': string;
        '5. volume'?: string;
        '5. adjusted close'?: string;
        '6. volume'?: string;
    };
}

/**
 * Fetch historical stock data from Alpha Vantage
 * ONE-TIME FETCH - No polling
 */
export async function fetchStockHistory(
    symbol: string,
    range: HistoryRange = '1Y'
): Promise<Candle[]> {
    if (!ALPHA_VANTAGE_API_KEY) {
        console.error('[REPLAY] Alpha Vantage API key not configured');
        return [];
    }

    try {
        // Use daily adjusted for most accuracy
        const outputSize = range === '1M' ? 'compact' : 'full';
        const url = `${BASE_URL}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=${outputSize}&apikey=${ALPHA_VANTAGE_API_KEY}`;

        console.log(`[REPLAY] Fetching history for ${symbol}, range: ${range}`);

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`[REPLAY] Alpha Vantage error: ${response.status}`);
            return [];
        }

        const data = await response.json();

        // Check for rate limit or error
        if (data['Note'] || data['Information'] || data['Error Message']) {
            console.warn('[REPLAY] Alpha Vantage limit/error:', data['Note'] || data['Information'] || data['Error Message']);
            return [];
        }

        const timeSeries: AlphaVantageTimeSeries = data['Time Series (Daily)'];

        if (!timeSeries) {
            console.warn('[REPLAY] No time series data for', symbol);
            return [];
        }

        // Convert to candles array
        const candles: Candle[] = Object.entries(timeSeries)
            .map(([date, values]) => ({
                time: new Date(date).getTime() / 1000, // Unix seconds
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['6. volume'] || values['5. volume'] || '0'),
            }))
            .sort((a, b) => a.time - b.time); // Oldest first

        // Limit based on range
        const rangeLimits: Record<HistoryRange, number> = {
            '1M': 22,   // ~1 month of trading days
            '3M': 65,   // ~3 months
            '6M': 130,  // ~6 months
            '1Y': 252,  // ~1 year
            '5Y': 1260, // ~5 years
        };

        const limited = candles.slice(-rangeLimits[range]);

        console.log(`[REPLAY] Loaded ${limited.length} candles for ${symbol}, range: ${range}`);

        return limited;
    } catch (error) {
        console.error(`[REPLAY] Fetch error for ${symbol}:`, error);
        return [];
    }
}

/**
 * Fetch historical forex data from Alpha Vantage
 * ONE-TIME FETCH - No polling
 */
export async function fetchForexHistory(
    pair: string,
    range: HistoryRange = '1Y'
): Promise<Candle[]> {
    if (!ALPHA_VANTAGE_API_KEY) {
        console.error('[REPLAY] Alpha Vantage API key not configured');
        return [];
    }

    try {
        // Parse pair: EUR/USD -> from=EUR, to=USD
        const normalized = pair.replace('/', '');
        const fromCurrency = normalized.slice(0, 3);
        const toCurrency = normalized.slice(3, 6) || 'USD';

        const outputSize = range === '1M' ? 'compact' : 'full';
        const url = `${BASE_URL}?function=FX_DAILY&from_symbol=${fromCurrency}&to_symbol=${toCurrency}&outputsize=${outputSize}&apikey=${ALPHA_VANTAGE_API_KEY}`;

        console.log(`[REPLAY] Fetching forex history for ${fromCurrency}/${toCurrency}`);

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`[REPLAY] Alpha Vantage forex error: ${response.status}`);
            return [];
        }

        const data = await response.json();

        if (data['Note'] || data['Information'] || data['Error Message']) {
            console.warn('[REPLAY] Alpha Vantage limit/error:', data['Note'] || data['Information'] || data['Error Message']);
            return [];
        }

        const timeSeries: AlphaVantageTimeSeries = data['Time Series FX (Daily)'];

        if (!timeSeries) {
            console.warn('[REPLAY] No forex time series data for', pair);
            return [];
        }

        const candles: Candle[] = Object.entries(timeSeries)
            .map(([date, values]) => ({
                time: new Date(date).getTime() / 1000,
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: 0, // Forex has no volume in this API
            }))
            .sort((a, b) => a.time - b.time);

        const rangeLimits: Record<HistoryRange, number> = {
            '1M': 22,
            '3M': 65,
            '6M': 130,
            '1Y': 252,
            '5Y': 1260,
        };

        const limited = candles.slice(-rangeLimits[range]);

        console.log(`[REPLAY] Loaded ${limited.length} forex candles for ${pair}`);

        return limited;
    } catch (error) {
        console.error(`[REPLAY] Forex fetch error for ${pair}:`, error);
        return [];
    }
}

/**
 * Unified history fetcher
 */
export async function fetchHistory(
    symbol: string,
    assetType: 'stock' | 'forex',
    range: HistoryRange = '1Y'
): Promise<Candle[]> {
    if (assetType === 'forex') {
        return fetchForexHistory(symbol, range);
    }
    return fetchStockHistory(symbol, range);
}
