/**
 * Position State Tracker
 * 
 * Implements the LOCKED 4-state machine for protective trading:
 * OBSERVING → SCOUTING → EXECUTING → RESET
 * 
 * Hard Rules:
 * - No execution outside this flow
 * - No Scenario Runner before 0.80% loss
 * - MIN_OBSERVATION_MS enforced (5 min)
 */

// ============================================================================
// IMMUTABLE CONSTANTS
// ============================================================================
import { SnapPool } from './SnapManager';

export const MIN_OBSERVATION_MS = 300_000;      // 5 minutes minimum observation

// Hysteresis thresholds (Enter vs. Exit)
export const ENTER_PRE_SCOUT_THRESHOLD_PCT = 0.45;
export const EXIT_PRE_SCOUT_THRESHOLD_PCT = 0.35;

export const ENTER_SCOUTING_THRESHOLD_PCT = 0.75;
export const EXIT_SCOUTING_THRESHOLD_PCT = 0.65;

export const EXECUTION_THRESHOLD_PCT = 0.90;

export const CRITICAL_RUG_MULTIPLIER = 0.10;    // Price < 10% of entry = critical rug
export const CRITICAL_LIQ_USD = 1000;           // Liquidity under $1k = critical
export const RUG_CONFIRMATION_TIME_MS = 15_000; // 15s persistence for rug signal

// ============================================================================
// TYPES
// ============================================================================
export type PositionState = 'OBSERVING' | 'SCOUTING' | 'EXECUTING' | 'RESET' | 'LOCKOUT';

export interface TrackedPosition {
    mint: string;
    symbol: string;
    amount: number;

    // Entry data
    entryTimestamp: number;
    entryPriceSOL: number;

    // Observation data
    currentPriceSOL: number;
    currentLiquidityUSD: number;
    smoothedPnLPct: number;
    accumulatedLossPct: number;

    // State machine
    state: PositionState;
    stateEnteredAt: number;

    // Hardening: Rug detection persistence
    rugDetectedAt?: number;

    // SNAP: Safety Net Asset Pool
    snapPool?: SnapPool;

    // Pre-scout data
    preScoutPrepared?: boolean;
    preScoutCandidates?: PreScoutCandidate[];

    // Scouting data
    scoutedPaths?: ScoutedPath[];
    bestPath?: ScoutedPath;
}

// ... (PreScoutCandidate, ScoutedPath, StateTransitionResult interfaces remain same)

// ============================================================================
// STATE MACHINE LOGIC
// ============================================================================

export function evaluatePositionState(
    position: TrackedPosition,
    currentPriceSOL: number,
    currentLiquidityUSD: number,
    currentTimestamp: number = Date.now()
): StateTransitionResult {

    const timeSinceEntry = currentTimestamp - position.entryTimestamp;

    // Update position metrics
    position.currentPriceSOL = currentPriceSOL;
    position.currentLiquidityUSD = currentLiquidityUSD;

    const unrealizedPnLPct = ((currentPriceSOL - position.entryPriceSOL) / position.entryPriceSOL) * 100;
    position.smoothedPnLPct = unrealizedPnLPct;

    if (unrealizedPnLPct < 0) {
        position.accumulatedLossPct = Math.abs(unrealizedPnLPct);
    } else if (unrealizedPnLPct > 0.05) {
        // Small gain slightly reduces accumulated loss (recovery)
        position.accumulatedLossPct = Math.max(0, position.accumulatedLossPct - (unrealizedPnLPct / 10));
    }

    // --- HARDENING: RUG CONFIRMATION ---
    const signals = {
        priceDump: currentPriceSOL < position.entryPriceSOL * CRITICAL_RUG_MULTIPLIER,
        liqCollapse: currentLiquidityUSD < CRITICAL_LIQ_USD
    };

    let isConfirmedRug = false;
    if (signals.priceDump && signals.liqCollapse) {
        // Multi-signal collision = Instant confirmation
        isConfirmedRug = true;
    } else if (signals.priceDump || signals.liqCollapse) {
        // Single signal requires persistence
        if (!position.rugDetectedAt) {
            position.rugDetectedAt = currentTimestamp;
        } else if (currentTimestamp - position.rugDetectedAt >= RUG_CONFIRMATION_TIME_MS) {
            isConfirmedRug = true;
        }
    } else {
        position.rugDetectedAt = undefined;
    }

    // State Machine Logic
    switch (position.state) {
        case 'OBSERVING':
            return evaluateObserving(position, timeSinceEntry, isConfirmedRug, currentTimestamp);

        case 'SCOUTING':
            return evaluateScouting(position, isConfirmedRug, currentTimestamp);

        case 'EXECUTING':
            return evaluateExecuting(position, currentTimestamp);

        case 'LOCKOUT':
            return evaluateLockout(position, currentTimestamp);

        case 'RESET':
            return evaluateReset(position, currentTimestamp);

        default:
            position.state = 'OBSERVING';
            position.stateEnteredAt = currentTimestamp;
            return {
                previousState: 'RESET',
                newState: 'OBSERVING',
                reason: 'Initialized to OBSERVING',
                action: 'HOLD',
                shouldCallScenarioRunner: false,
                shouldExecute: false,
                isCriticalRug: false
            };
    }
}

function evaluateObserving(
    position: TrackedPosition,
    timeSinceEntry: number,
    isConfirmedRug: boolean,
    currentTimestamp: number
): StateTransitionResult {

    if (isConfirmedRug) {
        position.state = 'EXECUTING';
        position.stateEnteredAt = currentTimestamp;
        return {
            previousState: 'OBSERVING',
            newState: 'EXECUTING',
            reason: `CONFIRMED RUG DETECTED`,
            action: 'EXECUTE',
            shouldCallScenarioRunner: false,
            shouldExecute: true,
            isCriticalRug: true
        };
    }

    // Observation window enforcement
    if (timeSinceEntry < MIN_OBSERVATION_MS) {
        return {
            previousState: 'OBSERVING',
            newState: 'OBSERVING',
            reason: `Watching: ${Math.ceil((MIN_OBSERVATION_MS - timeSinceEntry) / 1000)}s left`,
            action: 'HOLD',
            shouldCallScenarioRunner: false,
            shouldExecute: false,
            isCriticalRug: false
        };
    }

    // --- HYSTERESIS: PRE-SCOUT ---
    if (position.accumulatedLossPct >= ENTER_PRE_SCOUT_THRESHOLD_PCT && !position.preScoutPrepared) {
        position.preScoutPrepared = true;
        console.log(`[PRE-SCOUT] ${position.symbol}: Entered at ${position.accumulatedLossPct.toFixed(2)}%`);
    } else if (position.accumulatedLossPct < EXIT_PRE_SCOUT_THRESHOLD_PCT && position.preScoutPrepared) {
        position.preScoutPrepared = false;
        console.log(`[PRE-SCOUT] ${position.symbol}: Exited (Recovery) at ${position.accumulatedLossPct.toFixed(2)}%`);
    }

    // --- HYSTERESIS: SCOUTING ---
    if (position.accumulatedLossPct >= ENTER_SCOUTING_THRESHOLD_PCT) {
        position.state = 'SCOUTING';
        position.stateEnteredAt = currentTimestamp;
        return {
            previousState: 'OBSERVING',
            newState: 'SCOUTING',
            reason: `Loss ${position.accumulatedLossPct.toFixed(2)}% >= ${ENTER_SCOUTING_THRESHOLD_PCT}%`,
            action: 'SCOUT',
            shouldCallScenarioRunner: true,
            shouldExecute: false,
            isCriticalRug: false
        };
    }

    const phase = position.preScoutPrepared ? 'PRE-SCOUT' : 'OBSERVING';
    return {
        previousState: 'OBSERVING',
        newState: 'OBSERVING',
        reason: `${phase}: ${position.accumulatedLossPct.toFixed(2)}% loss`,
        action: 'HOLD',
        shouldCallScenarioRunner: false,
        shouldExecute: false,
        isCriticalRug: false
    };
}

/**
 * SCOUTING State Logic
 * - Check for recovery (Hysteresis)
 * - Check for execution trigger
 */
function evaluateScouting(
    position: TrackedPosition,
    isConfirmedRug: boolean,
    currentTimestamp: number
): StateTransitionResult {

    if (isConfirmedRug) {
        position.state = 'EXECUTING';
        position.stateEnteredAt = currentTimestamp;
        return {
            previousState: 'SCOUTING',
            newState: 'EXECUTING',
            reason: `CONFIRMED RUG during scouting`,
            action: 'EXECUTE',
            shouldCallScenarioRunner: false,
            shouldExecute: true,
            isCriticalRug: true
        };
    }

    // --- HYSTERESIS: Recovery to OBSERVING ---
    if (position.accumulatedLossPct < EXIT_SCOUTING_THRESHOLD_PCT) {
        position.state = 'OBSERVING';
        position.stateEnteredAt = currentTimestamp;
        return {
            previousState: 'SCOUTING',
            newState: 'OBSERVING',
            reason: `Recovery: loss ${position.accumulatedLossPct.toFixed(2)}% < ${EXIT_SCOUTING_THRESHOLD_PCT}%`,
            action: 'HOLD',
            shouldCallScenarioRunner: false,
            shouldExecute: false,
            isCriticalRug: false
        };
    }

    const hasPositiveUtility = position.bestPath && position.bestPath.utility > 0;

    // Trigger execution
    if (position.accumulatedLossPct >= EXECUTION_THRESHOLD_PCT || hasPositiveUtility) {
        position.state = 'EXECUTING';
        position.stateEnteredAt = currentTimestamp;
        const reason = hasPositiveUtility
            ? `Positive utility path: ${position.bestPath!.targetSymbol}`
            : `Loss ${position.accumulatedLossPct.toFixed(2)}% >= ${EXECUTION_THRESHOLD_PCT}%`;
        return {
            previousState: 'SCOUTING',
            newState: 'EXECUTING',
            reason,
            action: 'EXECUTE',
            shouldCallScenarioRunner: false,
            shouldExecute: true,
            isCriticalRug: false
        };
    }

    return {
        previousState: 'SCOUTING',
        newState: 'SCOUTING',
        reason: `Scouting: ${position.accumulatedLossPct.toFixed(2)}% loss`,
        action: 'HOLD',
        shouldCallScenarioRunner: false,
        shouldExecute: false,
        isCriticalRug: false
    };
}

function evaluateExecuting(
    position: TrackedPosition,
    currentTimestamp: number
): StateTransitionResult {
    // Immediate transition to RESET after execution signal
    position.state = 'RESET';
    position.stateEnteredAt = currentTimestamp;
    return {
        previousState: 'EXECUTING',
        newState: 'RESET',
        reason: 'Execution signal consumed',
        action: 'RESET',
        shouldCallScenarioRunner: false,
        shouldExecute: false,
        isCriticalRug: false
    };
}

/**
 * LOCKOUT State Logic
 * - Enforce 60s cooldown after reset
 */
function evaluateLockout(
    position: TrackedPosition,
    currentTimestamp: number
): StateTransitionResult {
    const lockoutDuration = 60_000;
    const elapsed = currentTimestamp - position.stateEnteredAt;

    if (elapsed >= lockoutDuration) {
        position.state = 'OBSERVING';
        position.stateEnteredAt = currentTimestamp;
        return {
            previousState: 'LOCKOUT',
            newState: 'OBSERVING',
            reason: 'Lockout expired',
            action: 'HOLD',
            shouldCallScenarioRunner: false,
            shouldExecute: false,
            isCriticalRug: false
        };
    }

    return {
        previousState: 'LOCKOUT',
        newState: 'LOCKOUT',
        reason: `Lockout: ${Math.ceil((lockoutDuration - elapsed) / 1000)}s remaining`,
        action: 'HOLD',
        shouldCallScenarioRunner: false,
        shouldExecute: false,
        isCriticalRug: false
    };
}

function evaluateReset(
    position: TrackedPosition,
    currentTimestamp: number
): StateTransitionResult {
    // Reset metrics
    position.entryTimestamp = currentTimestamp;
    position.entryPriceSOL = position.currentPriceSOL;
    position.accumulatedLossPct = 0;
    position.smoothedPnLPct = 0;
    position.rugDetectedAt = undefined;

    // Transition to LOCKOUT instead of immediate OBSERVING
    position.state = 'LOCKOUT';
    position.stateEnteredAt = currentTimestamp;

    return {
        previousState: 'RESET',
        newState: 'LOCKOUT',
        reason: 'Reset complete, entering cooldown',
        action: 'HOLD',
        shouldCallScenarioRunner: false,
        shouldExecute: false,
        isCriticalRug: false
    };
}

// ============================================================================
// FACTORY
// ============================================================================

export function createTrackedPosition(
    mint: string,
    symbol: string,
    amount: number,
    initialPriceSOL: number,
    initialLiquidityUSD: number
): TrackedPosition {
    const now = Date.now();
    return {
        mint,
        symbol,
        amount,
        entryTimestamp: now,
        entryPriceSOL: initialPriceSOL,
        currentPriceSOL: initialPriceSOL,
        currentLiquidityUSD: initialLiquidityUSD,
        smoothedPnLPct: 0,
        accumulatedLossPct: 0,
        state: 'OBSERVING',
        stateEnteredAt: now
    };
}

export function formatObservationRemaining(position: TrackedPosition): string {
    if (position.state === 'LOCKOUT') {
        const elapsed = Date.now() - position.stateEnteredAt;
        const remaining = Math.max(0, 60_000 - elapsed);
        return `Lock: ${Math.ceil(remaining / 1000)}s`;
    }
    if (position.state !== 'OBSERVING') return position.state;

    const elapsed = Date.now() - position.entryTimestamp;
    const remaining = Math.max(0, MIN_OBSERVATION_MS - elapsed);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
