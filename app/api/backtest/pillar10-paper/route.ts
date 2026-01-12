/**
 * POST /api/backtest/pillar10-paper
 *
 * Full Integration: Pillar 10 Funnel → Brain v2 Portfolio Simulation
 *
 * Flow:
 * 1. Run Pillar 10 compounding funnel (predict → wait → score → narrow)
 * 2. Get validated execution candidates
 * 3. Set AuthorityContext from funnel results
 * 4. Run Brain v2 portfolio simulation with validated tokens
 * 5. Track FLAT accountability + discipline throughout
 *
 * This is the complete governance stack in action.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    freezeUniverse,
    createFunnelState,
    predictFunnel,
    scoreFunnel,
    shouldContinueFunnel,
    getFunnelVerdict,
    getFlatStatistics,
    FunnelState,
} from '@/lib/learning-validation/compoundingLoop';
import { PortfolioSimulation, PortfolioAction, AuthorityContext } from '@/lib/smartswap/simulation/PortfolioSimulation';
import { TrustLevel, TrustDecision } from '@/lib/trust-engine';
import { DecisionIntent } from '@/lib/smartswap/simulation/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

type RunMode = 'EDGE' | 'EXPLORATION';

interface Pillar10PaperRequest {
    mode?: RunMode;
    horizonMinutes?: 5 | 10 | 15;
    tokenLimit?: number;
    portfolioDurationMinutes?: number;
}

/**
 * Main handler - runs full integration
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as Pillar10PaperRequest;
        const mode = body.mode || 'EDGE';
        const horizonMinutes = body.horizonMinutes || 10;
        const tokenLimit = body.tokenLimit || 1000;
        const portfolioDuration = body.portfolioDurationMinutes || 15;

        console.log('[Pillar10Paper] Starting full integration...');
        console.log(`[Pillar10Paper] Mode: ${mode}, Horizon: ${horizonMinutes}min, Tokens: ${tokenLimit}`);

        // ====================================================================
        // PHASE 1: PILLAR 10 FUNNEL
        // ====================================================================

        console.log('[Pillar10Paper] Phase 1: Running Pillar 10 funnel...');

        // Step 1: Freeze universe
        const universe = await freezeUniverse(tokenLimit);
        console.log(`[Pillar10Paper] Universe frozen: ${universe.length} tokens`);

        // Step 2: Create funnel state
        const funnelState = createFunnelState(universe);

        // Step 3: Run compounding funnel
        const funnelCycles: any[] = [];
        let funnelStopped = false;
        let stopReason = '';

        while (shouldContinueFunnel(funnelState) && funnelCycles.length < 6) {
            console.log(`[Pillar10Paper] Cycle ${funnelState.cycle + 1} starting...`);

            // Make predictions
            const directionalCheck = predictFunnel(funnelState);

            // Check directional commitment (Pillar 10.1 + 10.2)
            if (!directionalCheck.valid) {
                funnelStopped = true;
                stopReason = directionalCheck.reason || 'Directional commitment insufficient';
                console.log(`[Pillar10Paper] STOPPED: ${stopReason}`);
                break;
            }

            // Wait for horizon
            console.log(`[Pillar10Paper] Waiting ${horizonMinutes} minutes...`);
            await new Promise(resolve => setTimeout(resolve, horizonMinutes * 60 * 1000));

            // Score predictions
            const result = await scoreFunnel(funnelState);

            funnelCycles.push({
                cycle: result.cycle,
                accuracy: result.accuracy,
                survivors: result.tokensAfter,
                eliminated: result.eliminated.length,
                regime: result.regime,
            });

            console.log(`[Pillar10Paper] Cycle ${result.cycle} complete: ${result.accuracy * 100}% accuracy, ${result.tokensAfter} survivors`);

            if (funnelState.funnelComplete || funnelState.funnelCollapsed) {
                break;
            }
        }

        // Step 4: Get funnel verdict
        const verdict = getFunnelVerdict(funnelState);
        const flatStats = getFlatStatistics(funnelState.predictionStorage);

        console.log(`[Pillar10Paper] Funnel verdict: ${verdict.shouldExecute ? 'EXECUTE' : 'NO TRADE'}`);
        console.log(`[Pillar10Paper] FLAT stats: ${flatStats.totalFlat} total, ${flatStats.correctFlat} correct, accuracy ${(flatStats.flatAccuracy * 100).toFixed(1)}%`);

        // ====================================================================
        // PHASE 2: AUTHORITY CONTEXT SETUP
        // ====================================================================

        console.log('[Pillar10Paper] Phase 2: Setting up authority context...');

        const learningVerdict = verdict.shouldExecute
            ? 'EDGE_VALIDATED'
            : funnelStopped
                ? 'NO_EDGE_BASELINE_BEATS_BRAIN'
                : funnelState.regime === 'CHAOS'
                    ? 'CHAOS_ABORT'
                    : 'NO_TRADE_LOW_OPPORTUNITY';

        // Determine trust level based on funnel performance
        let trustLevel = TrustLevel.LEVEL_0_OBSERVER;
        let maxPositions = 0;
        let maxSolPerTrade = 0;

        if (verdict.shouldExecute && funnelCycles.length > 0) {
            const finalAccuracy = funnelCycles[funnelCycles.length - 1]?.accuracy || 0;

            if (finalAccuracy >= 0.7 && flatStats.cowardiceScore < 0.3) {
                trustLevel = TrustLevel.LEVEL_2_PAPER_STANDARD;
                maxPositions = 3;
                maxSolPerTrade = 0.05;
            } else if (finalAccuracy >= 0.6) {
                trustLevel = TrustLevel.LEVEL_1_PAPER_MICRO;
                maxPositions = 1;
                maxSolPerTrade = 0.02;
            }
        }

        const trustDecision: TrustDecision = {
            trustLevel,
            executionType: trustLevel > TrustLevel.LEVEL_0_OBSERVER ? 'PAPER' : 'NONE',
            maxTradesAllowed: maxPositions,
            maxSolPerTrade,
            restrictions: [],
            reasoning: `Funnel verdict: ${learningVerdict}, accuracy: ${funnelCycles[funnelCycles.length - 1]?.accuracy.toFixed(2) || 'N/A'}`,
        };

        const authorityContext: AuthorityContext = {
            learningVerdict: learningVerdict as any,
            trustDecision,
            regime: funnelState.regime as any,
        };

        console.log(`[Pillar10Paper] Trust level: ${TrustLevel[trustLevel]}`);
        console.log(`[Pillar10Paper] Max positions: ${maxPositions}`);

        // ====================================================================
        // PHASE 3: BRAIN v2 PORTFOLIO SIMULATION
        // ====================================================================

        if (!verdict.shouldExecute) {
            console.log('[Pillar10Paper] Phase 3: SKIPPED - No execution authority');
            return NextResponse.json({
                success: true,
                phase1_funnel: {
                    cycles: funnelCycles,
                    verdict: learningVerdict,
                    flatStats,
                    executionCandidates: [],
                    stopped: funnelStopped,
                    stopReason,
                },
                phase2_authority: {
                    trustLevel: TrustLevel[trustLevel],
                    maxPositions,
                    reasoning: trustDecision.reasoning,
                },
                phase3_simulation: {
                    skipped: true,
                    reason: verdict.reason,
                },
            });
        }

        console.log('[Pillar10Paper] Phase 3: Running Brain v2 portfolio simulation...');

        // Build portfolio brain strategy using validated tokens
        const validatedTokens = verdict.candidates.map(c => ({
            symbol: c.symbol,
            mint: c.mint,
            score: c.score,
        }));

        console.log(`[Pillar10Paper] Validated tokens: ${validatedTokens.map(t => t.symbol).join(', ')}`);

        const simulation = new PortfolioSimulation();
        simulation.setAuthorityContext(authorityContext);

        // Simple rotation strategy through validated tokens
        let currentTokenIndex = 0;

        const portfolioBrain = (state: any): PortfolioAction[] => {
            const actions: PortfolioAction[] = [];

            // If no positions and have liquid SOL, open first position
            if (state.positionCount === 0 && state.liquidSOL > 0.02 && validatedTokens.length > 0) {
                const token = validatedTokens[currentTokenIndex % validatedTokens.length];
                currentTokenIndex++;

                actions.push({
                    type: 'BUY',
                    token: token.symbol,
                    mint: token.mint,
                    allocationSOL: Math.min(0.03, state.liquidSOL * 0.3),
                    intent: {
                        thesis: `Opening position in validated token ${token.symbol} (score: ${token.score})`,
                        confidence: 0.7,
                        horizon: '5-15min',
                        risk: 'LOW',
                    },
                });
            }

            // Hold existing positions if profitable
            if (state.positions.length > 0) {
                const profitableCount = state.positions.filter((p: any) => p.unrealizedPnL > 0).length;
                if (profitableCount > 0) {
                    actions.push({
                        type: 'HOLD_ALL',
                        intent: {
                            thesis: `Holding ${profitableCount} profitable positions`,
                            confidence: 0.8,
                            horizon: 'SHORT',
                            risk: 'LOW',
                        },
                    });
                }

                // Exit losses after 30 seconds
                for (const pos of state.positions) {
                    if (pos.unrealizedPnL < -0.005 && pos.ageSeconds > 30) {
                        actions.push({
                            type: 'SELL',
                            token: pos.token,
                            allocationPct: 100,
                            intent: {
                                thesis: `Cutting loss on ${pos.token} (${pos.unrealizedPnL.toFixed(6)} SOL)`,
                                confidence: 0.9,
                                horizon: 'IMMEDIATE',
                                risk: 'MEDIUM',
                            },
                        });
                    }
                }

                // Take profits after 60 seconds
                for (const pos of state.positions) {
                    if (pos.unrealizedPnL > 0.01 && pos.ageSeconds > 60) {
                        actions.push({
                            type: 'SELL',
                            token: pos.token,
                            allocationPct: 100,
                            intent: {
                                thesis: `Taking profit on ${pos.token} (+${pos.unrealizedPnL.toFixed(6)} SOL)`,
                                confidence: 0.9,
                                horizon: 'IMMEDIATE',
                                risk: 'LOW',
                            },
                        });
                    }
                }
            }

            if (actions.length === 0) {
                actions.push({
                    type: 'HESITATE',
                    intent: {
                        thesis: 'Awaiting better opportunity',
                        confidence: 0.5,
                        horizon: 'SHORT',
                        risk: 'NONE',
                    },
                });
            }

            return actions;
        };

        const report = await simulation.run(portfolioBrain);

        console.log(`[Pillar10Paper] Simulation complete: ${report.verdict}`);
        console.log(`[Pillar10Paper] PnL: ${report.pnlPct.toFixed(2)}% (${report.verdictReason})`);

        // ====================================================================
        // FINAL REPORT
        // ====================================================================

        return NextResponse.json({
            success: true,
            phase1_funnel: {
                cycles: funnelCycles,
                verdict: learningVerdict,
                flatStats,
                executionCandidates: validatedTokens,
                stopped: funnelStopped,
                stopReason,
            },
            phase2_authority: {
                trustLevel: TrustLevel[trustLevel],
                maxPositions,
                maxSolPerTrade,
                reasoning: trustDecision.reasoning,
            },
            phase3_simulation: {
                verdict: report.verdict,
                verdictReason: report.verdictReason,
                startSOL: report.startSOL,
                endSOL: report.endSOL,
                pnlPct: report.pnlPct,
                penaltyScore: report.penaltyScore,
                violations: report.logs.filter(l => l.evaluation?.outcomeClass === 'BAD_DECISION_BAD_OUTCOME').length,
                totalTrades: report.logs.filter(l => l.executed).length,
            },
        });

    } catch (error: any) {
        console.error('[Pillar10Paper] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
        }, { status: 500 });
    }
}
