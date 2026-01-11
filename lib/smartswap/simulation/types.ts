/**
 * Brutal Brain Simulation - Core Types
 * 
 * Logs every decision with intent → execution → outcome → evaluation
 */

export type ActionType = 'SWAP' | 'HOLD' | 'HESITATE' | 'EXIT';

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

export interface Position {
    token: string;
    entryValueSOL: number;
    entryPrice: number;
    tokenAmount: number;
    openedAt: number;
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

    // Financials
    entryCostSOL?: number;      // Fees + Slippage at entry
    pnlSOL: number;             // Legacy - keeping for compat
    realizedPnlSOL: number;     // Profit banked on exit
    unrealizedPnlSOL: number;   // Mark-to-market while holding
    portfolioValueSOL: number;

    evaluation?: DecisionEvaluation;
}

export interface DecisionEvaluation {
    outcomeClass:
    | 'GOOD_DECISION_GOOD_OUTCOME'
    | 'GOOD_DECISION_BAD_OUTCOME'
    | 'BAD_DECISION_GOOD_OUTCOME'
    | 'BAD_DECISION_BAD_OUTCOME'
    | 'HESITATION_CORRECT'
    | 'HESITATION_COSTLY'
    | 'POSITION_OPENED'
    | 'POSITION_CLOSED';

    penaltyScore: number;
    explanation: string;
}

export interface SimulationReport {
    startSOL: number;
    endSOL: number;
    pnlPct: number;
    penaltyScore: number;
    totalInvalidDecisions: number;
    logs: DecisionLog[];
    verdict: 'PASS' | 'FAIL';
    verdictReason: string;
}
