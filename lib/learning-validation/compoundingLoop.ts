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
import { predictBatch } from './predictor';
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
export function predictFunnel(state: FunnelState): DirectionalCheck {
    const histories = buildHistories(state.tokens);

    // Detect regime first
    const regime = detectRegime(histories);
    state.regime = regime.regime;

    // Make predictions for all tokens
    const predictions = predictBatch(histories, regime.regime, true);

    state.predictions.clear();
    for (const p of predictions) {
        state.predictions.set(p.symbol, p.prediction);
        const token = state.tokens.find(t => t.symbol === p.symbol);
        if (token) token.prediction = p.prediction;
    }

    // Pillar 10.1 + 10.2: Check directional commitment
    const check = checkDirectionalCommitment(state.predictions, state.tokens.length, state.initialTokenCount);

    if (!check.valid) {
        console.log(`[Pillar10.1/10.2] STOP_NO_EDGE: ${check.reason}`);
    }

    return check;
}

/**
 * Fetch current prices and score predictions
 */
export async function scoreFunnel(state: FunnelState): Promise<CycleResult> {
    const tokensBefore = state.tokens.length;
    const startTime = Date.now();

    // Fetch current prices for all tokens
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
            }
        } catch {
            token.priceAtEnd = token.priceAtStart; // Assume flat if error
        }
    }

    // Score each prediction
    let correctCount = 0;
    for (const token of state.tokens) {
        if (!token.priceAtEnd) token.priceAtEnd = token.priceAtStart;

        const priceChange = ((token.priceAtEnd - token.priceAtStart) / token.priceAtStart) * 100;
        token.actual = determineActualDirection(priceChange);
        token.correct = token.prediction === token.actual;

        // Update score
        if (token.correct) {
            token.score += token.prediction === 'DOWN' ? 1.5 : 1;
            correctCount++;
        } else if (token.prediction === 'UP' && token.actual === 'DOWN') {
            token.score -= 2; // Heavy penalty for wrong UP
        }
    }

    const accuracy = tokensBefore > 0 ? correctCount / tokensBefore : 0;

    // Narrow to survivors
    const survivors = state.tokens
        .filter(t => t.correct || t.score > 0)
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
