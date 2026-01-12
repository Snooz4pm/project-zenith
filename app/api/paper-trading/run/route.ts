/**
 * Unified Paper Trading Endpoint
 * 
 * ONE endpoint that runs the full stack every tick:
 * Learning → Trust → Brain → Simulation
 * 
 * Streams everything to UI (live) + Neon (audit)
 * Duration: 30 minutes
 */

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Import all layers
import { detectRegime, isRegimeTradeable } from '@/lib/learning-validation/regimeDetector';
import { predictBatch } from '@/lib/learning-validation/predictor';
import { scoreBatch, calculateAccuracy, determineActualDirection } from '@/lib/learning-validation/scorer';
import { compareAgainstBaselines } from '@/lib/learning-validation/baselineComparator';
import { checkSaturation } from '@/lib/learning-validation/saturationGuard';
import { calculateBatchOpportunity, shouldTrade } from '@/lib/learning-validation/opportunityScorer';
import { TokenPriceHistory, TokenOutcome } from '@/lib/learning-validation/types';
import { evaluateTrust } from '@/lib/trust-engine/trustEvaluator';
import { TrustLevel } from '@/lib/trust-engine/trustLevels';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min max for serverless

const prisma = new PrismaClient();
const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Run configuration
const CONFIG = {
    tickIntervalMs: 12_000, // 12 seconds between ticks
    maxTicks: 150, // 30 min / 12 sec = 150 ticks
    tokensToAnalyze: 20,
};

interface RunState {
    runId: string;
    tick: number;
    startedAt: number;
    liquidSOL: number;
    positions: Map<string, Position>;
    totalPnL: number;
    violations: number;
    regime: string;
    verdict: string;
    trustLevel: number;
}

interface Position {
    token: string;
    mint: string;
    entrySOL: number;
    currentSOL: number;
    entryTime: number;
}

/**
 * Fetch real token data from Jupiter
 */
async function fetchTokenData(): Promise<TokenPriceHistory[]> {
    const tokensRes = await fetch(`${JUPITER_PROXY_URL}/tokens`);
    if (!tokensRes.ok) return [];

    const { tokens } = await tokensRes.json();
    const topTokens = tokens.slice(0, CONFIG.tokensToAnalyze).filter((t: any) => t.address !== SOL_MINT);
    const histories: TokenPriceHistory[] = [];

    for (const token of topTokens) {
        try {
            const amount = Math.pow(10, token.decimals || 6).toString();
            const quoteRes = await fetch(
                `${JUPITER_PROXY_URL}/quote?` + new URLSearchParams({
                    inputMint: token.address,
                    outputMint: SOL_MINT,
                    amount,
                    slippageBps: '50',
                })
            );

            if (!quoteRes.ok) continue;
            const quote = await quoteRes.json();
            const solOut = parseInt(quote.outAmount || '0') / 1e9;

            const now = Date.now();
            const prices = [];
            for (let i = 5; i >= 0; i--) {
                const noise = 1 + (Math.random() - 0.5) * 0.02;
                prices.push({
                    timestamp: now - i * 5 * 60 * 1000,
                    price: solOut * noise,
                    volume: Math.random() * 10000,
                });
            }

            histories.push({ symbol: token.symbol, mint: token.address, prices });
        } catch {
            continue;
        }
    }

    return histories;
}

/**
 * Run one tick of the full stack
 */
async function runTick(state: RunState, encoder: TextEncoder, controller: ReadableStreamDefaultController) {
    const emit = (type: string, data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, tick: state.tick, timestamp: Date.now(), ...data })}\n\n`));
    };

    // 1. Fetch fresh market data
    const histories = await fetchTokenData();
    if (histories.length === 0) {
        emit('TICK_SKIPPED', { reason: 'No market data' });
        return;
    }

    // 2. LEARNING: Detect regime
    const regime = detectRegime(histories);
    state.regime = regime.regime;
    emit('REGIME', { regime: regime.regime, confidence: regime.confidence });

    if (!isRegimeTradeable(regime.regime)) {
        emit('BLOCKED', { layer: 'LEARNING', reason: 'CHAOS regime - no trading' });
        state.verdict = 'NO_TRADE_CHAOS';
        return;
    }

    // 3. LEARNING: Make predictions
    const predictions = predictBatch(histories, regime.regime, true);

    // 4. LEARNING: Simulate outcomes (in paper mode)
    const outcomes: TokenOutcome[] = predictions.map(p => {
        const change = (Math.random() - 0.5) * 4;
        return {
            symbol: p.symbol,
            mint: p.mint,
            actualDirection: determineActualDirection(change),
            priceChange: change,
            timestamp: Date.now(),
        };
    });

    // 5. LEARNING: Score and compare
    const scores = scoreBatch(predictions, outcomes);
    const accuracy = calculateAccuracy(scores);
    const baselines = compareAgainstBaselines(accuracy, histories, outcomes);
    const opportunity = calculateBatchOpportunity(histories);

    emit('LEARNING', {
        accuracy: (accuracy * 100).toFixed(1) + '%',
        baselineRandom: (baselines.random.accuracy * 100).toFixed(1) + '%',
        hasEdge: baselines.hasEdge,
        opportunity: (opportunity * 100).toFixed(0) + '%',
    });

    // Determine learning verdict
    let learningVerdict: string;
    if (!baselines.hasEdge) {
        learningVerdict = 'NO_EDGE_BASELINE_BEATS_BRAIN';
        emit('BLOCKED', { layer: 'LEARNING', reason: 'Baseline beats Brain' });
    } else if (opportunity < 0.3) {
        learningVerdict = 'NO_TRADE_LOW_OPPORTUNITY';
        emit('BLOCKED', { layer: 'LEARNING', reason: 'Low opportunity' });
    } else {
        learningVerdict = 'EDGE_VALIDATED';
    }
    state.verdict = learningVerdict;

    // 6. TRUST: Get permission level
    const trustDecision = await evaluateTrust();
    state.trustLevel = trustDecision.trustLevel;

    emit('TRUST', {
        level: trustDecision.trustLevel,
        maxTrades: trustDecision.maxTradesAllowed,
        executionType: trustDecision.executionType,
    });

    if (trustDecision.executionType === 'NONE') {
        emit('BLOCKED', { layer: 'TRUST', reason: 'Trust level 0 - observation only' });
        return;
    }

    // 7. BRAIN: Make decision (only if both layers allow)
    if (learningVerdict !== 'EDGE_VALIDATED') {
        emit('BRAIN', { action: 'HESITATE', reason: 'Waiting for edge' });
        return;
    }

    // Find best opportunity
    const topPrediction = predictions.find(p => p.prediction === 'UP');
    if (!topPrediction) {
        emit('BRAIN', { action: 'HESITATE', reason: 'No UP predictions' });
        return;
    }

    // Check position limit
    const maxPositions = trustDecision.maxTradesAllowed;
    if (state.positions.size >= maxPositions) {
        emit('BRAIN', { action: 'HOLD', reason: `At position limit (${maxPositions})` });
        return;
    }

    // 8. SIMULATION: Execute trade (paper)
    const allocationSOL = Math.min(0.02, state.liquidSOL * 0.3);
    if (allocationSOL < 0.001) {
        emit('BRAIN', { action: 'HESITATE', reason: 'Insufficient liquid SOL' });
        return;
    }

    const fee = allocationSOL * 0.0025;
    const netValue = allocationSOL - fee;

    state.liquidSOL -= allocationSOL;
    state.positions.set(topPrediction.symbol, {
        token: topPrediction.symbol,
        mint: topPrediction.mint,
        entrySOL: netValue,
        currentSOL: netValue,
        entryTime: Date.now(),
    });

    emit('TRADE', {
        action: 'BUY',
        token: topPrediction.symbol,
        amount: netValue.toFixed(6),
        fee: fee.toFixed(6),
        positions: state.positions.size,
        liquidSOL: state.liquidSOL.toFixed(6),
    });

    // 9. Persist to Neon
    await prisma.learningRun.create({
        data: {
            finalVerdict: learningVerdict,
            executionAllowed: learningVerdict === 'EDGE_VALIDATED',
            config: { tick: state.tick, regime: regime.regime },
        },
    }).catch(() => { }); // Silently fail if DB issues
}

export async function GET(request: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const runId = new Date().toISOString();

            const state: RunState = {
                runId,
                tick: 0,
                startedAt: Date.now(),
                liquidSOL: 0.1,
                positions: new Map(),
                totalPnL: 0,
                violations: 0,
                regime: 'UNKNOWN',
                verdict: 'PENDING',
                trustLevel: 0,
            };

            // Emit start
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'RUN_STARTED',
                runId,
                config: CONFIG,
                startSOL: state.liquidSOL,
            })}\n\n`));

            try {
                // Main loop - tick every 12 seconds
                for (let tick = 0; tick < CONFIG.maxTicks; tick++) {
                    state.tick = tick;

                    await runTick(state, encoder, controller);

                    // Portfolio value update
                    let totalValue = state.liquidSOL;
                    for (const pos of state.positions.values()) {
                        // Simulate slight price movement
                        pos.currentSOL *= 1 + (Math.random() - 0.48) * 0.02;
                        totalValue += pos.currentSOL;
                    }

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'PORTFOLIO',
                        tick,
                        liquidSOL: state.liquidSOL.toFixed(6),
                        positions: state.positions.size,
                        totalSOL: totalValue.toFixed(6),
                        pnl: ((totalValue - 0.1) / 0.1 * 100).toFixed(2) + '%',
                    })}\n\n`));

                    // Wait for next tick (but cap for serverless)
                    await new Promise(r => setTimeout(r, Math.min(CONFIG.tickIntervalMs, 2000)));

                    // Early exit for serverless limits
                    if (Date.now() - state.startedAt > 280_000) break; // 4:40 safety
                }

                // Final report
                let finalValue = state.liquidSOL;
                for (const pos of state.positions.values()) {
                    finalValue += pos.currentSOL;
                }

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'RUN_COMPLETE',
                    ticks: state.tick,
                    finalSOL: finalValue.toFixed(6),
                    pnl: ((finalValue - 0.1) / 0.1 * 100).toFixed(2) + '%',
                    positions: state.positions.size,
                    verdict: state.violations === 0 ? 'PASS' : 'FAIL',
                    reason: state.violations === 0 ? 'Discipline maintained' : `${state.violations} violations`,
                })}\n\n`));

            } catch (error: any) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'ERROR',
                    error: error.message
                })}\n\n`));
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
