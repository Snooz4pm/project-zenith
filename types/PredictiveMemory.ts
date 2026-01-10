/**
 * Predictive Memory Types
 * 
 * Core principle: We track DIRECTIONAL accuracy, not numeric predictions.
 * Separates value math (always real) from search bias (learned patterns).
 */

export interface TokenLearning {
    mint: string;
    symbol: string;

    // Directional accuracy (not numeric)
    directionAccuracy: number; // 0-1, % of times we got direction right
    magnitudeBucketAccuracy: number; // 0-1, % of times we got magnitude bucket right
    confidenceScore: number; // 0-1, how much we trust this token's learnings

    lastUpdated: number;

    // Behavior patterns
    typicalHoldMinutes?: number; // Observed optimal hold time
    volatilityProfile: 'LOW' | 'MEDIUM' | 'HIGH';

    learningCount: number; // Number of sessions
}

export interface SessionComparison {
    token: string;

    // Actual outcome
    actualDirection: 'UP' | 'DOWN' | 'FLAT';
    actualBucket: 0 | 1 | 2; // 0: <2%, 1: 2-5%, 2: >5%
    actualPercentChange: number;

    // Predicted (what brain suggested)
    predictedDirection: 'UP' | 'DOWN' | 'FLAT';
    predictedBucket: 0 | 1 | 2;

    // Context
    timeBetweenSessions: number; // minutes
    marketRegime: 'BULL' | 'SIDEWAYS' | 'BEAR' | 'VOLATILE';

    // Outcome
    wasDirectionCorrect: boolean;
    wasBucketCorrect: boolean;
}

export interface MarketState {
    regime: 'BULL' | 'SIDEWAYS' | 'BEAR' | 'VOLATILE';
    volatilityIndex: number; // 0-1
    breadthRatio: number; // % of tokens positive
    lastUpdate: number;
}

// BIASES (NOT predictions)
export interface SearchBias {
    explorationPriority: number; // 0-1, how much to prioritize in search
    constraintRelaxation: number; // 0-0.3, max relaxation of constraints
    holdConfidence: number; // 0-1, confidence for hold suggestion
    beamBoost: number; // 1-2, beam width multiplier
}

export interface HoldSuggestion {
    token: string;
    symbol: string;
    confidence: number;
    suggestedDurationMinutes: number;
    reasons: string[];
    emergencyExitAvailable: boolean;
    maxRecommendedHold: number;
    stopSuggestedAtLoss: number; // %
}

// Search constraints (for relaxation)
export interface SearchConstraints {
    maxHops: number;
    maxTotalRTL: number;
    maxPerHopRTL: number;
    beamWidth: number;
    maxRevisits: number;
}
