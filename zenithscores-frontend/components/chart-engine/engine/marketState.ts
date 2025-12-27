/**
 * Zenith Chart Engine - Market State Calculation
 * Pure logic for indicators and regime detection.
 */

import { MarketCandle, DerivedIndicators, RegimeType } from './types';

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(candles: MarketCandle[], period: number): number[] {
    const emaArray: number[] = new Array(candles.length).fill(NaN);
    const k = 2 / (period + 1);

    let ema = candles[0].close;
    emaArray[0] = ema;

    for (let i = 1; i < candles.length; i++) {
        const price = candles[i].close;
        ema = price * k + ema * (1 - k);
        emaArray[i] = ema;
    }

    return emaArray;
}

/**
 * Calculate VWAP (Volume Weighted Average Price)
 * Resets daily for intraday charts, or continuous for daily+
 * For simplicity in this engine, we'll do a rolling VWAP or reset on session breaks if we had session data.
 * Here we implement a simple session-based VWAP anchor logic (reset when time gap > X).
 */
export function calculateVWAP(candles: MarketCandle[]): number[] {
    const vwap: number[] = new Array(candles.length).fill(NaN);

    let cumulativeTPV = 0; // Total Price * Volume
    let cumulativeVol = 0;

    // Detect session breaks (simple heuristic: > 24h gap or different day for intraday)
    // For now, simple continuous cumulative for the visible set (or since start of data)

    for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const typicalPrice = (c.high + c.low + c.close) / 3;

        cumulativeTPV += typicalPrice * c.volume;
        cumulativeVol += c.volume;

        vwap[i] = cumulativeVol === 0 ? typicalPrice : cumulativeTPV / cumulativeVol;
    }

    return vwap;
}

/**
 * Determine Market Regime based on derived factors
 */
export function determineRegime(
    candles: MarketCandle[],
    ema20: number[],
    ema50: number[]
): RegimeType {
    if (candles.length < 50) return 'chaos';

    const last = candles.length - 1;
    const price = candles[last].close;
    const e20 = ema20[last];
    const e50 = ema50[last];

    // Simple trend logic
    const isUptrend = price > e20 && e20 > e50;
    const isDowntrend = price < e20 && e20 < e50;

    // Volatility check (ATR simplified) - compare range to average range
    const range = candles[last].high - candles[last].low;
    // Avg range of last 10
    let sumRange = 0;
    for (let i = 0; i < 10; i++) {
        const idx = last - i;
        if (idx >= 0) sumRange += (candles[idx].high - candles[idx].low);
    }
    const avgRange = sumRange / 10;

    if (range > avgRange * 2.5) {
        return price > candles[last].open ? 'breakout' : 'breakdown';
    }

    if (isUptrend) return 'trend';
    if (isDowntrend) return 'trend'; // Technically downtrend, but 'trend' regime covers both for styling usually, or we distinguish

    // Check for tight range (consolidation)
    if (range < avgRange * 0.5) return 'range';

    return 'chaos';
}

/**
 * Main function to compute full state
 */
export function computeMarketState(candles: MarketCandle[]): DerivedIndicators {
    if (!candles || candles.length === 0) return {};

    const ema20 = calculateEMA(candles, 20);
    const ema50 = calculateEMA(candles, 50);
    // const vwap = calculateVWAP(candles); 

    const regime = determineRegime(candles, ema20, ema50);

    return {
        ema20,
        ema50,
        // vwap,
        regime
    };
}
