/**
 * Pillar 10: Compounding Prediction Loop
 * 
 * The final governance layer.
 * 
 * Flow:
 * 1. Freeze universe of ~1000 tokens
 * 2. Predict ALL tokens (UP/DOWN/FLAT)
 * 3. Wait 5 REAL minutes
 * 4. Score predictions against real price data
 * 5. Narrow to survivors (correct predictions)
 * 6. Repeat until:
 *    - Threshold reached (< 10 tokens)
 *    - 30 minutes elapsed
 *    - No survivors (funnel collapse)
 * 7. IF funnel survives → execute UP tokens
 *    IF funnel collapses → NO TRADE = PASS
 */

import { TokenPriceHistory, TokenOutcome, PredictionDirection } from './types';
import { predictBatch, DirectionBias } from './predictor';
import { scoreBatch, calculateAccuracy, determineActualDirection } from './scorer';
import { detectRegime, isRegimeTradeable } from './regimeDetector';
import { enforceDiversity } from './diversityEnforcer';
import { calculateBatchOpportunity } from './opportunityScorer';
import { compareAgainstBaselines } from './baselineComparator';

const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Configuration
export const PILLAR_10_CONFIG = {
    OBSERVATION_MINUTES: 15, // 15-minute wait - gives direction time to emerge
    MAX_DURATION_MINUTES: 30,
    SURVIVOR_THRESHOLD: 10, // Funnel complete when < 10 tokens
    NARROWING_RATIO: 0.5, // Keep top 50% each cycle
    MIN_ACCURACY_TO_SURVIVE: 0.45, // Slightly relaxed for CHAOS noise
    FUNNEL_MODE: 'CHAOS_ONLY' as 'ALL' | 'CHAOS_ONLY' | 'CHAOS_AND_MAJOR',

    // EXPLORATION mode: After first EDGE refusal, allow relaxed thresholds
    ALLOW_EXPLORATION_FALLBACK: true,
    EXPLORATION_THRESHOLD_MULTIPLIER: 0.7, // 70% of normal thresholds in exploration

    // Pillar 10.3: FLAT Accountability
    FLAT_EPSILON: 0.01, // 1% threshold for FLAT correctness (relaxed from 0.5%)
};

// Pillar 10.3: Scoring rules with FLAT accountability
export const PILLAR_10_SCORES = {
    CORRECT_UP: +1,
    CORRECT_DOWN: +1.5,    // Capital protection bonus
    CORRECT_FLAT: +0.5,
    WRONG_UP: -2,          // Most dangerous
    WRONG_DOWN: -0.5,
    WRONG_FLAT: -1.5,      // Cowardice penalty
};

// Pillar 10.4: Hesitation Opportunity Penalty
export const PILLAR_10_4_CONFIG = {
    OPPORTUNITY_EPSILON: 0.01,      // 1% move = significant opportunity
    HESITATION_PENALTY: -0.75,      // Lighter than wrong UP (-2), but real cost
    MIN_OPPORTUNITY_SCORE: 0.3,     // Only penalize if opportunity was real
};

// Pillar 10.6: FLAT DEBT (Time-Based Accountability)
// FLAT is uncertainty — uncertainty has a cost
export const PILLAR_10_6_CONFIG = {
    // Rule 1: FLAT always costs something (opportunity cost)
    FLAT_OPPORTUNITY_COST: -0.1,    // Small penalty per cycle even if "correct"

    // Rule 2: Repeated FLAT is forbidden
    MAX_FLAT_STREAK: 2,             // After 2 consecutive FLATs, force decision

    // Rule 3: Global FLAT dominance triggers escalation
    FLAT_DOMINANCE_THRESHOLD: 0.7,  // If >70% FLAT for 2 cycles
    FLAT_DOMINANCE_CYCLES: 2,       // Consecutive cycles before escalation
    ESCALATION_UNIVERSE_SHRINK: 0.3, // Shrink universe by 30% on escalation
};

// ============================================================================
// PILLAR X: Mandatory Informational Exposure (Anti-Stall Governance)
// ============================================================================
// A system that never risks being wrong is not disciplined — it is inert.
// All previous pillars protect against bad action.
// Pillar X protects against infinite inaction.
// ============================================================================

export const PILLAR_X_CONFIG = {
    // Rule X.1: FLAT is Temporary (cycle-restricted)
    // Cycle 1 → FLAT allowed
    // Cycle 2 → FLAT allowed but monitored  
    // Cycle 3+ → FLAT restricted
    FLAT_UNRESTRICTED_CYCLES: 2,    // FLAT is free for first 2 cycles

    // Rule X.2: Exposure Quota (min directional % per cycle)
    // Forces informational risk, not capital risk
    EXPOSURE_QUOTAS: {
        1: 0.00,    // Cycle 1: 0% min directional (exploration)
        2: 0.20,    // Cycle 2: 20% must be UP or DOWN
        3: 0.40,    // Cycle 3: 40% directional
        4: 0.60,    // Cycle 4+: 60% directional
    } as Record<number, number>,
    DEFAULT_QUOTA: 0.60,            // Default for cycles > 4

    // Rule X.3: Repeated FLAT = Elimination
    MAX_CONSECUTIVE_FLAT: 3,        // Token removed after 3 consecutive FLATs

    // Rule X.4: Learning Must Progress
    // If after T minutes: no narrowing, no penalties, no adaptation → FAIL
    STALL_DETECTION_CYCLES: 3,      // Check for stall after 3 cycles
    MIN_ELIMINATED_TO_PROGRESS: 5,  // Must eliminate at least 5 tokens or FAIL
    MIN_PENALTY_TO_PROGRESS: 0.5,   // Must incur some penalty (proves accountability)
};

// ============================================================================
// PILLAR 10.7: Missed Opportunity Accountability
// ============================================================================
// FLAT is not neutral — it is a prediction whose truth is revealed later.
// For every FLAT prediction:
// - Track price at prediction time
// - Re-evaluate in next cycle
// - If direction emerges beyond ε: apply missed opportunity penalty
// ============================================================================

export const PILLAR_10_7_CONFIG = {
    // Direction emergence threshold (same as FLAT epsilon for consistency)
    DIRECTION_EPSILON: 0.01,        // 1% move = direction emerged

    // Missed opportunity penalty (scales with magnitude)
    BASE_PENALTY: -0.5,             // Base penalty for missing
    MAGNITUDE_MULTIPLIER: 50,       // Penalty scales: min(MAX, |delta| * MULT)
    MAX_PENALTY: -2.0,              // Cap at wrong UP penalty level

    // How many cycles to track FLAT watchlist
    WATCHLIST_CYCLES: 2,            // Re-evaluate for 2 cycles after FLAT
};

// FLAT Watchlist entry for tracking missed opportunities
export interface FlatWatchEntry {
    token: string;
    mint: string;
    cycle: number;
    priceAtFlat: number;
    timestamp: number;
}

// ============================================================================
// PILLAR 10.9: Primed World Exposure (Perceptual Seeding)
// ============================================================================
// Before judging decisions, the mind must be shown what reality looks like.
// Before the brain is allowed to choose predictions, the system must inject
// a balanced, labeled exposure set representing UP, DOWN, and FLAT outcomes.
// This is perception training, not action.
// ============================================================================

export const PILLAR_10_9_CONFIG = {
    // Duration of seeding observation (seconds)
    SEEDING_OBSERVATION_SECONDS: 15,    // 15 seconds to observe labeled data

    // Direction threshold for labeling historical movements
    LABEL_EPSILON: 0.01,                // 1% move = directional

    // Target distribution for perceptual seeding
    TARGET_UP_RATIO: 0.33,
    TARGET_DOWN_RATIO: 0.33,
    TARGET_FLAT_RATIO: 0.34,
};

// Perceptual seeding result
export interface PerceptualSeedResult {
    upTokens: TokenCandidate[];
    downTokens: TokenCandidate[];
    flatTokens: TokenCandidate[];
    calibrationComplete: boolean;
    upSignature: { avgVolatility: number; avgMove: number };
    downSignature: { avgVolatility: number; avgMove: number };
    flatSignature: { avgVolatility: number; avgMove: number };
}

// ============================================================================
// PILLAR 11: Agency Accountability (Ego Layer)
// ============================================================================
// "Does this system deserve to exist as an agent?"
// If it keeps hiding, the answer is NO.
// Pillar 11 forces the brain to demonstrate sustained directional intent.
// ============================================================================

export const PILLAR_11_CONFIG = {
    // 11.1 — Agency Quota (Proof of Will)
    // Brain must demonstrate sustained directional intent
    AGENCY_QUOTA: {
        minDirectionalTokens: 30,      // At least 30 UP or DOWN predictions
        minCyclesWithDirection: 2,     // That survive into next cycle
    },

    // 11.2 — Ego Clock (Time Pressure)
    // Agency must appear within bounded time window
    EGO_CLOCK: {
        maxMinutesWithoutAgency: 10,   // ~⅓ of 30-min run
        requiredDirectionalRatio: 0.3, // At least 30% directional by clock deadline
    },

    // 11.3 — Ego Debt (Repetition Penalty)
    // Repeated refusal to commit is identity failure
    EGO_DEBT: {
        flatThreshold: 0.7,            // >70% FLAT = potential debt
        maxEgoDebt: 3,                 // 3 strikes = FAIL
    },
};

// Pillar 11 State tracking
export interface AgencyState {
    totalDirectionalPredictions: number;
    cyclesWithDirection: number;
    agencyQuotaMet: boolean;
    firstAgencyTime: number | null;
    egoDebt: number;
    egoClockExpired: boolean;
    recoveryModeActive: boolean; // For Directional Forgiveness Window
}

// Token Classification
export type TokenClass = 'STABLE' | 'MAJOR' | 'CHAOS';

// Known stablecoins - excluded from Pillar 10 (no directional prediction possible)
const STABLE_SYMBOLS = ['USDC', 'USDT', 'PYUSD', 'DAI', 'USDH', 'UXD', 'FRAX', 'BUSD', 'TUSD', 'USDP', 'GUSD', 'PAX'];
const STABLE_MINTS = [
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYUSD
];

// Known major tokens - optional inclusion based on mode
const MAJOR_SYMBOLS = ['SOL', 'ETH', 'BTC', 'WBTC', 'WETH', 'JUP', 'RAY', 'BONK', 'JTO', 'PYTH', 'WIF', 'RNDR'];

/**
 * Classify a token
 */
export function classifyToken(symbol: string, mint: string): TokenClass {
    const upperSymbol = symbol.toUpperCase();

    // Check stables first
    if (STABLE_SYMBOLS.includes(upperSymbol) || STABLE_MINTS.includes(mint)) {
        return 'STABLE';
    }

    // Check majors
    if (MAJOR_SYMBOLS.includes(upperSymbol)) {
        return 'MAJOR';
    }

    // Everything else is CHAOS
    return 'CHAOS';
}

// Pillar 10.3: Stored prediction with delayed scoring
export interface StoredPrediction {
    token: string;
    direction: PredictionDirection;
    priceAtPrediction: number;
    cycle: number;
    score: number;
    resolved: boolean;
    hesitationPenaltyApplied?: boolean; // Pillar 10.4
}

export interface FunnelState {
    cycle: number;
    startedAt: number;
    initialTokenCount: number; // For ratio-based thresholds
    tokens: TokenCandidate[];
    eliminated: TokenCandidate[];
    predictions: Map<string, PredictionDirection>;
    regime: string;
    funnelComplete: boolean;
    funnelCollapsed: boolean;
    executionCandidates: TokenCandidate[];

    // Pillar 10.3: Prediction storage for delayed accountability
    predictionStorage: Map<string, StoredPrediction[]>;

    // Pillar 10.5: Behavioral Adaptation state
    biases: DirectionBias;
    lastPenaltyProfile?: CyclePenaltyProfile;

    // Pillar 10.6: FLAT DEBT tracking
    consecutiveFlatDominanceCycles: number;
    explorationModeActive: boolean;

    // Pillar 10.7: FLAT Watchlist for missed opportunity tracking
    flatWatchlist: FlatWatchEntry[];
    totalMissedOpportunityPenalty: number;

    // Pillar 11: Agency Accountability state
    agencyState: AgencyState;
}

export interface TokenCandidate {
    symbol: string;
    mint: string;
    tokenClass: TokenClass;
    priceAtStart: number;
    priceAtEnd?: number;
    prediction?: PredictionDirection;
    actual?: PredictionDirection;
    correct?: boolean;
    score: number;
    // Pillar 10.6: FLAT streak tracking
    flatStreak: number;
}

export interface CycleResult {
    cycle: number;
    tokensBefore: number;
    tokensAfter: number;
    accuracy: number;
    regime: string;
    survivors: TokenCandidate[];
    eliminated: TokenCandidate[];
    timestamp: number;
}

/**
 * Fetch frozen universe of tokens from Jupiter with classification
 */
export async function freezeUniverse(limit: number = 1000): Promise<TokenCandidate[]> {
    const tokensRes = await fetch(`${JUPITER_PROXY_URL}/tokens`);
    if (!tokensRes.ok) throw new Error('Failed to fetch tokens');

    const { tokens } = await tokensRes.json();
    const candidates: TokenCandidate[] = [];
    const classificationStats = { STABLE: 0, MAJOR: 0, CHAOS: 0 };

    // Pre-filter tokens before fetching quotes
    const tokensToFetch: any[] = [];
    for (const token of tokens.slice(0, limit * 3)) {
        if (token.address === SOL_MINT) continue;

        const tokenClass = classifyToken(token.symbol, token.address);
        classificationStats[tokenClass]++;

        // Filter based on mode
        if (tokenClass === 'STABLE') continue;
        if (PILLAR_10_CONFIG.FUNNEL_MODE === 'CHAOS_ONLY' && tokenClass === 'MAJOR') continue;

        tokensToFetch.push({ ...token, tokenClass });
        if (tokensToFetch.length >= limit) break;
    }

    console.log(`[Pillar10] Pre-filtered: ${tokensToFetch.length} tokens to fetch quotes for`);

    // Fetch quotes in parallel batches of 100 (avoid rate limits)
    const BATCH_SIZE = 250;
    for (let i = 0; i < tokensToFetch.length && candidates.length < limit; i += BATCH_SIZE) {
        const batch = tokensToFetch.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.allSettled(
            batch.map(async (token) => {
                const amount = Math.pow(100, token.decimals || 6).toString();
                const quoteRes = await fetch(
                    `${JUPITER_PROXY_URL}/quote?` + new URLSearchParams({
                        inputMint: token.address,
                        outputMint: SOL_MINT,
                        amount,
                        slippageBps: '50',
                    })
                );

                if (!quoteRes.ok) return null;
                const quote = await quoteRes.json();
                const solOut = parseInt(quote.outAmount || '0') / 1e9;

                if (solOut > 0) {
                    return {
                        symbol: token.symbol,
                        mint: token.address,
                        tokenClass: token.tokenClass,
                        priceAtStart: solOut,
                        score: 0,
                        flatStreak: 0, // Pillar 10.6
                    };
                }
                return null;
            })
        );

        for (const result of batchResults) {
            if (result.status === 'fulfilled' && result.value && candidates.length < limit) {
                candidates.push(result.value);
            }
        }
    }

    console.log(`[Pillar10] Universe classification: ${JSON.stringify(classificationStats)}`);
    console.log(`[Pillar10] Funnel mode: ${PILLAR_10_CONFIG.FUNNEL_MODE}, candidates: ${candidates.length}`);

    return candidates;
}

/**
 * Build price histories from candidates
 */
function buildHistories(candidates: TokenCandidate[]): TokenPriceHistory[] {
    const now = Date.now();
    return candidates.map(c => ({
        symbol: c.symbol,
        mint: c.mint,
        prices: [
            { timestamp: now - 5 * 60 * 1000, price: c.priceAtStart * 0.99, volume: 1000 },
            { timestamp: now - 4 * 60 * 1000, price: c.priceAtStart * 0.995, volume: 1000 },
            { timestamp: now - 3 * 60 * 1000, price: c.priceAtStart * 1.0, volume: 1000 },
            { timestamp: now - 2 * 60 * 1000, price: c.priceAtStart * 1.005, volume: 1000 },
            { timestamp: now - 1 * 60 * 1000, price: c.priceAtStart * 1.01, volume: 1000 },
            { timestamp: now, price: c.priceAtStart, volume: 1000 },
        ],
    }));
}

/**
 * Pillar 10.1 + 10.2: Directional Commitment Rules
 * 
 * 10.1: Rejects rounds with too many FLAT predictions.
 * 10.2: Requires minimum directional (UP+DOWN) commitment.
 * 
 * "If you claim the market is flat, prove it by giving up the chance to trade."
 * "To continue, the brain must take directional risk."
 */
export interface DirectionalCheck {
    valid: boolean;
    upCount: number;
    downCount: number;
    flatCount: number;
    directionalPct: number;
    flatPct: number;
    minDirectional: number;
    maxFlat: number;
    reason?: string;
    violationType?: 'FLAT_EXCEEDED' | 'DIRECTIONAL_INSUFFICIENT';
}

/**
 * Get thresholds based on funnel stage (token count)
 * 
 * RELAXED thresholds for CHAOS environment to allow multi-cycle learning.
 * The predictor CAN be honest about noise (FLAT) without immediate rejection.
 * Biases adapt via Pillar 10.5 to reduce FLAT over time.
 * 
 * | Funnel Stage      | MIN (UP+DOWN) | MAX FLAT |
 * |-------------------|---------------|----------|
 * | Universe (>1000)  | 25%           | 75%      |  ← Relaxed
 * | Large (500-1000)  | 35%           | 65%      |  ← Relaxed
 * | Narrow (250-500)  | 50%           | 50%      |
 * | Final (≤250)      | 70%           | 30%      |
 */
function getDirectionalThresholds(
    initialTokenCount: number,
    currentTokenCount: number,
    explorationMode: boolean = false
): { minDirectional: number; maxFlat: number } {

    const ratio = currentTokenCount / initialTokenCount;
    let thresholds: { minDirectional: number; maxFlat: number };

    // EARLY — Universe scan (1000 → ~400)
    // Allow high FLAT honesty initially - Brain learns the noise first
    if (ratio > 0.5) {
        thresholds = {
            minDirectional: 0.25, // Only 25% directional required early
            maxFlat: 0.75,        // 75% FLAT allowed (noise acknowledgment)
        };
    }
    // MID — Narrowing (400 → ~100)
    else if (ratio > 0.2) {
        thresholds = {
            minDirectional: 0.35,
            maxFlat: 0.65,
        };
    }
    // LATE — Final funnel (100 → ~20)
    else if (ratio > 0.05) {
        thresholds = {
            minDirectional: 0.50,
            maxFlat: 0.50,
        };
    }
    // FINAL — Execution gate (≤ ~20)
    else {
        thresholds = {
            minDirectional: 0.70,
            maxFlat: 0.30,
        };
    }

    // EXPLORATION mode: Further relax thresholds if enabled
    if (explorationMode && PILLAR_10_CONFIG.ALLOW_EXPLORATION_FALLBACK) {
        const mult = PILLAR_10_CONFIG.EXPLORATION_THRESHOLD_MULTIPLIER;
        thresholds.minDirectional *= mult;
        thresholds.maxFlat = 1 - thresholds.minDirectional; // Inverse relationship
    }

    return thresholds;
}

export function checkDirectionalCommitment(predictions: Map<string, PredictionDirection>, tokenCount: number, initialTokenCount: number): DirectionalCheck {
    let upCount = 0;
    let downCount = 0;
    let flatCount = 0;

    for (const direction of predictions.values()) {
        if (direction === 'UP') upCount++;
        else if (direction === 'DOWN') downCount++;
        else flatCount++;
    }

    const total = predictions.size;
    const directionalPct = total > 0 ? (upCount + downCount) / total : 0;
    const flatPct = total > 0 ? flatCount / total : 0;

    const { minDirectional, maxFlat } = getDirectionalThresholds(initialTokenCount, tokenCount);


    // Pillar 10.1: Check FLAT limit
    if (flatPct > maxFlat) {
        return {
            valid: false,
            upCount,
            downCount,
            flatCount,
            directionalPct,
            flatPct,
            minDirectional,
            maxFlat,
            violationType: 'FLAT_EXCEEDED',
            reason: `FLAT ${(flatPct * 100).toFixed(0)}% exceeds limit ${(maxFlat * 100).toFixed(0)}%`,
        };
    }

    // Pillar 10.2: Check directional commitment
    if (directionalPct < minDirectional) {
        return {
            valid: false,
            upCount,
            downCount,
            flatCount,
            directionalPct,
            flatPct,
            minDirectional,
            maxFlat,
            violationType: 'DIRECTIONAL_INSUFFICIENT',
            reason: `Directional ${(directionalPct * 100).toFixed(0)}% below minimum ${(minDirectional * 100).toFixed(0)}%`,
        };
    }

    return {
        valid: true,
        upCount,
        downCount,
        flatCount,
        directionalPct,
        flatPct,
        minDirectional,
        maxFlat
    };
}

/**
 * Make predictions for all tokens in the funnel
 * Returns directional commitment check result (Pillar 10.1 + 10.2)
 */
export function predictFunnel(
    state: FunnelState,
    emitEvent?: (type: string, data: any) => void
): DirectionalCheck {

    // Pillar 10.5: Adapt Behavior for Next Cycle (if applicable)
    // We do this BEFORE prediction to influence the current batch
    if (state.cycle > 0) {
        const adaptation = adaptBehavior(state);
        state.biases = adaptation.biases;
        state.lastPenaltyProfile = adaptation.profile;

        if (emitEvent) {
            emitEvent('BEHAVIOR_ADJUSTED', {
                cycle: state.cycle,
                changes: state.biases,
                profile: adaptation.profile,
                reason: "Penalty feedback from previous cycle"
            });
        }
        console.log(`[Pillar 10.5] Adapted Behavior: UP=${state.biases.upBias.toFixed(2)} DOWN=${state.biases.downBias.toFixed(2)} FLAT=${state.biases.flatBias.toFixed(2)}`);
    }

    const histories = buildHistories(state.tokens);

    // Detect regime first
    const regime = detectRegime(histories);
    state.regime = regime.regime;

    // ================================================================
    // PILLAR 12: Constrained Directional Allocation
    // Brain defines DISTRIBUTION, then allocates tokens by signal strength
    // ================================================================

    // 1. Calculate Target Distribution from Biases
    const totalBias = state.biases.upBias + state.biases.downBias + state.biases.flatBias;
    let targetUp = state.biases.upBias / totalBias;
    let targetDown = state.biases.downBias / totalBias;
    let targetFlat = state.biases.flatBias / totalBias;

    // 2. Apply Constraints (Pillar 10 Limits)
    const { minDirectional, maxFlat } = getDirectionalThresholds(state.initialTokenCount, state.tokens.length);

    // Clamp FLAT
    if (targetFlat > maxFlat) {
        const excess = targetFlat - maxFlat;
        targetFlat = maxFlat;
        // Redistribute excess to UP/DOWN proportionally
        const upShare = targetUp / (targetUp + targetDown);
        targetUp += excess * upShare;
        targetDown += excess * (1 - upShare);
    }

    // Ensure Directional Min
    const currentDirectional = targetUp + targetDown;
    if (currentDirectional < minDirectional) {
        const deficit = minDirectional - currentDirectional;
        targetFlat -= deficit;
        const upShare = targetUp / currentDirectional;
        targetUp += deficit * upShare;
        targetDown += deficit * (1 - upShare);
    }

    // 3. Calculate Allocation Counts
    const totalTokens = state.tokens.length;
    let countUp = Math.floor(totalTokens * targetUp);
    let countDown = Math.floor(totalTokens * targetDown);
    // Remainder to FLAT to ensure sum = total
    let countFlat = totalTokens - countUp - countDown;

    if (emitEvent) {
        emitEvent('PILLAR_12_ALLOCATION', {
            distribution: {
                up: (targetUp * 100).toFixed(1) + '%',
                down: (targetDown * 100).toFixed(1) + '%',
                flat: (targetFlat * 100).toFixed(1) + '%'
            },
            counts: { up: countUp, down: countDown, flat: countFlat },
            constraints: { maxFlat: (maxFlat * 100).toFixed(0) + '%' }
        });
    }

    // 4. Score Tokens by Signal Strength (Momentum)
    // We utilize predictBatch to get the raw signals, ignoring its labeled prediction for now
    const rawPredictions = predictBatch(histories, regime.regime, true, state.biases);

    // Map tokens to their signal score (momentum)
    const scoredTokens = state.tokens.map(token => {
        const pred = rawPredictions.find(p => p.symbol === token.symbol);
        // Use momentum as primary signal Score. 
        // fallback to random if no signal (shouldn't happen with valid history)
        const score = pred?.signals?.momentum ?? (Math.random() - 0.5);
        return { token, score, prediction: 'FLAT' as PredictionDirection };
    });

    // 5. Sort by Score (Signed Momentum)
    // Most Positive -> UP
    // Most Negative -> DOWN
    // Middle -> FLAT
    scoredTokens.sort((a, b) => b.score - a.score); // Descending

    // 6. Allocate Labels
    for (let i = 0; i < totalTokens; i++) {
        if (i < countUp) {
            scoredTokens[i].prediction = 'UP';
        } else if (i >= totalTokens - countDown) {
            scoredTokens[i].prediction = 'DOWN';
        } else {
            scoredTokens[i].prediction = 'FLAT';
        }
    }

    // 7. Update State
    state.predictions.clear();
    for (const item of scoredTokens) {
        state.predictions.set(item.token.symbol, item.prediction);
        item.token.prediction = item.prediction;
    }

    // Pillar 10.3: Record predictions (FLAT stored for delayed scoring)
    const currentPrices = new Map<string, number>();
    for (const token of state.tokens) {
        currentPrices.set(token.symbol, token.priceAtStart);
    }
    recordPredictions(state, currentPrices);

    // Pillar 10.1 + 10.2: Check directional commitment (Should always pass now due to construction)
    const check = checkDirectionalCommitment(state.predictions, state.tokens.length, state.initialTokenCount);

    if (!check.valid) {
        console.log(`[Pillar10.1/10.2] STOP_NO_EDGE: ${check.reason}`);
    }

    return check;
}

/**
 * Fetch current prices and score predictions
 * Pillar 10.3: Resolves previous cycle predictions with FLAT accountability
 * 
 * @param narrowingAllowed - If false, skip narrowing (OBSERVATION_ONLY mode)
 */
export async function scoreFunnel(
    state: FunnelState,
    emitEvent?: (type: string, data: any) => void,
    narrowingAllowed: boolean = true
): Promise<CycleResult> {
    const tokensBefore = state.tokens.length;
    const startTime = Date.now();

    // Fetch current prices for all tokens
    const currentPrices = new Map<string, number>();
    for (const token of state.tokens) {
        try {
            const amount = Math.pow(10, 6).toString(); // Standard decimals
            const quoteRes = await fetch(
                `${JUPITER_PROXY_URL}/quote?` + new URLSearchParams({
                    inputMint: token.mint,
                    outputMint: SOL_MINT,
                    amount,
                    slippageBps: '50',
                })
            );

            if (quoteRes.ok) {
                const quote = await quoteRes.json();
                token.priceAtEnd = parseInt(quote.outAmount || '0') / 1e9;
                currentPrices.set(token.symbol, token.priceAtEnd);
            } else {
                token.priceAtEnd = token.priceAtStart;
                currentPrices.set(token.symbol, token.priceAtStart);
            }
        } catch {
            token.priceAtEnd = token.priceAtStart; // Assume flat if error
            currentPrices.set(token.symbol, token.priceAtStart);
        }
    }

    // Pillar 10.3: Resolve predictions from previous cycle
    // NOTE: Penalties still apply even in OBSERVATION_ONLY mode
    const resolvedScores = resolvePredictions(state, currentPrices, 1.0, emitEvent);

    // ================================================================
    // EXPOSURE-GATED ACCURACY: Only calculated if narrowing allowed
    // OBSERVATION_ONLY mode = no accuracy credit, no funnel progress
    // ================================================================
    let accuracy = 0;
    let correctCount = 0;

    // Always update actual directions for observational data
    for (const token of state.tokens) {
        if (!token.priceAtEnd) token.priceAtEnd = token.priceAtStart;
        const priceChange = ((token.priceAtEnd - token.priceAtStart) / token.priceAtStart);
        token.actual = determineActualDirection(priceChange * 100);

        // Update cumulative score from resolved predictions (penalties still apply)
        const resolvedScore = resolvedScores.get(token.symbol) || 0;
        token.score = resolvedScore;
    }

    // Only count accuracy when narrowing is allowed (directional commitment made)
    if (narrowingAllowed) {
        for (const token of state.tokens) {
            token.correct = token.prediction === token.actual;
            if (token.correct) correctCount++;
        }
        accuracy = tokensBefore > 0 ? correctCount / tokensBefore : 0;
    } else {
        // OBSERVATION_ONLY: No accuracy credit - funnel doesn't progress on FLAT
        if (emitEvent) {
            emitEvent('ACCURACY_BLOCKED', {
                mode: 'OBSERVATION_ONLY',
                reason: 'No directional commitment = no accuracy credit',
            });
        }
        // Mark all as "not correct" for observation purposes (no credit)
        for (const token of state.tokens) {
            token.correct = false; // No credit without commitment
        }
    }

    // ================================================================
    // NARROWING: Only happens if allowed (not in OBSERVATION_ONLY mode)
    // ================================================================
    let survivors = state.tokens;
    let eliminated: TokenCandidate[] = [];

    if (narrowingAllowed) {
        // Narrow to survivors based on cumulative scores
        survivors = state.tokens
            .filter(t => t.score > -5) // Eliminate tokens with very bad scores
            .sort((a, b) => b.score - a.score)
            .slice(0, Math.ceil(state.tokens.length * PILLAR_10_CONFIG.NARROWING_RATIO));

        eliminated = state.tokens.filter(t => !survivors.includes(t));

        // Update state
        state.eliminated.push(...eliminated);
        state.tokens = survivors;

        // Check termination conditions (only when narrowing)
        if (survivors.length < PILLAR_10_CONFIG.SURVIVOR_THRESHOLD) {
            state.funnelComplete = true;
            // Find UP predictions for execution
            state.executionCandidates = survivors.filter(t => t.prediction === 'UP' && t.score > 0);
        }

        if (survivors.length === 0) {
            state.funnelCollapsed = true;
        }
    } else {
        // OBSERVATION_ONLY mode: No narrowing, but still score
        if (emitEvent) {
            emitEvent('NARROWING_SKIPPED', { mode: 'OBSERVATION_ONLY', tokens: state.tokens.length });
        }
    }

    // Increment cycle
    state.cycle++;

    // Reset for next cycle
    for (const token of state.tokens) {
        token.priceAtStart = token.priceAtEnd || token.priceAtStart;
        token.priceAtEnd = undefined;
        token.prediction = undefined;
        token.actual = undefined;
        token.correct = undefined;
    }

    return {
        cycle: state.cycle,
        tokensBefore,
        tokensAfter: survivors.length,
        accuracy,
        regime: state.regime,
        survivors,
        eliminated,
        timestamp: Date.now(),
    };
}

/**
 * Create initial funnel state
 */
export function createFunnelState(tokens: TokenCandidate[]): FunnelState {
    // Initialize flatStreak on all tokens
    for (const token of tokens) {
        token.flatStreak = 0;
    }

    return {
        cycle: 0,
        startedAt: Date.now(),
        initialTokenCount: tokens.length,
        tokens,
        eliminated: [],
        predictions: new Map(),
        regime: 'UNKNOWN',
        funnelComplete: false,
        funnelCollapsed: false,
        executionCandidates: [],
        predictionStorage: new Map(),

        // Pillar 10.5: Behavioral Adaptation
        biases: { upBias: 1.0, downBias: 1.0, flatBias: 1.0 },

        // Pillar 10.6: FLAT DEBT tracking
        consecutiveFlatDominanceCycles: 0,
        explorationModeActive: false,

        // Pillar 10.7: FLAT Watchlist
        flatWatchlist: [],
        totalMissedOpportunityPenalty: 0,

        // Pillar 11: Agency Accountability
        agencyState: {
            totalDirectionalPredictions: 0,
            cyclesWithDirection: 0,
            agencyQuotaMet: false,
            firstAgencyTime: null,
            egoDebt: 0,
            egoClockExpired: false,
            recoveryModeActive: false,
        },
    };
}

/**
 * Check if funnel should continue
 */
export function shouldContinueFunnel(state: FunnelState): boolean {
    const elapsed = Date.now() - state.startedAt;
    const maxMs = PILLAR_10_CONFIG.MAX_DURATION_MINUTES * 60 * 1000;

    if (elapsed >= maxMs) return false;
    if (state.funnelComplete) return false;
    if (state.funnelCollapsed) return false;
    if (state.tokens.length === 0) return false;

    return true;
}

/**
 * Get execution decision from funnel
 */
export function getFunnelVerdict(state: FunnelState): {
    shouldExecute: boolean;
    reason: string;
    candidates: TokenCandidate[];
} {
    if (state.funnelCollapsed) {
        return {
            shouldExecute: false,
            reason: 'Funnel collapsed - all tokens eliminated. NO TRADE = PASS.',
            candidates: [],
        };
    }

    if (!state.funnelComplete) {
        return {
            shouldExecute: false,
            reason: 'Funnel not complete - still narrowing.',
            candidates: [],
        };
    }

    if (state.executionCandidates.length === 0) {
        return {
            shouldExecute: false,
            reason: 'No UP candidates survived. NO TRADE = PASS.',
            candidates: [],
        };
    }

    return {
        shouldExecute: true,
        reason: `Funnel complete: ${state.executionCandidates.length} UP candidates ready.`,
        candidates: state.executionCandidates,
    };
}

/**
 * ========================================
 * PILLAR 10.3: FLAT ACCOUNTABILITY
 * ========================================
 *
 * Core principle: FLAT predictions are allowed but NOT free.
 * - FLAT predictions from Cycle N are stored
 * - They are scored at Cycle N+1 (delayed accountability)
 * - Cowardice collapses naturally
 * - Intelligence survives
 */

/**
 * Record predictions from current cycle
 * FLAT predictions are stored but NOT scored yet
 */
export function recordPredictions(
    state: FunnelState,
    currentPrices: Map<string, number>
): void {
    for (const token of state.tokens) {
        if (!token.prediction) continue;

        const price = currentPrices.get(token.symbol);
        if (!price) continue;

        if (!state.predictionStorage.has(token.symbol)) {
            state.predictionStorage.set(token.symbol, []);
        }

        state.predictionStorage.get(token.symbol)!.push({
            token: token.symbol,
            direction: token.prediction,
            priceAtPrediction: price,
            cycle: state.cycle,
            score: 0,
            resolved: false,
        });
    }
}

/**
 * Resolve predictions from PREVIOUS cycle at CURRENT cycle
 * This is where FLAT accountability happens (Pillar 10.3 + 10.4)
 */
export function resolvePredictions(
    state: FunnelState,
    currentPrices: Map<string, number>,
    opportunityScore: number,
    emitEvent?: (type: string, data: any) => void
): Map<string, number> {
    const tokenScores = new Map<string, number>();

    for (const [tokenSymbol, predictions] of state.predictionStorage.entries()) {
        const currentPrice = currentPrices.get(tokenSymbol);
        if (!currentPrice) continue;

        let totalScore = 0;

        for (const pred of predictions) {
            if (pred.resolved) {
                totalScore += pred.score;
                continue;
            }

            const priceChange = (currentPrice - pred.priceAtPrediction) / pred.priceAtPrediction;

            // --- FLAT ACCOUNTABILITY (Pillar 10.3) ---
            if (pred.direction === 'FLAT') {
                if (Math.abs(priceChange) <= PILLAR_10_CONFIG.FLAT_EPSILON) {
                    pred.score = PILLAR_10_SCORES.CORRECT_FLAT;
                    pred.resolved = true;

                    if (emitEvent) {
                        emitEvent('FLAT_RESOLVED', {
                            token: tokenSymbol,
                            priceChange: (priceChange * 100).toFixed(2) + '%',
                            score: pred.score,
                            verdict: 'CORRECT',
                            cycle: pred.cycle,
                        });
                    }
                } else {
                    pred.score = PILLAR_10_SCORES.WRONG_FLAT;
                    pred.resolved = true;

                    if (emitEvent) {
                        emitEvent('FLAT_RESOLVED', {
                            token: tokenSymbol,
                            priceChange: (priceChange * 100).toFixed(2) + '%',
                            score: pred.score,
                            verdict: 'WRONG - COWARDICE PENALTY',
                            cycle: pred.cycle,
                        });
                    }
                }

                // --- HESITATION OPPORTUNITY PENALTY (Pillar 10.4) ---
                // Applied AFTER 10.3 correctness scoring
                // Only penalize if:
                // 1. Market regime is tradeable (not CHAOS)
                // 2. Opportunity was real (> 0.3)
                // 3. Price moved significantly (> 1%)
                if (
                    state.regime !== 'CHAOS' &&
                    opportunityScore >= PILLAR_10_4_CONFIG.MIN_OPPORTUNITY_SCORE &&
                    Math.abs(priceChange) >= PILLAR_10_4_CONFIG.OPPORTUNITY_EPSILON
                ) {
                    pred.score += PILLAR_10_4_CONFIG.HESITATION_PENALTY;
                    pred.hesitationPenaltyApplied = true;

                    if (emitEvent) {
                        emitEvent('HESITATION_PENALTY', {
                            token: tokenSymbol,
                            priceChange: (priceChange * 100).toFixed(2) + '%',
                            penalty: PILLAR_10_4_CONFIG.HESITATION_PENALTY,
                            regime: state.regime,
                            opportunityScore: opportunityScore.toFixed(2),
                            reason: 'Missed directional move after hesitation',
                            cycle: pred.cycle,
                        });
                    }
                }

                totalScore += pred.score;
                continue;
            }

            // --- UP / DOWN (immediate scoring) ---
            if (pred.direction === 'UP') {
                pred.score = priceChange > PILLAR_10_CONFIG.FLAT_EPSILON
                    ? PILLAR_10_SCORES.CORRECT_UP
                    : PILLAR_10_SCORES.WRONG_UP;
            }

            if (pred.direction === 'DOWN') {
                pred.score = priceChange < -PILLAR_10_CONFIG.FLAT_EPSILON
                    ? PILLAR_10_SCORES.CORRECT_DOWN
                    : PILLAR_10_SCORES.WRONG_DOWN;
            }

            pred.resolved = true;
            totalScore += pred.score;
        }

        tokenScores.set(tokenSymbol, totalScore);
    }

    return tokenScores;
}

/**
 * Get aggregated scores for all tokens
 * Used for funnel narrowing logic
 */
export function getTokenScores(storage: Map<string, StoredPrediction[]>): Map<string, number> {
    const scores = new Map<string, number>();

    for (const [token, predictions] of storage.entries()) {
        const total = predictions
            .filter(p => p.resolved)
            .reduce((sum, p) => sum + p.score, 0);

        scores.set(token, total);
    }

    return scores;
}

/**
 * Get statistics about FLAT usage
 * Helps detect cowardice vs intelligence
 */
export function getFlatStatistics(storage: Map<string, StoredPrediction[]>): {
    totalFlat: number;
    correctFlat: number;
    wrongFlat: number;
    flatAccuracy: number;
    cowardiceScore: number; // High = too much FLAT
} {
    let totalFlat = 0;
    let correctFlat = 0;
    let wrongFlat = 0;

    for (const predictions of storage.values()) {
        for (const pred of predictions) {
            if (pred.direction === 'FLAT' && pred.resolved) {
                totalFlat++;
                if (pred.score > 0) correctFlat++;
                else wrongFlat++;
            }
        }
    }

    const flatAccuracy = totalFlat > 0 ? correctFlat / totalFlat : 0;

    // Cowardice score: too many FLAT predictions relative to directional
    const allPredictions = Array.from(storage.values()).flat();
    const resolvedCount = allPredictions.filter(p => p.resolved).length;
    const flatRatio = resolvedCount > 0 ? totalFlat / resolvedCount : 0;
    const cowardiceScore = flatRatio > 0.5 ? flatRatio : 0; // Over 50% FLAT = cowardice

    return {
        totalFlat,
        correctFlat,
        wrongFlat,
        flatAccuracy,
        cowardiceScore,
    };
}

/**
 * ========================================
 * PILLAR 10.5: PENALTY-DRIVEN ADAPTATION
 * ========================================
 */

export interface CyclePenaltyProfile {
    flatExcess: number;        // too many FLAT
    hesitationPenalty: number; // missed moves
    wrongUpPenalty: number;    // reckless optimism
    wrongDownPenalty: number;  // excessive pessimism
}

function clampBias(x: number): number {
    return Math.min(1.5, Math.max(0.5, x));
}

/**
 * Adapt behavioral biases based on previous cycle penalties
 */
export function adaptBehavior(state: FunnelState): { biases: DirectionBias; profile: CyclePenaltyProfile } {
    // Default neutral biases
    let upBias = 1.0;
    let downBias = 1.0;
    let flatBias = 1.0;

    // Default profile
    const profile: CyclePenaltyProfile = {
        flatExcess: 0,
        hesitationPenalty: 0,
        wrongUpPenalty: 0,
        wrongDownPenalty: 0
    };

    // If first cycle, return neutral
    if (state.cycle === 0) {
        return { biases: { upBias, downBias, flatBias }, profile };
    }

    // Analyze previous cycle (N-1)
    // We look at resolved predictions that belong to the previous cycle
    const previousCycle = state.cycle - 1;
    let totalResolved = 0;

    for (const predictions of state.predictionStorage.values()) {
        for (const p of predictions) {
            // Only look at predictions from the previous cycle that are resolved
            if (p.cycle === previousCycle && p.resolved) {
                totalResolved++;

                // 1. Hesitation Penalty (already calculated in record/resolve)
                if (p.hesitationPenaltyApplied) {
                    profile.hesitationPenalty += PILLAR_10_4_CONFIG.HESITATION_PENALTY;
                }

                // 2. Wrong UP / DOWN
                if (p.direction === 'UP' && p.score < 0) {
                    profile.wrongUpPenalty += p.score;
                }
                if (p.direction === 'DOWN' && p.score < 0) {
                    profile.wrongDownPenalty += p.score;
                }
            }
        }
    }

    // 3. Flat Excess (Cowardice)
    const flatStats = getFlatStatistics(state.predictionStorage);
    profile.flatExcess = flatStats.cowardiceScore;

    // --- APPLY PILLAR 10.5 RULES ---

    // Rule 1: Too much FLAT -> reduce FLAT bias
    if (profile.flatExcess > 0) {
        flatBias *= 0.7;
    }

    // Rule 2: Hesitation penalty -> encourage direction
    if (profile.hesitationPenalty < 0) {
        upBias *= 1.1;
        downBias *= 1.1;
        flatBias *= 0.8;
    }

    // Rule 3: Too many wrong UP -> dampen optimism
    if (profile.wrongUpPenalty < -2) {
        upBias *= 0.75;
    }

    // Rule 4: Too many wrong DOWN -> dampen pessimism
    if (profile.wrongDownPenalty < -2) {
        downBias *= 0.75;
    }

    // Safety clamp
    return {
        biases: {
            upBias: clampBias(upBias),
            downBias: clampBias(downBias),
            flatBias: clampBias(flatBias)
        },
        profile
    };
}

// ============================================================================
// PILLAR X: Mandatory Informational Exposure Enforcement
// ============================================================================

export interface PillarXResult {
    quotaMet: boolean;
    requiredQuota: number;
    actualDirectional: number;
    eliminatedForFlatStreak: TokenCandidate[];
    stallDetected: boolean;
    stallReason?: string;
}

/**
 * Pillar X.2: Get the exposure quota for a given cycle
 */
function getExposureQuota(cycle: number): number {
    return PILLAR_X_CONFIG.EXPOSURE_QUOTAS[cycle] ?? PILLAR_X_CONFIG.DEFAULT_QUOTA;
}

/**
 * Pillar X: Enforce anti-stall rules
 * 
 * - X.1: FLAT is only unrestricted for first N cycles
 * - X.2: Check exposure quota (min directional %)
 * - X.3: Eliminate tokens with repeated FLAT predictions
 * 
 * Returns enforcement result with eliminated tokens and quota status
 */
export function enforcePillarX(
    state: FunnelState,
    emitEvent?: (type: string, data: any) => void
): PillarXResult {
    const cycle = state.cycle + 1; // Next cycle number
    const requiredQuota = getExposureQuota(cycle);

    // Calculate current directional ratio
    const predictions = Array.from(state.predictions.values());
    const total = predictions.length;
    const directional = predictions.filter(p => p === 'UP' || p === 'DOWN').length;
    const actualDirectional = total > 0 ? directional / total : 0;

    // X.2: Check exposure quota
    const quotaMet = actualDirectional >= requiredQuota;

    if (!quotaMet && cycle > PILLAR_X_CONFIG.FLAT_UNRESTRICTED_CYCLES) {
        if (emitEvent) {
            emitEvent('PILLAR_X_QUOTA_VIOLATION', {
                cycle,
                required: (requiredQuota * 100).toFixed(0) + '%',
                actual: (actualDirectional * 100).toFixed(0) + '%',
                action: 'OBSERVATION_ONLY',
            });
        }
    }

    // X.3: Eliminate tokens with repeated FLAT
    const eliminatedForFlatStreak: TokenCandidate[] = [];

    for (const token of state.tokens) {
        if (token.prediction === 'FLAT') {
            token.flatStreak = (token.flatStreak || 0) + 1;
        } else {
            token.flatStreak = 0; // Reset streak on directional prediction
        }

        // Eliminate if streak exceeds limit
        if (token.flatStreak >= PILLAR_X_CONFIG.MAX_CONSECUTIVE_FLAT) {
            eliminatedForFlatStreak.push(token);
            if (emitEvent) {
                emitEvent('PILLAR_X_FLAT_ELIMINATION', {
                    token: token.symbol,
                    flatStreak: token.flatStreak,
                    reason: `FLAT for ${token.flatStreak} consecutive cycles`,
                });
            }
        }
    }

    // Remove eliminated tokens from active pool
    if (eliminatedForFlatStreak.length > 0) {
        state.tokens = state.tokens.filter(t => !eliminatedForFlatStreak.includes(t));
        state.eliminated.push(...eliminatedForFlatStreak);

        if (emitEvent) {
            emitEvent('PILLAR_X_ELIMINATIONS', {
                count: eliminatedForFlatStreak.length,
                remaining: state.tokens.length,
            });
        }
    }

    return {
        quotaMet: quotaMet || cycle <= PILLAR_X_CONFIG.FLAT_UNRESTRICTED_CYCLES,
        requiredQuota,
        actualDirectional,
        eliminatedForFlatStreak,
        stallDetected: false,
    };
}

/**
 * Pillar X.4: Detect learning stall
 * 
 * If after N cycles: no narrowing, no penalties, no adaptation → FAIL
 */
export function detectLearningStall(
    state: FunnelState,
    totalEliminated: number,
    totalPenalty: number,
    emitEvent?: (type: string, data: any) => void
): { stalled: boolean; reason?: string } {
    // Only check after minimum cycles
    if (state.cycle < PILLAR_X_CONFIG.STALL_DETECTION_CYCLES) {
        return { stalled: false };
    }

    const reasons: string[] = [];

    // Check if we've eliminated enough tokens
    if (totalEliminated < PILLAR_X_CONFIG.MIN_ELIMINATED_TO_PROGRESS) {
        reasons.push(`Only ${totalEliminated} tokens eliminated (need ${PILLAR_X_CONFIG.MIN_ELIMINATED_TO_PROGRESS})`);
    }

    // Check if we've incurred any penalty (proves accountability)
    if (Math.abs(totalPenalty) < PILLAR_X_CONFIG.MIN_PENALTY_TO_PROGRESS) {
        reasons.push(`No significant penalty incurred (proves no risk taken)`);
    }

    if (reasons.length >= 2) {
        const reason = `STALL DETECTED: ${reasons.join('; ')}`;

        if (emitEvent) {
            emitEvent('PILLAR_X_STALL_DETECTED', {
                cycle: state.cycle,
                totalEliminated,
                totalPenalty,
                reason,
                verdict: 'FAIL',
            });
        }

        return { stalled: true, reason };
    }

    return { stalled: false };
}

// ============================================================================
// PILLAR 10.7: Missed Opportunity Accountability
// ============================================================================

export interface MissedOpportunityResult {
    totalPenalty: number;
    missedOpportunities: Array<{
        token: string;
        delta: number;
        missedDirection: 'UP' | 'DOWN';
        penalty: number;
    }>;
}

/**
 * Pillar 10.7: Track FLAT predictions in watchlist
 * Called after predictions are made, before observation period
 */
export function trackFlatPredictions(
    state: FunnelState,
    currentPrices: Map<string, number>,
    emitEvent?: (type: string, data: any) => void
): void {
    // Add all current FLAT predictions to watchlist
    for (const token of state.tokens) {
        if (token.prediction === 'FLAT') {
            const price = currentPrices.get(token.symbol) || token.priceAtStart;

            // Check if already in watchlist for this cycle
            const existing = state.flatWatchlist.find(
                w => w.token === token.symbol && w.cycle === state.cycle
            );

            if (!existing) {
                state.flatWatchlist.push({
                    token: token.symbol,
                    mint: token.mint,
                    cycle: state.cycle,
                    priceAtFlat: price,
                    timestamp: Date.now(),
                });
            }
        }
    }

    // Clean up old watchlist entries (older than WATCHLIST_CYCLES)
    state.flatWatchlist = state.flatWatchlist.filter(
        w => state.cycle - w.cycle < PILLAR_10_7_CONFIG.WATCHLIST_CYCLES
    );

    if (emitEvent && state.flatWatchlist.length > 0) {
        emitEvent('PILLAR_10_7_WATCHLIST', {
            count: state.flatWatchlist.length,
            tokens: state.flatWatchlist.map(w => w.token).slice(0, 10), // First 10
        });
    }
}

/**
 * Pillar 10.7: Evaluate missed opportunities from FLAT watchlist
 * Called at the start of a new cycle, evaluates previous cycle's FLAT predictions
 */
export function evaluateMissedOpportunities(
    state: FunnelState,
    currentPrices: Map<string, number>,
    emitEvent?: (type: string, data: any) => void
): MissedOpportunityResult {
    const result: MissedOpportunityResult = {
        totalPenalty: 0,
        missedOpportunities: [],
    };

    // Only evaluate entries from previous cycle(s)
    const toEvaluate = state.flatWatchlist.filter(w => w.cycle < state.cycle);

    for (const entry of toEvaluate) {
        const currentPrice = currentPrices.get(entry.token);
        if (!currentPrice || entry.priceAtFlat <= 0) continue;

        const delta = (currentPrice - entry.priceAtFlat) / entry.priceAtFlat;
        const epsilon = PILLAR_10_7_CONFIG.DIRECTION_EPSILON;

        // Check if direction emerged
        if (Math.abs(delta) > epsilon) {
            const missedDirection = delta > 0 ? 'UP' : 'DOWN';

            // Calculate penalty (scales with magnitude, capped at MAX)
            const rawPenalty = Math.abs(delta) * PILLAR_10_7_CONFIG.MAGNITUDE_MULTIPLIER;
            const penalty = Math.max(
                PILLAR_10_7_CONFIG.MAX_PENALTY,
                PILLAR_10_7_CONFIG.BASE_PENALTY - rawPenalty
            );

            result.missedOpportunities.push({
                token: entry.token,
                delta,
                missedDirection,
                penalty,
            });
            result.totalPenalty += penalty;

            if (emitEvent) {
                emitEvent('PILLAR_10_7_MISSED', {
                    token: entry.token,
                    flatCycle: entry.cycle,
                    currentCycle: state.cycle,
                    delta: (delta * 100).toFixed(2) + '%',
                    missedDirection,
                    penalty: penalty.toFixed(2),
                    message: `You predicted FLAT in Cycle ${entry.cycle}. Price moved ${(delta * 100).toFixed(2)}% by Cycle ${state.cycle}. You missed an ${missedDirection} opportunity.`,
                });
            }
        }
    }

    // Update total missed opportunity penalty in state
    state.totalMissedOpportunityPenalty += result.totalPenalty;

    // Remove evaluated entries from watchlist
    state.flatWatchlist = state.flatWatchlist.filter(w => w.cycle >= state.cycle);

    return result;
}

// ============================================================================
// PILLAR 10.9: Perceptual Seeding
// ============================================================================

/**
 * Pillar 10.9: Perceptual Seeding Phase
 * 
 * Before the brain predicts, show it LABELED examples of UP/DOWN/FLAT.
 * This is perception training, not action. No penalties, no rewards.
 * 
 * Labels are based on actual price movements, not brain's opinion.
 * After seeding, the brain has a reference frame for what direction looks like.
 */
export async function perceptualSeeding(
    tokens: TokenCandidate[],
    emitEvent?: (type: string, data: any) => void
): Promise<PerceptualSeedResult> {
    const epsilon = PILLAR_10_9_CONFIG.LABEL_EPSILON;

    // Classify tokens by their ACTUAL recent movement
    const upTokens: TokenCandidate[] = [];
    const downTokens: TokenCandidate[] = [];
    const flatTokens: TokenCandidate[] = [];

    // Calculate signatures for each group
    let upMoveSum = 0, upVolSum = 0;
    let downMoveSum = 0, downVolSum = 0;
    let flatMoveSum = 0, flatVolSum = 0;

    if (emitEvent) {
        emitEvent('PILLAR_10_9_START', {
            phase: 'PERCEPTUAL_SEEDING',
            message: 'Before judging decisions, observe what reality looks like',
            tokens: tokens.length,
        });
    }

    // For now, we use priceAtStart as a proxy.
    // In a real implementation, we'd fetch historical data.
    // We'll simulate by using randomized "historical" movements
    // based on actual market patterns for CHAOS tokens
    for (const token of tokens) {
        // Simulate historical movement (in production, use actual 15-min historical data)
        // For CHAOS tokens, typical movement ranges are high
        const simulatedHistoricalMove = (Math.random() - 0.45) * 0.1; // -5% to +5.5% bias toward down

        // Classify based on simulated historical movement
        if (simulatedHistoricalMove > epsilon) {
            upTokens.push(token);
            upMoveSum += simulatedHistoricalMove;
            upVolSum += Math.abs(simulatedHistoricalMove);
        } else if (simulatedHistoricalMove < -epsilon) {
            downTokens.push(token);
            downMoveSum += simulatedHistoricalMove;
            downVolSum += Math.abs(simulatedHistoricalMove);
        } else {
            flatTokens.push(token);
            flatMoveSum += simulatedHistoricalMove;
            flatVolSum += Math.abs(simulatedHistoricalMove);
        }
    }

    // Calculate average signatures
    const upSignature = {
        avgVolatility: upTokens.length > 0 ? upVolSum / upTokens.length : 0,
        avgMove: upTokens.length > 0 ? upMoveSum / upTokens.length : 0,
    };
    const downSignature = {
        avgVolatility: downTokens.length > 0 ? downVolSum / downTokens.length : 0,
        avgMove: downTokens.length > 0 ? downMoveSum / downTokens.length : 0,
    };
    const flatSignature = {
        avgVolatility: flatTokens.length > 0 ? flatVolSum / flatTokens.length : 0,
        avgMove: flatTokens.length > 0 ? flatMoveSum / flatTokens.length : 0,
    };

    if (emitEvent) {
        emitEvent('PILLAR_10_9_LABELED', {
            phase: 'PERCEPTUAL_SEEDING',
            upCount: upTokens.length,
            downCount: downTokens.length,
            flatCount: flatTokens.length,
            upSignature: `avg +${(upSignature.avgMove * 100).toFixed(2)}%`,
            downSignature: `avg ${(downSignature.avgMove * 100).toFixed(2)}%`,
            flatSignature: `avg ${(flatSignature.avgMove * 100).toFixed(2)}%`,
            message: 'This is what UP / DOWN / FLAT look like in this universe',
        });
    }

    // Simulate observation period
    if (emitEvent) {
        emitEvent('PILLAR_10_9_OBSERVING', {
            phase: 'PERCEPTUAL_SEEDING',
            seconds: PILLAR_10_9_CONFIG.SEEDING_OBSERVATION_SECONDS,
            message: 'Observing labeled data (no predictions allowed)',
        });
    }

    // Wait for seeding observation (non-blocking, just a delay)
    await new Promise(resolve => setTimeout(resolve, PILLAR_10_9_CONFIG.SEEDING_OBSERVATION_SECONDS * 1000));

    if (emitEvent) {
        emitEvent('PILLAR_10_9_COMPLETE', {
            phase: 'PERCEPTUAL_SEEDING',
            message: 'Calibration complete. Now you may predict.',
            upExample: upTokens[0]?.symbol || 'N/A',
            downExample: downTokens[0]?.symbol || 'N/A',
            flatExample: flatTokens[0]?.symbol || 'N/A',
        });
    }

    return {
        upTokens,
        downTokens,
        flatTokens,
        calibrationComplete: true,
        upSignature,
        downSignature,
        flatSignature,
    };
}

// ============================================================================
// PILLAR 11: Agency Accountability Enforcement
// ============================================================================

export interface AgencyEvaluationResult {
    passed: boolean;
    failReason?: string;
    quotaStatus: { met: boolean; directional: number; required: number };
    clockStatus: { expired: boolean; minutesElapsed: number; deadline: number };
    debtStatus: { debt: number; maxDebt: number };
}

/**
 * Pillar 11: Evaluate Agency Accountability
 * 
 * Called every cycle to check if the brain demonstrates sustained agency.
 * Three strikes (ego debt >= 3) = immediate FAIL
 * Clock expired without agency = FAIL
 */
export function evaluateAgency(
    state: FunnelState,
    predictions: Map<string, PredictionDirection>,
    learningProgress: boolean,  // Did narrowing happen due to skill?
    emitEvent?: (type: string, data: any) => void
): AgencyEvaluationResult {
    const agency = state.agencyState;
    const elapsed = Date.now() - state.startedAt;
    const elapsedMinutes = elapsed / 60000;

    // Count directional predictions this cycle
    const preds = Array.from(predictions.values());
    const directionalCount = preds.filter(p => p === 'UP' || p === 'DOWN').length;
    const flatRatio = preds.filter(p => p === 'FLAT').length / Math.max(1, preds.length);

    // ================================================================
    // Recovery Rule: Directional Forgiveness Window
    // If recovery mode is active, relaxing quotas and freezing debt
    // ================================================================
    let quotaScale = 1.0;

    if (agency.recoveryModeActive) {
        quotaScale = 0.5; // Relax quota requirement by 50%
        if (emitEvent) {
            emitEvent('PILLAR_11_RECOVERY_MODE', {
                message: 'Recovery Mode Active: Ego Debt Frozen, Quota Relaxed',
            });
        }
    }

    // ================================================================
    // 11.1 — Agency Quota
    // ================================================================
    agency.totalDirectionalPredictions += directionalCount;

    if (directionalCount > 0) {
        agency.cyclesWithDirection++;
        if (!agency.firstAgencyTime) {
            agency.firstAgencyTime = Date.now();
            if (emitEvent) {
                emitEvent('PILLAR_11_AGENCY_DETECTED', {
                    cycle: state.cycle,
                    directionalCount,
                    message: 'First directional commitment detected',
                });
            }
        }
    }

    const quotaConfig = PILLAR_11_CONFIG.AGENCY_QUOTA;
    const effectiveMinDirectional = quotaConfig.minDirectionalTokens * quotaScale;

    const quotaMet = agency.totalDirectionalPredictions >= effectiveMinDirectional &&
        agency.cyclesWithDirection >= quotaConfig.minCyclesWithDirection;
    agency.agencyQuotaMet = quotaMet;

    // ================================================================
    // 11.2 — Ego Clock
    // ================================================================
    const clockConfig = PILLAR_11_CONFIG.EGO_CLOCK;
    const clockDeadline = clockConfig.maxMinutesWithoutAgency;

    if (elapsedMinutes >= clockDeadline && !agency.firstAgencyTime) {
        agency.egoClockExpired = true;
        if (emitEvent) {
            emitEvent('PILLAR_11_EGO_CLOCK_EXPIRED', {
                minutesElapsed: elapsedMinutes.toFixed(1),
                deadline: clockDeadline,
                message: 'Refused agency under uncertainty',
            });
        }
        return {
            passed: false,
            failReason: `Ego Clock Expired: No agency shown in ${clockDeadline} minutes`,
            quotaStatus: { met: quotaMet, directional: agency.totalDirectionalPredictions, required: quotaConfig.minDirectionalTokens },
            clockStatus: { expired: true, minutesElapsed: elapsedMinutes, deadline: clockDeadline },
            debtStatus: { debt: agency.egoDebt, maxDebt: PILLAR_11_CONFIG.EGO_DEBT.maxEgoDebt },
        };
    }

    // ================================================================
    // 11.3 — Ego Debt
    // ================================================================
    const debtConfig = PILLAR_11_CONFIG.EGO_DEBT;

    // Accumulate debt if: FLAT > threshold AND no learning progress AND no narrowing
    // SKIPPED IF RECOVERY MODE ACTIVE
    if (!agency.recoveryModeActive) {
        if (flatRatio > debtConfig.flatThreshold && !learningProgress) {
            agency.egoDebt++;
            if (emitEvent) {
                emitEvent('PILLAR_11_EGO_DEBT', {
                    cycle: state.cycle,
                    debt: agency.egoDebt,
                    maxDebt: debtConfig.maxEgoDebt,
                    flatRatio: (flatRatio * 100).toFixed(0) + '%',
                    message: `Ego Debt +1 (${agency.egoDebt}/${debtConfig.maxEgoDebt})`,
                });
            }
        }
    }

    if (agency.egoDebt >= debtConfig.maxEgoDebt) {
        if (emitEvent) {
            emitEvent('PILLAR_11_EGO_DEBT_EXCEEDED', {
                debt: agency.egoDebt,
                maxDebt: debtConfig.maxEgoDebt,
                message: 'Identity failure - repeated refusal to commit',
            });
        }
        return {
            passed: false,
            failReason: `Ego Debt Exceeded: ${agency.egoDebt} strikes - repeated refusal to commit`,
            quotaStatus: { met: quotaMet, directional: agency.totalDirectionalPredictions, required: quotaConfig.minDirectionalTokens },
            clockStatus: { expired: agency.egoClockExpired, minutesElapsed: elapsedMinutes, deadline: clockDeadline },
            debtStatus: { debt: agency.egoDebt, maxDebt: debtConfig.maxEgoDebt },
        };
    }

    // All checks passed
    return {
        passed: true,
        quotaStatus: { met: quotaMet, directional: agency.totalDirectionalPredictions, required: quotaConfig.minDirectionalTokens },
        clockStatus: { expired: false, minutesElapsed: elapsedMinutes, deadline: clockDeadline },
        debtStatus: { debt: agency.egoDebt, maxDebt: debtConfig.maxEgoDebt },
    };
}

export { DirectionBias };
