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
    ENTER_SCOUTING_THRESHOLD_PCT,
    EXECUTION_THRESHOLD_PCT
} from '@/lib/execution-engine/PositionStateTracker';
import { SnapManager, SnapPool } from '@/lib/execution-engine/SnapManager';

export interface Position {
    mint: string;
    amount: number;
    entryPriceSOL?: number;
    entryTimestamp?: number;      // State machine: when position was entered
    state?: PositionState;        // State machine: current state
    accumulatedLossPct?: number;  // State machine: accumulated loss
    preScoutPrepared?: boolean;   // State machine: pre-scout flag
    snapPool?: SnapPool;          // State machine: Safety Net Asset Pool
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
    logs?: string[];  // UI-visible logs for state machine visibility
    error?: string;
    diagnostic?: string;
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Whitelisted symbols from SafeRotationConfig
const SAFE_SYMBOLS = ['USDC', 'USDT', 'SOL', 'JUP', 'RAY', 'BONK'];

/**
 * Jupiter Quote with Retries
 * Hardens against one-shot quote failure (Risk 2)
 */
async function getJupiterQuoteWithRetries(params: any, retries = 3, delayMs = 500): Promise<any | null> {
    for (let i = 0; i < retries; i++) {
        try {
            const quote = await getJupiterQuote(params);
            if (quote) return quote;
        } catch (err: any) {
            console.warn(`[QuoteRetry] Attempt ${i + 1} failed: ${err.message}`);
            if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs));
        }
    }
    return null;
}

/**
 * Fair Real-World Portfolio Test
 * Strictly deterministic, zero-hindsight.
 */
export async function runPortfolioAnalysis(positions: Position[]): Promise<PortfolioAnalysisResponse> {
    const uiLogs: string[] = [];
    try {
        const mints = positions.map(p => p.mint);
        console.log(`[PortfolioRunner] Starting Fair Test on ${mints.length} mints...`);

        // 1. Fetch Market Truth (The Eyes)
        uiLogs.push(`[SYSTEM] Starting analytical tick...`);
        const marketStartTime = Date.now();
        const [marketData, broadMarketData] = await Promise.all([
            getVirtualPortfolioTokens(mints, uiLogs),
            getDexMatchedTokens(uiLogs)
        ]);
        console.log(`[PortfolioRunner] Market data fetched in ${Date.now() - marketStartTime}ms. Portfolio: ${marketData.length}, Broad: ${broadMarketData.length}`);

        if (marketData.length === 0) {
            uiLogs.push(`[!! BUG] MarketData: No data fetched for portfolio tokens.`);
            return { success: true, results: [], logs: uiLogs };
        }

        const rawSolPrice = marketData.find(m => m.symbol === 'SOL')?.price || 140;
        const solPrice = isFinite(rawSolPrice) && rawSolPrice > 0 ? rawSolPrice : 140;

        // 2. Initialize Agent Physics (The Physics)
        console.log(`[PortfolioRunner] Step 2: Running Physics Engine on ${marketData.length + broadMarketData.length} tokens...`);

        // Combine portfolio and broad market for evaluation
        const evaluationData = [...marketData];
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
        }));

        uiLogs.push(`[SCAN] Physics Engine engaged on ${candidates.length} candidates...`);

        const funnelState = createFunnelState(candidates);
        if (broadMarketData.length === 0) {
            uiLogs.push(`[!! BUG] MarketData: Broad universe is empty. SNAP pre-scouting disabled.`);
        }
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
            let currentFrictionReason: string | undefined = undefined;
            let positionState: PositionState | undefined = undefined;
            let observationRemaining: string | undefined = undefined;
            let exitPlan = null;

            // ============================================================================
            // STATE MACHINE & SNAP LOGIC
            // ============================================================================
            if (isHeld && position) {
                const tokenPrice = token.price && isFinite(token.price) ? token.price : 0;
                const tokenPriceSOL = tokenPrice / solPrice;
                const entryPriceSOL = position.entryPriceSOL || tokenPriceSOL;
                const entryTimestamp = position.entryTimestamp || Date.now();
                const positionValueUSD = position.amount * tokenPrice;

                // CRITICAL Rug Protection: use high liquidity if missing
                const safeLiquidityUSD = (token.liquidityUSD && token.liquidityUSD > 0)
                    ? token.liquidityUSD
                    : Infinity;

                // Create tracked position
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
                    stateEnteredAt: entryTimestamp,
                    snapPool: position.snapPool
                };

                // Evaluate State machine
                const stateResult = evaluatePositionState(trackedPos, tokenPriceSOL, safeLiquidityUSD);

                // SNAP SURVIVAL ENGINE: Pre-arm candidates and quotes
                if (stateResult.newState === 'OBSERVING' || stateResult.newState === 'SCOUTING') {
                    // Trigger refresh if we are in SCOUTING or have a PRE-SCOUT flag
                    const shouldDeepScan = stateResult.newState === 'SCOUTING' || trackedPos.preScoutPrepared;

                    if (shouldDeepScan) {
                        try {
                            // 1. Refresh Pool
                            trackedPos.snapPool = await SnapManager.refreshSNAP(
                                trackedPos.snapPool,
                                evaluationData,
                                positionValueUSD,
                                solPrice,
                                uiLogs
                            );

                            // 2. Pre-fetch Quotes
                            if (trackedPos.snapPool.candidates.length > 0) {
                                await SnapManager.preFetchQuotes(
                                    trackedPos.snapPool,
                                    token.mint,
                                    position.amount,
                                    token.decimals || 6,
                                    solPrice,
                                    uiLogs
                                );

                                if (trackedPos.snapPool.bestCandidate) {
                                    // Log refresh to UI periodically
                                    if (Date.now() % 10000 < 2000) { // Throttle logs
                                        uiLogs.push(`[SNAP] Ready: ${trackedPos.snapPool.bestCandidate.symbol} via ${trackedPos.snapPool.bestCandidate.routeSummary}`);
                                    }
                                }
                            }
                        } catch (err: any) {
                            console.error(`[SNAP] Error refreshing for ${token.symbol}:`, err.message);
                        }
                    }
                }

                // Update Position State
                positionState = stateResult.newState;
                observationRemaining = formatObservationRemaining(trackedPos);

                position.state = stateResult.newState;
                position.accumulatedLossPct = trackedPos.accumulatedLossPct;
                position.entryPriceSOL = entryPriceSOL;
                position.entryTimestamp = entryTimestamp;
                position.snapPool = trackedPos.snapPool;

                // Determine High-Level Action
                if (stateResult.shouldExecute) {
                    action = 'SELL';
                    reason = stateResult.reason;
                    isSafe = false;
                    riskScore = stateResult.isCriticalRug ? 100 : 90;
                    uiLogs.push(`[EXECUTING] ${token.symbol}: Triggering RUTHLESS EXIT | ${stateResult.reason}`);
                } else if (stateResult.shouldCallScenarioRunner) {
                    action = 'OBSERVE';
                    reason = `SCOUTING: ${stateResult.reason}`;
                    isSafe = false;
                    riskScore = 70;
                } else {
                    action = 'HOLD';
                    reason = stateResult.reason;
                    isSafe = stateResult.newState === 'OBSERVING';
                    riskScore = trackedPos.accumulatedLossPct > 0 ? Math.min(50, trackedPos.accumulatedLossPct * 10) : 10;

                    if (stateResult.previousState !== stateResult.newState) {
                        uiLogs.push(`[STATE] ${token.symbol}: → ${stateResult.newState}`);
                    }
                }

                // ============================================================================
                // RUTHLESS EXECUTION (The Hands)
                // ============================================================================
                if (action === 'SELL' && position.amount > 0) {
                    // RANK 1: SNAP FIRE
                    const snapTarget = position.snapPool?.bestCandidate;
                    const isSnapFresh = snapTarget && (Date.now() - snapTarget.lastQuoteTs < 30_000);

                    if (snapTarget && isSnapFresh && snapTarget.quote) {
                        const quote = snapTarget.quote;
                        exitPlan = {
                            targetToken: snapTarget.mint,
                            targetSymbol: snapTarget.symbol,
                            grossSOL: snapTarget.expectedOutSOL,
                            slippagePct: parseFloat(quote.priceImpactPct) || 1.0,
                            feesSOL: 0.000005,
                            netSOL: snapTarget.expectedOutSOL - 0.000005,
                            routeSummary: `SNAP FIRE: ${snapTarget.routeSummary}`,
                            scenarioUsed: 'SNAP_SURVIVAL'
                        };
                        reason = `Ruthless SNAP rotation to ${snapTarget.symbol}`;
                        uiLogs.push(`[SNAP] ✓ FIRE: ${token.symbol} → ${snapTarget.symbol}`);
                    } else {
                        // RANK 2: Emergency SOL Exit
                        try {
                            const amountRaw = Math.floor(position.amount * Math.pow(10, token.decimals || 6)).toString();
                            const liveQuote = await getJupiterQuoteWithRetries({
                                inputMint: token.mint,
                                outputMint: SOL_MINT,
                                amount: amountRaw,
                                slippageBps: 300
                            });

                            if (liveQuote) {
                                const grossSOL = parseFloat(liveQuote.outAmount) / 1e9;
                                exitPlan = {
                                    targetToken: 'SOL',
                                    targetSymbol: 'SOL',
                                    grossSOL: grossSOL,
                                    slippagePct: parseFloat(liveQuote.priceImpactPct) || 0,
                                    feesSOL: 0.000005,
                                    netSOL: grossSOL - 0.000005,
                                    routeSummary: `EMERGENCY: ${liveQuote.routePlan.length} hops to SOL`,
                                    scenarioUsed: 'EMERGENCY_SOL'
                                };
                                uiLogs.push(`[SNAP] ✓ FALLBACK: ${token.symbol} → SOL`);
                            }
                        } catch (err: any) {
                            console.error(`[Execution] Emergency exit failed:`, err.message);
                        }
                    }

                    // RANK 3: Virtual Fallback (Safety net for sim)
                    if (!exitPlan) {
                        const fallbackTokenPrice = token.price && isFinite(token.price) ? token.price : 0;
                        const grossSOL = (position.amount * fallbackTokenPrice) / solPrice;
                        exitPlan = {
                            targetToken: 'SOL',
                            targetSymbol: 'SOL',
                            grossSOL: grossSOL,
                            slippagePct: 1.0,
                            feesSOL: grossSOL * 0.01,
                            netSOL: grossSOL * 0.98,
                            routeSummary: "Virtual Market Execution",
                            scenarioUsed: "VIRTUAL_SIM"
                        };
                    }
                }
            } else if (candidate) {
                // Discovery Logic
                const pred = candidate.prediction;
                if (pred === 'UP') {
                    action = 'BUY';
                    reason = `Momentum surge detected.`;
                    isSafe = true;
                    riskScore = 10;
                } else {
                    action = 'OBSERVE';
                    reason = pred === 'DOWN' ? `Decaying momentum.` : `Sideways.`;
                    isSafe = false;
                    riskScore = pred === 'DOWN' ? 80 : 50;
                }
            }

            // Pack Result
            const analysisResult: PortfolioAnalysisResult = {
                mint: token.mint,
                symbol: token.symbol,
                decimals: token.decimals || 6,
                metrics: {
                    price: token.price && isFinite(token.price) ? token.price : 0,
                    liquidityUSD: token.liquidityUSD && isFinite(token.liquidityUSD) ? token.liquidityUSD : 0,
                    volume5m: token.volume5m && isFinite(token.volume5m) ? token.volume5m : 0,
                    volumeState: (token.volume5m || 0) > 2000 ? 'expanding' : (token.volume5m || 0) < 500 ? 'collapsing' : 'stagnant',
                    riskLevel: token.riskLevel as VolumeRiskLevel
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

        console.log(`[PortfolioRunner] Analysis complete. Portfolio: ${portfolioResults.length}, Gems: ${discoveryResults.length}`);

        if (discoveryResults.length > 0) {
            uiLogs.push(`[SCAN] Found ${discoveryResults.length} gems passing physics filters.`);
        } else {
            uiLogs.push(`[SCAN] No high-conviction gems identified this tick.`);
        }

        return {
            success: true,
            results: portfolioResults,
            discoveryResults: discoveryResults.slice(0, 5),
            logs: uiLogs
        };
    } catch (globalErr: any) {
        console.error(`[PortfolioRunner] CRITICAL GLOBAL ERROR:`, globalErr);
        return {
            success: false,
            error: globalErr.message || 'Unknown Server Error',
            diagnostic: globalErr.stack,
            logs: uiLogs
        };
    }
}
