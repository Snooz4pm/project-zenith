/**
 * Prediction System - Pillar 2
 * 
 * Generates UP/DOWN/FLAT predictions for tokens.
 * Time horizon: 5 minutes
 * NO ML - uses simple momentum/volatility signals
 */

import {
    PredictionDirection,
    TokenPrediction,
    MarketRegime,
    TokenPriceHistory
} from './types';

// Thresholds for direction classification
const UP_THRESHOLD = 0.3;      // Momentum > 0.3 = UP
const DOWN_THRESHOLD = -0.3;   // Momentum < -0.3 = DOWN
const VOL_SPIKE_MULT = 1.5;    // Volume spike multiplier

// Pillar 10.5: Behavioral Control Knobs
export interface DirectionBias {
    upBias: number;
    downBias: number;
    flatBias: number;
}

/**
 * Generate prediction for a single token
 */
export function predictToken(
    history: TokenPriceHistory,
    regime: MarketRegime,
    allowFlat: boolean,
    bias?: DirectionBias
): TokenPrediction | null {
    if (history.prices.length < 3) {
        return null; // Insufficient data
    }

    const prices = history.prices;
    const recent = prices.slice(-5); // Last 5 data points

    // Calculate momentum (simple: last return direction weighted by recent trend)
    const lastPrice = recent[recent.length - 1].price;
    const prevPrice = recent[recent.length - 2].price;
    const oldPrice = recent[0].price;

    if (oldPrice === 0 || prevPrice === 0) return null;

    const shortMomentum = (lastPrice - prevPrice) / prevPrice;
    const trendMomentum = (lastPrice - oldPrice) / oldPrice;
    const momentum = shortMomentum * 0.6 + trendMomentum * 0.4;

    // Calculate volatility delta (is volatility increasing?)
    const recentReturns = recent.slice(1).map((p, i) =>
        (p.price - recent[i].price) / recent[i].price
    );
    const absReturns = recentReturns.map(r => Math.abs(r));
    const recentVol = absReturns.reduce((a, b) => a + b, 0) / absReturns.length;

    // Compare to older volatility
    const olderPrices = prices.slice(-10, -5);
    let olderVol = 0;
    if (olderPrices.length >= 2) {
        const olderReturns = olderPrices.slice(1).map((p, i) =>
            Math.abs((p.price - olderPrices[i].price) / olderPrices[i].price)
        );
        olderVol = olderReturns.reduce((a, b) => a + b, 0) / olderReturns.length;
    }
    const volatilityDelta = olderVol > 0 ? (recentVol - olderVol) / olderVol : 0;

    // Volume expansion (if available)
    let volumeExpansion = 0;
    const recentVolumes = recent.filter(p => p.volume !== undefined).map(p => p.volume!);
    if (recentVolumes.length >= 2) {
        const avgRecent = recentVolumes.slice(-2).reduce((a, b) => a + b, 0) / 2;
        const avgOlder = recentVolumes.slice(0, -2).reduce((a, b) => a + b, 0) / Math.max(recentVolumes.length - 2, 1);
        volumeExpansion = avgOlder > 0 ? (avgRecent - avgOlder) / avgOlder : 0;
    }

    // Determine prediction direction
    const { prediction, reasons } = determineDirection(
        momentum,
        volatilityDelta,
        volumeExpansion,
        regime,
        allowFlat,
        bias
    );

    return {
        symbol: history.symbol,
        mint: history.mint,
        timestamp: Date.now(),
        prediction,
        reasons,
        regime,
        signals: {
            momentum,
            volatilityDelta,
            volumeExpansion,
        },
    };
}

/**
 * Determine prediction direction from signals
 */
function determineDirection(
    momentum: number,
    volatilityDelta: number,
    volumeExpansion: number,
    regime: MarketRegime,
    allowFlat: boolean,
    bias?: DirectionBias
): { prediction: PredictionDirection; reasons: string[] } {
    const reasons: string[] = [];

    // Score each direction
    let upScore = 0;
    let downScore = 0;

    // Momentum contribution
    if (momentum > UP_THRESHOLD) {
        upScore += momentum * 2;
        reasons.push(`momentum +${(momentum * 100).toFixed(1)}%`);
    } else if (momentum < DOWN_THRESHOLD) {
        downScore += Math.abs(momentum) * 2;
        reasons.push(`momentum ${(momentum * 100).toFixed(1)}%`);
    }

    // Volatility spike (high vol often precedes moves)
    if (volatilityDelta > 0.5) {
        // High vol + up momentum = stronger up
        if (momentum > 0) {
            upScore += volatilityDelta * 0.5;
            reasons.push('vol spike');
        } else {
            downScore += volatilityDelta * 0.5;
            reasons.push('vol spike');
        }
    }

    // Volume expansion
    if (volumeExpansion > VOL_SPIKE_MULT) {
        if (momentum > 0) {
            upScore += 0.3;
            reasons.push('volume expansion');
        } else {
            downScore += 0.3;
            reasons.push('volume expansion');
        }
    }

    // Regime influence
    if (regime === 'TREND_UP') {
        upScore += 0.2;
    } else if (regime === 'TREND_DOWN') {
        downScore += 0.2;
    }

    // Apply Pillar 10.5 Behavioral Biases
    if (bias) {
        upScore *= bias.upBias;
        downScore *= bias.downBias;
        // Flat bias affects the threshold (higher flat bias = wider "no signal" zone)
    }

    // Determine direction
    const diff = upScore - downScore;
    const flatThreshold = 0.3 * (bias?.flatBias ?? 1.0);

    if (diff > flatThreshold) {
        return { prediction: 'UP', reasons: reasons.slice(0, 2) };
    } else if (diff < -flatThreshold) {
        return { prediction: 'DOWN', reasons: reasons.slice(0, 2) };
    } else if (allowFlat) {
        return { prediction: 'FLAT', reasons: ['no clear signal'] };
    } else {
        // Force a direction in trending regimes / if flat forbidden
        return {
            prediction: momentum >= 0 ? 'UP' : 'DOWN',
            reasons: reasons.length > 0 ? reasons.slice(0, 2) : ['weak signal, forced by regime']
        };
    }
}

/**
 * Generate predictions for all tokens in batch
 */
export function predictBatch(
    histories: TokenPriceHistory[],
    regime: MarketRegime,
    allowFlat: boolean,
    bias?: DirectionBias
): TokenPrediction[] {
    const predictions: TokenPrediction[] = [];

    for (const history of histories) {
        const prediction = predictToken(history, regime, allowFlat, bias);
        if (prediction) {
            predictions.push(prediction);
        }
    }

    return predictions;
}
