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
export async function freezeUniverse(limit: number = 100): Promise<TokenCandidate[]> {
    const tokensRes = await fetch(`${JUPITER_PROXY_URL}/tokens`);
    if (!tokensRes.ok) throw new Error('Failed to fetch tokens');

    const { tokens } = await tokensRes.json();
    const candidates: TokenCandidate[] = [];
    const classificationStats = { STABLE: 0, MAJOR: 0, CHAOS: 0 };

    // Get quotes for all tokens to establish starting prices
    for (const token of tokens.slice(0, limit * 2)) { // Fetch more to compensate for filtering
        if (token.address === SOL_MINT) continue;

        const tokenClass = classifyToken(token.symbol, token.address);
        classificationStats[tokenClass]++;

        // Filter based on mode
        if (tokenClass === 'STABLE') {
            // NEVER include stables in Pillar 10 funnel
            continue;
        }

        if (PILLAR_10_CONFIG.FUNNEL_MODE === 'CHAOS_ONLY' && tokenClass === 'MAJOR') {
            // Mode A: Pure Chaos Test - exclude majors too
            continue;
        }

        try {
            const amount = Math.pow(10, token.decimals || 6).toString();
            const quoteRes = await fetch(
                `${JUPITER_PROXY_URL}/quote?` + new URLSearchParams({
                    inputMint: token.address,
                    outputMint: SOL_MINT,
                    amount,
                    slippageBps: '50',
                })
            );

            if (!quoteRes.ok) continue;
            const quote = await quoteRes.json();
            const solOut = parseInt(quote.outAmount || '0') / 1e9;

            if (solOut > 0 && candidates.length < limit) {
                candidates.push({
                    symbol: token.symbol,
                    mint: token.address,
                    tokenClass,
                    priceAtStart: solOut,
                    score: 0,
                });
            }
        } catch {
            continue;
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
 * Pillar 10.1: Directional Entropy Constraint
 * 
 * Rejects rounds with too many FLAT predictions.
 * "If you claim the market is flat, prove it by giving up the chance to trade."
 */
export interface EntropyCheck {
    valid: boolean;
    flatCount: number;
    flatPct: number;
    maxAllowed: number;
    reason?: string;
}

function getMaxFlatPercentage(tokenCount: number): number {
    if (tokenCount > 50) return 0.60; // Universe rounds: 60%
    if (tokenCount > 20) return 0.40; // Narrowed rounds: 40%
    return 0.20; // Final rounds: 20%
}

export function checkEntropyConstraint(predictions: Map<string, PredictionDirection>, tokenCount: number): EntropyCheck {
    let flatCount = 0;
    for (const direction of predictions.values()) {
        if (direction === 'FLAT') flatCount++;
    }

    const flatPct = predictions.size > 0 ? flatCount / predictions.size : 0;
    const maxAllowed = getMaxFlatPercentage(tokenCount);

    if (flatPct > maxAllowed) {
        return {
            valid: false,
            flatCount,
            flatPct,
            maxAllowed,
            reason: `FLAT ${(flatPct * 100).toFixed(0)}% exceeds limit ${(maxAllowed * 100).toFixed(0)}%`,
        };
    }

    return { valid: true, flatCount, flatPct, maxAllowed };
}

/**
 * Make predictions for all tokens in the funnel
 * Returns entropy check result
 */
export function predictFunnel(state: FunnelState): EntropyCheck {
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

    // Pillar 10.1: Check directional entropy
    const entropyCheck = checkEntropyConstraint(state.predictions, state.tokens.length);

    if (!entropyCheck.valid) {
        console.log(`[Pillar10.1] STOP_NO_EDGE: ${entropyCheck.reason}`);
    }

    return entropyCheck;
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
