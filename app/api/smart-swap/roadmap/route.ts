/**
 * Smart Swap Roadmap API
 *
 * Discovers executable trading roadmaps using deterministic pathfinding.
 * POST /api/smart-swap/roadmap
 * Body: { inputSOL?: number }
 */

import { NextResponse } from 'next/server';
import { findRoadmaps } from '@/lib/execution-engine/pathfinder';
import { SmartToken } from '@/types/SmartToken';

export const dynamic = 'force-dynamic';

// In-memory cache of last valuation results
let cachedTokens: SmartToken[] = [];

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const inputSOL = body.inputSOL || 0.1; // Default 0.1 SOL

        // Validate input
        if (inputSOL < 0.01 || inputSOL > 10) {
            return NextResponse.json(
                { error: 'Input SOL must be between 0.01 and 10' },
                { status: 400 }
            );
        }

        // Get tokens (should be passed from client or fetched)
        const tokens: SmartToken[] = body.tokens || cachedTokens;

        if (tokens.length === 0) {
            return NextResponse.json(
                { error: 'No tokens available for pathfinding' },
                { status: 400 }
            );
        }

        console.log(`[Roadmap API] Pathfinding with ${inputSOL} SOL across ${tokens.length} tokens`);

        const roadmaps = await findRoadmaps(tokens, inputSOL);

        console.log(`[Roadmap API] Found ${roadmaps.length} roadmaps`);

        return NextResponse.json({
            success: true,
            inputSOL,
            roadmaps: roadmaps.slice(0, 10), // Return top 10
            total: roadmaps.length,
        });
    } catch (error: any) {
        console.error('[Roadmap API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Roadmap generation failed' },
            { status: 500 }
        );
    }
}

// Allow caching tokens
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        cachedTokens = body.tokens || [];
        return NextResponse.json({ success: true, cached: cachedTokens.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
