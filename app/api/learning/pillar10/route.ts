/**
 * Pillar 10 API - Compounding Prediction Funnel with Real Waiting
 *
 * This endpoint implements the full compounding loop:
 * 1. Freeze universe of ~1000 tokens (CHAOS only by default)
 * 2. Predict all tokens (UP/DOWN/FLAT)
 * 3. Wait 5 REAL minutes
 * 4. Score predictions
 * 5. Narrow to survivors
 * 6. Repeat until funnel completes or collapses
 *
 * Supports:
 * - EDGE mode (strict) vs EXPLORATION mode (relaxed)
 * - Variable prediction horizons (5/10/15 min)
 * - Detailed "WHY NO EDGE" diagnostics
 */

import { NextRequest } from 'next/server';
import {
    freezeUniverse,
    createFunnelState,
    predictFunnel,
    scoreFunnel,
    shouldContinueFunnel,
    getFunnelVerdict,
    PILLAR_10_CONFIG,
    FunnelState,
    DirectionalCheck,
} from '@/lib/physics-engine/compoundingLoop';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max (allow for multiple cycles)

type RunMode = 'EDGE' | 'EXPLORATION';

interface RunConfig {
    mode: RunMode;
    horizonMinutes: 5 | 10 | 15;
    tokenLimit: number;
}

/**
 * Get thresholds based on mode
 */
function getModeThresholds(mode: RunMode): {
    minDirectionalAdjustment: number;
    maxFlatAdjustment: number;
} {
    if (mode === 'EXPLORATION') {
        return {
            minDirectionalAdjustment: -0.15, // Relax by 15%
            maxFlatAdjustment: +0.15,        // Allow more FLAT
        };
    }
    return {
        minDirectionalAdjustment: 0,
        maxFlatAdjustment: 0,
    };
}

/**
 * Stream a single event
 */
function sendEvent(controller: ReadableStreamDefaultController, type: string, data: any) {
    const encoder = new TextEncoder();
    const payload = JSON.stringify({ type, data, timestamp: Date.now() });
    controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
}

/**
 * Build "WHY NO EDGE" diagnostics
 */
function buildNoEdgeDiagnostics(check: DirectionalCheck, state: FunnelState): any {
    return {
        directionalCommitment: {
            upCount: check.upCount,
            downCount: check.downCount,
            flatCount: check.flatCount,
            directionalPct: (check.directionalPct * 100).toFixed(1) + '%',
            flatPct: (check.flatPct * 100).toFixed(1) + '%',
            minRequired: (check.minDirectional * 100).toFixed(0) + '%',
            maxFlatAllowed: (check.maxFlat * 100).toFixed(0) + '%',
            violation: check.violationType,
        },
        regime: {
            current: state.regime,
            explanation: getRegimeExplanation(state.regime),
        },
        funnelStage: {
            tokenCount: state.tokens.length,
            cycle: state.cycle,
            initialCount: state.initialTokenCount,
            narrowingRatio: (state.tokens.length / state.initialTokenCount * 100).toFixed(0) + '%',
        },
        reasoning: check.reason || 'No directional conviction',
    };
}

function getRegimeExplanation(regime: string): string {
    switch (regime) {
        case 'TREND_UP':
            return 'Strong upward momentum - directional edge likely';
        case 'TREND_DOWN':
            return 'Strong downward pressure - shorting edge possible';
        case 'RANGE':
            return 'Low volatility, compressed range - directional edge unlikely';
        case 'CHAOS':
            return 'High volatility, erratic moves - no predictable patterns';
        default:
            return 'Unknown regime';
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = (searchParams.get('mode') || 'EDGE') as RunMode;
    const horizonMinutes = parseInt(searchParams.get('horizon') || '5') as 5 | 10 | 15;
    const tokenLimit = parseInt(searchParams.get('tokens') || '1000');

    const config: RunConfig = { mode, horizonMinutes, tokenLimit };
    const modeThresholds = getModeThresholds(mode);

    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Send connection event
                sendEvent(controller, 'CONNECTED', { config, pillar: 10 });

                // Step 1: Freeze universe
                sendEvent(controller, 'FREEZING_UNIVERSE', { targetTokens: tokenLimit });
                const universe = await freezeUniverse(tokenLimit);
                sendEvent(controller, 'UNIVERSE_FROZEN', { tokenCount: universe.length });

                // Create funnel state
                const state = createFunnelState(universe);
                sendEvent(controller, 'FUNNEL_CREATED', {
                    initialTokens: state.tokens.length,
                    mode,
                    horizon: horizonMinutes
                });

                // Funnel loop
                let cycleResults: any[] = [];
                while (shouldContinueFunnel(state)) {
                    const cycleStart = Date.now();
                    sendEvent(controller, 'CYCLE_START', {
                        cycle: state.cycle + 1,
                        tokenCount: state.tokens.length
                    });

                    // Step 2: Make predictions
                    sendEvent(controller, 'PREDICTING', { tokenCount: state.tokens.length });
                    const directionalCheck = await predictFunnel(state);

                    // Adjust thresholds for EXPLORATION mode
                    if (mode === 'EXPLORATION') {
                        // Relax thresholds slightly but still require commitment
                        const adjustedCheck = {
                            ...directionalCheck,
                            minDirectional: Math.max(0.2, directionalCheck.minDirectional + modeThresholds.minDirectionalAdjustment),
                            maxFlat: Math.min(0.8, directionalCheck.maxFlat + modeThresholds.maxFlatAdjustment),
                        };

                        // Re-evaluate with adjusted thresholds
                        if (directionalCheck.flatPct > adjustedCheck.maxFlat) {
                            directionalCheck.valid = false;
                            directionalCheck.reason = `EXPLORATION MODE: FLAT ${(directionalCheck.flatPct * 100).toFixed(0)}% still exceeds relaxed limit ${(adjustedCheck.maxFlat * 100).toFixed(0)}%`;
                        } else if (directionalCheck.directionalPct < adjustedCheck.minDirectional) {
                            directionalCheck.valid = false;
                            directionalCheck.reason = `EXPLORATION MODE: Directional ${(directionalCheck.directionalPct * 100).toFixed(0)}% below relaxed minimum ${(adjustedCheck.minDirectional * 100).toFixed(0)}%`;
                        } else {
                            directionalCheck.valid = true;
                            directionalCheck.reason = 'EXPLORATION MODE: Relaxed constraints met';
                        }
                    }

                    sendEvent(controller, 'PREDICTIONS_MADE', {
                        predictions: {
                            up: directionalCheck.upCount,
                            down: directionalCheck.downCount,
                            flat: directionalCheck.flatCount,
                        },
                        directionalPct: (directionalCheck.directionalPct * 100).toFixed(1) + '%',
                        regime: state.regime,
                    });

                    // Check directional commitment (Pillar 10.1 + 10.2)
                    if (!directionalCheck.valid) {
                        const diagnostics = buildNoEdgeDiagnostics(directionalCheck, state);
                        sendEvent(controller, 'STOP_NO_EDGE', diagnostics);
                        sendEvent(controller, 'FUNNEL_COLLAPSED', {
                            reason: 'Directional commitment insufficient',
                            diagnostics,
                        });
                        break;
                    }

                    // Step 3: Wait for horizon duration
                    const waitMs = horizonMinutes * 60 * 1000;
                    sendEvent(controller, 'WAITING', {
                        durationMs: waitMs,
                        horizonMinutes,
                        message: `Waiting ${horizonMinutes} minutes for price movements...`
                    });
                    await new Promise(resolve => setTimeout(resolve, waitMs));

                    // Step 4: Score predictions (with event emitter for FLAT resolution)
                    sendEvent(controller, 'SCORING', { tokenCount: state.tokens.length });
                    const result = await scoreFunnel(state, (type: string, data: any) => {
                        sendEvent(controller, type, data);
                    });

                    sendEvent(controller, 'CYCLE_COMPLETE', {
                        cycle: result.cycle,
                        accuracy: (result.accuracy * 100).toFixed(1) + '%',
                        survivorsCount: result.tokensAfter,
                        eliminatedCount: result.eliminated.length,
                        regime: result.regime,
                        durationMs: Date.now() - cycleStart,
                    });

                    cycleResults.push({
                        cycle: result.cycle,
                        accuracy: result.accuracy,
                        survivors: result.tokensAfter,
                        eliminated: result.eliminated.length,
                        regime: result.regime,
                    });

                    // Check termination
                    if (state.funnelComplete) {
                        sendEvent(controller, 'FUNNEL_COMPLETE', {
                            finalTokenCount: state.tokens.length,
                            cycles: cycleResults.length,
                        });
                        break;
                    }

                    if (state.funnelCollapsed) {
                        sendEvent(controller, 'FUNNEL_COLLAPSED', {
                            reason: 'All tokens eliminated',
                            cycles: cycleResults.length,
                        });
                        break;
                    }
                }

                // Final verdict
                const verdict = getFunnelVerdict(state);
                sendEvent(controller, 'FINAL_VERDICT', {
                    shouldExecute: verdict.shouldExecute,
                    reason: verdict.reason,
                    candidates: verdict.candidates.map(c => ({
                        symbol: c.symbol,
                        score: c.score,
                        tokenClass: c.tokenClass,
                    })),
                    mode,
                    cycleCount: cycleResults.length,
                });

                // Summary
                sendEvent(controller, 'RUN_SUMMARY', {
                    verdict: verdict.shouldExecute ? 'EXECUTION_ALLOWED' : 'NO_TRADE',
                    mode,
                    horizonMinutes,
                    cycles: cycleResults,
                    initialTokens: state.initialTokenCount,
                    finalTokens: state.tokens.length,
                    executionCandidates: verdict.candidates.length,
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
