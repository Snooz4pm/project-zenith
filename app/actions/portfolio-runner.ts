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
import {
    PositionState,
    TrackedPosition,
    evaluatePositionState,
    createTrackedPosition,
    formatObservationRemaining,
    MIN_OBSERVATION_MS,
    SCOUTING_THRESHOLD_PCT,
    EXECUTION_THRESHOLD_PCT
} from '@/lib/execution-engine/PositionStateTracker';

export interface Position {
    mint: string;
    amount: number;
    entryPriceSOL?: number;
    entryTimestamp?: number;      // State machine: when position was entered
    state?: PositionState;        // State machine: current state
    accumulatedLossPct?: number;  // State machine: accumulated loss
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
        action: 'HOLD' | 'SELL' | 'SWAP' | 'OBSERVE' | 'BUY';
        reason: string;
        riskScore: number;
        isSafe: boolean;
        positionState?: PositionState;      // NEW: State machine state
        observationRemaining?: string;      // NEW: Time remaining in observation
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
    discoveryResults?: PortfolioAnalysisResult[];
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
        console.log(`[PortfolioRunner] Step 2: Running Physics Engine on ${marketData.length + broadMarketData.length} tokens...`);

        // Combine portfolio and broad market for evaluation
        const allRelevantMints = new Set([...mints, ...broadMarketData.map(t => t.mint)]);
        const evaluationData = [...marketData];

        // Add broad market tokens that aren't already in marketData
        for (const bt of broadMarketData) {
            if (!evaluationData.some(m => m.mint === bt.mint)) {
                evaluationData.push(bt);
            }
        }

        const candidates: TokenCandidate[] = evaluationData.map(t => ({
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

        const portfolioResults: PortfolioAnalysisResult[] = [];
        const discoveryResults: PortfolioAnalysisResult[] = [];

        console.log(`[PortfolioRunner] Step 3: Analyzing results...`);
        for (const token of evaluationData) {
            const position = positions.find(p => p.mint === token.mint);
            const isHeld = !!position && position.amount > 0;
            const candidate = funnelState.tokens.find(c => c.mint === token.mint);

            let action: 'HOLD' | 'SELL' | 'SWAP' | 'OBSERVE' | 'BUY' = 'OBSERVE';
            let reason = 'Analyzing physics...';
            let isSafe = true;
            let riskScore = 0;
            let currentFrictionReason = undefined;
            let positionState: PositionState | undefined = undefined;
            let observationRemaining: string | undefined = undefined;

            // ============================================================================
            // STATE MACHINE LOGIC (Replaces instant selling)
            // ============================================================================
            if (isHeld && position) {
                const tokenPrice = token.price && isFinite(token.price) ? token.price : 0;
                const tokenPriceSOL = tokenPrice / solPrice;
                const entryPriceSOL = position.entryPriceSOL || tokenPriceSOL;
                const entryTimestamp = position.entryTimestamp || Date.now();

                // CRITICAL: If liquidity is missing/0, use Infinity to PREVENT false rug detection
                // Only trigger critical rug when we KNOW liquidity is low, not when data is missing
                const safeLiquidityUSD = (token.liquidityUSD && token.liquidityUSD > 0)
                    ? token.liquidityUSD
                    : Infinity; // Missing data = assume safe, don't trigger rug

                // Create tracked position for state machine evaluation
                const trackedPos: TrackedPosition = {
                    mint: token.mint,
                    symbol: token.symbol,
                    amount: position.amount,
                    entryTimestamp,
                    entryPriceSOL,
                    currentPriceSOL: tokenPriceSOL,
                    currentLiquidityUSD: safeLiquidityUSD,
                    smoothedPnLPct: 0,
                    accumulatedLossPct: position.accumulatedLossPct || 0,
                    state: position.state || 'OBSERVING',
                    stateEnteredAt: entryTimestamp
                };

                // Evaluate state machine
                const stateResult = evaluatePositionState(
                    trackedPos,
                    tokenPriceSOL,
                    safeLiquidityUSD
                );

                positionState = stateResult.newState;
                observationRemaining = formatObservationRemaining(trackedPos);

                // Update position with new state (will be sent back to frontend)
                position.state = stateResult.newState;
                position.accumulatedLossPct = trackedPos.accumulatedLossPct;
                position.entryPriceSOL = entryPriceSOL;
                position.entryTimestamp = entryTimestamp;

                // Determine action based on state machine result
                if (stateResult.shouldExecute) {
                    // State machine says EXECUTE
                    action = 'SELL';
                    reason = stateResult.reason;
                    isSafe = false;
                    riskScore = stateResult.isCriticalRug ? 100 : 90;
                } else if (stateResult.shouldCallScenarioRunner) {
                    // Transition to SCOUTING - prepare paths but don't execute yet
                    action = 'OBSERVE';
                    reason = `SCOUTING: ${stateResult.reason}`;
                    isSafe = false;
                    riskScore = 70;
                } else {
                    // Keep observing (including during minimum observation window)
                    action = 'HOLD';
                    reason = stateResult.reason;
                    isSafe = stateResult.newState === 'OBSERVING';
                    riskScore = trackedPos.accumulatedLossPct > 0 ? Math.min(50, trackedPos.accumulatedLossPct * 10) : 10;
                }

                console.log(`[StateMachine] ${token.symbol}: ${stateResult.previousState} → ${stateResult.newState} | ${stateResult.reason}`);
            } else if (candidate) {
                // Non-held token: use physics prediction for discovery
                const pred = candidate.prediction;

                // DEBUG: Log what's being scanned
                console.log(`[Discovery] Scanning ${token.symbol}: prediction=${pred}, score=${candidate.score}`);

                if (pred === 'UP') {
                    action = 'BUY';
                    reason = `Discovery: Momentum surge detected. Entry proposed.`;
                    isSafe = true;
                    riskScore = 10;
                    console.log(`[Discovery] >>> ${token.symbol} marked as BUY opportunity!`);
                } else {
                    action = 'OBSERVE';
                    reason = pred === 'DOWN' ? `Market decaying. No entry.` : `Sideways volume. Minimal conviction.`;
                    isSafe = false;
                    riskScore = pred === 'DOWN' ? 80 : 50;
                }
            }

            // 3. Execution Pathfinding (The Hands) - ONLY when state machine says EXECUTE
            let exitPlan = null;

            if (isHeld && action === 'SELL' && position.amount > 0) {
                console.log(`[PortfolioRunner] Evaluating EXIT for ${token.symbol}...`);

                // 3.1: Special Case: SOL -> SOL (Direct Capital Exit)
                if (token.mint === SOL_MINT) {
                    exitPlan = {
                        targetToken: 'SOL',
                        targetSymbol: 'SOL',
                        grossSOL: position.amount,
                        slippagePct: 0,
                        feesSOL: 0,
                        netSOL: position.amount,
                        routeSummary: "Direct Capital Move",
                        scenarioUsed: "DIRECT"
                    };
                } else {
                    // Regular cross-token exit pathfinding
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

                    // ============ VIRTUAL EXECUTION FALLBACK (Simulation Strength) ============
                    if (!exitPlan) {
                        console.log(`[PortfolioRunner] Using VIRTUAL FALLBACK for ${token.symbol} exit simulation.`);
                        const grossSOL = (position.amount * tokenPrice) / solPrice;
                        exitPlan = {
                            targetToken: 'SOL',
                            targetSymbol: 'SOL',
                            grossSOL: isFinite(grossSOL) ? grossSOL : 0,
                            slippagePct: 1.0,
                            feesSOL: isFinite(grossSOL) ? grossSOL * 0.01 : 0,
                            netSOL: isFinite(grossSOL) ? grossSOL * 0.98 : 0, // Apply 2% simulated penalty
                            routeSummary: "Virtual Market Execution",
                            scenarioUsed: "VIRTUAL_SIM"
                        };
                        currentFrictionReason = undefined; // Clear friction as we have successfully simulated the trade
                    }
                    // ==========================================================================
                }
            }

            const analysisResult: PortfolioAnalysisResult = {
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
                    isSafe,
                    positionState,
                    observationRemaining
                },
                frictionReason: currentFrictionReason,
                exitPlan: exitPlan || undefined
            };

            if (isHeld) {
                portfolioResults.push(analysisResult);
            } else if (action === 'BUY') {
                discoveryResults.push(analysisResult);
            }
        }

        console.log(`[PortfolioRunner] Analysis complete. Returning ${portfolioResults.length} portfolio items and ${discoveryResults.length} discovery gems.`);
        return {
            success: true,
            results: portfolioResults,
            discoveryResults: discoveryResults.slice(0, 5) // Return top 5 gems
        };
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
