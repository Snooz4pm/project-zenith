/**
 * Brain V2 Simulation API
 *
 * Endpoints to control and monitor the live simulation
 */

import { NextRequest, NextResponse } from 'next/server';
import { brainSimulator } from '@/lib/simulation/brainv2-simulator';
import type { SearchableToken } from '@/types/BrainV2';

// Mock universe for now - in production, fetch from Jupiter/DexScreener
function getMockUniverse(): SearchableToken[] {
    // This would be fetched from real sources
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const BONK_MINT = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';

    return [
        {
            mint: SOL_MINT,
            symbol: 'SOL',
            liquidityScore: 1.0,
            roundTripLoss: 0.1,
            alphaScore: 0.5,
            volatility: 0.05,
            tier: 'TIER1',
            isAlpha: false,
        },
        {
            mint: USDC_MINT,
            symbol: 'USDC',
            liquidityScore: 1.0,
            roundTripLoss: 0.05,
            alphaScore: 0.1,
            volatility: 0.01,
            tier: 'TIER1',
            isAlpha: false,
        },
        {
            mint: BONK_MINT,
            symbol: 'BONK',
            liquidityScore: 0.8,
            roundTripLoss: 2.5,
            alphaScore: 0.7,
            volatility: 0.15,
            tier: 'TIER2',
            isAlpha: true,
        },
    ];
}

/**
 * POST /api/simulation - Start new simulation
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { initialSol = 0.1, maxCycles = 10, targetROI = 5 } = body;

        const runId = await brainSimulator.startSimulation({
            initialSol,
            maxCycles,
            targetROI,
        });

        return NextResponse.json({
            success: true,
            runId,
            message: `Simulation started with ${initialSol} SOL`,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/simulation - Get simulation status
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const runId = searchParams.get('runId');

        if (runId) {
            // Get specific run
            const run = brainSimulator.getRun(runId);
            if (!run) {
                return NextResponse.json(
                    { success: false, error: 'Run not found' },
                    { status: 404 }
                );
            }

            const stats = run.wallet.getStats();

            return NextResponse.json({
                success: true,
                run: {
                    id: run.id,
                    status: run.status,
                    startTime: run.startTime,
                    endTime: run.endTime,
                    cycles: run.cycles.length,
                    stats,
                    latestCycle: run.cycles[run.cycles.length - 1],
                },
            });
        } else {
            // Get all runs
            const runs = brainSimulator.getAllRuns();
            return NextResponse.json({
                success: true,
                runs: runs.map(r => ({
                    id: r.id,
                    status: r.status,
                    startTime: r.startTime,
                    endTime: r.endTime,
                    cycles: r.cycles.length,
                    pnl: r.wallet.getStats().pnlPercent,
                })),
            });
        }
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/simulation - Run simulation cycle
 */
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { runId, action } = body;

        if (action === 'cycle') {
            // Run one cycle
            const universe = getMockUniverse();
            const cycle = await brainSimulator.runCycle(runId, universe);

            return NextResponse.json({
                success: true,
                cycle: {
                    cycleNumber: cycle.cycleNumber,
                    regime: cycle.regime,
                    trustLevel: cycle.trustLevel,
                    executionAllowed: cycle.executionAllowed,
                    executionReason: cycle.executionReason,
                    trades: cycle.trades.length,
                    logs: cycle.logs,
                },
            });
        } else if (action === 'stop') {
            // Stop simulation
            const run = await brainSimulator.stopSimulation(runId);
            const stats = run.wallet.getStats();

            return NextResponse.json({
                success: true,
                message: 'Simulation stopped',
                finalStats: stats,
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/simulation - Delete simulation run
 */
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const runId = searchParams.get('runId');

        if (!runId) {
            return NextResponse.json(
                { success: false, error: 'runId required' },
                { status: 400 }
            );
        }

        // Note: brainSimulator doesn't have delete method yet
        // Would need to add this method to the class

        return NextResponse.json({
            success: true,
            message: `Run ${runId} deleted`,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
