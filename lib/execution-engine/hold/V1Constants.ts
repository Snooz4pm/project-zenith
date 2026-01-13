/**
 * V1 Hold System - Constants and Types
 *
 * READ-ONLY momentum/volume analyzer.
 * Suggests hold duration based on existing market data.
 *
 * LOCKED SPEC - DO NOT MODIFY IN V1
 */

export const V1_HOLD = {
    MAX_HOLD_MINUTES: 4320, // 3 days maximum (72 hours)
    MIN_HOLD_MINUTES: 5,    // 5 minutes minimum
    CONFIDENCE_THRESHOLD: 0.4, // Minimum confidence to suggest hold
    MIN_EXIT_LIQUIDITY_USD: 50_000, // Must have emergency exit
    MAX_DRAWDOWN_PCT: 3, // Stop-loss trigger

    // Data requirements (we need to collect these)
    MIN_PRICE_POINTS: 60, // ~10 minutes of data at 10s intervals
    MIN_VOLUME_POINTS: 60,
} as const;

/**
 * Hold Checkpoint - Snapshot of hold suggestion
 *
 * CRITICAL: This expires after 60 seconds.
 * User must decide: HOLD or CONTINUE immediately.
 */
export type V1HoldCheckpoint = {
    token: string; // Mint address
    suggestedDurationMinutes: number; // 5 min - 3 days (4320 min)

    confidence: number; // 0-1
    maxDrawdownPct: 3; // Always 3% in v1

    signals: {
        momentum: {
            velocity: number; // %/min change
            acceleration: number; // short/medium ratio
            score: number; // 0-1
        };
        volume: {
            spikeRatio: number; // recent/baseline
            score: number; // 0-1
        };
    };

    timestamp: number; // When computed
    expiresAt: number; // Valid until (timestamp + 60s)
};
