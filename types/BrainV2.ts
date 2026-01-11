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

/**
 * ROI Intent - Goal-seeking, not maximization
 * 
 * The Brain should find paths CLOSE to the target ROI, not maximize it.
 * Overshoot is penalized, not rewarded.
 */
export interface RoiIntent {
    targetPct: number;        // e.g., 7 for 7%
    tolerancePct: number;     // ±1% is "perfect match"
    maxOvershootPct: number;  // Hard cap on overshoot (scenario-dependent)
}

export type BrainGoal = {
    startToken: string; // Mint address (e.g., SOL, BONK)
    targetToken: string; // Mint address (e.g., MEMO, USDC)

    startAmount?: number; // Real token units (e.g., 500000 BONK)
    startAmountSOL: number; // Valuation in SOL
    targetAmountSOL: number; // Valuation in SOL (CONSTRAINT)

    maxHops: number;
    maxTotalRTL: number;
    maxPerHopRTL: number;

    // ROI Intent (Phase 2.6) - Goal-seeking, not maximization
    roiIntent?: RoiIntent;

    // Safety Layer (Phase 2)
    preservation?: {
        enabled: boolean;
        maxAllowedDrawdownPct: number; // e.g., 0.7 for 0.7% max loss
    };
};

// ============================================================================
// PATH STATE (WHAT BRAIN TRACKS DURING SEARCH)
// ============================================================================

export type PathState = {
    currentToken: string; // mint address
    currentSymbol: string; // for display

    // CRITICAL: Separate actual amount from valuation
    currentTokenAmount: number; // REAL units (e.g., 500000 BONK)
    currentValueSOL: number; // SOL-equivalent valuation (measurement only)

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

    // Hold annotation (optional, computed at expansion time)
    hold?: {
        suggestedMinutes: number;
        confidence: number; // 0-1
        reason: string;
        source: 'momentum' | 'volatility' | 'learning';

        // UX-critical: where does the path go after hold?
        nextHopToken: string; // Symbol of next token after hold
        exitToken: string;    // Safe exit option (usually SOL)
    };
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
// GOAL ALIGNMENT (Mandatory Explanation)
// ============================================================================

export type GoalAlignmentStatus = 'REACHED' | 'REQUIRES_HOLD' | 'UNREACHABLE' | 'PARTIAL';

export interface GoalAlignment {
    status: GoalAlignmentStatus;
    explanation: string;

    // Progress metrics
    currentRoiPct: number;
    targetRoiPct: number;
    remainingGapPct: number;

    // Exit validation
    endsAtExitToken: boolean;
    exitToken: string;
    actualExitToken?: string;

    // Hold guidance
    holdRequired: boolean;
    holdReason?: string;
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
        explanation: PathExplanation;
        goalAlignment: GoalAlignment; // NEW: Mandatory
    }
    | {
        found: false;
        reason: string;
        bestEffort?: PathState;
        exploredPaths: number;
        explanation: PathExplanation;
        goalAlignment: GoalAlignment; // NEW: Mandatory (explains why unreachable)
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

// ============================================================================
// BRAIN ROADMAP (INTENT-BASED OUTPUT)
// Brain outputs PLANNING, not quotes. Execution fetches fresh quotes.
// ============================================================================

export type ScenarioType = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE' | 'VOLATILITY' | 'BEST_EFFORT' | 'TRINITY';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

// SAFETY LAYER TYPES
export type ProtectionClass = 'SAFE' | 'MEDIUM' | 'JITO_ONLY' | 'HIGH_RISK';

export interface ExitEnvelope {
    token: string;
    symbol: string;
    worstCaseExitPct: number; // % of start value preserved (e.g., 98.1)
}

export interface RoadmapStep {
    index: number;
    action: 'SWAP' | 'HOLD';

    // SWAP intent (NEVER amounts - intent only)
    fromToken?: string;
    fromSymbol?: string;
    toToken?: string;
    toSymbol?: string;

    // HARD constraints (enforced at execution)
    maxSlippagePct?: number;

    // HOLD metadata
    holdMinutes?: number;
    holdReason?: string;

    // Meta - confidence ONLY, no amounts
    confidence: ConfidenceLevel;
    mandatory: boolean; // if false, step can be skipped if quote fails

    // SAFETY LAYER
    protection: ProtectionClass;
    exitEnvelope: ExitEnvelope; // Exit-anywhere guarantee
}

export interface BrainRoadmap {
    scenario: ScenarioType;

    summary: {
        hops: number;
        holds: number;
        confidence: ConfidenceLevel;
        // NO ROI - never show numeric expectations
    };

    steps: RoadmapStep[];

    estimates: {
        durationMinutesRange: [number, number]; // Range, not exact
        feesImpact: ImpactLevel; // LOW/MEDIUM/HIGH, not numeric
    };

    explanation: {
        whyChosen: string[];
        mainRisks: string[];
    };

    warnings: string[];

    // Safety Blockers
    blocked?: boolean; // If true, this path violates safety constraints
    blockedReason?: string;

    // Source data (internal debugging only - never shown)
    _sourcePathState?: PathState;
}

// ============================================================================
// EXECUTION STATE MACHINE
// ============================================================================

export type StepStatus =
    | 'PLANNED'
    | 'AWAITING_QUOTE'
    | 'QUOTE_FOUND'
    | 'QUOTE_CHANGED'
    | 'QUOTE_NOT_FOUND'
    | 'USER_REJECTED'
    | 'SIGNED'
    | 'CONFIRMED'
    | 'SKIPPED'
    | 'CANCELLED';

// Drift thresholds for quote comparison
export const DRIFT_THRESHOLDS = {
    SOFT: 0.05, // 5% - warn
    HARD: 0.12, // 12% - block without explicit consent
} as const;
