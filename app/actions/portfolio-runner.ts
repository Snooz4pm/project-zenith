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
import { fetchJupiterTokens, JupiterToken as JupToken } from '@/lib/market-observer/JupiterDexMerger';
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
import {
    LifecyclePhase,
    evaluateObserving,
    calculateSeedSize,
    recordCapitalMovement,
    DEFAULT_LIFECYCLE_CONFIG
} from '@/lib/execution-engine/CapitalLifecycleManager';

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

/**
 * Simulation: Active Threat Injection
 */
export interface SimulationThreat {
    mint: string;
    impactPct: number; // e.g., -95 for a 95% price crash
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
        state?: PositionState;
        accumulatedLossPct?: number;
        riskScore: number;
        isSafe: boolean;
        observationRemaining?: string;
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
    roadmap?: any; // BrainRoadmap from ScenarioRunner
}

export interface PortfolioAnalysisResponse {
    success: boolean;
    results?: PortfolioAnalysisResult[];
    discoveryResults?: PortfolioAnalysisResult[];
    globalRoadmaps?: any[]; // Array of BrainRoadmap
    logs?: string[];  // UI-visible logs for state machine visibility
    error?: string;
    diagnostic?: string;
}

/**
 * Server Action: Fetch Jupiter Token Metadata
 * Used by the frontend to enrich wallet holdings without client-side DNS issues.
 */
export async function getMetadata(): Promise<JupToken[]> {
    try {
        return await fetchJupiterTokens();
    } catch (err) {
        console.error('[MetadataAction] Failed:', err);
        return [];
    }
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
export async function runPortfolioAnalysis(
    positions: Position[],
    activeThreats: SimulationThreat[] = []
): Promise<PortfolioAnalysisResponse> {
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
        console.log(`[DISCOVERY_DEBUG] Raw Broad Mkt Tokens: ${broadMarketData.length}`);
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

        // 3. CAPTURE CLEAN PRICES (Before Simulation Chaos)
        // This prevents baseline corruption when initializing entry prices
        const cleanPrices = new Map<string, number>();
        for (const t of evaluationData) {
            cleanPrices.set(t.mint, t.price || 0);
        }

        // --- SIMULATION: Apply Synthetic Threats (The Chaos) ---
        for (const threat of activeThreats) {
            const target = evaluationData.find(t => t.mint === threat.mint);
            if (target) {
                const multiplier = (1 + threat.impactPct / 100);
                target.price = (target.price || 0) * multiplier;

                // If it's a severe rug, also drain the liquidity visually for the state machine
                if (threat.impactPct <= -80) {
                    target.liquidityUSD = Math.min(target.liquidityUSD || 0, 500);
                }
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

        // Initialize Quote Budget (To prevent overwhelming RPC)
        const quoteBudget = { remaining: 15 };

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

                // Sync baseline using clean prices if unavailable (Simulation hardening)
                const cleanPrice = cleanPrices.get(position.mint) || tokenPrice;
                const cleanPriceSOL = cleanPrice / solPrice;

                const entryPriceSOL = position.entryPriceSOL || cleanPriceSOL;
                const entryTimestamp = position.entryTimestamp || Date.now();
                const safeLiquidityUSD = (token.liquidityUSD && token.liquidityUSD > 0) ? token.liquidityUSD : Infinity;

                const isStub = token.pairAddress === 'STUB_MISSING_DATA';

                // Initialize TrackedPosition for state machine
                const trackedPos: TrackedPosition = {
                    mint: token.mint,
                    symbol: token.symbol,
                    amount: position.amount,
                    entryTimestamp,
                    entryPriceSOL,
                    currentPriceSOL: tokenPriceSOL,
                    currentLiquidityUSD: safeLiquidityUSD === Infinity ? 0 : safeLiquidityUSD, // Clean up Infinity
                    smoothedPnLPct: 0,
                    accumulatedLossPct: position.accumulatedLossPct || 0,
                    state: position.state || 'OBSERVING',
                    stateEnteredAt: entryTimestamp,
                    snapPool: position.snapPool
                };

                // DATA INTEGRITY GUARD: If it's a stub or 0 price, we don't calculate PnL exits
                let stateResult: StateTransitionResult;
                if (isStub || tokenPrice === 0) {
                    currentFrictionReason = "MARKET_DATA_OFFLINE";
                    stateResult = {
                        previousState: trackedPos.state,
                        newState: trackedPos.state,
                        reason: isStub ? "Waiting for DexScreener index..." : "Price feed unresponsive",
                        action: 'HOLD',
                        shouldCallScenarioRunner: false,
                        shouldExecute: false,
                        isCriticalRug: false
                    };
                } else {
                    stateResult = evaluatePositionState(trackedPos, tokenPriceSOL, safeLiquidityUSD);
                }

                // SNAP SURVIVAL ENGINE: Pre-arm candidates and quotes
                if (stateResult.newState === 'OBSERVING' || stateResult.newState === 'SCOUTING') {
                    const shouldDeepScan = stateResult.newState === 'SCOUTING' || position.preScoutPrepared;

                    if (shouldDeepScan) {
                        try {
                            const posValueUSD = position.amount * tokenPrice;

                            // 1. Refresh Pool
                            trackedPos.snapPool = await SnapManager.refreshSNAP(
                                trackedPos.snapPool,
                                evaluationData,
                                posValueUSD,
                                solPrice,
                                uiLogs
                            );

                            // 2. Pre-fetch Quotes
                            if (trackedPos.snapPool.candidates.length > 0) {
                                await SnapManager.preFetchQuotes(
                                    trackedPos.snapPool,
                                    solPrice,
                                    quoteBudget,
                                    uiLogs
                                );
                                // Save back to ref-like structure for pack
                                position.snapPool = trackedPos.snapPool;
                            }
                        } catch (err: any) {
                            console.error(`[SNAP] Pre-scout fail for ${token.symbol}:`, err.message);
                        }
                    }
                }

                // Update Local Scoping for Pack Result
                positionState = stateResult.newState;
                observationRemaining = formatObservationRemaining(trackedPos);
                token.accumulatedLossPct = trackedPos.accumulatedLossPct;

                // Sync back to the positions array (passed to pack)
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

                    // DYNAMIC RISK SCORING: Use Dexter's risk assessment if available
                    // Otherwise default to high (50) for unassessed CHAOS gems
                    riskScore = token.riskScore || 50;
                    isSafe = riskScore <= 30;

                    // === FOUNDED GEM: LIFECYCLE PROMOTION ===
                    // This token qualifies for the Capital Lifecycle
                    uiLogs.push(`[LIFECYCLE] Founded Gem: ${token.symbol} | Triggering OBSERVING phase`);
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
                    state: positionState,
                    accumulatedLossPct: isHeld ? token.accumulatedLossPct : undefined,
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
            const tiers = {
                safe: discoveryResults.filter(g => g.verdict.riskScore <= 30).length,
                medium: discoveryResults.filter(g => g.verdict.riskScore > 30 && g.verdict.riskScore <= 65).length,
                meme: discoveryResults.filter(g => g.verdict.riskScore > 65).length
            };
            console.log(`[DISCOVERY_DEBUG] Risk Distribution: SAFE=${tiers.safe}, MEDIUM=${tiers.medium}, MEME=${tiers.meme}`);
            uiLogs.push(`[SCAN] Found ${discoveryResults.length} gems | Distribution: S:${tiers.safe} M:${tiers.medium} T:${tiers.meme}`);
        } else {
            console.log(`[DISCOVERY_DEBUG] No gems passed physics filters.`);
            uiLogs.push(`[SCAN] No high-conviction gems identified this tick.`);
        }

        // ============================================================================
        // 5. STRATEGIC REBALANCE HUB: Multi-Hop Roadmap Generation
        // ============================================================================
        const globalRoadmaps: any[] = [];
        uiLogs.push(`[BRAIN] Running Strategic Roadmap simulations...`);

        // Prepare Universe for ScenarioRunner
        const universe: SearchableToken[] = evaluationData.map(t => ({
            mint: t.mint,
            symbol: t.symbol,
            valueInSOL: (t.price || 0) / solPrice,
            roundTripLoss: (t.slippagePct || 1) * 2, // Estimate RTL
            hasRoute: true,
            liquidityScore: Math.min(1, (t.liquidityUSD || 0) / 100000),
            isStable: ['USDC', 'USDT'].includes(t.symbol),
            isAlpha: (t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL'),
            tier: (t.liquidityUSD || 0) > 50000 ? 'SAFE' : 'RANKABLE'
        }));

        for (const res of portfolioResults) {
            if (res.verdict.action === 'SELL' || res.verdict.action === 'SWAP') {
                // Find a target gem for rotation (highest volume/momentum gem)
                const targetGem = discoveryResults[0];
                if (!targetGem) continue;

                const goal: BrainGoal = {
                    startToken: res.mint,
                    targetToken: targetGem.mint,
                    startAmountSOL: (res.metrics.price * res.decimals) / solPrice, // Using unit for ratio
                    targetAmountSOL: ((res.metrics.price * res.decimals) / solPrice) * 1.1, // Seek 10% improvement
                    maxHops: 5,
                    maxTotalRTL: 10,
                    maxPerHopRTL: 4
                };

                try {
                    const comparison = await ScenarioRunner.runAll(universe, goal);
                    if (comparison.best && comparison.best.found) {
                        res.roadmap = comparison.best.roadmap;
                        globalRoadmaps.push(comparison.best.roadmap);
                        uiLogs.push(`[BRAIN] Roadmap secured: ${res.symbol} → ${targetGem.symbol} via ${comparison.best.config.name}`);
                    }
                } catch (err) {
                    console.error(`[Brain] Roadmap fail for ${res.symbol}:`, err);
                }
            }
        }

        return {
            success: true,
            results: portfolioResults,
            discoveryResults: discoveryResults.slice(0, 20),
            globalRoadmaps,
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
