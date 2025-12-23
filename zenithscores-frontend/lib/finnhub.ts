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

// Popular stock symbols
export const POPULAR_STOCKS = [
    'AAPL',  // Apple
    'MSFT',  // Microsoft
    'GOOGL', // Google
    'AMZN',  // Amazon
    'TSLA',  // Tesla
    'META',  // Meta
    'NVDA',  // NVIDIA
    'AMD',   // AMD
    'NFLX',  // Netflix
    'DIS',   // Disney
];

// Major forex pairs
export const MAJOR_FOREX_PAIRS = {
    'EUR/USD': { base: 'EUR', quote: 'USD' },
    'GBP/USD': { base: 'GBP', quote: 'USD' },
    'USD/JPY': { base: 'USD', quote: 'JPY' },
    'USD/CHF': { base: 'USD', quote: 'CHF' },
    'AUD/USD': { base: 'AUD', quote: 'USD' },
    'USD/CAD': { base: 'USD', quote: 'CAD' },
};
