'use server';

import { getVirtualPortfolioTokens, getDexMatchedTokens } from '@/lib/market-observer/JupiterDexMerger';
import { ScenarioRunner } from '@/lib/execution-engine/scenarios/ScenarioRunner';
import {
    createFunnelState,
    predictFunnel,
    classifyToken,
    TokenCandidate
} from '@/lib/physics-engine/compoundingLoop';
import { BrainGoal, SearchableToken } from '@/types/LiquidityFilter';
import { VolumeRiskLevel } from '@/lib/market-observer/VolumeObserver';
import { getJupiterQuote } from '@/lib/solana/jupiter';

export interface Position {
    mint: string;
    amount: number;
}

export interface PortfolioAnalysisResult {
    mint: string;
    symbol: string;
    metrics: {
        price: number;
        liquidityUSD: number;
        volume5m: number;
        volumeState: 'expanding' | 'collapsing' | 'stagnant' | 'unknown';
        riskLevel: VolumeRiskLevel;
    };
    verdict: {
        action: 'HOLD' | 'SELL' | 'SWAP' | 'OBSERVE';
        reason: string;
        riskScore: number;
        isSafe: boolean;
    };
    exitPlan?: {
        targetToken: string;
        grossSOL: number;
        slippagePct: number;
        feesSOL: number;
        netSOL: number;
        routeSummary: string;
        scenarioUsed: string;
    };
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * Fair Real-World Portfolio Test
 * Strictly deterministic, zero-hindsight.
 */
export async function runPortfolioAnalysis(positions: Position[]): Promise<PortfolioAnalysisResult[]> {
    const mints = positions.map(p => p.mint);
    console.log(`[PortfolioRunner] Starting Fair Test on ${mints.length} mints...`);

    // 1. Fetch Market Truth (The Eyes)
    const [marketData, broadMarketData] = await Promise.all([
        getVirtualPortfolioTokens(mints),
        getDexMatchedTokens() // Scans ~1000 tokens per user request
    ]);

    const solPrice = marketData.find(m => m.symbol === 'SOL')?.price || 140;

    // Build the "Agent's Vision" (Broad Universe)
    const broadUniverse: SearchableToken[] = broadMarketData.map(t => ({
        mint: t.mint,
        symbol: t.symbol,
        valueInSOL: (t.price || 0) / solPrice,
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

    // 2. Initialize Agent Physics (The Physics)
    const candidates: TokenCandidate[] = marketData.map(t => ({
        symbol: t.symbol,
        mint: t.mint,
        tokenClass: classifyToken(t.symbol, t.mint),
        priceAtStart: t.price || 0,
        score: 0,
        flatStreak: 0
    }));

    const funnelState = createFunnelState(candidates);

    // Run Pillar 10 Logic (Newtonian momentum + Brain v2 Memory)
    await predictFunnel(funnelState);

    const results: PortfolioAnalysisResult[] = [];

    for (const token of marketData) {
        const position = positions.find(p => p.mint === token.mint);
        if (!position) continue;

        console.log(`[PortfolioRunner] Analyzing ${token.symbol}...`);

        // --- THE ACTUAL AGENT DECISION ---
        const candidate = funnelState.tokens.find(c => c.mint === token.mint);

        let action: 'HOLD' | 'SELL' | 'SWAP' | 'OBSERVE' = 'HOLD';
        let reason = 'Analyzing physics...';
        let isSafe = true;
        let riskScore = 0;

        if (candidate) {
            const pred = candidate.prediction;

            if (pred === 'UP') {
                action = 'HOLD';
                reason = `Momentum positive. Agent holding for growth.`;
                isSafe = true;
                riskScore = 10;
            } else if (pred === 'DOWN') {
                action = 'SELL';
                reason = `Negative momentum. Survival protocol triggered.`;
                isSafe = false;
                riskScore = 80;
            } else {
                action = 'OBSERVE';
                reason = `Sideways volume. Minimal conviction.`;
                isSafe = false;
                riskScore = 50;
            }
        }

        // 3. Execution Pathfinding (The Hands)
        let exitPlan = undefined;

        if ((action === 'SELL' || action === 'SWAP') && token.mint !== SOL_MINT) {
            console.log(`[PortfolioRunner] Evaluating Real EXIT for ${token.symbol}...`);

            // Construct simulated universe for Pathfinder
            const universe: SearchableToken[] = [
                {
                    mint: token.mint,
                    symbol: token.symbol,
                    valueInSOL: (token.price || 0) / solPrice,
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
                ...broadUniverse
            ];

            const goal: BrainGoal = {
                startToken: token.mint,
                targetToken: SOL_MINT,
                startAmountSOL: (position.amount * (token.price || 0)) / solPrice,
                targetAmountSOL: ((position.amount * (token.price || 0)) / solPrice) * 1.01,
                maxHops: 3,
                maxTotalRTL: 10,
                maxPerHopRTL: 5
            };

            try {
                // Find potential routes
                const comparison = await ScenarioRunner.runAll(universe, goal);

                if (comparison.best && comparison.best.found) {
                    // REAL JUPITER QUOTE for the exact balance held
                    // Assumption: amount is in human units, Jupiter needs base units.
                    // For the test, we scale by 1e6 (typical for SOL tokens) or 1e9 locally.
                    const amountRaw = Math.floor(position.amount * 1e6).toString(); // Standard base estimate

                    const liveQuote = await getJupiterQuote({
                        inputMint: token.mint,
                        outputMint: SOL_MINT,
                        amount: amountRaw,
                        slippageBps: 50
                    });

                    if (liveQuote) {
                        const grossSOL = parseFloat(liveQuote.outAmount) / 1e9;
                        const priceImpact = parseFloat(liveQuote.priceImpactPct) || 0;
                        const platformFee = liveQuote.platformFee ? parseFloat(liveQuote.platformFee.amount) / 1e9 : 0;

                        exitPlan = {
                            targetToken: 'SOL',
                            grossSOL,
                            slippagePct: priceImpact,
                            feesSOL: platformFee + 0.000005, // platform + tx fee
                            netSOL: grossSOL - platformFee - 0.000005,
                            routeSummary: `${liveQuote.routePlan.length} hops via Jupiter`,
                            scenarioUsed: comparison.best.config.name
                        };
                    }
                }
            } catch (err) {
                console.error(`[PortfolioRunner] Real quote failed for ${token.symbol}`, err);
            }
        }

        results.push({
            mint: token.mint,
            symbol: token.symbol,
            metrics: {
                price: token.price || 0,
                liquidityUSD: token.liquidityUSD || 0,
                volume5m: token.volume5m || 0,
                volumeState: (token.volume5m || 0) > 2000 ? 'expanding' : (token.volume5m || 0) < 500 ? 'collapsing' : 'stagnant',
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
