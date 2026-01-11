/**
 * POST /api/backtest/brutal
 *
 * ✅ REAL Brain v2 Simulation - NO MOCK DATA
 * Uses actual Brain v2 search logic with live token universe
 */

import { BrutalBrainSimulation } from '@/lib/smartswap/simulation/BrutalSimulation';
import { DecisionIntent } from '@/lib/smartswap/simulation/types';
import { searchForPath } from '@/lib/smartswap/brainv2';
import { SearchableToken, BrainGoal } from '@/types/BrainV2';
import { SmartToken } from '@/types/SmartToken';

export const dynamic = 'force-dynamic';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

// ============================================================================
// REAL TOKEN UNIVERSE - NO MOCK DATA
// ============================================================================

/**
 * ✅ Fetch REAL token universe from the same source Brain v2 uses
 * This ensures simulation uses actual market data
 */
async function fetchRealUniverse(): Promise<SearchableToken[]> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Step 1: Fetch token list
        console.log('[Backtest] Step 1: Fetching token list...');
        const tokensResponse = await fetch(`${baseUrl}/api/smart-swap/tokens`);

        if (!tokensResponse.ok) {
            throw new Error(`Failed to fetch tokens: ${tokensResponse.status}`);
        }

        const tokensData = await tokensResponse.json();
        const rawTokens = tokensData.tokens || [];

        if (rawTokens.length === 0) {
            throw new Error('No tokens available');
        }

        console.log(`[Backtest] Loaded ${rawTokens.length} raw tokens`);

        // Step 2: Valuate tokens (get SOL values and routes)
        console.log('[Backtest] Step 2: Valuating tokens...');
        const valuateResponse = await fetch(`${baseUrl}/api/smart-swap/valuate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tokens: rawTokens.slice(0, 100).map((t: any) => ({
                    mint: t.address,
                    decimals: t.decimals || 6,
                })),
            }),
        });

        if (!valuateResponse.ok) {
            throw new Error(`Failed to valuate tokens: ${valuateResponse.status}`);
        }

        const valuateData = await valuateResponse.json();
        const results = valuateData.results || [];

        // Step 3: Merge valuation results with token data
        const tokens: SmartToken[] = results.map((valuation: any) => {
            const rawToken = rawTokens.find((t: any) => t.address === valuation.mint);
            return {
                mint: valuation.mint,
                symbol: rawToken?.symbol || 'UNKNOWN',
                name: rawToken?.name || 'Unknown Token',
                decimals: valuation.decimals || rawToken?.decimals || 6,
                valueInSOL: valuation.valueInSOL,
                priceImpactPct: valuation.priceImpactPct,
                hasRoute: valuation.hasRoute,
                canReverse: valuation.canReverse,
                roundTripLoss: valuation.roundTripLoss,
                safeTier: valuation.safeTier,
                alphaScore: valuation.alphaScore,
            };
        });

        // Convert to SearchableToken format (same transformation as Brain v2 API)
        const searchableTokens: SearchableToken[] = tokens.map(token => ({
            mint: token.mint,
            symbol: token.symbol,
            valueInSOL: token.valueInSOL ?? 0,
            roundTripLoss: token.roundTripLoss ?? 99,
            hasRoute: token.hasRoute ?? false,
            liquidityScore: token.hasRoute ? 0.5 : 0,
            alphaScore: token.alphaScore,
            volatility: token.roundTripLoss ? token.roundTripLoss / 50 : 0,
            isStable: ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'FRAX'].includes(token.symbol.toUpperCase()),
            isAlpha: Boolean(
                (token.alphaScore && token.alphaScore > 0.5) ||
                (token.safeTier === 'RANKABLE' && token.alphaScore && token.alphaScore > 0.3) ||
                (token.roundTripLoss && token.roundTripLoss > 5 && token.roundTripLoss < 15)
            ),
            tier: token.safeTier ?? 'REJECTED',
        }));

        console.log(`[Backtest] Loaded ${searchableTokens.length} tokens from real universe`);
        const safeCount = searchableTokens.filter(t => t.tier === 'SAFE').length;
        const alphaCount = searchableTokens.filter(t => t.isAlpha).length;
        console.log(`[Backtest]   • ${safeCount} SAFE tokens`);
        console.log(`[Backtest]   • ${alphaCount} ALPHA candidates`);

        return searchableTokens;
    } catch (error) {
        console.error('[Backtest] CRITICAL: Failed to fetch real universe:', error);
        throw new Error('Cannot run simulation without real token data');
    }
}

// Cache universe for simulation (refresh every 5 minutes)
let cachedUniverse: SearchableToken[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getUniverse(): Promise<SearchableToken[]> {
    const now = Date.now();
    if (cachedUniverse && (now - cacheTimestamp) < CACHE_TTL) {
        return cachedUniverse;
    }

    cachedUniverse = await fetchRealUniverse();
    cacheTimestamp = now;
    return cachedUniverse;
}

// ============================================================================
// REAL BRAIN V2 DECISION FUNCTION
// ============================================================================

// Pre-load universe cache
let universePromise: Promise<SearchableToken[]> | null = null;

function ensureUniverseLoaded() {
    if (!universePromise) {
        universePromise = getUniverse();
    }
}

/**
 * ✅ REAL Brain v2 Integration - SYNCHRONOUS
 * Uses actual searchForPath with real token universe
 */
function realBrainV2(state: any): DecisionIntent & { action: any; toToken?: string } {
    // Get cached universe (must be pre-loaded)
    if (!cachedUniverse) {
        throw new Error('Universe not loaded - call ensureUniverseLoaded() first');
    }
    const universe = cachedUniverse;

    const isHoldingSOL = state.token === 'SOL';
    const currentAmountSOL = state.balanceSOL; // Portfolio value in SOL

    // ============================================
    // DETERMINE GOAL
    // ============================================

    let goal: BrainGoal;

    if (isHoldingSOL) {
        // OPPORTUNITY SCANNING: Pick high-alpha targets
        const alphaTargets = universe.filter(t =>
            t.isAlpha &&
            t.mint !== SOL_MINT &&
            t.hasRoute &&
            t.tier !== 'REJECTED'
        );

        if (alphaTargets.length === 0) {
            return {
                action: 'HESITATE',
                thesis: 'No viable alpha targets in current universe',
                signals: {},
                expectedDirection: 'NEUTRAL',
                confidence: 0.2,
                invalidationRules: ['No alpha tokens available'],
            };
        }

        // Pick random alpha target (simulate opportunity scanning)
        const randomTarget = alphaTargets[Math.floor(Math.random() * alphaTargets.length)];

        goal = {
            startToken: SOL_MINT,
            targetToken: randomTarget.mint,
            startAmountSOL: currentAmountSOL,
            targetAmountSOL: currentAmountSOL * 1.05, // Aim for 5% gain
            maxHops: 3,
            maxTotalRTL: 5,
            maxPerHopRTL: 2,
        };

        console.log(`[Brain] Scanning: SOL → ${randomTarget.symbol} (target +5%)`);
    } else {
        // EXIT STRATEGY: Path back to SOL
        const currentTokenData = universe.find(t => t.symbol === state.token);

        if (!currentTokenData) {
            return {
                action: 'HESITATE',
                thesis: `Cannot find ${state.token} in universe`,
                signals: {},
                expectedDirection: 'NEUTRAL',
                confidence: 0,
                invalidationRules: ['Token not in universe'],
            };
        }

        goal = {
            startToken: currentTokenData.mint,
            targetToken: SOL_MINT,
            startAmountSOL: currentAmountSOL,
            targetAmountSOL: currentAmountSOL, // Any profitable exit
            maxHops: 3,
            maxTotalRTL: 5,
            maxPerHopRTL: 2,
        };

        console.log(`[Brain] Exiting: ${state.token} → SOL`);
    }

    // ============================================
    // RUN REAL BRAIN V2 SEARCH
    // ============================================

    const searchResult = searchForPath(universe, goal);

    // ============================================
    // INTERPRET RESULT
    // ============================================

    if (!searchResult.found) {
        return {
            action: 'HESITATE',
            thesis: `Brain v2: ${searchResult.reason}`,
            signals: {},
            expectedDirection: 'NEUTRAL',
            confidence: 0,
            invalidationRules: [searchResult.reason],
        };
    }

    const path = searchResult.path;
    const firstHop = path.path[0];

    if (!firstHop) {
        return {
            action: 'HESITATE',
            thesis: 'Brain found path but no hops',
            signals: {},
            expectedDirection: 'NEUTRAL',
            confidence: 0,
            invalidationRules: ['Empty path'],
        };
    }

    // ✅ Check for HOLD recommendation (using correct field)
    if (path.holdCheckpoint) {
        const hold = path.holdCheckpoint;
        return {
            action: 'HOLD',
            thesis: `Brain v2 HOLD: Friction detected (${(hold.confidence * 100).toFixed(0)}% confidence). RTL spread: ${hold.signals.momentum.velocity.toFixed(1)}%`,
            signals: {
                momentum: hold.confidence,
                volatility: hold.signals.momentum.acceleration,
            },
            expectedDirection: 'NEUTRAL', // Hold is NOT bullish, it's friction warning
            confidence: hold.confidence,
            invalidationRules: ['Friction subsides', 'Liquidity drops'],
        };
    }

    // ✅ Execute swap (using correct field names)
    const profit = path.currentValueSOL - goal.startAmountSOL;
    const profitPct = (profit / goal.startAmountSOL) * 100;

    return {
        action: 'SWAP',
        toToken: firstHop.toSymbol,
        thesis: `Brain v2 path: ${path.currentSymbol} → ${firstHop.toSymbol}. Score: ${path.score.toFixed(1)}, RTL: ${path.cumulativeRTL.toFixed(1)}%`,
        signals: {
            momentum: Math.min(1, path.score / 10), // Normalize score to 0-1
            volatility: path.cumulativeRTL / 20, // Normalize RTL to 0-1
        },
        expectedDirection: profit > 0 ? 'UP' : 'NEUTRAL',
        expectedEdgePct: profitPct,
        allocationPct: Math.floor(30 + Math.random() * 50), // Dynamic 30-80%
        confidence: searchResult.confidence === 'high' ? 0.8 : searchResult.confidence === 'medium' ? 0.6 : 0.4,
        invalidationRules: ['Path invalidation', 'RTL exceeds limit'],
    };
}

// ============================================================================
// API ENDPOINT
// ============================================================================

export async function POST(request: Request) {
    const encoder = new TextEncoder();
    const sim = new BrutalBrainSimulation();

    const stream = new ReadableStream({
        async start(controller) {
            console.log('[Brutal Simulation] Starting 30-minute REAL Brain v2 Paper Trading...');
            console.log('[Brutal Simulation] Starting Capital: 0.2 SOL (paper money)');
            console.log('[Brutal Simulation] Using REAL Jupiter quotes for all swaps');

            try {
                // ✅ PRE-LOAD universe before simulation starts
                console.log('[Brutal Simulation] Pre-loading token universe...');
                await getUniverse();
                console.log('[Brutal Simulation] Universe loaded successfully');

                // ✅ Use REAL Brain v2 with paper trading
                const report = await sim.run(realBrainV2, (log, state) => {
                    // Send log chunk with enhanced state info
                    const enhancedLog = {
                        ...log,
                        paperBalance: state.balanceSOL,
                        currentToken: state.token,
                        timestamp: Date.now(),
                    };

                    const chunk = JSON.stringify({ type: 'LOG', data: enhancedLog, state }) + '\n';
                    controller.enqueue(encoder.encode(chunk));
                });

                // Send final report
                const finalChunk = JSON.stringify({
                    type: 'REPORT',
                    data: {
                        ...report,
                        startingCapital: 0.2,
                        finalCapital: report.endSOL,
                        profitSOL: report.endSOL - 0.2,
                        profitPct: ((report.endSOL - 0.2) / 0.2) * 100,
                    }
                }) + '\n';
                controller.enqueue(encoder.encode(finalChunk));
                controller.close();

                console.log('[Brutal Simulation] Completed successfully');
                console.log(`[Brutal Simulation] Final: ${report.endSOL.toFixed(6)} SOL`);
            } catch (error: any) {
                console.error('[Brutal Simulation] Error:', error);
                const errorChunk = JSON.stringify({ type: 'ERROR', error: error.message }) + '\n';
                controller.enqueue(encoder.encode(errorChunk));
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
