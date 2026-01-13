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
    decimals: number;
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
    frictionReason?: string;
    exitPlan?: {
        targetToken: string;
        targetSymbol: string;
        grossSOL: number;
        slippagePct: number;
        feesSOL: number;
        netSOL: number;
        routeSummary: string;
        scenarioUsed: string;
    };
}

export interface PortfolioAnalysisResponse {
    success: boolean;
    results?: PortfolioAnalysisResult[];
    error?: string;
    diagnostic?: string;
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * Fair Real-World Portfolio Test
 * Strictly deterministic, zero-hindsight.
 */
export async function runPortfolioAnalysis(positions: Position[]): Promise<PortfolioAnalysisResponse> {
    try {
        const mints = positions.map(p => p.mint);
        console.log(`[PortfolioRunner] Starting Fair Test on ${mints.length} mints...`);

        // 1. Fetch Market Truth (The Eyes)
        console.log(`[PortfolioRunner] Step 1: Fetching market data...`);
        const marketStartTime = Date.now();
        const [marketData, broadMarketData] = await Promise.all([
            getVirtualPortfolioTokens(mints),
            getDexMatchedTokens()
        ]);
        console.log(`[PortfolioRunner] Market data fetched in ${Date.now() - marketStartTime}ms. Portfolio: ${marketData.length}, Broad: ${broadMarketData.length}`);

        if (marketData.length === 0) {
            console.warn(`[PortfolioRunner] No market data found for portfolio tokens.`);
            return { success: true, results: [] };
        }

        const rawSolPrice = marketData.find(m => m.symbol === 'SOL')?.price || 140;
        const solPrice = isFinite(rawSolPrice) && rawSolPrice > 0 ? rawSolPrice : 140;

        // Build the "Agent's Vision" (Broad Universe)
        const broadUniverse: SearchableToken[] = broadMarketData.map(t => ({
            mint: t.mint,
            symbol: t.symbol,
            valueInSOL: (t.price && isFinite(t.price) ? t.price : 0) / solPrice,
            hasRoute: true,
            isStable: ['USDC', 'USDT', 'PYUSD'].includes(t.symbol),
            tier: t.riskLevel === 'LOW' ? 'SAFE' : 'RANKABLE',
            liquidityScore: 1,
            volatility: t.riskLevel === 'HIGH' ? 0.8 : 0.2,
            alphaScore: 0,
            source: undefined,
            roundTripLoss: 0,
            isAlpha: t.riskLevel !== 'LOW'
        }));

        // Ensure SOL is in the vision (it's the exit target)
        if (!broadUniverse.some(u => u.mint === SOL_MINT)) {
            broadUniverse.push({
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
            });
        }

        // 2. Initialize Agent Physics (The Physics)
        console.log(`[PortfolioRunner] Step 2: Running Physics Engine...`);
        const candidates: TokenCandidate[] = marketData.map(t => ({
            symbol: t.symbol,
            mint: t.mint,
            tokenClass: classifyToken(t.symbol, t.mint),
            priceAtStart: t.price && isFinite(t.price) ? t.price : 0,
            score: 0,
            flatStreak: 0
        }));

        const funnelState = createFunnelState(candidates);

        // Run Pillar 10 Logic (Newtonian momentum + Brain v2 Memory)
        await predictFunnel(funnelState);

        const results: PortfolioAnalysisResult[] = [];

        console.log(`[PortfolioRunner] Step 3: Analyzing results and finding exits...`);
        for (const token of marketData) {
            const position = positions.find(p => p.mint === token.mint);
            if (!position) continue;

            const candidate = funnelState.tokens.find(c => c.mint === token.mint);

            let action: 'HOLD' | 'SELL' | 'SWAP' | 'OBSERVE' = 'HOLD';
            let reason = 'Analyzing physics...';
            let isSafe = true;
            let riskScore = 0;
            let currentFrictionReason = undefined;

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
            let exitPlan = null;

            if ((action === 'SELL' || action === 'SWAP') && token.mint !== SOL_MINT && position.amount > 0) {
                console.log(`[PortfolioRunner] Evaluating Real EXIT for ${token.symbol}...`);

                const tokenPrice = token.price && isFinite(token.price) ? token.price : 0;
                const universe: SearchableToken[] = [
                    {
                        mint: token.mint,
                        symbol: token.symbol,
                        valueInSOL: tokenPrice / solPrice,
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
                    startAmountSOL: (position.amount * tokenPrice) / solPrice,
                    targetAmountSOL: 0.000001, // Zero-friction: Accept any exit amount
                    maxHops: 10,               // Increase hops for deep liquidity discovery
                    maxTotalRTL: 100,         // Unbounded loss tolerance for exits
                    maxPerHopRTL: 100         // Unbounded loss tolerance for exits
                };

                try {
                    const comparison = await ScenarioRunner.runAll(universe, goal);

                    if (comparison.best && comparison.best.found) {
                        const amountRaw = Math.floor(position.amount * Math.pow(10, token.decimals || 6)).toString();

                        const liveQuote = await getJupiterQuote({
                            inputMint: token.mint,
                            outputMint: SOL_MINT,
                            amount: amountRaw,
                            slippageBps: 200 // Higher slippage tolerance for "Do whatever you want" mode
                        });

                        if (liveQuote) {
                            const grossSOL = parseFloat(liveQuote.outAmount) / 1e9;
                            const priceImpact = parseFloat(liveQuote.priceImpactPct) || 0;
                            const platformFee = liveQuote.platformFee ? parseFloat(liveQuote.platformFee.amount) / 1e9 : 0;

                            exitPlan = {
                                targetToken: 'SOL',
                                targetSymbol: 'SOL',
                                grossSOL: isFinite(grossSOL) ? grossSOL : 0,
                                slippagePct: isFinite(priceImpact) ? priceImpact : 0,
                                feesSOL: isFinite(platformFee) ? platformFee + 0.000005 : 0.000005,
                                netSOL: isFinite(grossSOL) ? grossSOL - platformFee - 0.000005 : 0,
                                routeSummary: `${liveQuote.routePlan.length} hops via Jupiter`,
                                scenarioUsed: comparison.best.config.name
                            };
                        }
                    } else {
                        // FALLBACK: Brute force direct quote if pathfinder fails
                        console.log(`[PortfolioRunner] Pathfinder failed for ${token.symbol}. Attempting BRUTE FORCE exit...`);
                        const amountRaw = Math.floor(position.amount * Math.pow(10, token.decimals || 6)).toString();
                        const directQuote = await getJupiterQuote({
                            inputMint: token.mint,
                            outputMint: SOL_MINT,
                            amount: amountRaw,
                            slippageBps: 500 // 5% slippage tolerance for emergency exit
                        });

                        if (directQuote) {
                            const grossSOL = parseFloat(directQuote.outAmount) / 1e9;
                            exitPlan = {
                                targetToken: 'SOL',
                                targetSymbol: 'SOL',
                                grossSOL: isFinite(grossSOL) ? grossSOL : 0,
                                slippagePct: parseFloat(directQuote.priceImpactPct) || 0,
                                feesSOL: 0.000005,
                                netSOL: isFinite(grossSOL) ? grossSOL - 0.000005 : 0,
                                routeSummary: "Direct Jupiter Fallback",
                                scenarioUsed: "BRUTE_FORCE"
                            };
                        } else {
                            currentFrictionReason = "Jupiter API refused even a direct high-slippage quote.";
                        }
                    }
                } catch (err: any) {
                    console.error(`[PortfolioRunner] Real quote failed for ${token.symbol}`, err);
                    currentFrictionReason = err.message || "Jupiter Quote Failed";
                }
            }

            results.push({
                mint: token.mint,
                symbol: token.symbol,
                decimals: token.decimals || 6,
                metrics: {
                    price: token.price && isFinite(token.price) ? token.price : 0,
                    liquidityUSD: token.liquidityUSD && isFinite(token.liquidityUSD) ? token.liquidityUSD : 0,
                    volume5m: token.volume5m && isFinite(token.volume5m) ? token.volume5m : 0,
                    volumeState: (token.volume5m || 0) > 2000 ? 'expanding' : (token.volume5m || 0) < 500 ? 'collapsing' : 'stagnant',
                    riskLevel: token.riskLevel
                },
                verdict: {
                    action,
                    reason,
                    riskScore,
                    isSafe
                },
                frictionReason: currentFrictionReason,
                exitPlan: exitPlan || undefined
            });
        }

        console.log(`[PortfolioRunner] Analysis complete. Returning ${results.length} results.`);
        return { success: true, results };
    } catch (globalErr: any) {
        console.error(`[PortfolioRunner] CRITICAL GLOBAL ERROR:`, globalErr);
        // Do not throw, return safe object to avoid Next.js production masking
        return {
            success: false,
            error: globalErr.message || 'Unknown Server Error',
            diagnostic: globalErr.stack
        };
    }
}
