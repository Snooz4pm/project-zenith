/**
 * Unified Portfolio Simulation API
 *
 * Complete integration of all Pillars (1-10) with real-time streaming
 * CHAOS tokens only, no stablecoins
 */

import { NextRequest } from 'next/server';
import { UnifiedPortfolioSimulation } from '@/lib/smartswap/simulation/UnifiedPortfolioSimulation';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function sendEvent(controller: ReadableStreamDefaultController, type: string, data: any) {
    const encoder = new TextEncoder();
    const payload = JSON.stringify({ type, data, timestamp: Date.now() });
    controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
}

export async function GET(request: NextRequest) {
    const stream = new ReadableStream({
        async start(controller) {
            try {
                sendEvent(controller, 'CONNECTED', { message: 'Starting Unified Portfolio Simulation' });

                const simulation = new UnifiedPortfolioSimulation();

                const report = await simulation.run(
                    // onProgress
                    (log, state) => {
                        sendEvent(controller, 'SIM_LOG', { log, state });
                    },
                    // onFunnelEvent
                    (type, data) => {
                        sendEvent(controller, `FUNNEL_${type}`, data);
                    }
                );

                sendEvent(controller, 'FINAL_REPORT', { report });
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
