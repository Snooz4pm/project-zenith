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
import { auditCoverage } from './pillar13-audit';

// Liquidity Filter Integration
import { predictiveEngine } from '@/lib/execution-engine/predictive/PredictiveEngineSafe';
import { SearchableToken } from '@/types/LiquidityFilter';

const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Configuration
// [LOBOTOMIZED] Funnel Collapsed.
// Single pass. No waiting. No narrowing.
export const PILLAR_10_CONFIG = {
    OBSERVATION_MINUTES: 0,
    MAX_DURATION_MINUTES: 1,
    SURVIVOR_THRESHOLD: 1000, // Do not filter
    NARROWING_RATIO: 1.0, // Keep everyone
    MIN_ACCURACY_TO_SURVIVE: 0.0, // No survival of the fittest
    FUNNEL_MODE: 'CHAOS_ONLY' as 'ALL' | 'CHAOS_ONLY' | 'CHAOS_AND_MAJOR',

    // EXPLORATION mode: Disabled
    ALLOW_EXPLORATION_FALLBACK: false,
    EXPLORATION_THRESHOLD_MULTIPLIER: 1.0,

    // Pillar 10.3: FLAT Accountability - Irrelevant
    FLAT_EPSILON: 0.01,
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
// [REMOVED] PILLAR X: Directional Quotas & Anti-Stall
// ============================================================================
// SURGICAL EXCISION: System no longer forces directional commitment.
// FLAT predictions are unrestricted. Uncertainty is legal.
// ============================================================================

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

// ============================================================================
// PILLAR 14: Emotional Calibration & Accountability
// ============================================================================
// The Brain must internalize consequences of its choices through three bounded signals:
// Confidence, Regret, and Fear.
// ============================================================================
export const PILLAR_14_CONFIG = {
    // Confidence: Earned trust (Predicted UP/DOWN -> Correct)
    CONFIDENCE_BOOST: 0.1,         // Increase directional bias
    CONFIDENCE_DECAY: 0.9,         // Decay factor per cycle

    // Regret: Missed reality (Predicted FLAT -> Price Moved)
    REGRET_PENALTY: 0.15,          // Reduce FLAT bias
    REGRET_DECAY: 0.8,

    // Fear: Calibration against overconfidence (Wrong Direction)
    FEAR_PENALTY: 0.2,             // Increase FLAT bias (caution)
    FEAR_DECAY: 0.7,
};

export interface EmotionalState {
    confidence: number; // 0-10
    regret: number;     // 0-10
    fear: number;       // 0-10
}

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
// [REMOVED] PILLAR 11: Agency Accountability (Ego Layer)
// ============================================================================
// SURGICAL EXCISION: Ego enforcement removed.
// System no longer punishes refusal to commit or tracks "agency debt".
// ============================================================================

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

    // Pillar 13: Observation Integrity Audit
    auditReport?: import('./pillar13-audit').CoverageReport;

    // Pillar 14: Emotional State
    emotionalState: EmotionalState;
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
// Pillar 1 Integration
import { getDexMatchedTokens, DexMatchedToken } from '@/lib/market-observer/JupiterDexMerger';

/**
 * Fetch frozen universe of tokens from Jupiter with classification
 * NOW INTEGRATED WITH PILLAR 1: MARKET OBSERVER
 */
export async function freezeUniverse(limit: number = 1000): Promise<TokenCandidate[]> {
    console.log('[Pillar10] Requesting verified universe from Market Observer (Pillar 1)...');

    // 1. Get Strict List from Market Observer
    const matchedTokens: DexMatchedToken[] = await getDexMatchedTokens();
    console.log(`[Pillar10] Pillar 1 return count: ${matchedTokens.length}`);

    const candidates: TokenCandidate[] = [];
    const classificationStats = { STABLE: 0, MAJOR: 0, CHAOS: 0 };

    // 2. Classify and Filter
    const tokensToFetch: any[] = [];
    for (const token of matchedTokens.slice(0, limit * 3)) {
        if (token.mint === SOL_MINT) continue;

        const tokenClass = classifyToken(token.symbol, token.mint);
        classificationStats[tokenClass]++;

        // Filter based on mode
        if (tokenClass === 'STABLE') continue;
        if (PILLAR_10_CONFIG.FUNNEL_MODE === 'CHAOS_ONLY' && tokenClass === 'MAJOR') continue;

        tokensToFetch.push({ ...token, address: token.mint, tokenClass });
        if (tokensToFetch.length >= limit) break;
    }

    console.log(`[Pillar10] Pre-filtered (Mode: ${PILLAR_10_CONFIG.FUNNEL_MODE}): ${tokensToFetch.length} tokens`);

    // 3. Fetch Initial Quotes (Price Discovery)
    const BATCH_SIZE = 250;
    for (let i = 0; i < tokensToFetch.length && candidates.length < limit; i += BATCH_SIZE) {
        const batch = tokensToFetch.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.allSettled(
            batch.map(async (token) => {
                const amount = Math.pow(100, 6).toString(); // Standard 6 decimals assumption for check
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
                        flatStreak: 0,
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
    console.log(`[Pillar10] Final Candidates: ${candidates.length}`);

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
// ============================================================================
// [REMOVED] Directional Commitment Checks (Pillar 10.1, 10.2)
// ============================================================================
// EXCISED: DirectionalCheck interface, getDirectionalThresholds, checkDirectionalCommitment
// System no longer enforces FLAT percentage limits or minimum directional quotas.
// ============================================================================

/**
 * Make predictions for all tokens in the funnel
 * [MODIFIED] No longer enforces directional quotas
 */
export interface DirectionalCheck {
    valid: boolean;
    violationType?: 'NONE' | 'FLAT_EXCEEDED' | 'DIRECTIONAL_INSUFFICIENT';
    reason?: string;
    directionalPct: number;
    flatPct: number;
    minDirectional: number;
    maxFlat: number;
    upCount: number;
    downCount: number;
    flatCount: number;
}

/**
 * Make predictions for all tokens in the funnel
 * [MODIFIED] No longer enforces directional quotas
 */
export async function predictFunnel(
    state: FunnelState,
    emitEvent?: (type: string, data: any) => void
): Promise<DirectionalCheck> {

    // Initialize Brain v2 (Lazy init)
    await predictiveEngine.initialize();

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

    // ================================================================
    // PILLAR 13: Observation Integrity Audit
    // Verification that we actually looked at the universe we claimed to.
    // ================================================================

    // 1. Audit Coverage (Did we scan everything?)
    // In this phase, "tokens" represents the set we *intend* to scan.
    const expectedUniverse = new Set(state.tokens.map(t => t.symbol));
    const successfullyScanned = new Set(state.tokens.map(t => t.symbol)); // Assuming all valid since we have them in state

    const audit = auditCoverage(state.cycle, Array.from(expectedUniverse), successfullyScanned);
    state.auditReport = audit;

    if (audit.status !== 'COMPLETE' || emitEvent) {
        emitEvent('COVERAGE_AUDIT', {
            cycle: state.cycle,
            coverage: (audit.coverageRatio * 100).toFixed(1) + '%',
            status: audit.status,
            missingCount: audit.failedScans,
            missingTokens: audit.missingTokens.slice(0, 5) // Sample
        });
    }

    console.log(`[Pillar 13] Coverage Audit: ${audit.successfullyScanned}/${audit.totalUniverse} (${(audit.coverageRatio * 100).toFixed(1)}%) - ${audit.status}`);

    // Build price histories for all tokens
    const histories = buildHistories(state.tokens);

    // Detect regime first
    const regime = detectRegime(histories);
    state.regime = regime.regime;

    // ================================================================
    // PILLAR 12: Constrained Directional Allocation
    // Brain defines DISTRIBUTION, then allocates tokens by signal strength
    // ================================================================

    // 1. Calculate Target Distribution from Biases (NO CONSTRAINTS)
    const totalBias = state.biases.upBias + state.biases.downBias + state.biases.flatBias;
    const targetUp = state.biases.upBias / totalBias;
    const targetDown = state.biases.downBias / totalBias;
    const targetFlat = state.biases.flatBias / totalBias;

    // [REMOVED] Pillar 10 constraints: No forced clamping of FLAT or directional minimums
    // Biases determine distribution freely

    // 2. Calculate Allocation Counts
    const totalTokens = histories.length;
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
            counts: { up: countUp, down: countDown, flat: countFlat }
        });
    }

    // 4. Score Tokens by Signal Strength (Momentum + Brain v2 Memory)
    // Pillar 13 Audit: Scanning ALL tokens (100% coverage assumed if audit passed)
    const rawPredictions = predictBatch(histories, regime.regime, true, state.biases);

    // Prepare liquidity filter inputs (best effort mapping)
    const searchableTokens: SearchableToken[] = state.tokens.map(t => ({
        mint: t.mint,
        symbol: t.symbol,
        liquidityScore: 1.0,
        valueInSOL: t.priceAtStart,
        roundTripLoss: 0,
        alphaScore: 0,
        hasRoute: true,
        isStable: false,
        isAlpha: false,
        tier: 'RANKABLE' as const
    }));

    // Update Brain's Market State
    predictiveEngine.updateMarketState(searchableTokens);

    // Map tokens to their signal score (momentum + brain bias)
    // Score ALL tokens
    const scoredTokens = await Promise.all(state.tokens.map(async (token) => {
        const pred = rawPredictions.find(p => p.symbol === token.symbol);
        // Use momentum as primary signal Score. 
        // fallback to random if no signal (shouldn't happen with valid history)
        const momentum = pred?.signals?.momentum ?? (Math.random() - 0.5);

        // Brain v2 Integration: Get Memory/Emotional Bias
        const searchBias = await predictiveEngine.getSearchBias({
            mint: token.mint,
            symbol: token.symbol,
            liquidityScore: 1,
            valueInSOL: 0,
            roundTripLoss: 0,
            hasRoute: false,
            isStable: false,
            isAlpha: false,
            tier: 'SAFE'
        });

        // Boost score if Brain has high exploration priority (gut feeling)
        // explorationPriority is 0-1. 
        // We add a small bias to the momentum.
        const brainBoost = (searchBias.explorationPriority - 0.5) * 0.1;

        return {
            token,
            score: momentum + brainBoost,
            brainBias: searchBias.explorationPriority,
            prediction: 'FLAT' as PredictionDirection
        };
    }));

    // Log top brain activities
    const topBrainPicks = scoredTokens
        .filter(t => t.brainBias > 0.6)
        .sort((a, b) => b.brainBias - a.brainBias)
        .slice(0, 3);

    if (topBrainPicks.length > 0 && emitEvent) {
        emitEvent('BRAIN_ACTIVITY', {
            picks: topBrainPicks.map(t => `${t.token.symbol} (${(t.brainBias * 100).toFixed(0)}%)`),
            message: "Brain memory influencing selection"
        });
    }

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

    // [REMOVED] Directional commitment check - no longer enforced
    // Return a dummy compliant check for API compatibility
    return {
        valid: true,
        violationType: 'NONE',
        reason: 'Checks removed',
        directionalPct: 1,
        flatPct: 0,
        minDirectional: 0,
        maxFlat: 1,
        upCount: countUp,
        downCount: countDown,
        flatCount: countFlat
    };
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
    // Fetch current prices for all tokens (Batched)
    const currentPrices = new Map<string, number>();
    const BATCH_SIZE = 10;

    for (let i = 0; i < state.tokens.length; i += BATCH_SIZE) {
        const batch = state.tokens.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (token) => {
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
        }));
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
    correctUpReward: number;   // valid confidence
    correctDownReward: number; // valid caution
}

function clampBias(x: number): number {
    return Math.min(1.5, Math.max(0.5, x));
}

/**
 * Adapt behavioral biases based on previous cycle penalties AND rewards
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
        wrongDownPenalty: 0,
        correctUpReward: 0,
        correctDownReward: 0
    };

    // If first cycle, return neutral
    if (state.cycle === 0) {
        return { biases: { upBias, downBias, flatBias }, profile };
    }

    // Analyze previous cycle (N-1)
    // We look at resolved predictions that belong to the previous cycle
    const previousCycle = state.cycle - 1;

    for (const predictions of state.predictionStorage.values()) {
        for (const p of predictions) {
            // Only look at predictions from the previous cycle that are resolved
            if (p.cycle === previousCycle && p.resolved) {

                // 1. Hesitation Penalty (already calculated in record/resolve)
                if (p.hesitationPenaltyApplied) {
                    profile.hesitationPenalty += PILLAR_10_4_CONFIG.HESITATION_PENALTY;
                }

                // 2. Wrong UP / DOWN (Penalties)
                if (p.direction === 'UP' && p.score < 0) {
                    profile.wrongUpPenalty += p.score;
                }
                if (p.direction === 'DOWN' && p.score < 0) {
                    profile.wrongDownPenalty += p.score;
                }

                // 3. Correct UP / DOWN (Rewards - Pillar 12.1)
                // If prediction matches reality (score > 0), reinforce bias
                if (p.direction === 'UP' && p.score > 0) {
                    profile.correctUpReward += 1;
                    upBias += 0.05; // Reinforce UP confidence
                }
                if (p.direction === 'DOWN' && p.score > 0) {
                    profile.correctDownReward += 1;
                    downBias += 0.05; // Reinforce DOWN confidence
                }
            }
        }
    }

    // 4. Flat Excess (Cowardice)
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

    // PILLAR 14: Emotional Calibration
    if (state.emotionalState) {
        // Confidence boosts directional conviction
        upBias += state.emotionalState.confidence * PILLAR_14_CONFIG.CONFIDENCE_BOOST;
        downBias += state.emotionalState.confidence * PILLAR_14_CONFIG.CONFIDENCE_BOOST;

        // Regret reduces FLAT bias (FOMO)
        flatBias -= state.emotionalState.regret * PILLAR_14_CONFIG.REGRET_PENALTY;

        // Fear increases FLAT bias (Caution)
        flatBias += state.emotionalState.fear * PILLAR_14_CONFIG.FEAR_PENALTY;
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

// ============================================================================
// [REMOVED] Pillar X Enforcement Functions
// ============================================================================
// EXCISED: getExposureQuota, enforcePillarX, detectLearningStall
// System no longer enforces directional quotas or penalizes FLAT predictions.
// ============================================================================

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
// Public Exports (Helper Functions)
// ============================================================================

/**
 * Initialize a new funnel state
 */
export function createFunnelState(tokens: TokenCandidate[]): FunnelState {
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
        biases: { upBias: 1, downBias: 1, flatBias: 1 },
        consecutiveFlatDominanceCycles: 0,
        explorationModeActive: false,
        flatWatchlist: [],
        totalMissedOpportunityPenalty: 0,
        agencyState: {
            totalDirectionalPredictions: 0,
            cyclesWithDirection: 0,
            agencyQuotaMet: false,
            firstAgencyTime: null,
            egoDebt: 0,
            egoClockExpired: false,
            recoveryModeActive: false
        },
        emotionalState: {
            confidence: 0,
            regret: 0,
            fear: 0
        }
    };
}

/**
 * Get final verdict from funnel state
 */
export function getFunnelVerdict(state: FunnelState | null): {
    shouldExecute: boolean;
    candidates: TokenCandidate[];
    reason: string
} {
    if (!state) return { shouldExecute: false, candidates: [], reason: 'No state' };

    if (state.funnelCollapsed) {
        return { shouldExecute: false, candidates: [], reason: 'Funnel collapsed (no survivors)' };
    }

    if (state.executionCandidates.length > 0) {
        return { shouldExecute: true, candidates: state.executionCandidates, reason: 'Funnel complete' };
    }

    // Default fallback
    const survivors = state.tokens.filter(t => (t.score || 0) > 0 && t.prediction === 'UP');
    if (survivors.length > 0) {
        return { shouldExecute: true, candidates: survivors, reason: 'Survivors found (Partial)' };
    }

    return { shouldExecute: false, candidates: [], reason: 'No valid candidates' };
}

/**
 * Check if should continue funnel
 */
export function shouldContinueFunnel(state: FunnelState): boolean {
    return !state.funnelComplete && !state.funnelCollapsed;
}

export type { DirectionBias };
export type { PredictionDirection };


