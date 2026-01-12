/**
 * Trust Decision Output - Pillar 9
 * 
 * The final output of trust evaluation.
 * Combined with LearningVerdict to gate execution.
 */

import { TrustLevel, ExecutionType } from './trustLevels';

export interface TrustDecision {
    trustLevel: TrustLevel;
    maxTradesAllowed: number;
    executionType: ExecutionType;
    maxSolPerTrade: number;
    reason: string;
    timestamp: number;

    // Historical context
    consecutiveEdgeValidated: number;
    totalRuns: number;
    violations: number;
    lastPromotion: Date | null;
    lastDemotion: Date | null;
}

export interface TrustHistorySummary {
    totalRuns: number;
    edgeValidatedRuns: number;
    noEdgeRuns: number;
    noTradeRuns: number;
    chaosAborts: number;

    consecutiveEdgeValidated: number;
    consecutiveNoEdge: number;

    violations: TrustViolation[];
    promotions: TrustChange[];
    demotions: TrustChange[];
}

export interface TrustViolation {
    type: ViolationType;
    description: string;
    timestamp: Date;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export type ViolationType =
    | 'EXECUTED_WITHOUT_EDGE'
    | 'EXCEEDED_TRADE_LIMIT'
    | 'EXCEEDED_SOL_LIMIT'
    | 'IGNORED_CHAOS_REGIME'
    | 'OVERTRADING'
    | 'BASELINE_BEATS_BRAIN_REPEATED';

export interface TrustChange {
    fromLevel: TrustLevel;
    toLevel: TrustLevel;
    reason: string;
    timestamp: Date;
}

/**
 * Format trust decision for logging
 */
export function formatTrustDecision(decision: TrustDecision): string {
    const lines = [
        `Trust Level: ${decision.trustLevel} (${decision.reason})`,
        `Execution: ${decision.executionType}`,
        `Max Trades: ${decision.maxTradesAllowed}`,
        `Max SOL/Trade: ${decision.maxSolPerTrade}`,
        `History: ${decision.consecutiveEdgeValidated} consecutive validated, ${decision.totalRuns} total runs, ${decision.violations} violations`,
    ];
    return lines.join('\n');
}

/**
 * Check if execution is allowed given trust + learning verdict
 */
export function isExecutionAllowed(
    trustDecision: TrustDecision,
    learningVerdict: string
): { allowed: boolean; reason: string } {
    // Both must pass
    if (learningVerdict !== 'EDGE_VALIDATED') {
        return {
            allowed: false,
            reason: `Learning verdict is ${learningVerdict}, not EDGE_VALIDATED`,
        };
    }

    if (trustDecision.executionType === 'NONE') {
        return {
            allowed: false,
            reason: `Trust level ${trustDecision.trustLevel} does not allow execution`,
        };
    }

    return {
        allowed: true,
        reason: `EDGE_VALIDATED + Trust Level ${trustDecision.trustLevel} = Execution allowed (${trustDecision.executionType})`,
    };
}
