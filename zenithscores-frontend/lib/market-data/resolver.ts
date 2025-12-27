/**
 * Market Data Resolver
 * Single entry point for all market data requests
 * Auto-detects asset type and routes to correct provider
 */

import type {
    OHLCV,
    OHLCVRequest,
    OHLCVResponse,
    AssetType,
    Timeframe,
    DataRange,
    DataProvider
} from './types';
import {
    normalizeFinnhubCandles,
    generateSyntheticOHLCV,
    cleanOHLCV
} from './normalizer';
import {
    getStockQuote,
    getStockCandles,
    getForexCandles,
    getTimeRange,
    type CandleData
} from '../finnhub';
import { SUPPORTED_CRYPTOS } from '../market/crypto-engine';

// Use centralized crypto list
const CRYPTO_SYMBOLS = new Set([
    ...SUPPORTED_CRYPTOS,
    ...SUPPORTED_CRYPTOS.map(s => s + 'USD')
]);

// Known forex pairs
const FOREX_PAIRS = new Set([
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
    'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'CADJPY', 'CHFJPY', 'NZDJPY',
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'
]);

/**
 * Detect asset type from symbol
 */
export function detectAssetType(symbol: string): AssetType {
    const normalized = symbol.toUpperCase().replace('/', '');

    if (CRYPTO_SYMBOLS.has(normalized) || normalized.endsWith('USD') && normalized.length <= 7) {
        // Check if it's a forex pair instead
        if (FOREX_PAIRS.has(normalized) || FOREX_PAIRS.has(symbol)) {
            return 'forex';
        }
        return 'crypto';
    }

    if (FOREX_PAIRS.has(normalized) || FOREX_PAIRS.has(symbol)) {
        return 'forex';
    }

    // Default to stock
    return 'stock';
}

/**
 * Convert our timeframe to Finnhub resolution
 */
function toFinnhubResolution(timeframe: Timeframe): string {
    const map: Record<Timeframe, string> = {
        '1m': '1',
        '5m': '5',
        '15m': '15',
        '30m': '30',
        '1H': '60',
        '1D': 'D',
        '1W': 'W',
        '1M': 'M',
    };
    return map[timeframe] || 'D';
}

/**
 * Calculate time range from DataRange
 */
function calculateTimeRange(range: DataRange): { from: number; to: number } {
    const now = Math.floor(Date.now() / 1000);
    const day = 24 * 60 * 60;

    const rangeMap: Record<DataRange, number> = {
        '1D': day,
        '1W': 7 * day,
        '1M': 30 * day,
        '3M': 90 * day,
        '6M': 180 * day,
        '1Y': 365 * day,
        '5Y': 5 * 365 * day,
        'ALL': 10 * 365 * day,
    };

    return {
        from: now - rangeMap[range],
        to: now,
    };
}

/**
 * Get timeframe in minutes
 */
function getTimeframeMinutes(timeframe: Timeframe): number {
    const map: Record<Timeframe, number> = {
        '1m': 1,
        '5m': 5,
        '15m': 15,
        '30m': 30,
        '1H': 60,
        '1D': 1440,
        '1W': 10080,
        '1M': 43200,
    };
    return map[timeframe] || 1440;
}

/**
 * Main resolver function - THE entry point for all market data
 */
export async function getOHLCV(
    symbol: string,
    timeframe: Timeframe,
    range: DataRange,
    assetType?: AssetType
): Promise<OHLCVResponse> {
    const detectedType = assetType || detectAssetType(symbol);
    const { from, to } = calculateTimeRange(range);
    const resolution = toFinnhubResolution(timeframe);

    let data: OHLCV[] = [];
    let provider: DataProvider = 'finnhub';

    try {
        switch (detectedType) {
            case 'stock':
                data = await fetchStockOHLCV(symbol, resolution, from, to);
                provider = 'finnhub';
                break;

            case 'crypto':
                data = await fetchCryptoOHLCV(symbol, timeframe, range);
                provider = 'dexscreener';
                break;

            case 'forex':
                data = await fetchForexOHLCV(symbol, resolution, from, to);
                provider = 'finnhub';
                break;
        }
    } catch (error) {
        console.error(`[Resolver] Error fetching ${symbol}:`, error);
    }

    // If no data, generate synthetic
    if (data.length === 0) {
        const quote = await getStockQuote(symbol);
        const currentPrice = quote?.c || 100;
        const count = range === '1D' ? 390 : range === '1W' ? 1000 : 500;
        data = generateSyntheticOHLCV(currentPrice, count, getTimeframeMinutes(timeframe));
        provider = 'finnhub'; // Still from Finnhub quote
    }

    return {
        symbol,
        assetType: detectedType,
        timeframe,
        range,
        data: cleanOHLCV(data),
        provider,
        fetchedAt: Date.now(),
        isCached: false,
    };
}

/**
 * Fetch stock OHLCV from Finnhub
 */
async function fetchStockOHLCV(
    symbol: string,
    resolution: string,
    from: number,
    to: number
): Promise<OHLCV[]> {
    const candles = await getStockCandles(
        symbol,
        resolution as any,
        from,
        to
    );

    if (!candles) return [];
    return normalizeFinnhubCandles(candles);
}

/**
 * Fetch crypto OHLCV
 * Uses crypto-engine for accurate prices (Coinbase/CoinGecko only)
 */
async function fetchCryptoOHLCV(
    symbol: string,
    timeframe: Timeframe,
    range: DataRange
): Promise<OHLCV[]> {
    // Import centralized crypto engine
    const { fetchCryptoPrice } = await import('@/lib/market/crypto-engine');

    const result = await fetchCryptoPrice(symbol);

    if (result && result.price > 0) {
        const upperSymbol = symbol.toUpperCase();
        const volatility = upperSymbol === 'BTC' ? 0.02 : upperSymbol === 'ETH' ? 0.03 : 0.05;
        const count = range === '1D' ? 1440 : range === '1W' ? 2000 : 1000;
        console.log(`[Resolver] ${upperSymbol} OHLCV from ${result.source}: $${result.price}`);
        return generateSyntheticOHLCV(result.price, count, getTimeframeMinutes(timeframe), volatility);
    }

    console.warn(`[Resolver] No price data for ${symbol}`);
    return [];
}

/**
 * Fetch forex OHLCV from Finnhub
 */
async function fetchForexOHLCV(
    symbol: string,
    resolution: string,
    from: number,
    to: number
): Promise<OHLCV[]> {
    // Format symbol for OANDA (Finnhub forex format)
    const formatted = symbol.includes('/')
        ? `OANDA:${symbol.replace('/', '_')}`
        : `OANDA:${symbol.slice(0, 3)}_${symbol.slice(3)}`;

    const candles = await getForexCandles(
        formatted,
        resolution as any,
        from,
        to
    );

    if (!candles) return [];
    return normalizeFinnhubCandles(candles);
}

/**
 * Simple alias for backwards compatibility
 */
export async function fetchMarketData(request: OHLCVRequest): Promise<OHLCVResponse> {
    return getOHLCV(request.symbol, request.timeframe, request.range, request.assetType);
}
