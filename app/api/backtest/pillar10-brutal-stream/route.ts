/**
 * GET /api/backtest/pillar10-brutal-stream
 *
 * Real-time SSE streaming of full Pillar 10 + Brutal simulation
 * Shows every funnel event, every swap, every decision
 */

import { NextRequest } from 'next/server';
import { Pillar10BrutalSimulation } from '@/lib/smartswap/simulation/Pillar10BrutalSimulation';
import { DecisionIntent } from '@/lib/smartswap/simulation/types';
import { searchForPath, BrainGoal } from '@/lib/smartswap/brainv2';
import { SearchableToken } from '@/types/BrainV2';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';

/**
 * Send SSE event
 */
function sendEvent(controller: ReadableStreamDefaultController, type: string, data: any) {
    const encoder = new TextEncoder();
    const payload = JSON.stringify({ type, data, timestamp: Date.now() });
    controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
}

/**
 * Fetch minimal token universe for Brain v2
 */
async function fetchMinimalUniverse(): Promise<SearchableToken[]> {
    try {
        const tokensResponse = await fetch(`${JUPITER_PROXY_URL}/tokens`);
        if (!tokensResponse.ok) throw new Error('Failed to fetch tokens');

        const { tokens } = await tokensResponse.json();
        const searchable: SearchableToken[] = [];

        for (const token of tokens.slice(0, 30)) {
            if (token.address === SOL_MINT) continue;

            searchable.push({
                mint: token.address,
                symbol: token.symbol,
                roundTripLoss: 5,
                alphaScore: 30,
                safeTier: 'RANKABLE',
            });
        }

        return searchable;
    } catch (error) {
        console.error('[Stream] Error fetching universe:', error);
        return [];
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = (searchParams.get('mode') || 'EDGE') as 'EDGE' | 'EXPLORATION';
    const horizonMinutes = parseInt(searchParams.get('horizon') || '10') as 5 | 10 | 15;
    const tokenLimit = parseInt(searchParams.get('tokens') || '1000');

    const stream = new ReadableStream({
        async start(controller) {
            try {
                sendEvent(controller, 'CONNECTED', { mode, horizonMinutes, tokenLimit });

                // Fetch Brain v2 universe
                sendEvent(controller, 'LOADING_BRAIN_UNIVERSE', {});
                const brainUniverse = await fetchMinimalUniverse();
                sendEvent(controller, 'BRAIN_UNIVERSE_LOADED', { tokenCount: brainUniverse.length });

                // Create simulation
                const simulation = new Pillar10BrutalSimulation();

                // Brain v2 strategy
                const brain = (state: any) => {
                    const intent: DecisionIntent & { action: any; toToken?: string } = {
                        action: 'HESITATE',
                        thesis: 'Awaiting validated opportunity',
                        confidence: 0.5,
                        horizon: 'SHORT',
                        risk: 'NONE',
                    };

                    // If in SOL and have balance, look for swap opportunity
                    if (state.token === 'SOL' && state.liquidSOL > 0.05) {
                        const goal: BrainGoal = {
                            type: 'ROI_TARGET',
                            roiTargetPercent: 5,
                            preservationMode: true,
                            maxHops: 2,
                        };

                        const result = searchForPath(brainUniverse, goal);

                        if (result.status === 'SUCCESS' && result.path && result.path.length > 1) {
                            const targetToken = result.path[1];

                            intent.action = 'SWAP';
                            intent.toToken = targetToken.symbol;
                            intent.thesis = `Brain v2 path: ROI ${result.estimatedROI?.toFixed(2)}%, RTL ${result.totalRTL?.toFixed(2)}%`;
                            intent.confidence = 0.7;
                            intent.horizon = '5-15min';
                            intent.risk = 'LOW';
                        }
                    }

                    // Exit logic
                    if (state.hasPosition && state.positionValueSOL) {
                        const unrealizedPnL = state.positionValueSOL - (state.balanceSOL || 0);

                        if (unrealizedPnL < -0.01) {
                            intent.action = 'EXIT';
                            intent.toToken = 'SOL';
                            intent.thesis = `Cutting loss: ${unrealizedPnL.toFixed(6)} SOL`;
                            intent.confidence = 0.9;
                            intent.horizon = 'IMMEDIATE';
                            intent.risk = 'MEDIUM';
                        }

                        if (unrealizedPnL > 0.015) {
                            intent.action = 'EXIT';
                            intent.toToken = 'SOL';
                            intent.thesis = `Taking profit: +${unrealizedPnL.toFixed(6)} SOL`;
                            intent.confidence = 0.9;
                            intent.horizon = 'IMMEDIATE';
                            intent.risk = 'LOW';
                        }
                    }

                    return intent;
                };

                // Run with streaming
                sendEvent(controller, 'STARTING_PHASE_1', { phase: 'FUNNEL' });

                const report = await simulation.runWithFunnel(
                    mode,
                    horizonMinutes,
                    tokenLimit,
                    brain,
                    (event: string, data: any) => {
                        // Stream funnel events
                        sendEvent(controller, `FUNNEL_${event}`, data);
                    },
                    (log: any, state: any) => {
                        // Stream simulation logs
                        sendEvent(controller, 'SIM_LOG', { log, state });
                    }
                );

                // Send final report
                sendEvent(controller, 'FINAL_REPORT', {
                    verdict: report.verdict,
                    verdictReason: report.verdictReason,
                    startSOL: report.startSOL,
                    endSOL: report.endSOL,
                    pnlPct: report.pnlPct,
                    penaltyScore: report.penaltyScore,
                    funnelAuthority: report.funnelAuthority,
                    disciplineMetrics: report.disciplineMetrics,
                    totalLogs: report.logs.length,
                });

                sendEvent(controller, 'STREAM_END', {});

            } catch (error: any) {
                sendEvent(controller, 'ERROR', { error: error.message, stack: error.stack });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
