/**
 * Smart Swap Brain API
 *
 * READ-ONLY intelligence endpoint
 * POST /api/smart-swap/brain
 * Body: BrainInput
 */

import { NextResponse } from 'next/server';
import { runBrain } from '@/lib/smartswap/brain';
import { BrainInput } from '@/types/Brain';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const input: BrainInput = await request.json();

        // Validate input
        if (!input.baseToken || !input.tokens || !Array.isArray(input.tokens)) {
            return NextResponse.json(
                { error: 'Invalid brain input: missing baseToken or tokens' },
                { status: 400 }
            );
        }

        if (!input.routes || typeof input.routes !== 'object') {
            return NextResponse.json(
                { error: 'Invalid brain input: missing routes' },
                { status: 400 }
            );
        }

        console.log(`[Brain API] Processing ${input.tokens.length} tokens with ${input.amountSOL} SOL`);

        // Run brain
        const output = runBrain(input);

        console.log(`[Brain API] Generated ${output.rankedTargets.length} ranked targets`);

        return NextResponse.json({
            success: true,
            output,
        });
    } catch (error: any) {
        console.error('[Brain API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Brain processing failed' },
            { status: 500 }
        );
    }
}
