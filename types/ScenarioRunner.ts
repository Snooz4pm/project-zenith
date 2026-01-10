/**
 * Scenario Runner Types
 * Defines the 5 key scenarios and their configurations.
 */

import { BrainSearchResult, PathState, SearchableToken } from '@/types/BrainV2';

export enum ScenarioId {
    CONSERVATIVE = 'CONSERVATIVE',
    BALANCED = 'BALANCED',
    AGGRESSIVE = 'AGGRESSIVE',
    VOLATILITY = 'VOLATILITY',
    BEST_EFFORT = 'BEST_EFFORT'
}

export interface ScenarioConfig {
    id: ScenarioId;
    name: string;
    description: string;

    // Constraints
    maxHops: number;
    maxPerHopRTL: number; // %
    maxTotalRTL: number; // %

    // Mechanics
    allowAlphaTokens: boolean | 'prioritized' | 'only';
    allowHolds: boolean | number; // false = no, number = max minutes
    biasActive: boolean; // Use predictive memory bias?
    constraintRelaxation: boolean; // Allow relaxation for high-confidence tokens?
}

export interface ScenarioResult {
    scenarioId: ScenarioId;
    config: ScenarioConfig;

    // Outcome
    found: boolean;
    result: BrainSearchResult; // The actual brain result

    // Key metrics for comparison
    finalAmountSOL: number;
    roiPct: number;
    hops: number;
    cumulativeRTL: number;
    hasHold: boolean;

    // Why this result?
    explanation: string[];
}

export interface ScenarioComparison {
    best: ScenarioResult;
    all: ScenarioResult[];
    winnerReason: string;
}
