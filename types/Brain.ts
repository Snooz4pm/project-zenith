/**
 * Smart Swap Brain v1 - LOCKED SPEC
 *
 * This is the contract between the data layer and the brain.
 * If this is respected → no crashes, no undefined.address ever again.
 *
 * RULES:
 * - Brain is READ-ONLY (no wallet, no tx, no promises)
 * - AlphaSignals are OPTIONAL (brain works without it)
 * - All fields are validated before entering the brain
 */

// ============================================================================
// BRAIN INPUT (READ-ONLY)
// ============================================================================

export type BrainInput = {
    baseToken: {
        address: string; // SOL mint
        symbol: 'SOL';
        priceUSD: number;
    };

    amountSOL: number; // e.g. 1

    tokens: TokenInfo[]; // from Jupiter proxy ONLY

    valuations: {
        [tokenAddress: string]: {
            priceInSOL: number;
            priceUSD: number;
        };
    };

    routes: {
        [tokenAddress: string]: RouteSimulation;
    };

    alphaSignals?: {
        [tokenAddress: string]: AlphaSignal;
    };
};

/**
 * TokenInfo - from Jupiter proxy ONLY
 * Rule: if address missing → token is dropped before brain
 */
export type TokenInfo = {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
    tags?: string[];
};

/**
 * RouteSimulation - already stable in system
 */
export type RouteSimulation = {
    exists: boolean;

    hops: number;
    inAmountSOL: number;
    outAmountSOL: number;

    entrySlippage: number; // %
    exitSlippage: number; // %
    roundTripLoss: number; // %

    liquidityScore: number; // normalized 0–1
};

/**
 * AlphaSignal - SIDE CHANNEL, NOT REQUIRED
 * If AlphaScan fails → this object is undefined
 * The brain must still run.
 */
export type AlphaSignal = {
    poolAgeHours: number;
    volume24hUSD: number;
    volumeChange24h: number; // %
    txGrowth24h: number; // %
};

// ============================================================================
// BRAIN OUTPUT (SAFE, DISPLAY-ONLY)
// ============================================================================

export type BrainOutput = {
    universeStats: {
        totalTokens: number;
        routeableTokens: number;
        safeTokens: number;
    };

    rankedTargets: RankedTarget[];
};

export type RankedTarget = {
    targetToken: {
        address: string;
        symbol: string;
    };

    classification: 'A' | 'B'; // A = SAFE, B = RANKABLE

    metrics: {
        iqScore: number;
        alphaScore: number;
        combinedScore: number;

        volatility: number;
        roundTripLoss: number;
        hops: number;
        stableHopCount: number;
    };

    roadmapPreview: {
        steps: RoadmapStep[]; // NOT executable
        expectedBias: RoadmapBias;
    };
};

/**
 * RoadmapStep - SIMULATION ONLY
 */
export type RoadmapStep = {
    from: string; // symbol
    to: string; // symbol
    reason: string;
};

export type RoadmapBias =
    | 'early momentum'
    | 'liquidity expansion'
    | 'high risk / high attention'
    | 'stable alpha';

// ============================================================================
// CONSTRAINTS (HARD RULES)
// ============================================================================

export const BRAIN_CONSTRAINTS = {
    // Final token must be ALPHA (not stablecoin)
    STABLECOINS_FORBIDDEN_AS_FINAL: true,

    // Max hops
    MAX_HOPS: 3,

    // Max cumulative round-trip loss
    MAX_RTL: 12, // %

    // At least 1 volatile exposure required
    MIN_VOLATILE_EXPOSURE: 1,

    // Stable → Stable is illegal
    STABLE_TO_STABLE_FORBIDDEN: true,
} as const;

// ============================================================================
// ALPHA FRESHNESS SCORE WEIGHTS (LOCKED)
// ============================================================================

export const ALPHA_WEIGHTS = {
    poolFreshness: 0.4,
    volumeAcceleration: 0.35,
    txMomentum: 0.25,
} as const;
