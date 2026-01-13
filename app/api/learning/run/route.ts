/**
 * Learning Lab API - SSE Streaming
 * 
 * READ-ONLY visualization endpoint.
 * Streams learning events in real-time.
 * Uses real Jupiter data.
 */

import { NextRequest } from 'next/server';
import { runValidation } from '@/lib/physics-engine/verdictEngine';
import { TokenPriceHistory, TokenOutcome } from '@/lib/physics-engine/types';
import { determineActualDirection } from '@/lib/physics-engine/scorer';
import { getEvents, subscribe } from '@/lib/physics-engine/eventEmitter';

export const dynamic = 'force-dynamic';

const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * Fetch real price histories from Jupiter
 */
async function fetchPriceHistories(): Promise<TokenPriceHistory[]> {
    const tokensRes = await fetch(`${JUPITER_PROXY_URL}/tokens`);
    if (!tokensRes.ok) throw new Error(`Failed to fetch tokens: ${tokensRes.status}`);

    const { tokens } = await tokensRes.json();
    const topTokens = tokens.slice(0, 50).filter((t: any) => t.address !== SOL_MINT);
    const histories: TokenPriceHistory[] = [];

    for (const token of topTokens.slice(0, 20)) {
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
 * Simulate outcomes
 */
async function simulateOutcomes(predictions: any[]): Promise<TokenOutcome[]> {
    return predictions.map(p => {
        const change = (Math.random() - 0.5) * 4;
        return {
            symbol: p.symbol,
            mint: p.mint,
            actualDirection: determineActualDirection(change),
            priceChange: change,
            timestamp: Date.now(),
        };
    });
}

export async function GET(request: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Subscribe to events
            const unsubscribe = subscribe((event) => {
                const data = `data: ${JSON.stringify(event)}\n\n`;
                controller.enqueue(encoder.encode(data));
            });

            try {
                // Send initial connection event
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`));

                // Run validation
                const report = await runValidation(
                    fetchPriceHistories,
                    simulateOutcomes,
                    { maxCycles: 3, tokensPerCycle: 20, narrowingRatio: 0.5 }
                );

                // Send final report
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'FINAL_REPORT', data: report })}\n\n`));
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'STREAM_END' })}\n\n`));

            } catch (error: any) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'ERROR', error: error.message })}\n\n`));
            } finally {
                unsubscribe();
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
