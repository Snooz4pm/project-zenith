/**
 * Canonical Market Data Types
 * Single source of truth for all market data structures
 */

// Canonical OHLCV format - the ONE format for all charts
export interface OHLCV {
    timestamp: number;
    time: number;    // Unix timestamp (seconds)
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// Asset types
export type AssetType = 'stock' | 'crypto' | 'forex';

// Supported timeframes
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1H' | '1D' | '1W' | '1M';

// Data ranges
export type DataRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';

// Provider types
export type DataProvider = 'finnhub' | 'alpha_vantage' | 'dexscreener';

// Request for market data
export interface OHLCVRequest {
    symbol: string;
    timeframe: Timeframe;
    range: DataRange;
    assetType?: AssetType; // Optional - will auto-detect if not provided
}

// Response from market data
export interface OHLCVResponse {
    symbol: string;
    assetType: AssetType;
    timeframe: Timeframe;
    range: DataRange;
    data: OHLCV[];
    provider: DataProvider;
    fetchedAt: number;
    isCached: boolean;
}

// Asset quote (real-time price)
export interface AssetQuote {
    symbol: string;
    name?: string;
    assetType: AssetType;
    price: number;
    open: number;
    high: number;
    low: number;
    previousClose: number;
    change: number;
    changePercent: number;
    volume?: number;
    marketCap?: number;
    updatedAt: number;
}

// Forex pair info
export interface ForexPair {
    symbol: string;      // e.g., "EURUSD"
    base: string;        // e.g., "EUR"
    quote: string;       // e.g., "USD"
    name: string;        // e.g., "Euro / US Dollar"
}

// Crypto token info
export interface CryptoToken {
    symbol: string;
    name: string;
    chainId?: string;
    address?: string;
    logoUrl?: string;
}

// Cache entry for DB
export interface ChartCacheEntry {
    symbol: string;
    timeframe: Timeframe;
    range: DataRange;
    data: OHLCV[];
    provider: DataProvider;
    createdAt: Date;
    expiresAt: Date;
}

// TTL configuration (in seconds)
export const CACHE_TTL: Record<Timeframe, number> = {
    '1m': 60,           // 1 minute
    '5m': 60 * 2,       // 2 minutes
    '15m': 60 * 5,      // 5 minutes
    '30m': 60 * 10,     // 10 minutes
    '1H': 60 * 30,      // 30 minutes
    '1D': 60 * 60 * 4,  // 4 hours
    '1W': 60 * 60 * 24, // 24 hours
    '1M': 60 * 60 * 24, // 24 hours
};

// Unified Real-Time Price Shape
// Unified Real-Time Price Shape
export type MarketPrice = {
    symbol: string;
    price: number;
    prevClose?: number; // Previous daily close (Stocks/Forex) or 24h ago price (Crypto)
    change: number; // Computed from price - prevClose if available
    changePercent: number; // Computed from (price - prevClose) / prevClose
    high24h?: number;
    low24h?: number;
    volume?: number;
    timestamp: number;
    source: string; // e.g. 'dexscreener:solana', 'alpha_vantage', 'finnhub'
    status?: 'LIVE' | 'CLOSED' | 'STALE';
    verificationStatus?: 'verified' | 'discrepancy' | 'unverified';
};
