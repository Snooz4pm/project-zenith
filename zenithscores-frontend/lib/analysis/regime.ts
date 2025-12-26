/**
 * Regime Detection Module
 * 
 * IMPORTANT: Regime is an INTERPRETIVE classification derived from OHLCV.
 * It does NOT override or affect v1 conviction score.
 * 
 * Used to categorize market structure for UI display and filtering only.
 */

import type { OHLCV, RegimeType } from '@/lib/types/market';
import {
    calculateEMA,
    calculateATR,
    calculateAverageVolume,
    calculatePercentile,
    getLatestValue
} from './indicators';

/**
 * Regime detection thresholds (tunable)
 */
const THRESHOLDS = {
    breakoutVolatility: 85,     // ATR percentile for breakout
    breakoutVolumeRatio: 1.5,   // Volume vs avg for breakout
    trendStrength: 0.01,        // Min EMA spread for trend
    rangeVolatility: 35,        // Max ATR percentile for range
    rangeMomentum: 0.01,        // Max momentum for range
} as const;

/**
 * Regime metrics computed from OHLCV
 */
export type RegimeMetrics = {
    ema20: number;
    ema50: number;
    ema200: number;
    atr14: number;
    atrPercentile: number;
    volumeRatio: number;
    trendStrength: number;
    momentum: number;
    price: number;
};

/**
 * Compute regime metrics from OHLCV data
 */
export function computeRegimeMetrics(data: OHLCV[]): RegimeMetrics | null {
    if (data.length < 200) {
        // Not enough data for full analysis
        return null;
    }

    const latestPrice = data[data.length - 1].close;
    const latestVolume = data[data.length - 1].volume;

    // Calculate EMAs
    const ema20Values = calculateEMA(data, 20);
    const ema50Values = calculateEMA(data, 50);
    const ema200Values = calculateEMA(data, 200);

    const ema20 = getLatestValue(ema20Values) ?? latestPrice;
    const ema50 = getLatestValue(ema50Values) ?? latestPrice;
    const ema200 = getLatestValue(ema200Values) ?? latestPrice;

    // Calculate ATR and percentile
    const atrValues = calculateATR(data, 14);
    const atr14 = getLatestValue(atrValues) ?? 0;

    // Get historical ATR values for percentile (last 252 periods)
    const historicalATR = atrValues.filter(v => v !== undefined && !isNaN(v)).slice(-252);
    const atrPercentile = calculatePercentile(atr14, historicalATR);

    // Volume analysis
    const avgVolume = calculateAverageVolume(data, 20);
    const volumeRatio = avgVolume > 0 ? latestVolume / avgVolume : 1;

    // Trend strength
    const trendStrength = Math.abs(ema20 - ema50) / latestPrice;

    // Momentum (price vs EMA50)
    const momentum = (latestPrice - ema50) / ema50;

    return {
        ema20,
        ema50,
        ema200,
        atr14,
        atrPercentile,
        volumeRatio,
        trendStrength,
        momentum,
        price: latestPrice,
    };
}

/**
 * Determine market regime from metrics
 * 
 * Classification rules (in priority order):
 * 1. Breakout: High volatility + high volume
 * 2. Trend: Aligned EMAs + sustained momentum
 * 3. Range: Low volatility + low momentum
 * 4. Breakdown: Inverse trend (bearish alignment)
 * 5. Chaos: Everything else
 */
export function detectRegime(metrics: RegimeMetrics): RegimeType {
    const { ema20, ema50, ema200, atrPercentile, volumeRatio, trendStrength, momentum } = metrics;

    // 1. BREAKOUT: Volatility expansion with volume confirmation
    if (atrPercentile > THRESHOLDS.breakoutVolatility && volumeRatio > THRESHOLDS.breakoutVolumeRatio) {
        return 'breakout';
    }

    // 2. TREND (bullish): EMAs aligned upward with strength
    if (ema20 > ema50 && ema50 > ema200 && trendStrength > THRESHOLDS.trendStrength) {
        return 'trend';
    }

    // 3. RANGE: Low volatility coupled with little directional bias
    if (atrPercentile < THRESHOLDS.rangeVolatility && Math.abs(momentum) < THRESHOLDS.rangeMomentum) {
        return 'range';
    }

    // 4. BREAKDOWN (bearish trend): EMAs aligned downward with strength
    if (ema20 < ema50 && ema50 < ema200 && trendStrength > THRESHOLDS.trendStrength) {
        return 'breakdown';
    }

    // 5. CHAOS: No clear structure
    return 'chaos';
}

/**
 * Get regime from OHLCV data (convenience function)
 */
export function getRegimeFromOHLCV(data: OHLCV[]): RegimeType {
    const metrics = computeRegimeMetrics(data);
    if (!metrics) return 'chaos'; // Not enough data
    return detectRegime(metrics);
}

/**
 * Get regime display properties
 */
export function getRegimeDisplay(regime: RegimeType): {
    label: string;
    color: string;
    bgColor: string;
    description: string;
} {
    switch (regime) {
        case 'trend':
            return {
                label: 'Trending',
                color: '#22c55e',
                bgColor: 'rgba(34, 197, 94, 0.1)',
                description: 'Strong directional momentum with aligned structure',
            };
        case 'range':
            return {
                label: 'Ranging',
                color: '#f59e0b',
                bgColor: 'rgba(245, 158, 11, 0.1)',
                description: 'Consolidation phase with low volatility',
            };
        case 'breakout':
            return {
                label: 'Breakout',
                color: '#3b82f6',
                bgColor: 'rgba(59, 130, 246, 0.1)',
                description: 'Volatility expansion with volume confirmation',
            };
        case 'breakdown':
            return {
                label: 'Breakdown',
                color: '#ef4444',
                bgColor: 'rgba(239, 68, 68, 0.1)',
                description: 'Bearish structure with sustained selling pressure',
            };
        case 'chaos':
        default:
            return {
                label: 'Uncertain',
                color: '#6b7280',
                bgColor: 'rgba(107, 114, 128, 0.1)',
                description: 'No clear market structure detected',
            };
    }
}
