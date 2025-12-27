/**
 * BATTLE-TESTED SYMBOL LISTS
 * 
 * Safe for deployment.
 * Stocks: Alpha Vantage GLOBAL_QUOTE
 * Forex: Alpha Vantage CURRENCY_EXCHANGE_RATE
 * Crypto: Dexscreener Search
 */

// ============================================
// STOCKS (Alpha Vantage Safe)
// ============================================

export const SUPPORTED_STOCKS = [
    // Big Tech & Growth
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD', 'NFLX', 'INTC',

    // Finance
    'JPM', 'BAC', 'GS', 'MS', 'V', 'MA', 'PYPL',

    // Consumer / Industrial
    'WMT', 'COST', 'KO', 'PEP', 'DIS', 'MCD', 'NKE', 'SBUX',

    // Energy / Others
    'XOM', 'CVX', 'IBM', 'ORCL',
] as const;

export type SupportedStock = typeof SUPPORTED_STOCKS[number];

// ============================================
// FOREX (Alpha Vantage Safe)
// ============================================

export const SUPPORTED_FOREX = [
    // Majors
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',

    // Crosses
    'EUR/GBP', 'EUR/JPY', 'EUR/CHF', 'GBP/JPY', 'AUD/JPY', 'CHF/JPY',

    // USD Crosses
    'EUR/AUD', 'EUR/CAD', 'GBP/AUD', 'GBP/CAD', 'AUD/CAD',
] as const;

export type SupportedForex = typeof SUPPORTED_FOREX[number];

// ============================================
// CRYPTO (Dexscreener Safe)
// ============================================

export const SUPPORTED_CRYPTO = [
    // Majors
    'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'TRX',

    // Layer 1 / Layer 2
    'AVAX', 'MATIC', 'ARB', 'OP', 'NEAR', 'ATOM', 'FTM',

    // DeFi / Infra
    'LINK', 'UNI', 'AAVE', 'MKR', 'SUSHI',

    // Popular / Liquidity-safe
    'LTC', 'BCH', 'ICP', 'FIL', 'INJ',
] as const;

export type SupportedCrypto = typeof SUPPORTED_CRYPTO[number];

// ============================================
// HELPERS
// ============================================

// Legacy alias to prevent immediate breakage, but explicit about content
export const FINNHUB_STOCKS = SUPPORTED_STOCKS;
export const FINNHUB_FOREX = SUPPORTED_FOREX;

export function getAllSupportedSymbols(assetType: 'stock' | 'forex' | 'crypto'): string[] {
    if (assetType === 'stock') return [...SUPPORTED_STOCKS];
    if (assetType === 'forex') return [...SUPPORTED_FOREX];
    if (assetType === 'crypto') return [...SUPPORTED_CRYPTO];
    return [];
}

export function isSymbolSupported(symbol: string): boolean {
    const s = symbol.toUpperCase();
    return (
        SUPPORTED_STOCKS.includes(s as any) ||
        SUPPORTED_FOREX.includes(s as any) ||
        SUPPORTED_CRYPTO.includes(s as any)
    );
}

export function getDefaultSymbols(assetType: 'stock' | 'forex' | 'crypto'): string[] {
    if (assetType === 'stock') return ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN'];
    if (assetType === 'forex') return ['EUR/USD', 'GBP/USD', 'USD/JPY'];
    if (assetType === 'crypto') return ['BTC', 'ETH', 'SOL', 'BNB'];
    return [];
}
