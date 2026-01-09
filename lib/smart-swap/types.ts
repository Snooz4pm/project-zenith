/**
 * Smart Swap Types
 *
 * ISOLATED MODULE - Does NOT touch existing swap logic
 * This is a recommendation engine only, NOT an execution engine
 */

export type RiskMode = 'safe' | 'balanced' | 'degenerate';

export interface TokenCandidate {
    mint: string;
    symbol: string;
    name: string;
    logoURI?: string;
    decimals: number;
}

export interface TokenMetrics {
    mint: string;
    liquidity: number;
    volume24h: number;
    priceChange24h: number;
    marketCap?: number;
    holderCount?: number;
    age?: number; // days since token creation
}

export interface RiskAssessment {
    mint: string;
    score: number; // 0-100, higher is safer
    flags: string[];
    mintAuthority: boolean;
    freezeAuthority: boolean;
    topHolderPercentage: number;
    rugCheckScore?: number;
}

export interface SwapRecommendation {
    tokenOut: TokenCandidate;
    estimatedAmountOut: number;
    estimatedSlippage: number;
    liquidityScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high';
    riskScore: number; // 0-100
    smartSwapScore: number; // composite score
    explanation: string;
    priceImpact: number;
}

export interface SmartSwapRequest {
    amountIn: number;
    tokenInMint: string;
    riskMode: RiskMode;
}

export interface SmartSwapResponse {
    recommendations: SwapRecommendation[];
    timestamp: number;
    riskMode: RiskMode;
}

// Risk mode configurations
export const RISK_MODE_CONFIG = {
    safe: {
        minLiquidity: 1000000, // $1M
        minVolume24h: 100000, // $100k
        minTokenAge: 30, // 30 days
        maxTopHolderPercentage: 20, // 20%
        minRugCheckScore: 80,
        label: 'Safe',
        description: 'Established tokens with high liquidity and low risk',
    },
    balanced: {
        minLiquidity: 250000, // $250k
        minVolume24h: 25000, // $25k
        minTokenAge: 7, // 7 days
        maxTopHolderPercentage: 30, // 30%
        minRugCheckScore: 60,
        label: 'Balanced',
        description: 'Mix of safety and opportunity',
    },
    degenerate: {
        minLiquidity: 50000, // $50k
        minVolume24h: 5000, // $5k
        minTokenAge: 1, // 1 day
        maxTopHolderPercentage: 50, // 50%
        minRugCheckScore: 40,
        label: 'Degenerate',
        description: 'Higher risk, newer tokens with potential upside',
    },
} as const;
