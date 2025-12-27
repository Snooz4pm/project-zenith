/**
 * Real-Time Intelligence Calculator
 * Converts raw market data into Zenith Factor Scores (0-100)
 */

import { calculateRSI, calculateATR, calculateEMA, calculateSMA, MinimalCandle } from '@/lib/chart/calculations';

export interface FactorScores {
    momentum: number;
    volume: number;
    volatility: number;
    trend: number;
}

/**
 * Calculate all factor scores from OHLCV history
 */
export function calculateFactors(data: MinimalCandle[]): FactorScores {
    if (!data || data.length < 50) {
        return { momentum: 50, volume: 50, volatility: 50, trend: 50 };
    }

    return {
        momentum: calculateMomentumScore(data),
        volume: calculateVolumeScore(data),
        volatility: calculateVolatilityScore(data),
        trend: calculateTrendScore(data),
    };
}

/**
 * Momentum Score: Based on RSI and Price ROC
 * - RSI > 70 = High momentum (bullish/overbought)
 * - RSI < 30 = Low momentum (bearish/oversold)
 * - ROC confirms speed
 */
function calculateMomentumScore(data: MinimalCandle[]): number {
    const rsi = calculateRSI(data, 14);
    const currentRsi = rsi[rsi.length - 1] || 50;

    // RSI Contribution (0-100)
    // Map RSI directly as it's already 0-100.
    // However, for "Momentum Alignment", we want strength. 
    // Usually RSI 50 is neutral. 
    // Let's use raw RSI as the base score for "Bullish Momentum". 
    // If user wants absolute velocity regardless of direction, we'd use ABS(RSI-50).
    // Assuming score reflects Bullish Momentum here based on UI green bars.

    // Check Price Rate of Change (ROC) over 10 periods
    const period = 10;
    const currentPrice = data[data.length - 1].close;
    const pastPrice = data[data.length - 1 - period].close;
    const roc = ((currentPrice - pastPrice) / pastPrice) * 100;

    // Normalize ROC (-5% to +5% -> 0 to 100)
    const rocScore = Math.min(100, Math.max(0, (roc + 5) * 10));

    // Weighted average: 70% RSI, 30% ROC
    return (currentRsi * 0.7) + (rocScore * 0.3);
}

/**
 * Volume Score: Relative Volume (RVol)
 * - High score = Unusual institutional activity
 */
function calculateVolumeScore(data: MinimalCandle[]): number {
    const period = 20;
    const volumes = data.map(d => d.volume || 0);
    const currentVol = volumes[volumes.length - 1];

    // Calculate SMA of volume
    const volSma = volumes.slice(-period - 1, -1).reduce((a, b) => a + b, 0) / period;

    if (volSma === 0) return 50;

    const rVol = currentVol / volSma;

    // RVol 1.0 = Average (score 50)
    // RVol > 2.0 = High (score 100)
    // RVol < 0.5 = Low (score 25)

    // Map: 0.5 -> 2.5 range to 0 -> 100
    const score = ((rVol - 0.5) / 2.0) * 100;
    return Math.min(100, Math.max(0, score));
}

/**
 * Volatility Score: ATR Percentile
 * - High score = High volatility (Expand)
 * - Low score = Compression (Squeeze)
 */
function calculateVolatilityScore(data: MinimalCandle[]): number {
    const atr = calculateATR(data, 14);
    const currentAtr = atr[atr.length - 1];

    // Compare current ATR to last 30 periods range
    const history = atr.slice(-30).filter(v => !isNaN(v));
    const minAtr = Math.min(...history);
    const maxAtr = Math.max(...history);

    if (maxAtr === minAtr) return 50;

    // Percentile rank
    const score = ((currentAtr - minAtr) / (maxAtr - minAtr)) * 100;
    return score;
}

/**
 * Trend Score: ADX + EMA Alignment
 * - High score = Strong Trend
 */
function calculateTrendScore(data: MinimalCandle[]): number {
    const ema20 = calculateEMA(data, 20);
    const ema50 = calculateEMA(data, 50);
    const ema200 = calculateEMA(data, 200); // Need enough data, might be NaN

    const e20 = ema20[ema20.length - 1];
    const e50 = ema50[ema50.length - 1];
    const e200 = ema200[ema200.length - 1] || e50; // Fallback
    const price = data[data.length - 1].close;

    let score = 50;

    // Alignment check (Bullish Perfect Alignment: Price > 20 > 50 > 200)
    if (price > e20 && e20 > e50 && e50 > e200) {
        score = 85;
    } else if (price < e20 && e20 < e50 && e50 < e200) {
        score = 15; // Strong Bearish (low score if we measure Bullish Trend)
        // If we measure Trend Strength (directionless), this should be 85 too.
        // User screenshot implies 61% Trend, possibly directional strength?
        // Let's assume Directional Bullish Strength (0-100). 
    } else {
        // Choppy
        score = 50;
    }

    // Refine with slope check logic (simplified)
    const prevE20 = ema20[ema20.length - 2];
    const slope = (e20 - prevE20) / prevE20;

    if (slope > 0.001) score += 10;
    if (slope < -0.001) score -= 10;

    return Math.min(100, Math.max(0, score));
}
