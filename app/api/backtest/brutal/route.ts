/**
 * POST /api/backtest/brutal
 *
 * ✅ REAL Brain v2 Simulation - NO MOCK DATA
 * Uses actual Brain v2 search logic with live token universe
 */

import { PortfolioSimulation, PortfolioAction } from '@/lib/smartswap/simulation/PortfolioSimulation';
import { DecisionIntent } from '@/lib/smartswap/simulation/types';
import { SearchableToken } from '@/types/BrainV2';
import { SmartToken } from '@/types/SmartToken';

export const dynamic = 'force-dynamic';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';

// ============================================================================
// REAL TOKEN UNIVERSE - NO MOCK DATA
// ============================================================================

/**
 * ✅ Fetch REAL token universe directly from Jupiter proxy
 * This ensures simulation uses actual market data
 */
async function fetchRealUniverse(): Promise<SearchableToken[]> {
    try {
        // Step 1: Fetch token list directly from Jupiter proxy
        console.log('[Backtest] Step 1: Fetching token list from Jupiter proxy...');
        const tokensResponse = await fetch(`${JUPITER_PROXY_URL}/tokens`, {
            headers: { 'Accept': 'application/json' },
        });

        if (!tokensResponse.ok) {
            throw new Error(`Failed to fetch tokens from Jupiter: ${tokensResponse.status}`);
        }

        const tokensData = await tokensResponse.json();
        const rawTokens = tokensData.tokens || [];

        if (rawTokens.length === 0) {
            throw new Error('No tokens available from Jupiter proxy');
        }

        console.log(`[Backtest] Loaded ${rawTokens.length} raw tokens`);

        // Step 2: Get Jupiter quotes for top tokens to determine SOL values
        console.log('[Backtest] Step 2: Getting quotes for top 30 tokens...');
        const tokensToValue = rawTokens.slice(0, 30);

        const results = await Promise.all(
            tokensToValue.map(async (token: any) => {
                try {
                    // Get quote for 1 token unit -> SOL
                    const amount = Math.pow(10, token.decimals || 6).toString();
                    const quoteResponse = await fetch(
                        `${JUPITER_PROXY_URL}/quote?` + new URLSearchParams({
                            inputMint: token.address,
                            outputMint: SOL_MINT,
                            amount: amount,
                            slippageBps: '50',
                        })
                    );

                    if (!quoteResponse.ok) {
                        return {
                            mint: token.address,
                            hasRoute: false,
                            roundTripLoss: 99,
                            safeTier: 'REJECTED' as const,
                        };
                    }

                    const quote = await quoteResponse.json();
                    const solOut = parseInt(quote.outAmount || '0');
                    const valueInSOL = solOut / Math.pow(10, 9);
                    const priceImpact = Math.abs(parseFloat(quote.priceImpactPct || '0'));

                    // Estimate RTL (simplified for simulation)
                    const estimatedRTL = priceImpact * 2; // Rough estimate

                    return {
                        mint: token.address,
                        valueInSOL,
                        priceImpactPct: priceImpact,
                        hasRoute: true,
                        roundTripLoss: estimatedRTL,
                        safeTier: estimatedRTL <= 15 ? 'SAFE' as const : 'RANKABLE' as const,
                        alphaScore: estimatedRTL > 5 && estimatedRTL < 20 ? 50 : 30,
                    };
                } catch (error) {
                    return {
                        mint: token.address,
                        hasRoute: false,
                        roundTripLoss: 99,
                        safeTier: 'REJECTED' as const,
                    };
                }
            })
        );

        console.log(`[Backtest] Valuation complete: ${results.length} results`);

        const validResults = results.filter(r => r.hasRoute);

        if (validResults.length === 0) {
            throw new Error('No tokens passed valuation - no routes found');
        }

        console.log(`[Backtest] ${validResults.length} tokens with valid routes`);

        // Step 3: Merge valuation results with token data
        const tokens: SmartToken[] = validResults.map((valuation: any) => {
            const rawToken = tokensToValue.find((t: any) => t.address === valuation.mint);
            return {
                id: valuation.mint, // Use mint as ID
                mint: valuation.mint,
                symbol: rawToken?.symbol || 'UNKNOWN',
                name: rawToken?.name || 'Unknown Token',
                decimals: rawToken?.decimals || 6,
                logoURI: rawToken?.logoURI,
                tags: rawToken?.tags || [],
                valueInSOL: valuation.valueInSOL,
                priceImpactPct: valuation.priceImpactPct,
                hasRoute: valuation.hasRoute,
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

        // ✅ ADD SOL to universe (required for Brain v2 pathfinding)
        searchableTokens.push({
            mint: SOL_MINT,
            symbol: 'SOL',
            valueInSOL: 1.0, // SOL is worth 1 SOL
            roundTripLoss: 0, // No RTL for SOL itself
            hasRoute: true,
            liquidityScore: 1.0,
            alphaScore: 0,
            volatility: 0.2,
            isStable: false,
            isAlpha: false,
            tier: 'SAFE',
        });

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

// Track recently traded tokens to prevent re-entering same positions
const recentTrades = new Map<string, number>(); // token -> timestamp of last exit
const COOLDOWN_MS = 60_000; // 60 seconds cooldown before re-entering same token

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
// PORTFOLIO BRAIN V2 - MULTI-ASSET STRATEGY
// ============================================================================

/**
 * ✅ Portfolio Brain v2 - Can hold multiple tokens simultaneously
 * Returns array of actions to execute in parallel
 */
function portfolioBrainV2(state: any): PortfolioAction[] {
    if (!cachedUniverse) {
        throw new Error('Universe not loaded');
    }
    const universe = cachedUniverse;
    const actions: PortfolioAction[] = [];

    const { liquidSOL, positions, positionCount } = state;

    // ============================================
    // PORTFOLIO STRATEGY
    // ============================================
    // 1. Diversification: Hold 2-4 positions simultaneously
    // 2. Smart allocation: Split capital across opportunities
    // 3. Hold to accumulate: Let positions appreciate
    // 4. Exit winners: Take profits on good exits

    const MAX_POSITIONS = 4;
    const MIN_HOLD_COUNT = 3; // Min holds before considering exit
    const MAX_HOLD_COUNT = 8; // Force exit after this many holds

    // ===== MANAGE EXISTING POSITIONS =====
    for (const pos of positions) {
        const tokenData = universe.find(t => t.symbol === pos.token);
        if (!tokenData) continue;

        const rtl = tokenData.roundTripLoss;
        const holdCount = pos.holdCount;
        const unrealizedPnL = pos.unrealizedPnL;

        // EMERGENCY EXIT: High RTL or big loss
        if (rtl > 15 || unrealizedPnL < -0.01) {
            actions.push({
                type: 'SELL',
                token: pos.token,
                mint: pos.mint,
                allocationPct: 100,
                intent: {
                    thesis: `EMERGENCY EXIT ${pos.token}: RTL ${rtl.toFixed(1)}% or loss ${unrealizedPnL.toFixed(6)} SOL`,
                    signals: { momentum: 0.2, volatility: 0.8 },
                    expectedDirection: 'NEUTRAL',
                    confidence: 0.9,
                    invalidationRules: ['Stop loss'],
                },
            });
            // Add to cooldown to prevent immediate re-entry
            recentTrades.set(pos.token, Date.now());
            continue;
        }

        // PROFIT TAKING: Good gains and clean exit
        if (unrealizedPnL > 0.005 && rtl < 8 && holdCount >= MIN_HOLD_COUNT) {
            actions.push({
                type: 'SELL',
                token: pos.token,
                mint: pos.mint,
                allocationPct: 100,
                intent: {
                    thesis: `PROFIT TAKE ${pos.token}: +${unrealizedPnL.toFixed(6)} SOL after ${holdCount} holds, RTL ${rtl.toFixed(1)}%`,
                    signals: { momentum: 0.7, volatility: 0.3 },
                    expectedDirection: 'NEUTRAL',
                    confidence: 0.8,
                    invalidationRules: ['Lock in profits'],
                },
            });
            // Add to cooldown to prevent immediate re-entry
            recentTrades.set(pos.token, Date.now());
            continue;
        }

        // FORCED EXIT: Held too long
        if (holdCount >= MAX_HOLD_COUNT) {
            actions.push({
                type: 'SELL',
                token: pos.token,
                mint: pos.mint,
                allocationPct: 100,
                intent: {
                    thesis: `TIME EXIT ${pos.token}: ${holdCount} holds reached, PnL ${unrealizedPnL.toFixed(6)} SOL`,
                    signals: { momentum: 0.5, volatility: 0.4 },
                    expectedDirection: 'NEUTRAL',
                    confidence: 0.6,
                    invalidationRules: ['Max hold time'],
                },
            });
            // Add to cooldown to prevent immediate re-entry
            recentTrades.set(pos.token, Date.now());
            continue;
        }

        // Otherwise, HOLD to accumulate gains
        // (No explicit HOLD action needed - happens by default)
    }

    // ===== OPEN NEW POSITIONS =====
    if (positionCount < MAX_POSITIONS && liquidSOL > 0.02) {
        // Clean up expired cooldowns
        const now = Date.now();
        for (const [token, exitTime] of recentTrades.entries()) {
            if (now - exitTime > COOLDOWN_MS) {
                recentTrades.delete(token);
            }
        }

        // Find alpha opportunities (excluding tokens on cooldown)
        const alphaTargets = universe.filter(t => {
            // Skip if on cooldown
            const lastExitTime = recentTrades.get(t.symbol);
            if (lastExitTime && now - lastExitTime < COOLDOWN_MS) {
                return false; // Still on cooldown
            }

            return (
                t.tier === 'SAFE' &&
                t.mint !== SOL_MINT &&
                t.hasRoute &&
                t.valueInSOL > 0 &&
                t.roundTripLoss < 8 &&
                (t.alphaScore || 0) > 0.3 &&
                !t.isStable &&
                !positions.some((p: any) => p.token === t.symbol) // Don't buy what we already have
            );
        });

        if (alphaTargets.length > 0) {
            // Sort by alpha score
            alphaTargets.sort((a, b) => (b.alphaScore || 0) - (a.alphaScore || 0));

            // How many new positions can we open?
            const slotsAvailable = MAX_POSITIONS - positionCount;
            const positionsToOpen = Math.min(slotsAvailable, 2); // Open max 2 at once

            for (let i = 0; i < positionsToOpen && i < alphaTargets.length; i++) {
                const target = alphaTargets[i];

                // Allocate capital: split available SOL across new positions
                const allocSOL = liquidSOL / (positionsToOpen - i);
                const actualAlloc = Math.min(allocSOL * 0.4, liquidSOL * 0.9); // Use 40% of share, max 90% total

                if (actualAlloc < 0.01) break; // Too small

                const expectedEdge = (target.alphaScore || 0) * 10 - target.roundTripLoss;

                actions.push({
                    type: 'BUY',
                    token: target.symbol,
                    mint: target.mint,
                    allocationSOL: actualAlloc,
                    intent: {
                        thesis: `BUY ${target.symbol}: Alpha ${((target.alphaScore || 0) * 100).toFixed(0)}%, RTL ${target.roundTripLoss.toFixed(1)}%, Edge ${expectedEdge.toFixed(1)}%`,
                        signals: { momentum: target.alphaScore || 0.5, volatility: target.volatility || 0.3 },
                        expectedDirection: 'UP',
                        expectedEdgePct: expectedEdge,
                        confidence: 0.7,
                        invalidationRules: ['RTL exceeds 15%'],
                    },
                });
            }
        } else {
            // Count tokens on cooldown for better logging
            const tokensOnCooldown = Array.from(recentTrades.keys()).filter(token => {
                const lastExitTime = recentTrades.get(token);
                return lastExitTime && now - lastExitTime < COOLDOWN_MS;
            });

            if (tokensOnCooldown.length > 0) {
                console.log(`[Brain] ${tokensOnCooldown.length} tokens on cooldown: ${tokensOnCooldown.join(', ')}`);
            }
        }
    }

    // ===== HOLD ALL POSITIONS (if no sells) =====
    if (actions.length === 0 && positionCount > 0) {
        actions.push({
            type: 'HOLD_ALL',
            intent: {
                thesis: `HOLD ALL: ${positionCount} positions accumulating gains`,
                signals: { momentum: 0.6, volatility: 0.3 },
                expectedDirection: 'UP',
                confidence: 0.7,
                invalidationRules: ['Exit conditions met'],
            },
        });
    }

    // ===== HESITATE (no opportunities) =====
    if (actions.length === 0) {
        // Check if we're waiting for cooldowns
        const now = Date.now();
        const tokensOnCooldown = Array.from(recentTrades.keys()).filter(token => {
            const lastExitTime = recentTrades.get(token);
            return lastExitTime && now - lastExitTime < COOLDOWN_MS;
        });

        let thesis = 'No opportunities: waiting for alpha setups';
        if (tokensOnCooldown.length > 0) {
            const cooldownSec = Math.ceil(COOLDOWN_MS / 1000);
            thesis = `Waiting for cooldown (${cooldownSec}s): ${tokensOnCooldown.join(', ')}. Looking for new alpha opportunities.`;
        }

        actions.push({
            type: 'HESITATE',
            intent: {
                thesis,
                signals: {},
                expectedDirection: 'NEUTRAL',
                confidence: 0.3,
                invalidationRules: ['New opportunities appear', 'Cooldowns expire'],
            },
        });
    }

    return actions;
}

// ============================================================================
// API ENDPOINT
// ============================================================================

export async function POST(_request: Request) {
    const encoder = new TextEncoder();
    const sim = new PortfolioSimulation();

    const stream = new ReadableStream({
        async start(controller) {
            console.log('[Portfolio Simulation] Starting 30-minute Portfolio Brain v2...');
            console.log('[Portfolio Simulation] Starting Capital: 0.2 SOL');
            console.log('[Portfolio Simulation] Multi-asset support: Can hold up to 4 positions');
            console.log('[Portfolio Simulation] Fees deducted from wallet, penalties only for losses');

            try {
                // ✅ PRE-LOAD universe before simulation starts
                console.log('[Portfolio Simulation] Pre-loading token universe...');
                await getUniverse();
                console.log('[Portfolio Simulation] Universe loaded successfully');

                // ✅ Use Portfolio Brain v2
                const report = await sim.run(portfolioBrainV2, (log: any, state: any) => {
                    // Send log chunk with portfolio state
                    const enhancedLog = {
                        ...log,
                        liquidSOL: state.liquidSOL,
                        positions: state.positions,
                        positionCount: state.positionCount,
                        totalFeesSOL: state.totalFeesSOL,
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

                console.log('[Portfolio Simulation] Completed successfully');
                console.log(`[Portfolio Simulation] Final: ${report.endSOL.toFixed(6)} SOL`);
                console.log(`[Portfolio Simulation] ${report.verdictReason}`);
            } catch (error: any) {
                console.error('[Portfolio Simulation] Error:', error);
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
