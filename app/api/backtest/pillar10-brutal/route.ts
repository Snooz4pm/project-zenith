/**
 * POST /api/backtest/pillar10-brutal
 *
 * Full Integration: Pillar 10 Funnel → Brutal Brain v2 Simulation
 *
 * CHAOS TOKENS ONLY - No stablecoins, no majors
 *
 * Flow:
 * 1. Run Pillar 10 compounding funnel on CHAOS tokens (predict → wait → score → narrow)
 * 2. Get validated execution candidates
 * 3. Set authority from funnel results
 * 4. Run Brutal Brain v2 simulation with validated tokens only
 * 5. Track FLAT accountability + discipline throughout
 *
 * This is the complete governance stack in action.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pillar10BrutalSimulation } from '@/lib/smartswap/simulation/Pillar10BrutalSimulation';
import { DecisionIntent } from '@/lib/smartswap/simulation/types';
import { searchForPath, BrainGoal } from '@/lib/smartswap/brainv2';
import { SearchableToken } from '@/types/BrainV2';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

type RunMode = 'EDGE' | 'EXPLORATION';

interface Pillar10BrutalRequest {
    mode?: RunMode;
    horizonMinutes?: 5 | 10 | 15;
    tokenLimit?: number;
}

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';

/**
 * Fetch minimal token universe for Brain v2 pathfinding
 */
async function fetchMinimalUniverse(): Promise<SearchableToken[]> {
    try {
        const tokensResponse = await fetch(`${JUPITER_PROXY_URL}/tokens`);
        if (!tokensResponse.ok) throw new Error('Failed to fetch tokens');

        const { tokens } = await tokensResponse.json();
        const searchable: SearchableToken[] = [];

        // Get top 30 tokens for Brain v2
        for (const token of tokens.slice(0, 30)) {
            if (token.address === SOL_MINT) continue;

            searchable.push({
                mint: token.address,
                symbol: token.symbol,
                roundTripLoss: 5, // Estimated
                alphaScore: 30,
                safeTier: 'RANKABLE',
            });
        }

        return searchable;
    } catch (error) {
        console.error('[Pillar10Brutal] Error fetching universe:', error);
        return [];
    }
}

/**
 * Main handler - runs full integration
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as Pillar10BrutalRequest;
        const mode = body.mode || 'EDGE';
        const horizonMinutes = body.horizonMinutes || 10;
        const tokenLimit = body.tokenLimit || 1000;

        console.log('[Pillar10Brutal] Starting full integration...');
        console.log(`[Pillar10Brutal] Mode: ${mode}, Horizon: ${horizonMinutes}min, Tokens: ${tokenLimit} (CHAOS ONLY)`);

        // Fetch Brain v2 universe
        const brainUniverse = await fetchMinimalUniverse();
        console.log(`[Pillar10Brutal] Brain universe: ${brainUniverse.length} tokens loaded`);

        // Create simulation
        const simulation = new Pillar10BrutalSimulation();

        // Simple Brain v2 strategy using validated tokens
        const brain = (state: any) => {
            // Default to hesitate
            const intent: DecisionIntent & { action: any; toToken?: string } = {
                action: 'HESITATE',
                thesis: 'Awaiting validated opportunity',
                confidence: 0.5,
                horizon: 'SHORT',
                risk: 'NONE',
            };

            // If in SOL and have balance, look for swap opportunity
            if (state.token === 'SOL' && state.liquidSOL > 0.05) {
                // Use Brain v2 to find path
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
                    intent.thesis = `Brain v2 path found: ROI ${result.estimatedROI?.toFixed(2)}%, RTL ${result.totalRTL?.toFixed(2)}%`;
                    intent.confidence = 0.7;
                    intent.horizon = '5-15min';
                    intent.risk = 'LOW';
                }
            }

            // If in position, check if we should exit
            if (state.hasPosition && state.positionValueSOL) {
                const unrealizedPnL = state.positionValueSOL - (state.balanceSOL || 0);

                // Exit on loss
                if (unrealizedPnL < -0.01) {
                    intent.action = 'EXIT';
                    intent.toToken = 'SOL';
                    intent.thesis = `Cutting loss: ${unrealizedPnL.toFixed(6)} SOL`;
                    intent.confidence = 0.9;
                    intent.horizon = 'IMMEDIATE';
                    intent.risk = 'MEDIUM';
                }

                // Take profit
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

        // Track events
        const funnelEvents: any[] = [];
        const simLogs: any[] = [];

        // Run integrated simulation
        const report = await simulation.runWithFunnel(
            mode,
            horizonMinutes,
            tokenLimit,
            brain,
            (event: string, data: any) => {
                funnelEvents.push({ event, data, timestamp: Date.now() });
                console.log(`[Pillar10Brutal] Funnel: ${event}`);
            },
            (log: any, state: any) => {
                simLogs.push({ log, state, timestamp: Date.now() });
            }
        );

        console.log(`[Pillar10Brutal] Complete: ${report.verdict}`);
        console.log(`[Pillar10Brutal] Edge validated: ${report.funnelAuthority.edgeValidated}`);
        console.log(`[Pillar10Brutal] Blocked swaps: ${report.disciplineMetrics.blockedSwaps}`);
        console.log(`[Pillar10Brutal] Authorized swaps: ${report.disciplineMetrics.authorizedSwaps}`);

        return NextResponse.json({
            success: true,
            report: {
                verdict: report.verdict,
                verdictReason: report.verdictReason,
                startSOL: report.startSOL,
                endSOL: report.endSOL,
                pnlPct: report.pnlPct,
                penaltyScore: report.penaltyScore,
                totalInvalidDecisions: report.totalInvalidDecisions,
            },
            funnelAuthority: report.funnelAuthority,
            disciplineMetrics: report.disciplineMetrics,
            funnelEvents: funnelEvents.slice(-50), // Last 50 events
            logs: report.logs,
        });

    } catch (error: any) {
        console.error('[Pillar10Brutal] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
        }, { status: 500 });
    }
}
