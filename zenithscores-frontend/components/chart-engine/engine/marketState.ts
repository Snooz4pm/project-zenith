/**
 * Zenith Chart Engine - Market State Calculation
 * Pure logic for indicators and regime detection.
 */

import { MarketCandle, DerivedIndicators, RegimeType, Indicator } from './types';

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
 * Calculate Simple Moving Average
 */
export function calculateSMA(candles: MarketCandle[], period: number): number[] {
    const sma: number[] = new Array(candles.length).fill(NaN);

    for (let i = period - 1; i < candles.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += candles[i - j].close;
        }
        sma[i] = sum / period;
    }

    return sma;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(candles: MarketCandle[], period: number = 14): number[] {
    const rsi: number[] = new Array(candles.length).fill(NaN);

    if (candles.length < period + 1) return rsi;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = candles[i].close - candles[i - 1].close;
        if (change > 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    rsi[period] = 100 - (100 / (1 + avgGain / (avgLoss || 1)));

    for (let i = period + 1; i < candles.length; i++) {
        const change = candles[i].close - candles[i - 1].close;
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        rsi[i] = 100 - (100 / (1 + avgGain / (avgLoss || 1)));
    }

    return rsi;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(candles: MarketCandle[]): { macd: number[]; signal: number[]; histogram: number[] } {
    const ema12 = calculateEMA(candles, 12);
    const ema26 = calculateEMA(candles, 26);

    const macd = ema12.map((val, i) => val - ema26[i]);

    const signal = new Array(candles.length).fill(NaN);
    const k = 2 / (9 + 1);
    let ema = macd[26];
    signal[26] = ema;

    for (let i = 27; i < candles.length; i++) {
        ema = macd[i] * k + ema * (1 - k);
        signal[i] = ema;
    }

    const histogram = macd.map((val, i) => val - signal[i]);

    return { macd, signal, histogram };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(candles: MarketCandle[], period: number = 20, stdDev: number = 2): { upper: number[]; middle: number[]; lower: number[] } {
    const middle = calculateSMA(candles, period);
    const upper = new Array(candles.length).fill(NaN);
    const lower = new Array(candles.length).fill(NaN);

    for (let i = period - 1; i < candles.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            const diff = candles[i - j].close - middle[i];
            sum += diff * diff;
        }
        const std = Math.sqrt(sum / period);
        upper[i] = middle[i] + stdDev * std;
        lower[i] = middle[i] - stdDev * std;
    }

    return { upper, middle, lower };
}

/**
 * Calculate ATR (Average True Range)
 */
export function calculateATR(candles: MarketCandle[], period: number = 14): number[] {
    const atr: number[] = new Array(candles.length).fill(NaN);
    const tr: number[] = new Array(candles.length).fill(NaN);

    for (let i = 1; i < candles.length; i++) {
        const high = candles[i].high;
        const low = candles[i].low;
        const prevClose = candles[i - 1].close;

        tr[i] = Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        );
    }

    let sum = 0;
    for (let i = 1; i <= period; i++) {
        sum += tr[i];
    }
    atr[period] = sum / period;

    for (let i = period + 1; i < candles.length; i++) {
        atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
    }

    return atr;
}

/**
 * Compute indicators based on configuration
 */
export function computeIndicators(candles: MarketCandle[], indicators: Indicator[]): Record<string, number[]> {
    const result: Record<string, number[]> = {};

    for (const indicator of indicators) {
        if (indicator.visible === false) continue;

        switch (indicator.type) {
            case 'sma':
                result.sma = calculateSMA(candles, indicator.period || 20);
                break;
            case 'ema':
                result.ema = calculateEMA(candles, indicator.period || 50);
                break;
            case 'rsi':
                result.rsi = calculateRSI(candles, indicator.period || 14);
                break;
            case 'macd':
                const macdData = calculateMACD(candles);
                result.macd = macdData.macd;
                result.macdSignal = macdData.signal;
                result.macdHistogram = macdData.histogram;
                break;
            case 'bollinger':
                const bbData = calculateBollingerBands(candles, indicator.period || 20);
                result.bollingerUpper = bbData.upper;
                result.bollingerMiddle = bbData.middle;
                result.bollingerLower = bbData.lower;
                break;
            case 'atr':
                result.atr = calculateATR(candles, indicator.period || 14);
                break;
            case 'vwap':
                result.vwap = calculateVWAP(candles);
                break;
        }
    }

    return result;
}

/**
 * Main function to compute full state
 */
export function computeMarketState(candles: MarketCandle[]): DerivedIndicators {
    if (!candles || candles.length === 0) return {};

    const ema20 = calculateEMA(candles, 20);
    const ema50 = calculateEMA(candles, 50);

    const regime = determineRegime(candles, ema20, ema50);

    return {
        ema20,
        ema50,
        regime
    };
}
