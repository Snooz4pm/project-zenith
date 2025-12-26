/**
 * Factor Explanation Model (NON-AUTHORITATIVE)
 * 
 * NOTE: This model does NOT compute the official convictionScore.
 * It is an explanatory decomposition to help users understand WHY
 * an asset may have received a high score from v1.
 * 
 * The displayed convictionScore ALWAYS comes from v1 API.
 */

import type { OHLCV, FactorStack, FactorValue, RegimeType } from '@/lib/types/market';
import {
    calculateEMA,
    calculateATR,
    calculateAverageVolume,
    calculatePercentile,
    getLatestValue,
    clamp
} from './indicators';
import { computeRegimeMetrics } from './regime';

/**
 * Regime-aware factor weights (for explanation purposes only)
 * These DO NOT affect v1 scoring
 */
const REGIME_WEIGHTS: Record<RegimeType, { m: number; v: number; l: number; t: number }> = {
    trend: { m: 0.35, v: 0.15, l: 0.25, t: 0.25 },
    range: { m: 0.15, v: 0.40, l: 0.25, t: 0.20 },
    breakout: { m: 0.40, v: 0.30, l: 0.20, t: 0.10 },
    breakdown: { m: 0.25, v: 0.25, l: 0.25, t: 0.25 },
    chaos: { m: 0.25, v: 0.25, l: 0.25, t: 0.25 },
};

/**
 * Calculate momentum factor (0-1 scale)
 */
function calculateMomentumFactor(data: OHLCV[]): { value: number; raw: number } {
    if (data.length < 50) return { value: 0.5, raw: 0 };

    const latestPrice = data[data.length - 1].close;
    const ema50Values = calculateEMA(data, 50);
    const ema50 = getLatestValue(ema50Values) ?? latestPrice;

    // Momentum: (price - ema50) / ema50
    const raw = (latestPrice - ema50) / ema50;

    // Normalize to 0-1 (clamp between -5% and +5%)
    const value = clamp((raw + 0.05) / 0.10, 0, 1);

    return { value, raw };
}

/**
 * Calculate volatility factor (0-1 scale, penalizes extremes)
 */
function calculateVolatilityFactor(data: OHLCV[]): { value: number; percentile: number } {
    if (data.length < 14) return { value: 0.5, percentile: 50 };

    const atrValues = calculateATR(data, 14);
    const atr = getLatestValue(atrValues) ?? 0;

    // Get historical ATR for percentile
    const historicalATR = atrValues.filter(v => v !== undefined && !isNaN(v)).slice(-252);
    const percentile = calculatePercentile(atr, historicalATR);

    // Volatility factor: penalize extremes (optimal around 50th percentile)
    const value = 1 - Math.abs(percentile - 50) / 50;

    return { value, percentile };
}

/**
 * Calculate liquidity factor (0-1 scale)
 */
function calculateLiquidityFactor(data: OHLCV[]): { value: number; ratio: number } {
    if (data.length < 20) return { value: 0.5, ratio: 1 };

    const latestVolume = data[data.length - 1].volume;
    const avgVolume = calculateAverageVolume(data, 20);

    // Volume ratio (current / average)
    const ratio = avgVolume > 0 ? latestVolume / avgVolume : 1;

    // Normalize to 0-1 (cap at 2x average)
    const value = clamp(ratio / 2, 0, 1);

    return { value, ratio };
}

/**
 * Calculate trend stability factor (0-1 scale)
 */
function calculateTrendFactor(data: OHLCV[]): { value: number; alignment: string } {
    if (data.length < 200) return { value: 0.5, alignment: 'insufficient data' };

    const ema20Values = calculateEMA(data, 20);
    const ema50Values = calculateEMA(data, 50);
    const ema200Values = calculateEMA(data, 200);

    const ema20 = getLatestValue(ema20Values);
    const ema50 = getLatestValue(ema50Values);
    const ema200 = getLatestValue(ema200Values);

    if (!ema20 || !ema50 || !ema200) {
        return { value: 0.5, alignment: 'calculation error' };
    }

    // Perfect bullish alignment: 20 > 50 > 200
    if (ema20 > ema50 && ema50 > ema200) {
        return { value: 1.0, alignment: 'bullish' };
    }

    // Perfect bearish alignment: 20 < 50 < 200
    if (ema20 < ema50 && ema50 < ema200) {
        return { value: 0.8, alignment: 'bearish' };
    }

    // Mixed alignment
    return { value: 0.4, alignment: 'mixed' };
}

/**
 * Generate human-readable interpretation for a factor
 */
function generateInterpretation(
    factorName: string,
    value: number,
    percentile: number
): string {
    const strength = percentile > 75 ? 'strong' : percentile > 50 ? 'moderate' : percentile > 25 ? 'weak' : 'very weak';

    switch (factorName) {
        case 'momentum':
            if (value > 0.7) return `${strength} bullish momentum, price trading well above moving average`;
            if (value > 0.5) return `Neutral momentum with slight upward bias`;
            if (value > 0.3) return `Neutral momentum with slight downward bias`;
            return `${strength} bearish momentum, price trading below moving average`;

        case 'volatility':
            if (percentile > 75) return `High volatility environment (${percentile}th percentile) - elevated risk`;
            if (percentile > 50) return `Above-average volatility (${percentile}th percentile)`;
            if (percentile > 25) return `Below-average volatility (${percentile}th percentile) - potential compression`;
            return `Low volatility environment (${percentile}th percentile) - breakout potential`;

        case 'liquidity':
            if (value > 0.7) return `Strong volume confirmation, ${Math.round(value * 200)}% of average`;
            if (value > 0.5) return `Above-average volume activity`;
            if (value > 0.3) return `Below-average volume, watch for conviction`;
            return `Low volume environment, reduced conviction`;

        case 'trend':
            if (value >= 1.0) return `Perfect bullish alignment: 20 EMA > 50 EMA > 200 EMA`;
            if (value >= 0.8) return `Bearish alignment: 20 EMA < 50 EMA < 200 EMA`;
            return `Mixed trend signals, EMAs not aligned`;

        default:
            return `Factor value: ${Math.round(value * 100)}/100`;
    }
}

/**
 * Compute complete factor stack from OHLCV data
 */
export function computeFactorStack(data: OHLCV[]): FactorStack {
    const momentum = calculateMomentumFactor(data);
    const volatility = calculateVolatilityFactor(data);
    const liquidity = calculateLiquidityFactor(data);
    const trend = calculateTrendFactor(data);

    // Get historical percentiles for momentum and trend
    // (volatility and liquidity already have their own percentiles)
    const momentumPercentile = Math.round(momentum.value * 100);
    const trendPercentile = Math.round(trend.value * 100);

    return {
        momentum: {
            value: momentum.value,
            percentile: momentumPercentile,
            interpretation: generateInterpretation('momentum', momentum.value, momentumPercentile),
        },
        volatility: {
            value: volatility.value,
            percentile: volatility.percentile,
            interpretation: generateInterpretation('volatility', volatility.value, volatility.percentile),
        },
        liquidity: {
            value: liquidity.value,
            percentile: Math.round(liquidity.value * 100),
            interpretation: generateInterpretation('liquidity', liquidity.value, Math.round(liquidity.value * 100)),
        },
        trend: {
            value: trend.value,
            percentile: trendPercentile,
            interpretation: generateInterpretation('trend', trend.value, trendPercentile),
        },
    };
}

/**
 * Compute volatility and liquidity scores (0-100)
 */
export function computeScores(data: OHLCV[]): { volatilityScore: number; liquidityScore: number } {
    const volatility = calculateVolatilityFactor(data);
    const liquidity = calculateLiquidityFactor(data);

    return {
        volatilityScore: volatility.percentile,
        liquidityScore: Math.round(liquidity.value * 100),
    };
}

/**
 * Get factor weights for a given regime (for display purposes)
 */
export function getRegimeWeights(regime: RegimeType) {
    return REGIME_WEIGHTS[regime];
}
