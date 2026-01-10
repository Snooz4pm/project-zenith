/**
 * Roadmap Types - Smart Swap Brain
 *
 * Deterministic path-finding through real Jupiter quote simulations.
 * No predictions, no automation, no custody.
 */

export type RoadmapCandidate = {
    path: string[]; // ["SOL", "A", "B", "SOL"]
    mints: string[]; // Corresponding mint addresses
    simulatedROI: number; // % gain/loss (e.g., 6.3 = +6.3%)
    confidence: number; // 0-1 (penalized by slippage, hops, fragility)
    riskLevel: 'low' | 'medium' | 'high';
    validFor: number; // TTL in seconds
    executionReady: boolean;
    // Detailed hop data
    hops: RoadmapHop[];
    // Risk metrics
    totalSlippage: number; // %
    maxHopSlippage: number; // %
    totalFees: number; // SOL
};

export type RoadmapHop = {
    from: string; // Symbol
    to: string; // Symbol
    fromMint: string;
    toMint: string;
    inputAmount: string; // lamports/decimals
    outputAmount: string; // lamports/decimals
    slippage: number; // %
    priceImpact: number; // %
    routePlan: any; // Jupiter route plan
};

export type PathfindingConfig = {
    maxHops: number; // Max 3 (SOL → A → B → SOL)
    maxSlippagePerHop: number; // % (e.g., 20)
    maxTotalSlippage: number; // % (e.g., 40)
    maxRoundTripLoss: number; // % (e.g., 30)
    topKNeighbors: number; // How many neighbors to explore (e.g., 5)
    minInputSOL: number; // Min SOL to start (e.g., 0.01)
    validityTTL: number; // seconds (e.g., 20)
};
