/**
 * Learning Validation System - Core Types
 *
 * Purpose: Validate if Brain v2 has real edge or is fooling itself
 * NO PNL OPTIMIZATION - ONLY LEARNING QUALITY
 */

// Market Regime Classification
export type MarketRegime = 'TREND_UP' | 'TREND_DOWN' | 'RANGE' | 'CHAOS';

export interface RegimeDetection {
    regime: MarketRegime;
    confidence: number; // 0-1
    metrics: {
        percentMoving: number; // % tokens moving > ±1%
        meanReturn: number;
        medianReturn: number;
        volatilityDispersion: number;
    };
}

// Prediction Types
export type PredictionDirection = 'UP' | 'DOWN' | 'FLAT';

export interface TokenPrediction {
    symbol: string;
    mint: string;
    timestamp: number;
    prediction: PredictionDirection;
    reasons: string[]; // Top 2 contributing reasons
    regime: MarketRegime;

    // Internal signals (not exposed to scorer)
    signals: {
        momentum: number;
        volatilityDelta: number;
        volumeExpansion?: number;
    };
}

// Actual Outcome (after 5 minutes)
export interface TokenOutcome {
    symbol: string;
    mint: string;
    actualDirection: PredictionDirection;
    priceChange: number; // percentage
    timestamp: number;
}

// Asymmetric Scoring Results
export interface PredictionScore {
    symbol: string;
    predicted: PredictionDirection;
    actual: PredictionDirection;
    score: number; // Asymmetric: UP wrong = -2, DOWN correct = +1.5, etc.
    isCorrect: boolean;
}

// Token Learning State
export interface TokenLearningState {
    symbol: string;
    mint: string;
    cumulativeScore: number;
    predictions: TokenPrediction[];
    outcomes: TokenOutcome[];
    scores: PredictionScore[];

    // Opportunity metrics
    averageTrueRange: number;
    volumeExpansion: number;
    returnDispersion: number;
    opportunityScore: number; // 0-1
}

// Baseline Comparators
export interface BaselineResults {
    random: {
        accuracy: number;
        correctCount: number;
        totalCount: number;
    };
    momentum: {
        accuracy: number;
        correctCount: number;
        totalCount: number;
    };
}

// Cycle Summary
export interface CycleSummary {
    cycleNumber: number;
    regime: RegimeDetection;

    // Learning metrics
    brainAccuracy: number;
    deltaAccuracy: number; // vs previous cycle
    baselineResults: BaselineResults;

    // Opportunity
    avgOpportunityScore: number;

    // Decision
    decision: 'CONTINUE' | 'STOP_SATURATION' | 'STOP_NO_OPPORTUNITY' | 'STOP_NO_EDGE';
    reasoning: string;

    // Token counts
    tokensEvaluated: number;
    tokensNarrowed: number;

    // Top performers
    topTokens: {
        symbol: string;
        score: number;
        accuracy: number;
    }[];
}

// Final Verdict
export type FinalVerdict =
    | 'EDGE_VALIDATED'
    | 'NO_TRADE_LOW_OPPORTUNITY'
    | 'NO_EDGE_BASELINE_BEATS_BRAIN'
    | 'LEARNING_SATURATED_EARLY';

export interface ValidationReport {
    verdict: FinalVerdict;
    reasoning: string;

    cycles: CycleSummary[];

    // Post-mortem insights
    insights: {
        improvements: string[];
        failures: string[];
        biases: string[];
    };

    // Final statistics
    finalStats: {
        totalPredictions: number;
        overallAccuracy: number;
        beatsRandomBy: number; // percentage points
        beatsMomentumBy: number;
        finalTokenCount: number;
    };
}

// Price History (from Jupiter)
export interface TokenPriceHistory {
    symbol: string;
    mint: string;
    prices: {
        timestamp: number;
        price: number;
        volume?: number;
    }[];
}
