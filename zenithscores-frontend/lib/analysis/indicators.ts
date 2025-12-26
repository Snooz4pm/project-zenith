/**
 * Technical Indicator Utilities
 * 
 * Pure functions - no side effects, no state
 * Used to compute derived analytics from OHLCV data
 */

import type { OHLCV } from '@/lib/types/market';

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(data: OHLCV[], period: number): number[] {
    if (data.length === 0) return [];

    const multiplier = 2 / (period + 1);
    const ema: number[] = [];

    // Start with SMA for first value
    let sum = 0;
    for (let i = 0; i < Math.min(period, data.length); i++) {
        sum += data[i].close;
    }
    ema[period - 1] = sum / period;

    // Calculate EMA for remaining values
    for (let i = period; i < data.length; i++) {
        ema[i] = (data[i].close - ema[i - 1]) * multiplier + ema[i - 1];
    }

    return ema;
}

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(data: OHLCV[], period: number): number[] {
    if (data.length < period) return [];

    const sma: number[] = [];

    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j].close;
        }
        sma[i] = sum / period;
    }

    return sma;
}

/**
 * Calculate Average True Range (volatility measure)
 */
export function calculateATR(data: OHLCV[], period: number = 14): number[] {
    if (data.length < 2) return [];

    const trueRanges: number[] = [];
    const atr: number[] = [];

    // Calculate True Range for each period
    for (let i = 1; i < data.length; i++) {
        const high = data[i].high;
        const low = data[i].low;
        const prevClose = data[i - 1].close;

        const tr = Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        );
        trueRanges.push(tr);
    }

    // Calculate ATR using Wilder's smoothing
    if (trueRanges.length >= period) {
        // First ATR is simple average
        let sum = 0;
        for (let i = 0; i < period; i++) {
            sum += trueRanges[i];
        }
        atr[period] = sum / period;

        // Subsequent ATRs use smoothing
        for (let i = period; i < trueRanges.length; i++) {
            atr[i + 1] = (atr[i] * (period - 1) + trueRanges[i]) / period;
        }
    }

    return atr;
}

/**
 * Calculate Volume Weighted Average Price
 */
export function calculateVWAP(data: OHLCV[]): number[] {
    if (data.length === 0) return [];

    const vwap: number[] = [];
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;

    for (let i = 0; i < data.length; i++) {
        const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
        cumulativeTPV += typicalPrice * data[i].volume;
        cumulativeVolume += data[i].volume;

        vwap[i] = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice;
    }

    return vwap;
}

/**
 * Calculate average volume over a period
 */
export function calculateAverageVolume(data: OHLCV[], period: number = 20): number {
    if (data.length === 0) return 0;

    const lookback = Math.min(period, data.length);
    let sum = 0;

    for (let i = data.length - lookback; i < data.length; i++) {
        sum += data[i].volume;
    }

    return sum / lookback;
}

/**
 * Calculate historical percentile of a value
 */
export function calculatePercentile(value: number, historicalValues: number[]): number {
    if (historicalValues.length === 0) return 50;

    const sorted = [...historicalValues].sort((a, b) => a - b);
    let count = 0;

    for (const v of sorted) {
        if (v < value) count++;
    }

    return Math.round((count / sorted.length) * 100);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Get latest valid value from indicator array
 */
export function getLatestValue(values: number[]): number | null {
    for (let i = values.length - 1; i >= 0; i--) {
        if (values[i] !== undefined && !isNaN(values[i])) {
            return values[i];
        }
    }
    return null;
}
