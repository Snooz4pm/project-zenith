/**
 * Smart Swap Brain v2 API - Graph Search Engine
 *
 * POST /api/smart-swap/brain-v2
 * Body: { goal: BrainGoal, tokens: SmartToken[] }
 *
 * Returns: BrainSearchResult
 */

import { NextResponse } from 'next/server';
import { searchForPath } from '@/lib/smartswap/brainv2';
import { BrainGoal, SearchableToken } from '@/types/BrainV2';
import { SmartToken } from '@/types/SmartToken';

export const dynamic = 'force-dynamic';

const STABLECOINS = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'FRAX'];

function isStablecoin(symbol: string): boolean {
    return STABLECOINS.includes(symbol.toUpperCase());
}

/**
 * Convert SmartToken to SearchableToken
 */
function toSearchableToken(token: SmartToken): SearchableToken {
    return {
        mint: token.mint,
        symbol: token.symbol,
        valueInSOL: token.valueInSOL ?? 0,
        roundTripLoss: token.roundTripLoss ?? 99,
        hasRoute: token.hasRoute ?? false,
        liquidityScore: token.hasRoute ? 0.5 : 0, // TODO: better liquidity scoring
        alphaScore: token.alphaScore,
        volatility: token.roundTripLoss ? token.roundTripLoss / 50 : 0, // rough estimate
        isStable: isStablecoin(token.symbol),
        tier: token.safeTier ?? 'REJECTED',
    };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { goal, tokens } = body as { goal: BrainGoal; tokens: SmartToken[] };

        // Validate goal
        if (!goal || !goal.startAmountSOL || !goal.targetAmountSOL) {
            return NextResponse.json(
                { error: 'Invalid goal: missing startAmountSOL or targetAmountSOL' },
                { status: 400 }
            );
        }

        if (!tokens || !Array.isArray(tokens)) {
            return NextResponse.json({ error: 'Invalid tokens array' }, { status: 400 });
        }

        console.log(`[Brain v2 API] Goal: ${goal.startAmountSOL} SOL → ${goal.targetAmountSOL} SOL`);
        console.log(`[Brain v2 API] Universe: ${tokens.length} tokens`);

        // Convert to searchable tokens
        const universe: SearchableToken[] = tokens
            .filter(t => t.safeTier === 'SAFE' || t.safeTier === 'RANKABLE')
            .map(toSearchableToken);

        console.log(`[Brain v2 API] Searchable universe: ${universe.length} tokens`);

        // Run beam search
        const result = searchForPath(universe, goal);

        return NextResponse.json({
            success: true,
            result,
        });
    } catch (error: any) {
        console.error('[Brain v2 API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Brain v2 search failed' },
            { status: 500 }
        );
    }
}
