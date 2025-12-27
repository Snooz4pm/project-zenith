/**
 * LIVE MODE TYPES
 * Strictly for real-time Finnhub snapshot data.
 * NO history. NO candles. NO indicators.
 */

export enum MarketMode {
    LIVE = 'LIVE',
    REPLAY = 'REPLAY',
}

export type LiveStatus = 'LIVE' | 'DELAYED' | 'DISCONNECTED';

export interface LivePriceState {
    symbol: string;
    price: number;
    previousClose: number;
    change: number;
    changePercent: number;
    timestamp: number;      // API timestamp (Unix ms)
    latencyMs: number;      // Date.now() - timestamp
    status: LiveStatus;
    lastFetchedAt: number;  // When we last polled
}

export interface LivePriceResult {
    symbol: string;
    price: number;
    previousClose: number;
    high: number;
    low: number;
    open: number;
    timestamp: number;
    isDelayed: boolean;
    delaySeconds: number;
}

// Constants
export const LIVE_POLL_INTERVAL_MS = 8000;  // 8 seconds
export const DELAY_THRESHOLD_MS = 15000;    // >15s = DELAYED status
export const STALE_THRESHOLD_MS = 60000;    // >60s = DISCONNECTED
