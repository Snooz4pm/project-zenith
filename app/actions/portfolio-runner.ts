'use server';

import { getVirtualPortfolioTokens, getDexMatchedTokens } from '@/lib/market-observer/JupiterDexMerger';
import { ScenarioRunner } from '@/lib/execution-engine/scenarios/ScenarioRunner';
import {
    createFunnelState,
    predictFunnel,
    getFunnelVerdict,
    classifyToken,
    TokenCandidate
} from '@/lib/physics-engine/compoundingLoop';
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
/**
 * Run Full Physics Analysis on a Portfolio of Mints
 */
export async function runPortfolioAnalysis(mints: string[]): Promise<PortfolioAnalysisResult[]> {
    console.log(`[PortfolioRunner] Analyzing ${mints.length} tokens...`);

    // 1. Fetch Live Market Data (Portfolio + Broad Market Context)
    // We launch both fetches in parallel for speed.
    // "Broad Market" satisfies the "Intutition" requirement - seeing the rest of the market.
    const [marketData, broadMarketData] = await Promise.all([
        getVirtualPortfolioTokens(mints),
        getDexMatchedTokens() // Scans ~1000 tokens per user request
    ]);

    // Convert Broad Market to Searchable Universe once (for efficiency)
    const broadUniverse: SearchableToken[] = broadMarketData.map(t => ({
        mint: t.mint,
        symbol: t.symbol,
        valueInSOL: (t.price || 0) / 140, // Approx SOL value
        hasRoute: true,
        isStable: ['USDC', 'USDT', 'PYUSD'].includes(t.symbol),
        tier: t.riskLevel === 'LOW' ? 'SAFE' : 'RANKABLE',
        liquidityScore: 1,
        volatility: t.riskLevel === 'HIGH' ? 0.8 : 0.2, // Rough heuristic
        alphaScore: 0,
        source: undefined,
        roundTripLoss: 0,
        isAlpha: t.riskLevel !== 'LOW'
    }));

    const results: PortfolioAnalysisResult[] = [];

    // 2. Initialize Machine State (Pillar 10)
    // We treat the current portfolio as the "Funnel" to judge.
    const candidates: TokenCandidate[] = marketData.map(t => ({
        symbol: t.symbol,
        mint: t.mint,
        tokenClass: classifyToken(t.symbol, t.mint),
        priceAtStart: t.price || 0,
        score: 0,
        flatStreak: 0
    }));

    const funnelState = createFunnelState(candidates);

    // 3. Run Pillar 10 Logic (Newtonian momentum + Brain v2 Memory)
    await predictFunnel(funnelState);

    // 4. Get Agent Verdict
    // This helper decides if a trade is earned based on the Pillars.
    const verdictSummary = getFunnelVerdict(funnelState);

    for (const token of marketData) {
        console.log(`[PortfolioRunner] Processing ${token.symbol}...`);

        // --- THE ACTUAL AGENT DECISION ---
        const candidate = funnelState.tokens.find(c => c.mint === token.mint);

        let action: 'HOLD' | 'SELL' | 'SWAP' | 'OBSERVE' = 'HOLD';
        let reason = 'Agent analyzing...';
        let isSafe = true;
        let riskScore = 0;

        if (candidate) {
            const pred = candidate.prediction;

            // Map actual Pillar 10/11/14 predictions to Actions
            if (pred === 'UP') {
                action = 'HOLD';
                reason = `Momentum upward. Agent holding for growth.`;
                isSafe = true;
                riskScore = 10;
            } else if (pred === 'DOWN') {
                action = 'SELL';
                reason = `Negative momentum detected. Survival logic triggered.`;
                isSafe = false;
                riskScore = 80;
            } else {
                action = 'OBSERVE';
                reason = `Sideways volume. Minimal conviction.`;
                isSafe = false;
                riskScore = 50;
            }
        }

        // --- EXECUTION ENGINE LOGIC (PATHFINDING) ---
        let exitPlan = undefined;

        if (action === 'SELL' || action === 'SWAP') {
            console.log(`[PortfolioRunner] Planning exit for ${token.symbol}...`);

            // Construct simulated universe for Pathfinder (Portfolio Asset + Broad Market)
            // We combine the current token + SOL + The entire monitored universe.
            const universe: SearchableToken[] = [
                {
                    mint: token.mint,
                    symbol: token.symbol,
                    valueInSOL: (token.price || 0) / 140, // Normalize to SOL
                    hasRoute: true,
                    isStable: false,
                    tier: 'RANKABLE',
                    liquidityScore: 1,
                    volatility: 0,
                    alphaScore: 0,
                    source: undefined,
                    roundTripLoss: 0,
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
                },
                ...broadUniverse // Integrate the 1000 scanned tokens as potential route hops
            ];

            // Define Goal: Exit to SOL
            const goal: BrainGoal = {
                startToken: token.mint,
                targetToken: SOL_MINT,
                startAmountSOL: 1,
                targetAmountSOL: 1.01,
                maxHops: 3,
                maxTotalRTL: 5,
                maxPerHopRTL: 2
            };

            try {
                // Run Pathfinding Scenarios
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
                slippagePct: 0.005, // Conservative defalt
                price: token.price || 0,
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
