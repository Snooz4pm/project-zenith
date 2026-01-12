/**
 * Market Regime Detection - Pillar 1
 * 
 * Classifies market into: TREND_UP, TREND_DOWN, RANGE, CHAOS
 * MUST be called BEFORE any prediction cycle.
 * 
 * Uses simple, explainable metrics:
 * - % of tokens moving > ±1% in window
 * - Mean and median returns
 * - Volatility dispersion
 */

import { MarketRegime, RegimeDetection, TokenPriceHistory } from './types';

// Thresholds for regime classification
const TREND_THRESHOLD = 0.6;    // 60% tokens moving same direction = trend
const CHAOS_THRESHOLD = 0.8;    // 80% tokens moving > ±1% = chaos
const RANGE_VOL_MAX = 0.5;      // Low volatility dispersion = range

/**
 * Detect current market regime from price histories
 */
export function detectRegime(priceHistories: TokenPriceHistory[]): RegimeDetection {
    if (priceHistories.length === 0) {
        return {
            regime: 'CHAOS',
            confidence: 0,
            metrics: {
                percentMoving: 0,
                meanReturn: 0,
                medianReturn: 0,
                volatilityDispersion: 1,
            },
        };
    }

    // Calculate 5-min returns for each token
    const returns: number[] = [];

    for (const history of priceHistories) {
        if (history.prices.length < 2) continue;

        const recent = history.prices[history.prices.length - 1];
        const previous = history.prices[history.prices.length - 2];

        if (previous.price > 0) {
            const returnPct = ((recent.price - previous.price) / previous.price) * 100;
            returns.push(returnPct);
        }
    }

    if (returns.length === 0) {
        return {
            regime: 'CHAOS',
            confidence: 0,
            metrics: {
                percentMoving: 0,
                meanReturn: 0,
                medianReturn: 0,
                volatilityDispersion: 1,
            },
        };
    }

    // Metrics calculation
    const percentMoving = returns.filter(r => Math.abs(r) > 1).length / returns.length;
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const medianReturn = sortedReturns[Math.floor(sortedReturns.length / 2)];

    // Volatility dispersion (std dev of absolute returns)
    const absReturns = returns.map(r => Math.abs(r));
    const meanAbs = absReturns.reduce((a, b) => a + b, 0) / absReturns.length;
    const variance = absReturns.reduce((sum, r) => sum + Math.pow(r - meanAbs, 2), 0) / absReturns.length;
    const volatilityDispersion = Math.sqrt(variance);

    // Classify regime
    const { regime, confidence } = classifyRegime(
        percentMoving,
        meanReturn,
        medianReturn,
        volatilityDispersion,
        returns
    );

    return {
        regime,
        confidence,
        metrics: {
            percentMoving,
            meanReturn,
            medianReturn,
            volatilityDispersion,
        },
    };
}

/**
 * Classify regime based on metrics
 */
function classifyRegime(
    percentMoving: number,
    meanReturn: number,
    medianReturn: number,
    volatilityDispersion: number,
    returns: number[]
): { regime: MarketRegime; confidence: number } {

    // CHAOS: Too many tokens moving erratically
    if (percentMoving > CHAOS_THRESHOLD && volatilityDispersion > 2) {
        return {
            regime: 'CHAOS',
            confidence: Math.min(percentMoving, 1),
        };
    }

    // Count directional bias
    const upCount = returns.filter(r => r > 0.5).length;
    const downCount = returns.filter(r => r < -0.5).length;
    const upRatio = upCount / returns.length;
    const downRatio = downCount / returns.length;

    // TREND_UP: Clear upward momentum
    if (upRatio > TREND_THRESHOLD && meanReturn > 0.5 && medianReturn > 0) {
        return {
            regime: 'TREND_UP',
            confidence: Math.min(upRatio * 1.2, 1),
        };
    }

    // TREND_DOWN: Clear downward momentum
    if (downRatio > TREND_THRESHOLD && meanReturn < -0.5 && medianReturn < 0) {
        return {
            regime: 'TREND_DOWN',
            confidence: Math.min(downRatio * 1.2, 1),
        };
    }

    // RANGE: Low volatility, mixed signals
    if (volatilityDispersion < RANGE_VOL_MAX && percentMoving < 0.4) {
        return {
            regime: 'RANGE',
            confidence: 1 - volatilityDispersion,
        };
    }

    // CHAOS: Default when signals are mixed
    return {
        regime: 'CHAOS',
        confidence: 0.5,
    };
}

/**
 * Check if regime allows trading
 */
export function isRegimeTradeable(regime: MarketRegime): boolean {
    // CHAOS = abort execution
    return regime !== 'CHAOS';
}

/**
 * Get regime-specific thresholds
 */
export function getRegimeThresholds(regime: MarketRegime): {
    saturationDelta: number;       // Learning stop threshold
    opportunityMinimum: number;    // Min opportunity score
    allowFlat: boolean;            // FLAT predictions allowed?
} {
    switch (regime) {
        case 'TREND_UP':
            return { saturationDelta: 0.05, opportunityMinimum: 0.4, allowFlat: false };
        case 'TREND_DOWN':
            return { saturationDelta: 0.05, opportunityMinimum: 0.3, allowFlat: false };
        case 'RANGE':
            return { saturationDelta: 0.02, opportunityMinimum: 0.2, allowFlat: true };
        case 'CHAOS':
            return { saturationDelta: 0, opportunityMinimum: 1, allowFlat: true }; // Block all
    }
}
