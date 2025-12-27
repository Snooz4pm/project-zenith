/**
 * SYMBOL VALIDATION
 * 
 * Validates symbol availability before display.
 * Only show supported symbols - no placeholders.
 */

// ============================================
// FINNHUB SUPPORTED STOCKS (LIVE)
// Major US stocks confirmed working
// ============================================

export const FINNHUB_STOCKS = [
    // Technology
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA', 'AMD', 'INTC',
    'CRM', 'ORCL', 'ADBE', 'CSCO', 'QCOM', 'TXN', 'AVGO', 'IBM', 'NOW',

    // Financial
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'C', 'AXP', 'V', 'MA',

    // Healthcare
    'JNJ', 'UNH', 'PFE', 'MRK', 'ABBV', 'LLY', 'TMO', 'ABT', 'DHR', 'BMY',

    // Consumer
    'TSLA', 'HD', 'NKE', 'MCD', 'SBUX', 'DIS', 'NFLX', 'COST', 'WMT', 'TGT',

    // Industrial
    'BA', 'CAT', 'GE', 'MMM', 'UPS', 'HON', 'LMT', 'RTX', 'DE', 'UNP',

    // Energy
    'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'VLO', 'PSX', 'OXY', 'HAL',
] as const;

export type FinnhubStock = typeof FINNHUB_STOCKS[number];

// ============================================
// FINNHUB SUPPORTED FOREX (LIVE)
// Major and cross pairs
// ============================================

export const FINNHUB_FOREX = [
    // Major Pairs
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',

    // Cross Pairs
    'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'CAD/JPY', 'CHF/JPY', 'NZD/JPY',
    'EUR/CHF', 'GBP/CHF', 'EUR/AUD', 'GBP/AUD', 'EUR/CAD', 'GBP/CAD',
] as const;

export type FinnhubForex = typeof FINNHUB_FOREX[number];

// ============================================
// ALPHA VANTAGE COVERAGE (REPLAY)
// Most US stocks have historical data
// ============================================

export const ALPHA_VANTAGE_COVERAGE = {
    stocks: true,  // Most US tickers supported
    forex: true,   // Major pairs supported
    crypto: false, // Not using AV for crypto
} as const;

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Check if stock is supported for LIVE mode
 */
export function isStockSupportedLive(symbol: string): boolean {
    return FINNHUB_STOCKS.includes(symbol.toUpperCase() as FinnhubStock);
}

/**
 * Check if forex pair is supported for LIVE mode
 */
export function isForexSupportedLive(pair: string): boolean {
    const normalized = pair.includes('/') ? pair.toUpperCase() :
        `${pair.slice(0, 3).toUpperCase()}/${pair.slice(3).toUpperCase()}`;
    return FINNHUB_FOREX.includes(normalized as FinnhubForex);
}

/**
 * Check if symbol is supported for REPLAY mode
 */
export function isSymbolSupportedReplay(symbol: string, assetType: 'stock' | 'forex'): boolean {
    // Alpha Vantage supports most standard symbols
    // Only reject obviously invalid ones
    if (!symbol || symbol.length < 1) return false;
    if (symbol.length > 10) return false; // Too long
    return true;
}

/**
 * Unified support checker
 */
export function isSymbolSupported(
    symbol: string,
    assetType: 'stock' | 'forex',
    mode: 'LIVE' | 'REPLAY'
): boolean {
    if (mode === 'LIVE') {
        return assetType === 'stock'
            ? isStockSupportedLive(symbol)
            : isForexSupportedLive(symbol);
    }
    return isSymbolSupportedReplay(symbol, assetType);
}

/**
 * Get default symbols for quick access
 */
export function getDefaultSymbols(assetType: 'stock' | 'forex'): string[] {
    if (assetType === 'forex') {
        return ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'];
    }
    return ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA'];
}

/**
 * Get all supported symbols
 */
export function getAllSupportedSymbols(assetType: 'stock' | 'forex'): string[] {
    if (assetType === 'forex') {
        return [...FINNHUB_FOREX];
    }
    return [...FINNHUB_STOCKS];
}
