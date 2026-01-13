/**
 * Asymmetric Scoring - Pillar 3
 * 
 * Score predictions with capital-protection bias:
 * - Correct UP: +1
 * - Correct DOWN: +1.5 (capital protection bonus)
 * - Correct FLAT: +0.5
 * - Wrong UP: -2 (most dangerous - expected gains, got losses)
 * - Wrong DOWN: -0.5
 * - Wrong FLAT: -1
 */

import {
    PredictionDirection,
    PredictionScore,
    TokenPrediction,
    TokenOutcome
} from './types';

// Asymmetric score matrix
const SCORE_MATRIX: Record<PredictionDirection, Record<PredictionDirection, number>> = {
    'UP': {
        'UP': 1,      // Correct UP
        'DOWN': -2,   // WRONG: Expected up, got down (worst case)
        'FLAT': -0.5, // Mildly wrong
    },
    'DOWN': {
        'UP': -0.5,   // Underestimated, but not catastrophic
        'DOWN': 1.5,  // Correct DOWN (capital protection bonus)
        'FLAT': -0.5, // Mildly wrong
    },
    'FLAT': {
        'UP': -1,     // Missed opportunity
        'DOWN': -1,   // Missed opportunity
        'FLAT': 0.5,  // Correct FLAT
    },
};

/**
 * Score a single prediction against actual outcome
 */
export function scorePrediction(
    prediction: TokenPrediction,
    outcome: TokenOutcome
): PredictionScore {
    const predicted = prediction.prediction;
    const actual = outcome.actualDirection;
    const score = SCORE_MATRIX[predicted][actual];
    const isCorrect = predicted === actual;

    return {
        symbol: prediction.symbol,
        predicted,
        actual,
        score,
        isCorrect,
    };
}

/**
 * Score all predictions in a batch
 */
export function scoreBatch(
    predictions: TokenPrediction[],
    outcomes: TokenOutcome[]
): PredictionScore[] {
    const scores: PredictionScore[] = [];

    // Create outcome lookup map
    const outcomeMap = new Map<string, TokenOutcome>();
    for (const outcome of outcomes) {
        outcomeMap.set(outcome.mint, outcome);
    }

    for (const prediction of predictions) {
        const outcome = outcomeMap.get(prediction.mint);
        if (outcome) {
            scores.push(scorePrediction(prediction, outcome));
        }
    }

    return scores;
}

/**
 * Calculate accuracy from scores
 */
export function calculateAccuracy(scores: PredictionScore[]): number {
    if (scores.length === 0) return 0;
    const correct = scores.filter(s => s.isCorrect).length;
    return correct / scores.length;
}

/**
 * Calculate cumulative score
 */
export function calculateCumulativeScore(scores: PredictionScore[]): number {
    return scores.reduce((sum, s) => sum + s.score, 0);
}

/**
 * Determine actual direction from price change
 */
export function determineActualDirection(priceChange: number): PredictionDirection {
    if (priceChange > 0.5) return 'UP';
    if (priceChange < -0.5) return 'DOWN';
    return 'FLAT';
}

/**
 * Break down scores by prediction type for analysis
 */
export function analyzeScoreBreakdown(scores: PredictionScore[]): {
    upAccuracy: number;
    downAccuracy: number;
    flatAccuracy: number;
    upBias: number; // Ratio of UP predictions
    dangerousWrongs: number; // Count of UP→DOWN (worst case)
} {
    const upPredictions = scores.filter(s => s.predicted === 'UP');
    const downPredictions = scores.filter(s => s.predicted === 'DOWN');
    const flatPredictions = scores.filter(s => s.predicted === 'FLAT');

    const upCorrect = upPredictions.filter(s => s.isCorrect).length;
    const downCorrect = downPredictions.filter(s => s.isCorrect).length;
    const flatCorrect = flatPredictions.filter(s => s.isCorrect).length;

    const dangerousWrongs = scores.filter(
        s => s.predicted === 'UP' && s.actual === 'DOWN'
    ).length;

    return {
        upAccuracy: upPredictions.length > 0 ? upCorrect / upPredictions.length : 0,
        downAccuracy: downPredictions.length > 0 ? downCorrect / downPredictions.length : 0,
        flatAccuracy: flatPredictions.length > 0 ? flatCorrect / flatPredictions.length : 0,
        upBias: scores.length > 0 ? upPredictions.length / scores.length : 0,
        dangerousWrongs,
    };
}
