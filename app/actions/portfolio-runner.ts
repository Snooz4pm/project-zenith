'use server';

import { getVirtualPortfolioTokens } from '@/lib/market-observer/JupiterDexMerger';
import { MarketScanner } from '@/lib/execution-engine/simulation/MarketScanner';
import { BrainGoal, SearchableToken } from '@/types/LiquidityFilter';
import { VolumeRiskLevel } from '@/lib/market-observer/VolumeObserver';

export interface PortfolioAnalysisResult {
    mint: string;
    symbol: string;
    metrics: {
        slippagePct: number;
        price: number;
        liquidityUSD: number;
        volume5m: number;
        riskLevel: VolumeRiskLevel;
    };
    verdict: {
        action: 'HOLD' | 'SELL' | 'SWAP' | 'OBSERVE';
        reason: string;
        riskScore: number;
        isSafe: boolean;
    };
    exitPlan?: {
        targetToken: string; // e.g., 'SOL' or 'USDC'
        expectedROI: number;
        routeSummary: string;
        scenarioUsed: string;
    };
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

/**
 * Run Full Physics Analysis on a Portfolio of Mints
 */
export async function runPortfolioAnalysis(mints: string[]): Promise<PortfolioAnalysisResult[]> {
    console.log(`[PortfolioRunner] Analyzing ${mints.length} tokens...`);

    // 1. Fetch Live Market Data (Jupiter + DexScreener)
    const marketData = await getVirtualPortfolioTokens(mints);
    const results: PortfolioAnalysisResult[] = [];

    for (const token of marketData) {
        console.log(`[PortfolioRunner] Processing ${token.symbol}...`);

        // 2. Physics Evaluation (MarketScanner Logic)
        // We manually reconstruct the logic here or use MarketScanner if it exposes a helper.
        // Since MarketScanner is mostly a loop, we'll implement the "Evaluation Logic" directly here
        // using the Physics Engine principles (Safety First).

        let action: 'HOLD' | 'SELL' | 'SWAP' | 'OBSERVE' = 'HOLD';
        let reason = 'Safe asset.';
        let isSafe = true;
        let riskScore = 0;

        // --- PHYSICS ENGINE LOGIC ---
        if (token.riskLevel === 'CRITICAL') {
            action = 'SELL';
            reason = 'CRITICAL RISK: Potential rug pull or collapsed liquidity.';
            isSafe = false;
            riskScore = 100;
        } else if (token.riskLevel === 'HIGH') {
            // High risk but maybe tradeable?
            // If stablecoin, this is weird. If meme, check volume.
            if (['USDC', 'USDT', 'PYUSD'].includes(token.symbol)) {
                action = 'HOLD';
                reason = 'Stablecoin (ignoring high volume).';
                isSafe = true;
                riskScore = 10;
            } else {
                action = 'SELL'; // Panic unless explicitly whitelisted
                reason = 'High volatility/risk detected. Exiting to safety.';
                isSafe = false;
                riskScore = 80;
            }
        } else if (token.riskLevel === 'MEDIUM') {
            // "Tradeable" zone for memes
            if (['USDC', 'USDT', 'PYUSD'].includes(token.symbol)) {
                action = 'HOLD';
                isSafe = true;
            } else {
                action = 'OBSERVE'; // Watch closely
                reason = 'Medium risk. Holding but monitoring.';
                isSafe = false; // Not "Safe" safe, but not sell yet
                riskScore = 40;
            }
        } else {
            // LOW Risk
            action = 'HOLD';
            reason = 'Low risk. Asset is healthy.';
            isSafe = true;
            riskScore = 0;
        }

        // Special handling for SOL (Fuel)
        if (token.symbol === 'SOL') {
            action = 'HOLD';
            reason = 'Native fuel.';
            isSafe = true;
            riskScore = 0;
        }

        // --- EXECUTION ENGINE LOGIC (PATHFINDING) ---
        let exitPlan = undefined;

        if (action === 'SELL' || action === 'SWAP') {
            console.log(`[PortfolioRunner] Planning exit for ${token.symbol}...`);

            // CONSERVATIVE MODE: No Pathfinding, Direct Exit Only
            exitPlan = {
                targetToken: 'SOL',
                expectedROI: 0, // Market Price
                routeSummary: 'Direct Swap (Conservative)',
                scenarioUsed: 'DIRECT_MARKET_EXIT'
            };
        }

        results.push({
            mint: token.mint,
            symbol: token.symbol,
            metrics: {
                price: 0, // TODO: Add price fetch if needed for UI, currently inferred
                liquidityUSD: token.liquidityUSD || 0,
                volume5m: token.volume5m || 0,
                riskLevel: token.riskLevel
            },
            verdict: {
                action,
                reason,
                riskScore,
                isSafe
            },
            exitPlan
        });
    }

    return results;
}
