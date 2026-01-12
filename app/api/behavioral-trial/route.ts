/**
 * GET /api/behavioral-trial
 * 
 * Runs the 10-Pillar Behavioral Trial
 * CHAOS tokens only, no stablecoins, no majors
 */

import { BrutalBrainSimulation } from '@/lib/smartswap/simulation/BrutalSimulation';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Vercel

export async function GET() {
    const encoder = new TextEncoder();
    const sim = new BrutalBrainSimulation();

    const stream = new ReadableStream({
        async start(controller) {
            const emit = (type: string, data: any) => {
                const chunk = JSON.stringify({ type, data, timestamp: Date.now() }) + '\n';
                controller.enqueue(encoder.encode(chunk));
            };

            try {
                emit('INIT', { message: '10-Pillar Behavioral Trial starting...' });

                const report = await sim.run((type, data) => emit(type, data));

                emit('FINAL_REPORT', report);
                controller.close();
            } catch (error: any) {
                emit('ERROR', { message: error.message });
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
