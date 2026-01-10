/**
 * V1 Hold Signals - Pure Signal Computation
 *
 * V1 STRATEGY: Use single-point volatility proxies (RTL, priceImpact)
 * instead of historical time-series data.
 *
 * NO API calls, NO side effects, NO state mutations.
 */

import { V1_HOLD, type V1HoldCheckpoint } from './V1Constants';

/**
 * Input contract - Only uses data we ALREADY HAVE
 *
 * V1 SIMPLIFICATION: Works with single-point data + volatility proxies
 */
export interface HoldSignalInput {
    token: string; // Mint address

    // Single-point data (from current simulation)
    currentPriceSOL: number; // Token value in SOL
    rtlPercent: number; // Round-trip loss % (volatility proxy)
    priceImpactPct: number; // Price impact % (liquidity proxy)

    poolLiquidityUSD: number; // Pool liquidity (safety gate)

    // Optional: AlphaScan data (if available)
    alphaVolume24h?: number;
    alphaVolumeChange24h?: number;
}

/**
 * VOLATILITY SIGNAL (V1)
 *
 * Uses RTL% as volatility proxy.
 * High RTL = high volatility = potential momentum.
 *
 * RTL Range:
 * - < 5%: Low volatility (score ~0)
 * - 5-12%: Medium volatility (score 0.3-0.8)
 * - > 12%: High volatility (score ~1, but rejected by constraints)
 *
 * Returns null if no signal.
 */
export function calculateVolatilitySignal(rtlPercent: number, priceImpactPct: number) {
    // Too low volatility = no momentum
    if (rtlPercent < 3) return null;

    // Too high = rejected by brain anyway
    if (rtlPercent > 12) return null;

    // Normalize RTL to 0-1 score
    // 5% RTL → 0.3 score
    // 8% RTL → 0.6 score
    // 12% RTL → 1.0 score
    const rtlScore = Math.min(1, Math.max(0, (rtlPercent - 3) / 9));

    // Price impact penalty (high impact = less confidence)
    const impactPenalty = Math.min(1, priceImpactPct / 20);

    const score = rtlScore * (1 - impactPenalty * 0.3);

    return {
        rtlPercent,
        priceImpactPct,
        volatilityScore: rtlScore,
        score: Math.max(0, score),
    };
}

/**
 * LIQUIDITY SIGNAL (V1)
 *
 * Uses pool liquidity + AlphaScan volume (if available).
 *
 * Good liquidity + volume growth = potential for hold.
 *
 * Returns null if insufficient liquidity.
 */
export function calculateLiquiditySignal(
    poolLiquidityUSD: number,
    alphaVolume24h?: number,
    alphaVolumeChange24h?: number
) {
    // Minimum liquidity gate
    if (poolLiquidityUSD < V1_HOLD.MIN_EXIT_LIQUIDITY_USD) {
        return null;
    }

    // Base liquidity score (50k → 0.3, 200k+ → 1.0)
    const liquidityScore = Math.min(
        1,
        (poolLiquidityUSD - V1_HOLD.MIN_EXIT_LIQUIDITY_USD) / 150_000
    );

    // Volume growth bonus (if AlphaScan available)
    let volumeBonus = 0;
    if (alphaVolume24h && alphaVolume24h > 10_000) {
        // Positive volume change = bonus
        if (alphaVolumeChange24h && alphaVolumeChange24h > 50) {
            volumeBonus = Math.min(0.3, alphaVolumeChange24h / 300);
        }
    }

    const score = Math.min(1, liquidityScore + volumeBonus);

    return {
        poolLiquidityUSD,
        liquidityScore,
        volumeBonus,
        score,
    };
}

/**
 * MAIN FUNCTION: Compute Hold Checkpoint
 *
 * V1: Uses volatility + liquidity proxies instead of historical data.
 *
 * Returns V1HoldCheckpoint if conditions met, null otherwise.
 *
 * PURE FUNCTION - No side effects, no network calls.
 */
export function computeHoldCheckpoint(input: HoldSignalInput): V1HoldCheckpoint | null {
    // === SAFETY GATES ===

    // Gate 1: Liquidity check (must have emergency exit)
    if (input.poolLiquidityUSD < V1_HOLD.MIN_EXIT_LIQUIDITY_USD) {
        return null;
    }

    // Gate 2: Price sanity check
    if (input.currentPriceSOL <= 0) {
        return null;
    }

    // === SIGNAL COMPUTATION ===

    const volatility = calculateVolatilitySignal(input.rtlPercent, input.priceImpactPct);
    const liquidity = calculateLiquiditySignal(
        input.poolLiquidityUSD,
        input.alphaVolume24h,
        input.alphaVolumeChange24h
    );

    // Gate 3: Both signals must exist
    if (!volatility || !liquidity) {
        return null;
    }

    // === CONFIDENCE CALCULATION ===

    // Fixed weights (locked in v1)
    // Volatility = 60% (primary signal)
    // Liquidity = 40% (safety signal)
    const confidence = 0.6 * volatility.score + 0.4 * liquidity.score;

    // Gate 4: Minimum confidence threshold
    if (confidence < V1_HOLD.CONFIDENCE_THRESHOLD) {
        return null;
    }

    // === DURATION CALCULATION ===

    // Linear mapping: confidence 0.4 → 1.8min, confidence 1.0 → 2.5min
    const suggestedDuration = Math.min(V1_HOLD.MAX_HOLD_MINUTES, 1 + confidence * 2);

    // === BUILD CHECKPOINT ===

    const now = Date.now();

    return {
        token: input.token,
        suggestedDurationMinutes: Math.round(suggestedDuration * 10) / 10, // Round to 0.1
        confidence: Math.round(confidence * 100) / 100, // Round to 2 decimals
        maxDrawdownPct: V1_HOLD.MAX_DRAWDOWN_PCT,
        signals: {
            momentum: {
                velocity: volatility.rtlPercent,
                acceleration: volatility.volatilityScore,
                score: volatility.score,
            },
            volume: {
                spikeRatio: liquidity.liquidityScore,
                score: liquidity.score,
            },
        },
        timestamp: now,
        expiresAt: now + 60_000, // Valid for 60 seconds
    };
}
