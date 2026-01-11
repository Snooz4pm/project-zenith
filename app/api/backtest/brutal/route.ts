/**
 * POST /api/backtest/brutal
 * 
 * Runs 30-minute brutal simulation with real-time progress
 */

import { NextResponse } from 'next/server';
import { BrutalBrainSimulation } from '@/lib/smartswap/simulation/BrutalSimulation';
import { DecisionIntent } from '@/lib/smartswap/simulation/types';

export const dynamic = 'force-dynamic';

// Example brain (replace with real brainv2 logic)
function exampleBrain(state: any): DecisionIntent & { action: any; toToken?: string } {
    const roll = Math.random();

    if (roll < 0.25) {
        return {
            action: 'HESITATE',
            thesis: 'No clear edge detected',
            signals: {},
            expectedDirection: 'NEUTRAL',
            confidence: 0.4,
            invalidationRules: [],
        };
    }

    return {
        action: 'SWAP',
        toToken: roll > 0.6 ? 'BONK' : 'RENDER',
        thesis: 'Momentum continuation signal',
        signals: { momentum: 0.7 },
        expectedDirection: 'UP',
        expectedEdgePct: 2 + Math.random() * 2,
        confidence: 0.7,
        invalidationRules: ['If slippage spikes above 2%'],
    };
}

export async function POST(request: Request) {
    const encoder = new TextEncoder();
    const sim = new BrutalBrainSimulation();

    const stream = new ReadableStream({
        async start(controller) {
            console.log('[Brutal Simulation] Starting 30-minute streaming run...');

            try {
                const report = await sim.run(exampleBrain, (log, state) => {
                    // Send log chunk
                    const chunk = JSON.stringify({ type: 'LOG', data: log, state }) + '\n';
                    controller.enqueue(encoder.encode(chunk));
                });

                // Send final report
                const finalChunk = JSON.stringify({ type: 'REPORT', data: report }) + '\n';
                controller.enqueue(encoder.encode(finalChunk));
                controller.close();
            } catch (error: any) {
                console.error('[Brutal Simulation Streaming Error]:', error);
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
