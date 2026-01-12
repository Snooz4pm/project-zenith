/**
 * Promotion Rules - Pillar 9
 * 
 * Determines when trust level should INCREASE.
 * Based on sustained discipline, not single runs.
 */

import { TrustLevel, getTrustConfig } from './trustLevels';
import { TrustHistorySummary } from './trustDecision';

export interface PromotionResult {
    shouldPromote: boolean;
    fromLevel: TrustLevel;
    toLevel: TrustLevel;
    reason: string;
    signals: string[];
}

/**
 * Promotion Signals - What we look for
 */
export interface PromotionSignals {
    consecutiveEdgeValidated: number;
    totalRuns: number;
    violations: number;
    correctNoTradeDecisions: number;
    saturationStopsRespected: number;
    chaosAbortsRespected: number;
    baselineBeatenRate: number; // 0-1
}

/**
 * Evaluate if promotion is warranted
 */
export function evaluatePromotion(
    currentLevel: TrustLevel,
    history: TrustHistorySummary,
    signals: PromotionSignals
): PromotionResult {
    const nextLevel = currentLevel + 1 as TrustLevel;

    // Can't promote beyond max level
    if (nextLevel > TrustLevel.LEVEL_4_REAL_SMALL) {
        return {
            shouldPromote: false,
            fromLevel: currentLevel,
            toLevel: currentLevel,
            reason: 'Already at maximum trust level',
            signals: [],
        };
    }

    const targetConfig = getTrustConfig(nextLevel);
    const positiveSignals: string[] = [];
    const blockingSignals: string[] = [];

    // Check consecutive edge validated
    if (signals.consecutiveEdgeValidated >= targetConfig.minConsecutiveEdgeValidated) {
        positiveSignals.push(`${signals.consecutiveEdgeValidated} consecutive EDGE_VALIDATED (need ${targetConfig.minConsecutiveEdgeValidated})`);
    } else {
        blockingSignals.push(`Only ${signals.consecutiveEdgeValidated} consecutive EDGE_VALIDATED (need ${targetConfig.minConsecutiveEdgeValidated})`);
    }

    // Check total runs
    if (signals.totalRuns >= targetConfig.minTotalRuns) {
        positiveSignals.push(`${signals.totalRuns} total runs (need ${targetConfig.minTotalRuns})`);
    } else {
        blockingSignals.push(`Only ${signals.totalRuns} total runs (need ${targetConfig.minTotalRuns})`);
    }

    // Check violations
    if (signals.violations <= targetConfig.maxViolations) {
        positiveSignals.push(`${signals.violations} violations (max ${targetConfig.maxViolations})`);
    } else {
        blockingSignals.push(`${signals.violations} violations exceeds max ${targetConfig.maxViolations}`);
    }

    // Bonus: Correct NO-TRADE decisions
    if (signals.correctNoTradeDecisions > 0) {
        positiveSignals.push(`${signals.correctNoTradeDecisions} correct NO-TRADE decisions (discipline)`);
    }

    // Bonus: Saturation stops respected
    if (signals.saturationStopsRespected > 0) {
        positiveSignals.push(`${signals.saturationStopsRespected} saturation stops respected`);
    }

    // Bonus: High baseline beat rate
    if (signals.baselineBeatenRate >= 0.7) {
        positiveSignals.push(`${(signals.baselineBeatenRate * 100).toFixed(0)}% baseline beat rate`);
    }

    // Decision
    const shouldPromote = blockingSignals.length === 0;

    return {
        shouldPromote,
        fromLevel: currentLevel,
        toLevel: shouldPromote ? nextLevel : currentLevel,
        reason: shouldPromote
            ? `Promoted: ${positiveSignals.join(', ')}`
            : `Blocked: ${blockingSignals.join(', ')}`,
        signals: shouldPromote ? positiveSignals : blockingSignals,
    };
}

/**
 * Special promotion for level 0 → 1 (first execution)
 */
export function canStartPaperTrading(signals: PromotionSignals): boolean {
    return (
        signals.consecutiveEdgeValidated >= 3 &&
        signals.totalRuns >= 5 &&
        signals.violations === 0
    );
}
