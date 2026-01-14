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
export const MIN_OBSERVATION_MS = 300_000;      // 5 minutes minimum observation
export const SCOUTING_THRESHOLD_PCT = 0.80;     // 0.80% accumulated loss triggers SCOUTING
export const EXECUTION_THRESHOLD_PCT = 0.90;    // 0.90% accumulated loss triggers EXECUTION
export const CRITICAL_RUG_MULTIPLIER = 0.10;    // Price < 10% of entry = critical rug
export const CRITICAL_LIQ_USD = 1000;           // Liquidity under $1k = critical

// ============================================================================
// TYPES
// ============================================================================
export type PositionState = 'OBSERVING' | 'SCOUTING' | 'EXECUTING' | 'RESET';

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
    smoothedPnLPct: number;       // Smoothed unrealized PnL
    accumulatedLossPct: number;   // Accumulated loss percentage (always >= 0)

    // State machine
    state: PositionState;
    stateEnteredAt: number;

    // Scouting data (only populated in SCOUTING state)
    scoutedPaths?: ScoutedPath[];
    bestPath?: ScoutedPath;
}

export interface ScoutedPath {
    targetMint: string;
    targetSymbol: string;
    scenario: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE' | 'VOLATILITY' | 'BEST_EFFORT';
    projectedOutSOL: number;
    hopCount: number;
    slippageBps: number;
    liquidityScore: number;
    landingProb: number;
    utility: number;
    routeSummary: string;
}

export interface StateTransitionResult {
    previousState: PositionState;
    newState: PositionState;
    reason: string;
    action: 'HOLD' | 'SCOUT' | 'EXECUTE' | 'RESET';
    shouldCallScenarioRunner: boolean;
    shouldExecute: boolean;
    isCriticalRug: boolean;
}

// ============================================================================
// STATE MACHINE LOGIC
// ============================================================================

/**
 * Evaluate position state and determine next action
 * This is the ONLY place where state transitions happen
 */
export function evaluatePositionState(
    position: TrackedPosition,
    currentPriceSOL: number,
    currentLiquidityUSD: number,
    currentTimestamp: number = Date.now()
): StateTransitionResult {

    const timeSinceEntry = currentTimestamp - position.entryTimestamp;
    const timeSinceStateEntry = currentTimestamp - position.stateEnteredAt;

    // Calculate current PnL
    const unrealizedPnLPct = ((currentPriceSOL - position.entryPriceSOL) / position.entryPriceSOL) * 100;

    // Check for critical rug conditions (bypass observation window)
    const isCriticalRug =
        currentPriceSOL < position.entryPriceSOL * CRITICAL_RUG_MULTIPLIER ||
        currentLiquidityUSD < CRITICAL_LIQ_USD;

    // Update position metrics
    position.currentPriceSOL = currentPriceSOL;
    position.currentLiquidityUSD = currentLiquidityUSD;
    position.smoothedPnLPct = unrealizedPnLPct;

    // Accumulated loss is always positive (we track how much we've lost, not gained)
    if (unrealizedPnLPct < 0) {
        position.accumulatedLossPct = Math.abs(unrealizedPnLPct);
    }

    // State Machine Logic
    switch (position.state) {
        case 'OBSERVING':
            return evaluateObserving(position, timeSinceEntry, isCriticalRug, currentTimestamp);

        case 'SCOUTING':
            return evaluateScouting(position, isCriticalRug, currentTimestamp);

        case 'EXECUTING':
            return evaluateExecuting(position, currentTimestamp);

        case 'RESET':
            return evaluateReset(position, currentTimestamp);

        default:
            // Default to OBSERVING
            position.state = 'OBSERVING';
            position.stateEnteredAt = currentTimestamp;
            return {
                previousState: 'RESET',
                newState: 'OBSERVING',
                reason: 'Initialized to OBSERVING state',
                action: 'HOLD',
                shouldCallScenarioRunner: false,
                shouldExecute: false,
                isCriticalRug: false
            };
    }
}

/**
 * OBSERVING State Logic
 * - Minimum time enforced
 * - Track smoothed unrealized PnL
 * - Exit only on critical rug OR accumulated loss >= 0.80%
 */
function evaluateObserving(
    position: TrackedPosition,
    timeSinceEntry: number,
    isCriticalRug: boolean,
    currentTimestamp: number
): StateTransitionResult {

    // Critical rug bypasses observation window
    if (isCriticalRug) {
        position.state = 'EXECUTING';
        position.stateEnteredAt = currentTimestamp;
        return {
            previousState: 'OBSERVING',
            newState: 'EXECUTING',
            reason: `CRITICAL RUG DETECTED: Price or liquidity collapsed`,
            action: 'EXECUTE',
            shouldCallScenarioRunner: false,  // Skip scouting, emergency exit
            shouldExecute: true,
            isCriticalRug: true
        };
    }

    // Enforce minimum observation window
    if (timeSinceEntry < MIN_OBSERVATION_MS) {
        const remainingMs = MIN_OBSERVATION_MS - timeSinceEntry;
        const remainingSec = Math.ceil(remainingMs / 1000);
        return {
            previousState: 'OBSERVING',
            newState: 'OBSERVING',
            reason: `Observation window: ${remainingSec}s remaining (${(position.accumulatedLossPct).toFixed(2)}% loss)`,
            action: 'HOLD',
            shouldCallScenarioRunner: false,
            shouldExecute: false,
            isCriticalRug: false
        };
    }

    // Check if accumulated loss triggers SCOUTING
    if (position.accumulatedLossPct >= SCOUTING_THRESHOLD_PCT) {
        position.state = 'SCOUTING';
        position.stateEnteredAt = currentTimestamp;
        return {
            previousState: 'OBSERVING',
            newState: 'SCOUTING',
            reason: `Accumulated loss ${position.accumulatedLossPct.toFixed(2)}% >= ${SCOUTING_THRESHOLD_PCT}%`,
            action: 'SCOUT',
            shouldCallScenarioRunner: true,
            shouldExecute: false,
            isCriticalRug: false
        };
    }

    // Continue observing
    return {
        previousState: 'OBSERVING',
        newState: 'OBSERVING',
        reason: `Observing: ${position.accumulatedLossPct.toFixed(2)}% loss (threshold: ${SCOUTING_THRESHOLD_PCT}%)`,
        action: 'HOLD',
        shouldCallScenarioRunner: false,
        shouldExecute: false,
        isCriticalRug: false
    };
}

/**
 * SCOUTING State Logic
 * - Scenario Runner already called, paths should be populated
 * - Wait for execution trigger: loss >= 0.90% OR positive utility path
 */
function evaluateScouting(
    position: TrackedPosition,
    isCriticalRug: boolean,
    currentTimestamp: number
): StateTransitionResult {

    // Critical rug bypasses scouting
    if (isCriticalRug) {
        position.state = 'EXECUTING';
        position.stateEnteredAt = currentTimestamp;
        return {
            previousState: 'SCOUTING',
            newState: 'EXECUTING',
            reason: `CRITICAL RUG during scouting`,
            action: 'EXECUTE',
            shouldCallScenarioRunner: false,
            shouldExecute: true,
            isCriticalRug: true
        };
    }

    // Check if we have a positive utility path
    const hasPositiveUtility = position.bestPath && position.bestPath.utility > 0;

    // Check if accumulated loss triggers execution
    if (position.accumulatedLossPct >= EXECUTION_THRESHOLD_PCT || hasPositiveUtility) {
        position.state = 'EXECUTING';
        position.stateEnteredAt = currentTimestamp;
        const reason = hasPositiveUtility
            ? `Positive utility path found: ${position.bestPath!.targetSymbol}`
            : `Accumulated loss ${position.accumulatedLossPct.toFixed(2)}% >= ${EXECUTION_THRESHOLD_PCT}%`;
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

    // Continue scouting (paths already computed)
    return {
        previousState: 'SCOUTING',
        newState: 'SCOUTING',
        reason: `Scouting: ${position.accumulatedLossPct.toFixed(2)}% loss, waiting for trigger`,
        action: 'HOLD',
        shouldCallScenarioRunner: false,  // Already have paths
        shouldExecute: false,
        isCriticalRug: false
    };
}

/**
 * EXECUTING State Logic
 * - One-time execution, immediately transition to RESET
 */
function evaluateExecuting(
    position: TrackedPosition,
    currentTimestamp: number
): StateTransitionResult {
    // Execution is immediate, transition to RESET
    position.state = 'RESET';
    position.stateEnteredAt = currentTimestamp;
    return {
        previousState: 'EXECUTING',
        newState: 'RESET',
        reason: 'Execution complete, resetting position',
        action: 'RESET',
        shouldCallScenarioRunner: false,
        shouldExecute: false,
        isCriticalRug: false
    };
}

/**
 * RESET State Logic
 * - Reset counters and return to OBSERVING
 */
function evaluateReset(
    position: TrackedPosition,
    currentTimestamp: number
): StateTransitionResult {
    // Reset all tracking data
    position.entryTimestamp = currentTimestamp;
    position.entryPriceSOL = position.currentPriceSOL;
    position.accumulatedLossPct = 0;
    position.smoothedPnLPct = 0;
    position.scoutedPaths = undefined;
    position.bestPath = undefined;

    // Transition to OBSERVING
    position.state = 'OBSERVING';
    position.stateEnteredAt = currentTimestamp;

    return {
        previousState: 'RESET',
        newState: 'OBSERVING',
        reason: 'Position reset, starting new observation window',
        action: 'HOLD',
        shouldCallScenarioRunner: false,
        shouldExecute: false,
        isCriticalRug: false
    };
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a new tracked position with initial state
 */
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

/**
 * Format remaining observation time for display
 */
export function formatObservationRemaining(position: TrackedPosition): string {
    if (position.state !== 'OBSERVING') return 'N/A';
    const elapsed = Date.now() - position.entryTimestamp;
    const remaining = Math.max(0, MIN_OBSERVATION_MS - elapsed);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
