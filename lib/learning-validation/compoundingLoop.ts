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
    OBSERVATION_MINUTES: 5, // Real 5-minute wait
    MAX_DURATION_MINUTES: 30,
    SURVIVOR_THRESHOLD: 10, // Funnel complete when < 10 tokens
    NARROWING_RATIO: 0.5, // Keep top 50% each cycle
    MIN_ACCURACY_TO_SURVIVE: 0.5, // Must be 50%+ accurate to survive
    FUNNEL_MODE: 'CHAOS_ONLY' as 'ALL' | 'CHAOS_ONLY' | 'CHAOS_AND_MAJOR', // Mode A: Pure Chaos Test

    // Pillar 10.3: FLAT Accountability
    FLAT_EPSILON: 0.005, // 0.5% threshold for FLAT correctness
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
 * Starting with ~1000 tokens, narrow down to candidates
 * 
 * | Funnel Stage      | MIN (UP+DOWN) | MAX FLAT |
 * |-------------------|---------------|----------|
 * | Universe (>1000)  | 30%           | 70%      |
 * | Large (500-1000)  | 50%           | 50%      |
 * | Narrow (250-500)  | 70%           | 30%      |
 * | Final (≤250)      | 90%           | 10%      |
 */
function getDirectionalThresholds(
    initialTokenCount: number,
    currentTokenCount: number
): { minDirectional: number; maxFlat: number } {

    const ratio = currentTokenCount / initialTokenCount;

    // EARLY — Universe scan (1000 → ~400)
    if (ratio > 0.5) {
        return {
            minDirectional: 0.40, // must commit early
            maxFlat: 0.60,
        };
    }

    // MID — Narrowing (400 → ~100)
    if (ratio > 0.2) {
        return {
            minDirectional: 0.60,
            maxFlat: 0.40,
        };
    }

    // LATE — Final funnel (100 → ~20)
    if (ratio > 0.05) {
        return {
            minDirectional: 0.80,
            maxFlat: 0.20,
        };
    }

    // FINAL — Execution gate (≤ ~20)
    return {
        minDirectional: 0.95,
        maxFlat: 0.05,
    };
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

    // Make predictions for all tokens (with Bias)
    const predictions = predictBatch(histories, regime.regime, true, state.biases);

    state.predictions.clear();
    for (const p of predictions) {
        state.predictions.set(p.symbol, p.prediction);
        const token = state.tokens.find(t => t.symbol === p.symbol);
        if (token) token.prediction = p.prediction;
    }

    // Pillar 10.3: Record predictions (FLAT stored for delayed scoring)
    const currentPrices = new Map<string, number>();
    for (const token of state.tokens) {
        currentPrices.set(token.symbol, token.priceAtStart);
    }
    recordPredictions(state, currentPrices);

    // Pillar 10.1 + 10.2: Check directional commitment
    const check = checkDirectionalCommitment(state.predictions, state.tokens.length, state.initialTokenCount);

    if (!check.valid) {
        console.log(`[Pillar10.1/10.2] STOP_NO_EDGE: ${check.reason}`);
    }

    return check;
}

/**
 * Fetch current prices and score predictions
 * Pillar 10.3: Resolves previous cycle predictions with FLAT accountability
 */
export async function scoreFunnel(
    state: FunnelState,
    emitEvent?: (type: string, data: any) => void
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
    const resolvedScores = resolvePredictions(state, currentPrices, 1.0, emitEvent);

    // Calculate accuracy from current cycle predictions
    let correctCount = 0;
    for (const token of state.tokens) {
        if (!token.priceAtEnd) token.priceAtEnd = token.priceAtStart;

        const priceChange = ((token.priceAtEnd - token.priceAtStart) / token.priceAtStart);
        token.actual = determineActualDirection(priceChange * 100);
        token.correct = token.prediction === token.actual;

        if (token.correct) correctCount++;

        // Update cumulative score from resolved predictions
        const resolvedScore = resolvedScores.get(token.symbol) || 0;
        token.score = resolvedScore;
    }

    const accuracy = tokensBefore > 0 ? correctCount / tokensBefore : 0;

    // Narrow to survivors based on cumulative scores
    const survivors = state.tokens
        .filter(t => t.score > -5) // Eliminate tokens with very bad scores
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.ceil(state.tokens.length * PILLAR_10_CONFIG.NARROWING_RATIO));

    const eliminated = state.tokens.filter(t => !survivors.includes(t));

    // Update state
    state.eliminated.push(...eliminated);
    state.tokens = survivors;
    state.cycle++;

    // Check termination conditions
    if (survivors.length < PILLAR_10_CONFIG.SURVIVOR_THRESHOLD) {
        state.funnelComplete = true;
        // Find UP predictions for execution
        state.executionCandidates = survivors.filter(t => t.prediction === 'UP' && t.score > 0);
    }

    if (survivors.length === 0) {
        state.funnelCollapsed = true;
    }

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
    return {
        cycle: 0,
        startedAt: Date.now(),
        initialTokenCount: tokens.length, // Store for ratio-based thresholds
        tokens,
        eliminated: [],
        predictions: new Map(),
        regime: 'UNKNOWN',
        funnelComplete: false,
        funnelCollapsed: false,
        executionCandidates: [],
        predictionStorage: new Map(), // Pillar 10.3

        // Pillar 10.5 defaults
        biases: { upBias: 1.0, downBias: 1.0, flatBias: 1.0 },
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
