/**
 * Demotion Rules - Pillar 9
 * 
 * Determines when trust level should DECREASE.
 * One bad run ≠ demotion. Repeated bad behavior = demotion.
 */

import { TrustLevel, getTrustLevelName } from './trustLevels';
import { TrustViolation, ViolationType } from './trustDecision';

export interface DemotionResult {
    shouldDemote: boolean;
    fromLevel: TrustLevel;
    toLevel: TrustLevel;
    reason: string;
    violations: TrustViolation[];
}

/**
 * Demotion Signals - What triggers demotion
 */
export interface DemotionSignals {
    consecutiveNoEdge: number;
    executedWithoutEdge: boolean;
    exceededTradeLimit: boolean;
    exceededSolLimit: boolean;
    ignoredChaosRegime: boolean;
    overtrading: boolean;
    baselineBeatsConsecutive: number;
}

// Thresholds
const CONSECUTIVE_NO_EDGE_THRESHOLD = 3;
const BASELINE_BEATS_CONSECUTIVE_THRESHOLD = 5;

/**
 * Evaluate if demotion is warranted
 */
export function evaluateDemotion(
    currentLevel: TrustLevel,
    signals: DemotionSignals
): DemotionResult {
    const violations: TrustViolation[] = [];

    // Can't demote below level 0
    if (currentLevel === TrustLevel.LEVEL_0_OBSERVER) {
        return {
            shouldDemote: false,
            fromLevel: currentLevel,
            toLevel: currentLevel,
            reason: 'Already at minimum level',
            violations: [],
        };
    }

    // CRITICAL violations - immediate demotion
    if (signals.executedWithoutEdge) {
        violations.push({
            type: 'EXECUTED_WITHOUT_EDGE',
            description: 'Executed trade when LearningVerdict ≠ EDGE_VALIDATED',
            timestamp: new Date(),
            severity: 'CRITICAL',
        });
    }

    if (signals.exceededSolLimit) {
        violations.push({
            type: 'EXCEEDED_SOL_LIMIT',
            description: 'Trade exceeded maximum SOL limit for trust level',
            timestamp: new Date(),
            severity: 'CRITICAL',
        });
    }

    // HIGH violations - demotion after warning
    if (signals.exceededTradeLimit) {
        violations.push({
            type: 'EXCEEDED_TRADE_LIMIT',
            description: 'Exceeded maximum trades allowed for trust level',
            timestamp: new Date(),
            severity: 'HIGH',
        });
    }

    if (signals.ignoredChaosRegime) {
        violations.push({
            type: 'IGNORED_CHAOS_REGIME',
            description: 'Attempted execution during CHAOS regime',
            timestamp: new Date(),
            severity: 'HIGH',
        });
    }

    // MEDIUM violations - demotion if repeated
    if (signals.consecutiveNoEdge >= CONSECUTIVE_NO_EDGE_THRESHOLD) {
        violations.push({
            type: 'BASELINE_BEATS_BRAIN_REPEATED',
            description: `${signals.consecutiveNoEdge} consecutive NO_EDGE verdicts`,
            timestamp: new Date(),
            severity: 'MEDIUM',
        });
    }

    if (signals.baselineBeatsConsecutive >= BASELINE_BEATS_CONSECUTIVE_THRESHOLD) {
        violations.push({
            type: 'BASELINE_BEATS_BRAIN_REPEATED',
            description: `Baseline beats Brain ${signals.baselineBeatsConsecutive} times in a row`,
            timestamp: new Date(),
            severity: 'MEDIUM',
        });
    }

    if (signals.overtrading) {
        violations.push({
            type: 'OVERTRADING',
            description: 'Excessive trading activity detected',
            timestamp: new Date(),
            severity: 'MEDIUM',
        });
    }

    // Determine demotion level
    const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length;
    const highCount = violations.filter(v => v.severity === 'HIGH').length;

    let demotionSteps = 0;
    if (criticalCount > 0) {
        demotionSteps = 2; // Drop 2 levels for critical
    } else if (highCount > 0) {
        demotionSteps = 1; // Drop 1 level for high
    } else if (violations.length >= 2) {
        demotionSteps = 1; // Multiple medium = 1 level drop
    }

    const newLevel = Math.max(0, currentLevel - demotionSteps) as TrustLevel;
    const shouldDemote = demotionSteps > 0;

    return {
        shouldDemote,
        fromLevel: currentLevel,
        toLevel: newLevel,
        reason: shouldDemote
            ? `Demoted from ${getTrustLevelName(currentLevel)} to ${getTrustLevelName(newLevel)}: ${violations.map(v => v.type).join(', ')}`
            : violations.length > 0
                ? `Warning: ${violations.map(v => v.type).join(', ')} (not yet demoting)`
                : 'No violations detected',
        violations,
    };
}

/**
 * Check for immediate demotion conditions
 */
export function hasImmediateDemotion(signals: DemotionSignals): boolean {
    return (
        signals.executedWithoutEdge ||
        signals.exceededSolLimit
    );
}
