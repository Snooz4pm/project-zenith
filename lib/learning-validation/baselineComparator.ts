/**
 * Baseline Comparator - Pillar 6
 * 
 * Compare Brain accuracy against dumb baselines:
 * 1. Random baseline: 33% (random UP/DOWN/FLAT)
 * 2. Momentum baseline: Follow last 1-min direction
 * 
 * If Brain does NOT beat these by meaningful margin:
 * → Flag simulation as INVALID EDGE
 */

import {
    BaselineResults,
    TokenPriceHistory,
    PredictionDirection,
    TokenOutcome
} from './types';
import { determineActualDirection } from './scorer';

// Minimum margin to claim edge
export const MIN_EDGE_OVER_RANDOM = 0.10;     // 10% points above random
export const MIN_EDGE_OVER_MOMENTUM = 0.05;   // 5% points above momentum

/**
 * Generate random baseline predictions
 */
export function generateRandomBaseline(
    outcomes: TokenOutcome[]
): { accuracy: number; correctCount: number; totalCount: number } {
    const directions: PredictionDirection[] = ['UP', 'DOWN', 'FLAT'];
    let correctCount = 0;

    for (const outcome of outcomes) {
        // Random prediction
        const randomPick = directions[Math.floor(Math.random() * 3)];
        if (randomPick === outcome.actualDirection) {
            correctCount++;
        }
    }

    return {
        accuracy: outcomes.length > 0 ? correctCount / outcomes.length : 0,
        correctCount,
        totalCount: outcomes.length,
    };
}

/**
 * Generate momentum baseline predictions
 * Simple: follow the last 1-minute direction
 */
export function generateMomentumBaseline(
    histories: TokenPriceHistory[],
    outcomes: TokenOutcome[]
): { accuracy: number; correctCount: number; totalCount: number } {
    let correctCount = 0;
    let totalCount = 0;

    // Create history lookup
    const historyMap = new Map<string, TokenPriceHistory>();
    for (const h of histories) {
        historyMap.set(h.mint, h);
    }

    for (const outcome of outcomes) {
        const history = historyMap.get(outcome.mint);
        if (!history || history.prices.length < 2) continue;

        // Last 1-min direction
        const prices = history.prices;
        const lastPrice = prices[prices.length - 1].price;
        const prevPrice = prices[prices.length - 2].price;

        if (prevPrice === 0) continue;

        const lastReturn = (lastPrice - prevPrice) / prevPrice;
        const momentumPrediction = determineActualDirection(lastReturn * 100);

        if (momentumPrediction === outcome.actualDirection) {
            correctCount++;
        }
        totalCount++;
    }

    return {
        accuracy: totalCount > 0 ? correctCount / totalCount : 0,
        correctCount,
        totalCount,
    };
}

/**
 * Compare Brain accuracy against baselines
 */
export function compareAgainstBaselines(
    brainAccuracy: number,
    histories: TokenPriceHistory[],
    outcomes: TokenOutcome[]
): BaselineResults & { hasEdge: boolean; edgeAnalysis: string } {
    const random = generateRandomBaseline(outcomes);
    const momentum = generateMomentumBaseline(histories, outcomes);

    const edgeOverRandom = brainAccuracy - random.accuracy;
    const edgeOverMomentum = brainAccuracy - momentum.accuracy;

    // Check if Brain has real edge
    const beatsRandom = edgeOverRandom >= MIN_EDGE_OVER_RANDOM;
    const beatsMomentum = edgeOverMomentum >= MIN_EDGE_OVER_MOMENTUM;
    const hasEdge = beatsRandom && beatsMomentum;

    let edgeAnalysis: string;
    if (hasEdge) {
        edgeAnalysis = `EDGE CONFIRMED: Brain beats random by ${(edgeOverRandom * 100).toFixed(1)}% and momentum by ${(edgeOverMomentum * 100).toFixed(1)}%`;
    } else if (!beatsRandom) {
        edgeAnalysis = `NO EDGE: Brain (${(brainAccuracy * 100).toFixed(1)}%) does not beat random baseline (${(random.accuracy * 100).toFixed(1)}%) by required ${(MIN_EDGE_OVER_RANDOM * 100).toFixed(0)}%`;
    } else {
        edgeAnalysis = `WEAK EDGE: Brain beats random but not momentum baseline by required margin`;
    }

    return {
        random,
        momentum,
        hasEdge,
        edgeAnalysis,
    };
}

/**
 * Run multiple random baseline trials for statistical significance
 */
export function runMultipleRandomTrials(
    outcomes: TokenOutcome[],
    trials: number = 100
): { meanAccuracy: number; stdDev: number; p95: number } {
    const accuracies: number[] = [];

    for (let i = 0; i < trials; i++) {
        const result = generateRandomBaseline(outcomes);
        accuracies.push(result.accuracy);
    }

    const mean = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / accuracies.length;
    const stdDev = Math.sqrt(variance);

    // 95th percentile
    accuracies.sort((a, b) => a - b);
    const p95 = accuracies[Math.floor(accuracies.length * 0.95)];

    return { meanAccuracy: mean, stdDev, p95 };
}

/**
 * Statistical significance test
 */
export function isStatisticallySignificant(
    brainAccuracy: number,
    outcomes: TokenOutcome[],
    requiredConfidence: number = 0.95
): { isSignificant: boolean; pValue: number; analysis: string } {
    const trials = runMultipleRandomTrials(outcomes, 1000);

    // Simplified statistical test
    // If brain accuracy > 95th percentile of random, it's significant
    const isSignificant = brainAccuracy > trials.p95;

    // Rough p-value estimate (proportion of random trials that beat brain)
    const randomBaselines: number[] = [];
    for (let i = 0; i < 1000; i++) {
        randomBaselines.push(generateRandomBaseline(outcomes).accuracy);
    }
    const beatingBrain = randomBaselines.filter(r => r >= brainAccuracy).length;
    const pValue = beatingBrain / 1000;

    let analysis: string;
    if (isSignificant && pValue < 0.05) {
        analysis = `STATISTICALLY SIGNIFICANT: p-value ${pValue.toFixed(4)}, Brain outperforms ${((1 - pValue) * 100).toFixed(1)}% of random trials`;
    } else {
        analysis = `NOT SIGNIFICANT: p-value ${pValue.toFixed(4)}, Brain performance could be random chance`;
    }

    return { isSignificant, pValue, analysis };
}
