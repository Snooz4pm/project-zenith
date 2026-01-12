/**
 * Opportunity Scorer - Pillar 5
 * 
 * Separates SKILL from OPPORTUNITY.
 * High skill + Low opportunity = NO TRADE (this is a SUCCESS state)
 * 
 * Opportunity metrics:
 * - Average True Range (price movement potential)
 * - Volume Expansion (activity increasing)
 * - Return Dispersion (spread of outcomes)
 */

import { TokenPriceHistory, TokenLearningState } from './types';

export interface OpportunityMetrics {
    averageTrueRange: number;
    volumeExpansion: number;
    returnDispersion: number;
    opportunityScore: number; // 0-1 normalized
}

// Minimum opportunity to justify trading
export const MIN_OPPORTUNITY_SCORE = 0.3;

/**
 * Calculate opportunity metrics for a token
 */
export function calculateOpportunity(history: TokenPriceHistory): OpportunityMetrics {
    if (history.prices.length < 5) {
        return {
            averageTrueRange: 0,
            volumeExpansion: 0,
            returnDispersion: 0,
            opportunityScore: 0,
        };
    }

    const prices = history.prices;

    // Average True Range (normalized)
    const ranges: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        const high = Math.max(prices[i].price, prices[i - 1].price);
        const low = Math.min(prices[i].price, prices[i - 1].price);
        if (low > 0) {
            ranges.push((high - low) / low);
        }
    }
    const averageTrueRange = ranges.length > 0
        ? ranges.reduce((a, b) => a + b, 0) / ranges.length
        : 0;

    // Volume Expansion
    let volumeExpansion = 0;
    const volumes = prices.filter(p => p.volume !== undefined).map(p => p.volume!);
    if (volumes.length >= 4) {
        const recentVol = volumes.slice(-2).reduce((a, b) => a + b, 0) / 2;
        const olderVol = volumes.slice(0, -2).reduce((a, b) => a + b, 0) / (volumes.length - 2);
        volumeExpansion = olderVol > 0 ? (recentVol - olderVol) / olderVol : 0;
    }

    // Return Dispersion (std dev of returns)
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        if (prices[i - 1].price > 0) {
            returns.push((prices[i].price - prices[i - 1].price) / prices[i - 1].price);
        }
    }
    let returnDispersion = 0;
    if (returns.length > 0) {
        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
        returnDispersion = Math.sqrt(variance);
    }

    // Normalize to 0-1 score
    const opportunityScore = normalizeOpportunity(averageTrueRange, volumeExpansion, returnDispersion);

    return {
        averageTrueRange,
        volumeExpansion,
        returnDispersion,
        opportunityScore,
    };
}

/**
 * Normalize opportunity metrics to 0-1 score
 */
function normalizeOpportunity(
    atr: number,
    volumeExp: number,
    dispersion: number
): number {
    // Weight components
    const atrScore = Math.min(atr * 20, 1);        // 5% ATR = 1.0
    const volScore = Math.min(volumeExp / 2, 1);   // 200% volume expansion = 1.0
    const dispScore = Math.min(dispersion * 10, 1); // 10% dispersion = 1.0

    // Weighted average
    return atrScore * 0.4 + volScore * 0.3 + dispScore * 0.3;
}

/**
 * Check if opportunity justifies trading
 */
export function shouldTrade(
    accuracy: number,
    opportunityScore: number,
    minOpportunity: number = MIN_OPPORTUNITY_SCORE
): { shouldTrade: boolean; reason: string } {
    // High skill but low opportunity = NO TRADE (success state)
    if (accuracy >= 0.6 && opportunityScore < minOpportunity) {
        return {
            shouldTrade: false,
            reason: `HIGH SKILL (${(accuracy * 100).toFixed(0)}%), LOW OPPORTUNITY (${(opportunityScore * 100).toFixed(0)}%) - No trade is the correct decision`,
        };
    }

    // Low skill = NO TRADE
    if (accuracy < 0.5) {
        return {
            shouldTrade: false,
            reason: `LOW SKILL (${(accuracy * 100).toFixed(0)}%) - Don't trade without edge`,
        };
    }

    // Low opportunity regardless of skill
    if (opportunityScore < minOpportunity) {
        return {
            shouldTrade: false,
            reason: `LOW OPPORTUNITY (${(opportunityScore * 100).toFixed(0)}%) - Market not moving enough`,
        };
    }

    return {
        shouldTrade: true,
        reason: `Skill ${(accuracy * 100).toFixed(0)}%, Opportunity ${(opportunityScore * 100).toFixed(0)}% - Trade justified`,
    };
}

/**
 * Calculate average opportunity for a batch of tokens
 */
export function calculateBatchOpportunity(
    histories: TokenPriceHistory[]
): number {
    if (histories.length === 0) return 0;

    const scores = histories.map(h => calculateOpportunity(h).opportunityScore);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Update token learning state with opportunity metrics
 */
export function updateTokenOpportunity(
    state: TokenLearningState,
    history: TokenPriceHistory
): TokenLearningState {
    const metrics = calculateOpportunity(history);

    return {
        ...state,
        averageTrueRange: metrics.averageTrueRange,
        volumeExpansion: metrics.volumeExpansion,
        returnDispersion: metrics.returnDispersion,
        opportunityScore: metrics.opportunityScore,
    };
}
