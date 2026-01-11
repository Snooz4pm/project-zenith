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
 * FRICTION ASYMMETRY DETECTOR (V1)
 *
 * V1 HOLD ≠ "Price will go up"
 * V1 HOLD = "Market friction detected - execution is fragile"
 *
 * Uses market stress indicators:
 * - High RTL = market charging premium
 * - High price impact = shallow liquidity
 *
 * This is NOT a bullish signal.
 * This is a SAFETY WARNING.
 *
 * RTL Range:
 * - < 3%: Low friction (no signal)
 * - 3-8%: Medium friction (reassess)
 * - 8-12%: High friction (pause recommended)
 * - > 12%: Excessive friction (rejected by brain)
 *
 * Returns null if no friction detected.
 */
export function calculateFrictionSignal(rtlPercent: number, priceImpactPct: number) {
    // Too low friction = no signal
    if (rtlPercent < 3) return null;

    // Too high = rejected by brain anyway
    if (rtlPercent > 12) return null;

    // Normalize RTL to 0-1 friction score
    // 3% RTL → 0.0 friction
    // 8% RTL → 0.55 friction
    // 12% RTL → 1.0 friction
    const rtlFriction = Math.min(1, Math.max(0, (rtlPercent - 3) / 9));

    // Normalize price impact to 0-1 friction score
    // 0% impact → 0.0 friction
    // 5% impact → 0.25 friction
    // 20% impact → 1.0 friction
    const impactFriction = Math.min(1, priceImpactPct / 20);

    return {
        rtlPercent,
        priceImpactPct,
        rtlFriction,
        impactFriction,
    };
}

/**
 * LIQUIDITY PENALTY (V1)
 *
 * Low liquidity = higher risk = penalty to confidence.
 *
 * This is NOT a bonus system.
 * This is a RISK GUARD.
 *
 * Returns penalty score (0 = max penalty, 1 = no penalty).
 */
export function calculateLiquidityPenalty(
    poolLiquidityUSD: number,
    alphaVolume24h?: number,
    alphaVolumeChange24h?: number
) {
    // Minimum liquidity gate
    if (poolLiquidityUSD < V1_HOLD.MIN_EXIT_LIQUIDITY_USD) {
        return null;
    }

    // Base liquidity penalty (inverse score)
    // 50k → 0.33 (33% confidence reduction)
    // 100k → 0.66 (no penalty)
    // 200k+ → 1.0 (no penalty)
    const liquidityGuard = Math.min(
        1,
        (poolLiquidityUSD - V1_HOLD.MIN_EXIT_LIQUIDITY_USD) / 150_000
    );

    // Volume stress indicator (if AlphaScan available)
    // High volume change = market stress = additional penalty
    let volumeStress = 0;
    if (alphaVolume24h && alphaVolume24h > 10_000) {
        if (alphaVolumeChange24h && Math.abs(alphaVolumeChange24h) > 100) {
            // Large volume swings = stress
            volumeStress = Math.min(0.2, Math.abs(alphaVolumeChange24h) / 500);
        }
    }

    const penalty = Math.max(0, liquidityGuard - volumeStress);

    return {
        poolLiquidityUSD,
        liquidityGuard,
        volumeStress,
        penalty,
    };
}

/**
 * MAIN FUNCTION: Compute Hold Checkpoint
 *
 * V1 HOLD = FRICTION-BASED RISK DETECTION
 *
 * NOT a prediction of upside.
 * IS a warning that execution is fragile.
 *
 * Confidence formula (LOCKED for V1):
 *   confidence = w1 * rtlFriction + w2 * impactFriction - w3 * liquidityPenalty
 *
 * Where:
 *   w1 = 0.4 (RTL friction weight)
 *   w2 = 0.4 (price impact weight)
 *   w3 = 0.2 (liquidity penalty weight)
 *
 * Higher confidence = higher market stress = "HOLD and reassess"
 *
 * Returns V1HoldCheckpoint if friction detected, null otherwise.
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

    // === FRICTION DETECTION ===

    const friction = calculateFrictionSignal(input.rtlPercent, input.priceImpactPct);
    const liquidityRisk = calculateLiquidityPenalty(
        input.poolLiquidityUSD,
        input.alphaVolume24h,
        input.alphaVolumeChange24h
    );

    // Gate 3: Both signals must exist
    if (!friction || !liquidityRisk) {
        return null;
    }

    // === CONFIDENCE CALCULATION (FRICTION-BASED) ===

    // V1 weights (LOCKED):
    const w1 = 0.4; // Price impact friction
    const w2 = 0.4; // RTL friction
    const w3 = 0.2; // Liquidity guard

    // Confidence = weighted friction + liquidity safety
    // Higher confidence = more friction + safer exit = "PAUSE and reassess"
    //
    // Why liquidity ADDS to confidence:
    // - High friction + high liquidity = safe to wait
    // - High friction + low liquidity = already filtered out by gate
    const frictionScore = w1 * friction.impactFriction + w2 * friction.rtlFriction;
    const confidence = Math.max(0, Math.min(1, frictionScore + w3 * liquidityRisk.penalty));

    // Gate 4: Minimum confidence threshold
    // "Is there enough friction to warrant a warning?"
    if (confidence < V1_HOLD.CONFIDENCE_THRESHOLD) {
        return null;
    }

    // === DURATION CALCULATION ===

    // Higher friction = longer pause recommended
    // confidence 0.4 → 5 min (minimum)
    // confidence 0.7 → ~1 hour
    // confidence 1.0 → up to 3 days (based on severity)
    //
    // Scale: 5 min base + (confidence * dynamic range)
    // Dynamic range increases with friction severity
    const baseMinutes = V1_HOLD.MIN_HOLD_MINUTES;
    const maxRange = V1_HOLD.MAX_HOLD_MINUTES - baseMinutes;

    // Exponential scaling for severe friction
    // Low confidence (0.4-0.6): 5-30 min
    // Medium confidence (0.6-0.8): 30 min - 4 hours
    // High confidence (0.8-1.0): 4 hours - 3 days
    const scaledDuration = baseMinutes + (Math.pow(confidence, 2) * maxRange);
    const suggestedDuration = Math.min(V1_HOLD.MAX_HOLD_MINUTES, Math.max(V1_HOLD.MIN_HOLD_MINUTES, scaledDuration));

    // === BUILD CHECKPOINT ===

    const now = Date.now();

    return {
        token: input.token,
        suggestedDurationMinutes: Math.round(suggestedDuration * 10) / 10, // Round to 0.1
        confidence: Math.round(confidence * 100) / 100, // Round to 2 decimals
        maxDrawdownPct: V1_HOLD.MAX_DRAWDOWN_PCT,
        signals: {
            momentum: {
                velocity: friction.rtlPercent,
                acceleration: friction.rtlFriction,
                score: frictionScore,
            },
            volume: {
                spikeRatio: liquidityRisk.liquidityGuard,
                score: liquidityRisk.penalty,
            },
        },
        timestamp: now,
        expiresAt: now + 60_000, // Valid for 60 seconds
    };
}
