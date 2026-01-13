'use server';

import { getVirtualPortfolioTokens } from '@/lib/market-observer/JupiterDexMerger';
import { MarketScanner } from '@/lib/execution-engine/simulation/MarketScanner';
import { ScenarioRunner } from '@/lib/execution-engine/scenarios/ScenarioRunner';
import { BrainGoal, SearchableToken } from '@/types/LiquidityFilter';
import { VolumeRiskLevel } from '@/lib/market-observer/VolumeObserver';

export interface PortfolioAnalysisResult {
    mint: string;
    symbol: string;
    metrics: {
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

            // Construct simulated universe for Pathfinder
            // We need at least the token, SOL, and USDC
            const universe: SearchableToken[] = [
                {
                    mint: token.mint,
                    symbol: token.symbol,
                    valueInSOL: 0, // Need to fetch price? MarketData has liquidity but not price? 
                    // Wait, DexMatchedToken doesn't have price. 
                    // We need price to run pathfinder effectively? 
                    // Actually ScenarioRunner runs 'searchForPath' which internally uses 'getJupiterQuote'.
                    // So we just need valid Mint IDs.
                    hasRoute: true,
                    isStable: false,
                    tier: 'RANKABLE',
                    liquidityScore: 1,
                    volatility: 0,
                    alphaScore: 0,
                    source: undefined,
                    roundTripLoss: 0, // unknown
                    isAlpha: true
                },
                {
                    mint: SOL_MINT,
                    symbol: 'SOL',
                    valueInSOL: 1,
                    hasRoute: true,
                    isStable: false,
                    tier: 'SAFE',
                    liquidityScore: 1,
                    volatility: 0,
                    alphaScore: 0,
                    source: undefined,
                    roundTripLoss: 0,
                    isAlpha: false
                }
            ];

            // Define Goal: Exit to SOL
            const goal: BrainGoal = {
                startToken: token.mint,
                targetToken: SOL_MINT,
                startAmountSOL: 1, // Normalized assumption
                targetAmountSOL: 1.01, // Target break-even or better
                maxHops: 3,
                maxTotalRTL: 5,
                maxPerHopRTL: 2
            };

            try {
                // Run Best Effort Scenario
                const comparison = await ScenarioRunner.runAll(universe, goal);

                if (comparison.best && comparison.best.found) {
                    exitPlan = {
                        targetToken: 'SOL',
                        expectedROI: comparison.best.roiPct,
                        routeSummary: `${comparison.best.hops} hops via ${comparison.best.config.name}`,
                        scenarioUsed: comparison.best.config.name
                    };
                } else {
                    exitPlan = {
                        targetToken: 'SOL',
                        expectedROI: 0,
                        routeSummary: 'Direct Swap (Emergency)',
                        scenarioUsed: 'EMERGENCY_DUMP'
                    };
                }
            } catch (err) {
                console.error(`[PortfolioRunner] Pathfinding failed for ${token.symbol}`, err);
            }
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
