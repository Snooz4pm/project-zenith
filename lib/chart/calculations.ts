/**
 * Chart Calculation Utilities
 * Pure functions for technical analysis indicators
 */

// Flexible candle type for calculations - works with any OHLCV format
export interface MinimalCandle {
    close: number;
    volume?: number;
    high?: number;
    low?: number;
    [key: string]: any;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMA - Exponential Moving Average
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateEMA(data: MinimalCandle[], period: number): number[] {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);
    let ema = data[0]?.close || 0;

    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            ema = data[i].close;
        } else {
            ema = (data[i].close - ema) * multiplier + ema;
        }
        result.push(i >= period - 1 ? ema : NaN);
    }

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMA - Simple Moving Average
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// SMA - Simple Moving Average
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateSMA(data: MinimalCandle[], period: number): number[] {
    const result: number[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(NaN);
            continue;
        }

        const slice = data.slice(i - period + 1, i + 1);
        const sum = slice.reduce((acc, d) => acc + d.close, 0);
        result.push(sum / period);
    }

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Bollinger Bands
// ═══════════════════════════════════════════════════════════════════════════════

export interface BollingerBands {
    sma: number[];
    upper: number[];
    lower: number[];
}

export function calculateBB(data: MinimalCandle[], period: number = 20, stdDev: number = 2): BollingerBands {
    const sma: number[] = [];
    const upper: number[] = [];
    const lower: number[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(NaN);
            upper.push(NaN);
            lower.push(NaN);
            continue;
        }

        // Calculate SMA
        const slice = data.slice(i - period + 1, i + 1);
        const sum = slice.reduce((acc, d) => acc + d.close, 0);
        const avg = sum / period;

        // Calculate standard deviation
        const variance = slice.reduce((acc, d) => acc + Math.pow(d.close - avg, 2), 0) / period;
        const std = Math.sqrt(variance);

        sma.push(avg);
        upper.push(avg + stdDev * std);
        lower.push(avg - stdDev * std);
    }

    return { sma, upper, lower };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Volume Profile
// ═══════════════════════════════════════════════════════════════════════════════

export interface VolumeProfile {
    prices: number[];
    volumes: number[];
    pocIndex: number; // Point of Control index
}

export function calculateVolumeProfile(data: MinimalCandle[], bins: number = 20): VolumeProfile {
    const prices = data.map(d => d.close);
    const volumes = data.map(d => d.volume || 0);

    // If no data, return empty profile
    if (prices.length === 0) {
        return { prices: [], volumes: [], pocIndex: 0 };
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    const binSize = range / bins || 1; // Prevent division by zero

    const profile: VolumeProfile = {
        prices: [],
        volumes: [],
        pocIndex: 0,
    };

    let maxVolume = 0;

    for (let i = 0; i < bins; i++) {
        const binMin = minPrice + i * binSize;
        const binMax = minPrice + (i + 1) * binSize;

        let binVolume = 0;
        data.forEach((d, idx) => {
            if (d.close >= binMin && d.close < binMax) {
                binVolume += volumes[idx];
            }
        });

        profile.prices.push((binMin + binMax) / 2);
        profile.volumes.push(binVolume);

        if (binVolume > maxVolume) {
            maxVolume = binVolume;
            profile.pocIndex = i;
        }
    }

    return profile;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RSI - Relative Strength Index
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateRSI(data: MinimalCandle[], period: number = 14): number[] {
    const result: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            result.push(NaN);
            continue;
        }

        const change = data[i].close - data[i - 1].close;
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? -change : 0);

        if (i < period) {
            result.push(NaN);
            continue;
        }

        const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

        if (avgLoss === 0) {
            result.push(100);
        } else {
            const rs = avgGain / avgLoss;
            result.push(100 - (100 / (1 + rs)));
        }
    }

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATR - Average True Range
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateATR(data: MinimalCandle[], period: number = 14): number[] {
    const result: number[] = [];
    const trueRanges: number[] = [];

    for (let i = 0; i < data.length; i++) {
        const high = data[i].high || data[i].close;
        const low = data[i].low || data[i].close;
        const prevClose = i > 0 ? data[i - 1].close : data[i].close;

        if (i === 0) {
            trueRanges.push(high - low);
            result.push(NaN);
            continue;
        }

        const tr = Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        );
        trueRanges.push(tr);

        if (i < period - 1) {
            result.push(NaN);
            continue;
        }

        const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
        result.push(atr);
    }

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VWAP - Volume Weighted Average Price
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateVWAP(data: MinimalCandle[]): number[] {
    const result: number[] = [];
    let cumulativeTPV = 0; // Typical Price * Volume
    let cumulativeVolume = 0;

    for (let i = 0; i < data.length; i++) {
        const high = data[i].high || data[i].close;
        const low = data[i].low || data[i].close;
        const volume = data[i].volume || 0;

        const typicalPrice = (high + low + data[i].close) / 3;
        cumulativeTPV += typicalPrice * volume;
        cumulativeVolume += volume;

        result.push(cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice);
    }

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADX - Average Directional Index
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateADX(data: MinimalCandle[], period: number = 14): number[] {
    const result: number[] = [];

    // Arrays for True Range and Directional Movements
    const tr: number[] = [];
    const dmPlus: number[] = [];
    const dmMinus: number[] = [];

    // 1. Calculate TR, +DM, -DM
    for (let i = 0; i < data.length; i++) {
        const high = data[i].high || data[i].close;
        const low = data[i].low || data[i].close;
        const prevClose = i > 0 ? data[i - 1].close : data[i].close;

        if (i === 0) {
            tr.push(high - low);
            dmPlus.push(0);
            dmMinus.push(0);
            continue;
        }

        const prevHigh = data[i - 1].high || data[i - 1].close;
        const prevLow = data[i - 1].low || data[i - 1].close;

        const currentTR = Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        );
        tr.push(currentTR);

        const upMove = high - prevHigh;
        const downMove = prevLow - low;

        if (upMove > downMove && upMove > 0) {
            dmPlus.push(upMove);
        } else {
            dmPlus.push(0);
        }

        if (downMove > upMove && downMove > 0) {
            dmMinus.push(downMove);
        } else {
            dmMinus.push(0);
        }
    }

    // 2. Smoothed TR, +DM, -DM (Wilder's Smoothing)
    // First period is simple sum
    let smoothTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
    let smoothDMPlus = dmPlus.slice(0, period).reduce((a, b) => a + b, 0);
    let smoothDMMinus = dmMinus.slice(0, period).reduce((a, b) => a + b, 0);

    const diPlusArr: number[] = [];
    const diMinusArr: number[] = [];
    const dxArr: number[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(NaN);
            continue;
        }

        if (i >= period) {
            // Wilder's Smoothing: Previous * (period - 1) + Current
            smoothTR = smoothTR - (smoothTR / period) + tr[i];
            smoothDMPlus = smoothDMPlus - (smoothDMPlus / period) + dmPlus[i];
            smoothDMMinus = smoothDMMinus - (smoothDMMinus / period) + dmMinus[i];
        }

        const diPlus = (smoothDMPlus / smoothTR) * 100;
        const diMinus = (smoothDMMinus / smoothTR) * 100;

        diPlusArr.push(diPlus);
        diMinusArr.push(diMinus);

        const sumDI = diPlus + diMinus;
        const dx = sumDI === 0 ? 0 : (Math.abs(diPlus - diMinus) / sumDI) * 100;
        dxArr.push(dx);

        if (i < (period * 2) - 1) {
            result.push(NaN);
        } else if (i === (period * 2) - 1) {
            // First ADX is average of DX
            const adx = dxArr.slice(0, period).reduce((a, b) => a + b, 0) / period;
            result.push(adx);
        } else {
            // Subsequent ADX = ((Prior ADX * (period - 1)) + Current DX) / period
            const prevADX = result[result.length - 1];
            const adx = ((prevADX * (period - 1)) + dx) / period;
            result.push(adx);
        }
    }

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Anchored VWAP
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateAnchoredVWAP(data: MinimalCandle[], anchorIndex: number): number[] {
    const result: number[] = [];
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;

    for (let i = 0; i < data.length; i++) {
        // Before anchor, no value
        if (i < anchorIndex) {
            result.push(NaN);
            continue;
        }

        const candle = data[i];
        // Use HLC3 if possible, else Close
        const high = candle.high ?? candle.close;
        const low = candle.low ?? candle.close;
        const close = candle.close;

        const typicalPrice = (high + low + close) / 3;
        const volume = candle.volume || 0;

        cumulativeTPV += typicalPrice * volume;
        cumulativeVolume += volume;

        if (cumulativeVolume === 0) {
            result.push(typicalPrice);
        } else {
            result.push(cumulativeTPV / cumulativeVolume);
        }
    }

    return result;
}
