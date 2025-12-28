/**
 * CRYPTO LIVE TYPES
 * Dexscreener-specific types for on-chain DEX data.
 * 
 * KEY MINDSET:
 * - Trade-driven updates (NOT tick-by-tick)
 * - Liquidity matters more than price
 * - No trades = no price change (correct behavior)
 */

export type CryptoLiveStatus = 'LIVE' | 'DELAYED' | 'LOW_ACTIVITY' | 'DISCONNECTED';
export type LiquidityTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CryptoLiveState {
    symbol: string;
    pairAddress: string;
    chain: string;
    priceUsd: number;
    priceChange24h: number;
    liquidityUsd: number;
    liquidityTier: LiquidityTier;
    volume24h: number;
    txnsH1: number;           // Transactions in last hour
    lastTradeTime: number;    // Unix ms of last trade
    status: CryptoLiveStatus;
    lastFetchedAt: number;
}

export interface DexscreenerPair {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    txns: {
        m5: { buys: number; sells: number };
        h1: { buys: number; sells: number };
        h6: { buys: number; sells: number };
        h24: { buys: number; sells: number };
    };
    volume: {
        h24: number;
        h6: number;
        h1: number;
        m5: number;
    };
    priceChange: {
        m5: number;
        h1: number;
        h6: number;
        h24: number;
    };
    liquidity: {
        usd: number;
        base: number;
        quote: number;
    };
    fdv?: number;
    pairCreatedAt?: number;
}

// Constants
export const CRYPTO_POLL_INTERVAL_MS = 12000;  // 12 seconds (conservative)
export const LIQUIDITY_HIGH_THRESHOLD = 250000;   // $250k+
export const LIQUIDITY_MEDIUM_THRESHOLD = 50000;  // $50k-$250k
export const LOW_ACTIVITY_THRESHOLD_MS = 300000;  // 5 min no trades = low activity
