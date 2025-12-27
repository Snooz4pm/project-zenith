// Finnhub API Client - Real-time stock and forex data
// API Documentation: https://finnhub.io/docs/api

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

if (!FINNHUB_API_KEY) {
    console.warn('⚠️ NEXT_PUBLIC_FINNHUB_API_KEY not set! Add to .env');
}

// Stock Quote Response
export interface StockQuote {
    c: number;  // Current price
    h: number;  // High price of the day
    l: number;  // Low price of the day
    o: number;  // Open price of the day
    pc: number; // Previous close price
    t: number;  // Timestamp
    d?: number; // Change
    dp?: number; // Percent change
}

// Forex Rates Response
export interface ForexRates {
    base: string;
    quote: Record<string, number>;
}

// Company News Response
export interface CompanyNews {
    category: string;
    datetime: number;
    headline: string;
    id: number;
    image: string;
    related: string;
    source: string;
    summary: string;
    url: string;
}

/**
 * Get real-time quote for a stock symbol
 * @param symbol Stock ticker (e.g., 'AAPL', 'TSLA', 'MSFT')
 */
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
    try {
        const response = await fetch(
            `${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 60 } } // Cache for 1 minute
        );

        if (!response.ok) {
            throw new Error(`Finnhub API error: ${response.status}`);
        }

        const data: StockQuote = await response.json();

        // Calculate change if not provided
        if (data.c && data.pc) {
            data.d = data.c - data.pc;
            data.dp = ((data.c - data.pc) / data.pc) * 100;
        }

        return data;
    } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
        return null;
    }
}

/**
 * Get real-time forex exchange rates
 * @param base Base currency (default: 'USD')
 */
export async function getForexRates(base: string = 'USD'): Promise<ForexRates | null> {
    try {
        const response = await fetch(
            `${BASE_URL}/forex/rates?base=${base}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 60 } }
        );

        if (!response.ok) {
            throw new Error(`Finnhub API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch forex rates for ${base}:`, error);
        return null;
    }
}

/**
 * Get company news for a stock
 * @param symbol Stock ticker
 * @param from Start date (YYYY-MM-DD)
 * @param to End date (YYYY-MM-DD)
 */
export async function getCompanyNews(
    symbol: string,
    from: string,
    to: string
): Promise<CompanyNews[] | null> {
    try {
        const response = await fetch(
            `${BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 300 } } // Cache for 5 minutes
        );

        if (!response.ok) {
            throw new Error(`Finnhub API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch news for ${symbol}:`, error);
        return null;
    }
}

// Historical Candle Data
export interface CandleData {
    c: number[];  // Close prices
    h: number[];  // High prices
    l: number[];  // Low prices
    o: number[];  // Open prices
    t: number[];  // Timestamps
    v: number[];  // Volume
    s: string;    // Status
}

export type Resolution = '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M';

/**
 * Get historical stock candles (OHLCV)
 * @param symbol Stock ticker
 * @param resolution Timeframe: 1, 5, 15, 30, 60, D, W, M
 * @param from Unix timestamp (seconds)
 * @param to Unix timestamp (seconds)
 */
export async function getStockCandles(
    symbol: string,
    resolution: Resolution = 'D',
    from: number,
    to: number
): Promise<CandleData | null> {
    try {
        const response = await fetch(
            `${BASE_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 60 } } // Cache for 1 minute
        );

        if (!response.ok) {
            throw new Error(`Finnhub API error: ${response.status}`);
        }

        const data: CandleData = await response.json();

        // Check if data is valid
        if (data.s === 'no_data' || !data.t || data.t.length === 0) {
            console.warn(`No candle data available for ${symbol}`);
            return null;
        }

        return data;
    } catch (error) {
        console.error(`Failed to fetch candles for ${symbol}:`, error);
        return null;
    }
}

/**
 * Get historical forex candles
 * @param symbol Forex pair (e.g., 'OANDA:EUR_USD')
 * @param resolution Timeframe
 * @param from Unix timestamp
 * @param to Unix timestamp
 */
export async function getForexCandles(
    symbol: string,
    resolution: Resolution = 'D',
    from: number,
    to: number
): Promise<CandleData | null> {
    try {
        // Finnhub forex format: OANDA:EUR_USD
        const forexSymbol = symbol.includes(':') ? symbol : `OANDA:${symbol.replace('/', '_')}`;

        const response = await fetch(
            `${BASE_URL}/forex/candle?symbol=${forexSymbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 60 } }
        );

        if (!response.ok) {
            throw new Error(`Finnhub API error: ${response.status}`);
        }

        const data: CandleData = await response.json();

        if (data.s === 'no_data' || !data.t || data.t.length === 0) {
            console.warn(`No forex candle data for ${forexSymbol}`);
            return null;
        }

        return data;
    } catch (error) {
        console.error(`Failed to fetch forex candles for ${symbol}:`, error);
        return null;
    }
}

/**
 * Generate realistic historical candle data for charts
 * Uses real current price as anchor and generates believable historical movement
 * @param currentPrice Real current price from Finnhub quote API
 * @param timeframe Timeframe (1m, 5m, 15m, 30m, 1h, 1D, 1W, 1M, 3M, 1Y)
 * @param symbol Asset symbol for volatility estimation
 */
export function generateRealisticCandles(
    currentPrice: number,
    timeframe: string,
    symbol: string
): CandleData {
    const now = Math.floor(Date.now() / 1000);
    const { pointCount, interval, volatility } = getChartConfig(timeframe, symbol);

    const timestamps: number[] = [];
    const opens: number[] = [];
    const highs: number[] = [];
    const lows: number[] = [];
    const closes: number[] = [];
    const volumes: number[] = [];

    // Start from current price and work backwards
    let price = currentPrice;

    // Generate data points from oldest to newest
    for (let i = pointCount - 1; i >= 0; i--) {
        const timestamp = now - (i * interval);
        timestamps.unshift(timestamp);

        // More realistic price movement using Brownian motion
        const drift = -0.0001; // Slight upward drift over time
        const randomWalk = (Math.random() - 0.5) * 2 * volatility;
        const priceChange = price * (drift + randomWalk);

        const open = price;
        price = price + priceChange;

        // Generate high/low with realistic spread
        const spreadPercent = volatility * (0.5 + Math.random() * 0.5);
        const high = Math.max(open, price) * (1 + spreadPercent);
        const low = Math.min(open, price) * (1 - spreadPercent);
        const close = price;

        opens.unshift(open);
        highs.unshift(high);
        lows.unshift(low);
        closes.unshift(close);

        // Realistic volume (higher during market hours)
        const baseVolume = symbol.includes('/') ? 10000000 : 1000000;
        const volumeVariation = 0.5 + Math.random();
        volumes.unshift(Math.floor(baseVolume * volumeVariation));
    }

    // Ensure last close matches current price exactly
    closes[closes.length - 1] = currentPrice;
    highs[highs.length - 1] = Math.max(highs[highs.length - 1], currentPrice);
    lows[lows.length - 1] = Math.min(lows[lows.length - 1], currentPrice);

    return {
        c: closes,
        h: highs,
        l: lows,
        o: opens,
        t: timestamps,
        v: volumes,
        s: 'ok'
    };
}

/**
 * Get chart configuration based on timeframe and asset type
 */
function getChartConfig(timeframe: string, symbol: string) {
    const isForex = symbol.includes('/');
    const isCrypto = ['BTC', 'ETH', 'SOL'].some(c => symbol.includes(c));

    // Base volatility by asset type (%)
    const baseVolatility = isForex ? 0.001 : isCrypto ? 0.02 : 0.005;

    const minute = 60;
    const hour = 60 * 60;
    const day = 24 * 60 * 60;

    switch (timeframe) {
        case '1m':
        case '1M':
            return { pointCount: 60, interval: minute, volatility: baseVolatility * 0.3 };
        case '5m':
        case '5M':
            return { pointCount: 48, interval: 5 * minute, volatility: baseVolatility * 0.5 };
        case '15m':
        case '15M':
            return { pointCount: 48, interval: 15 * minute, volatility: baseVolatility * 0.7 };
        case '30m':
        case '30M':
            return { pointCount: 48, interval: 30 * minute, volatility: baseVolatility };
        case '1h':
        case '1H':
            return { pointCount: 48, interval: hour, volatility: baseVolatility * 1.2 };
        case '1D':
            return { pointCount: 90, interval: 15 * minute, volatility: baseVolatility };
        case '1W':
            return { pointCount: 84, interval: 2 * hour, volatility: baseVolatility * 1.5 };
        case '1M':
            return { pointCount: 90, interval: 8 * hour, volatility: baseVolatility * 2 };
        case '3M':
            return { pointCount: 90, interval: day, volatility: baseVolatility * 2.5 };
        case '1Y':
            return { pointCount: 365, interval: day, volatility: baseVolatility * 3 };
        default:
            return { pointCount: 90, interval: 15 * minute, volatility: baseVolatility };
    }
}

/**
 * Helper: Get timestamp range for different timeframes
 */
export function getTimeRange(timeframe: string): { from: number; to: number; resolution: Resolution } {
    const now = Math.floor(Date.now() / 1000);
    const minute = 60;
    const hour = 60 * 60;
    const day = 24 * 60 * 60;

    switch (timeframe) {
        // Minute intervals (live trading)
        case '1m':
        case '1M':
            return { from: now - hour, to: now, resolution: '1' }; // Last hour with 1-min candles
        case '5m':
        case '5M':
            return { from: now - (4 * hour), to: now, resolution: '5' }; // Last 4 hours with 5-min candles
        case '15m':
        case '15M':
            return { from: now - (12 * hour), to: now, resolution: '15' }; // Last 12 hours with 15-min candles
        case '30m':
        case '30M':
            return { from: now - day, to: now, resolution: '30' }; // Last 24 hours with 30-min candles

        // Hour intervals
        case '1h':
        case '1H':
            return { from: now - (2 * day), to: now, resolution: '60' }; // Last 2 days with 1-hour candles

        // Day/Week/Month intervals
        case '1D':
            return { from: now - day, to: now, resolution: '5' }; // 1 day with 5-min candles
        case '1W':
            return { from: now - (7 * day), to: now, resolution: '30' }; // 1 week with 30-min candles
        case '1M':
            return { from: now - (30 * day), to: now, resolution: '60' }; // 1 month with 1-hour candles
        case '3M':
            return { from: now - (90 * day), to: now, resolution: 'D' }; // 3 months daily
        case '1Y':
            return { from: now - (365 * day), to: now, resolution: 'D' }; // 1 year daily
        case '5Y':
            return { from: now - (5 * 365 * day), to: now, resolution: 'W' }; // 5 years weekly
        default:
            return { from: now - day, to: now, resolution: '5' }; // Default: 1 day
    }
}

/**
 * Batch fetch quotes for multiple symbols
 * @param symbols Array of stock tickers
 */
export async function getBatchQuotes(symbols: string[]): Promise<Record<string, StockQuote | null>> {
    const quotes: Record<string, StockQuote | null> = {};

    // Fetch in parallel but respect rate limits
    const chunks = [];
    for (let i = 0; i < symbols.length; i += 10) {
        chunks.push(symbols.slice(i, i + 10));
    }

    for (const chunk of chunks) {
        const results = await Promise.all(
            chunk.map(symbol => getStockQuote(symbol))
        );

        chunk.forEach((symbol, index) => {
            quotes[symbol] = results[index];
        });

        // Small delay between chunks to avoid rate limiting
        if (chunks.indexOf(chunk) < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return quotes;
}

// ===== COMPREHENSIVE STOCK LISTS BY SECTOR =====

// Technology
export const TECH_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'CSCO', 'QCOM', 'TXN', 'AVGO', 'IBM', 'NOW', 'SNOW', 'PLTR', 'NET'];

// Financials
export const FINANCIAL_STOCKS = ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'USB', 'PNC', 'AXP', 'V', 'MA', 'BLK', 'SCHW', 'SPGI', 'CME'];

// Healthcare
export const HEALTHCARE_STOCKS = ['JNJ', 'UNH', 'PFE', 'ABBV', 'MRK', 'LLY', 'TMO', 'ABT', 'DHR', 'BMY', 'AMGN', 'GILD', 'CVS', 'CI', 'HUM'];

// Consumer
export const CONSUMER_STOCKS = ['WMT', 'COST', 'HD', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW', 'TJX', 'KO', 'PEP', 'PG', 'DIS', 'NFLX', 'TSLA'];

// Industrial
export const INDUSTRIAL_STOCKS = ['BA', 'CAT', 'HON', 'UPS', 'RTX', 'LMT', 'GE', 'MMM', 'DE', 'UNP', 'FDX', 'EMR', 'NSC', 'CSX', 'WM'];

// Energy
export const ENERGY_STOCKS = ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL', 'KMI', 'WMB', 'BKR', 'DVN', 'HES'];

// Combined popular (top 35)
export const POPULAR_STOCKS = [
    ...TECH_STOCKS.slice(0, 10),
    ...FINANCIAL_STOCKS.slice(0, 5),
    ...HEALTHCARE_STOCKS.slice(0, 5),
    ...CONSUMER_STOCKS.slice(0, 10),
    ...ENERGY_STOCKS.slice(0, 5),
];

// All stocks
export const ALL_STOCKS = [...TECH_STOCKS, ...FINANCIAL_STOCKS, ...HEALTHCARE_STOCKS, ...CONSUMER_STOCKS, ...INDUSTRIAL_STOCKS, ...ENERGY_STOCKS];

// ===== COMPREHENSIVE FOREX PAIRS =====

// Major Pairs
export const MAJOR_FOREX_PAIRS = {
    'EUR/USD': { base: 'EUR', quote: 'USD', name: 'Euro / US Dollar' },
    'GBP/USD': { base: 'GBP', quote: 'USD', name: 'British Pound / US Dollar' },
    'USD/JPY': { base: 'USD', quote: 'JPY', name: 'US Dollar / Japanese Yen' },
    'USD/CHF': { base: 'USD', quote: 'CHF', name: 'US Dollar / Swiss Franc' },
    'AUD/USD': { base: 'AUD', quote: 'USD', name: 'Australian Dollar / US Dollar' },
    'USD/CAD': { base: 'USD', quote: 'CAD', name: 'US Dollar / Canadian Dollar' },
    'NZD/USD': { base: 'NZD', quote: 'USD', name: 'New Zealand Dollar / US Dollar' },
};

// Minor/Cross Pairs
export const MINOR_FOREX_PAIRS = {
    'EUR/GBP': { base: 'EUR', quote: 'GBP', name: 'Euro / British Pound' },
    'EUR/JPY': { base: 'EUR', quote: 'JPY', name: 'Euro / Japanese Yen' },
    'EUR/CHF': { base: 'EUR', quote: 'CHF', name: 'Euro / Swiss Franc' },
    'EUR/AUD': { base: 'EUR', quote: 'AUD', name: 'Euro / Australian Dollar' },
    'EUR/CAD': { base: 'EUR', quote: 'CAD', name: 'Euro / Canadian Dollar' },
    'GBP/JPY': { base: 'GBP', quote: 'JPY', name: 'British Pound / Japanese Yen' },
    'GBP/CHF': { base: 'GBP', quote: 'CHF', name: 'British Pound / Swiss Franc' },
    'GBP/AUD': { base: 'GBP', quote: 'AUD', name: 'British Pound / Australian Dollar' },
    'AUD/JPY': { base: 'AUD', quote: 'JPY', name: 'Australian Dollar / Japanese Yen' },
    'AUD/CAD': { base: 'AUD', quote: 'CAD', name: 'Australian Dollar / Canadian Dollar' },
    'CAD/JPY': { base: 'CAD', quote: 'JPY', name: 'Canadian Dollar / Japanese Yen' },
    'CHF/JPY': { base: 'CHF', quote: 'JPY', name: 'Swiss Franc / Japanese Yen' },
    'NZD/JPY': { base: 'NZD', quote: 'JPY', name: 'New Zealand Dollar / Japanese Yen' },
};

// Exotic Pairs
export const EXOTIC_FOREX_PAIRS = {
    'USD/MXN': { base: 'USD', quote: 'MXN', name: 'US Dollar / Mexican Peso' },
    'USD/ZAR': { base: 'USD', quote: 'ZAR', name: 'US Dollar / South African Rand' },
    'USD/SGD': { base: 'USD', quote: 'SGD', name: 'US Dollar / Singapore Dollar' },
    'USD/HKD': { base: 'USD', quote: 'HKD', name: 'US Dollar / Hong Kong Dollar' },
    'USD/NOK': { base: 'USD', quote: 'NOK', name: 'US Dollar / Norwegian Krone' },
    'USD/SEK': { base: 'USD', quote: 'SEK', name: 'US Dollar / Swedish Krona' },
    'USD/TRY': { base: 'USD', quote: 'TRY', name: 'US Dollar / Turkish Lira' },
    'USD/PLN': { base: 'USD', quote: 'PLN', name: 'US Dollar / Polish Zloty' },
    'USD/INR': { base: 'USD', quote: 'INR', name: 'US Dollar / Indian Rupee' },
    'USD/CNY': { base: 'USD', quote: 'CNY', name: 'US Dollar / Chinese Yuan' },
    'USD/BRL': { base: 'USD', quote: 'BRL', name: 'US Dollar / Brazilian Real' },
    'EUR/TRY': { base: 'EUR', quote: 'TRY', name: 'Euro / Turkish Lira' },
    'EUR/PLN': { base: 'EUR', quote: 'PLN', name: 'Euro / Polish Zloty' },
    'EUR/NOK': { base: 'EUR', quote: 'NOK', name: 'Euro / Norwegian Krone' },
    'EUR/SEK': { base: 'EUR', quote: 'SEK', name: 'Euro / Swedish Krona' },
};

// All forex pairs combined (40+ pairs)
export const ALL_FOREX_PAIRS = { ...MAJOR_FOREX_PAIRS, ...MINOR_FOREX_PAIRS, ...EXOTIC_FOREX_PAIRS };
// ... existing code ...

/**
 * Unified Price Fetcher for Finnhub
 */
import { MarketPrice } from '@/lib/market-data/types';

export async function fetchPriceFinnhub(symbol: string): Promise<MarketPrice | null> {
    try {
        // Finnhub handles standard tickers well
        const quote = await getStockQuote(symbol);

        if (!quote || quote.c === 0) return null; // Finnhub often returns 0s for invalid symbols

        return {
            symbol,
            price: quote.c,
            change: quote.d || 0,
            changePercent: quote.dp || 0,
            high24h: quote.h,
            low24h: quote.l,
            timestamp: quote.t ? quote.t * 1000 : Date.now(),
            source: 'finnhub',
            verificationStatus: 'unverified'
        };
    } catch (error) {
        console.error('FetchPriceFinnhub Error:', error);
        return null;
    }
}
