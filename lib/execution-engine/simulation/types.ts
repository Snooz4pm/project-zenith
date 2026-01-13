export interface DecisionLog {
    timestamp: number;
    cycle: number;
    decision: string;
    reason: string;
    data?: any;
}

export interface Position {
    token: string;
    entryValueSOL: number;
    entryPrice: number;
    tokenAmount: number;
    openedAt: number;
}

export interface SimulationReport {
    startSOL: number;
    endSOL: number;
    solPriceUSD: number;
    pnlPct: number;
    penaltyScore: number;
    totalInvalidDecisions: number;
    logs: DecisionLog[];
    verdict: 'PASS' | 'FAIL';
    verdictReason: string;
    // Add other fields as recognized by usage in MarketScanner
    trustLevel?: string;
    cycleMetrics?: any[];
    funnelMetrics?: any;
}
