/**
 * Brutal Brain Simulation - Core Types
 * 
 * Logs every decision with intent → execution → outcome → evaluation
 */

export type ActionType = 'SWAP' | 'HOLD' | 'HESITATE';

export interface DecisionIntent {
    thesis: string;
    signals: {
        momentum?: number;
        volatility?: number;
        liquidity?: number;
    };
    expectedDirection: 'UP' | 'DOWN' | 'NEUTRAL';
    expectedEdgePct?: number;
    confidence: number;
    invalidationRules: string[];
}

export interface DecisionLog {
    timestamp: number;
    action: ActionType;
    fromToken: string;
    toToken?: string;

    intent: DecisionIntent;

    executed: boolean;
    skippedReason?: string;

    expectedEdgePct?: number;
    realizedEdgePct?: number;

    pnlSOL: number;

    evaluation?: DecisionEvaluation;
}

export interface DecisionEvaluation {
    outcomeClass:
    | 'GOOD_DECISION_GOOD_OUTCOME'
    | 'GOOD_DECISION_BAD_OUTCOME'
    | 'BAD_DECISION_GOOD_OUTCOME'
    | 'BAD_DECISION_BAD_OUTCOME'
    | 'HESITATION_CORRECT'
    | 'HESITATION_COSTLY';

    penaltyScore: number;
    explanation: string;
}

export interface SimulationReport {
    startSOL: number;
    endSOL: number;
    pnlPct: number;
    penaltyScore: number;
    logs: DecisionLog[];
    verdict: 'PASS' | 'FAIL';
    verdictReason: string;
}
