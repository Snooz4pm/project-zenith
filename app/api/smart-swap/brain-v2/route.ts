/**
 * Smart Swap Brain v2 API - Graph Search Engine
 *
 * POST /api/smart-swap/brain-v2
 * Body: { goal: BrainGoal, tokens: SmartToken[] }
 *
 * Returns: BrainSearchResult + universeStats
 */

import { NextResponse } from 'next/server';
import { searchForPath } from '@/lib/smartswap/liquidityFilter';
import { BrainGoal, SearchableToken } from '@/types/LiquidityFilter';
import { SmartToken } from '@/types/SmartToken';

export const dynamic = 'force-dynamic';

const STABLECOINS = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'FRAX'];

function isStablecoin(symbol: string): boolean {
    return STABLECOINS.includes(symbol.toUpperCase());
}

/**
 * Determine if token is an alpha candidate (high-beta escape token)
 */
function isAlphaToken(token: SmartToken): boolean {
    // Alpha tokens have:
    // - High alpha score (>0.5)
    // - Or RANKABLE tier with some alpha signal
    // - Or high volatility indicators
    if (token.alphaScore && token.alphaScore > 0.5) return true;
    if (token.safeTier === 'RANKABLE' && token.alphaScore && token.alphaScore > 0.3) return true;
    // High RTL can indicate volatile alpha opportunity
    if (token.roundTripLoss && token.roundTripLoss > 5 && token.roundTripLoss < 15) return true;
    return false;
}

/**
 * Convert SmartToken to SearchableToken - NO PRE-FILTERING
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
        isAlpha: isAlphaToken(token),
        tier: token.safeTier ?? 'REJECTED',
        source: undefined, // TODO: track token source when available
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

        const SOL_MINT = 'So11111111111111111111111111111111111111112';
        if (!goal.startToken) goal.startToken = SOL_MINT;
        if (!goal.targetToken) goal.targetToken = SOL_MINT;

        console.log(`[Brain v2 API] Goal: ${goal.startAmountSOL} SOL → ${goal.targetAmountSOL} SOL`);
        console.log(`[Brain v2 API] Raw universe: ${tokens.length} tokens`);

        // Convert ALL tokens to searchable tokens - NO PRE-FILTERING
        const universe: SearchableToken[] = tokens.map(toSearchableToken);

        // Calculate universe stats for transparency
        const safeCount = universe.filter(t => t.tier === 'SAFE' && t.hasRoute).length;
        const alphaCount = universe.filter(t => t.isAlpha && t.hasRoute).length;
        const routableCount = universe.filter(t => t.hasRoute).length;
        const rejectedCount = universe.filter(t => !t.hasRoute || t.tier === 'REJECTED').length;

        console.log(`[Brain v2 API] Universe breakdown:`);
        console.log(`  • ${tokens.length} indexed tokens`);
        console.log(`  • ${safeCount} SAFE fuel tokens`);
        console.log(`  • ${alphaCount} ALPHA candidates`);
        console.log(`  • ${routableCount} routable total`);
        console.log(`  • ${rejectedCount} excluded`);

        // Run beam search with FULL universe
        const result = searchForPath(universe, goal);

        return NextResponse.json({
            success: true,
            result,
            universeStats: {
                total: tokens.length,
                safe: safeCount,
                alpha: alphaCount,
                routable: routableCount,
                excluded: rejectedCount,
            },
        });
    } catch (error: any) {
        console.error('[Brain v2 API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Brain v2 search failed' },
            { status: 500 }
        );
    }
}
