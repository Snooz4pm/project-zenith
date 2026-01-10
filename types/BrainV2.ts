/**
 * Smart Swap Brain v2 - Graph Search Engine
 *
 * NOT a profit predictor.
 * IS a path-finding engine on token liquidity graph.
 *
 * Target is a CONSTRAINT, not a promise.
 * Most searches will fail to reach target - that's honest.
 */

import { SmartToken } from './SmartToken';
import { V1HoldCheckpoint } from '@/lib/smartswap/hold/V1Constants';

// ============================================================================
// SEARCH GOAL (USER INPUT)
// ============================================================================

export type BrainGoal = {
    startToken: string; // Mint address (e.g., SOL, BONK)
    targetToken: string; // Mint address (e.g., MEMO, USDC)

    startAmountSOL: number; // Valuation in SOL
    targetAmountSOL: number; // Valuation in SOL (CONSTRAINT)

    maxHops: number;
    maxTotalRTL: number;
    maxPerHopRTL: number;
};

// ============================================================================
// PATH STATE (WHAT BRAIN TRACKS DURING SEARCH)
// ============================================================================

export type PathState = {
    currentToken: string; // mint address
    currentSymbol: string; // for display
    currentAmountSOL: number; // estimated SOL value

    hopsUsed: number;
    cumulativeRTL: number; // %

    path: PathHop[]; // full journey so far
    visitedTokens: string[]; // tokens visited (for novelty pressure)

    score: number; // heuristic score (higher = better)

    // V1 Hold overlay (optional, read-only)
    holdCheckpoint?: V1HoldCheckpoint | null;
};

export type PathHop = {
    fromToken: string; // mint
    fromSymbol: string;
    toToken: string; // mint
    toSymbol: string;

    estimatedInSOL: number;
    estimatedOutSOL: number;
    slippage: number; // %
    hopRTL: number; // %
};

// ============================================================================
// PATH EXPLANATION (Reality-Aware Reporting)
// ============================================================================

export interface PathExplanation {
    summary: string;
    explanations: string[];
    recommendation: string;
    marketContext: {
        profitablePathsExist: boolean;
        typicalMaxROI: number;
        timeOfDayFactor: number;
    };
    alternatives: {
        lowerTarget?: number;
        differentStrategy?: string;
        waitSuggestion?: string;
    };
    insights: string[];
}

// ============================================================================
// SEARCH RESULT (BRAIN OUTPUT)
// ============================================================================

export type BrainSearchResult =
    | {
        found: true;
        path: PathState;
        confidence: 'low' | 'medium' | 'high';
        warnings: string[];
        reachableAtHop: number;
        explanation: PathExplanation; // NEW: Reality-aware context
    }
    | {
        found: false;
        reason: string;
        bestEffort?: PathState; // closest we got
        exploredPaths: number;
        explanation: PathExplanation; // NEW: Why it failed + alternatives
    };

// ============================================================================
// SEARCH CONFIGURATION
// ============================================================================

export const SEARCH_CONFIG = {
    BEAM_WIDTH: 50, // Keep top K paths at each hop
    MIN_LIQUIDITY_SCORE: 0.3, // Reject low-liquidity tokens
    MIN_ALPHA_SCORE_AFTER_HOP_5: 0.1, // After hop 5, need some alpha
    STABLE_AS_ROUTER_OK: true, // Can route through stables
    STABLE_AS_FINAL_FORBIDDEN: true, // Cannot end on stable
} as const;

// ============================================================================
// HEURISTIC WEIGHTS (LOCKED)
// ============================================================================

export const HEURISTIC_WEIGHTS = {
    growthMultiplier: 1.0, // log(current/start)
    rtlPenalty: 2.0, // cumulative RTL cost
    hopPenalty: 0.15, // per hop
    alphaMomentumBoost: 0.5, // alpha signal bonus
} as const;

// ============================================================================
// TOKEN UNIVERSE (FOR SEARCH)
// ============================================================================

export type SearchableToken = {
    mint: string;
    symbol: string;

    // From valuation
    valueInSOL: number;
    roundTripLoss: number;
    hasRoute: boolean;
    liquidityScore: number;

    // From alpha (optional)
    alphaScore?: number;
    volatility?: number;

    // Classification
    isStable: boolean;
    isAlpha: boolean; // High-beta escape token
    tier: 'SAFE' | 'RANKABLE' | 'REJECTED';
    source?: 'jupiter' | 'alphascan' | 'pump'; // Token source for rule relaxation
};
