/**
 * Multi-Scenario Search API
 * 
 * POST /api/smart-swap/scenarios
 * Body: { startAmountSOL: number, tokens: SmartToken[] }
 * 
 * Runs 5 independent searches and returns valid comparison.
 */

import { NextResponse } from 'next/server';
import { ScenarioRunner } from '@/lib/smartswap/scenarios/ScenarioRunner';
import { BrainGoal, SearchableToken } from '@/types/BrainV2';
import { SmartToken } from '@/types/SmartToken';

export const dynamic = 'force-dynamic';

const STABLECOINS = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'FRAX'];

function isStablecoin(symbol: string): boolean {
    return STABLECOINS.includes(symbol.toUpperCase());
}

function isAlphaToken(token: SmartToken): boolean {
    if (token.alphaScore && token.alphaScore > 0.5) return true;
    if (token.safeTier === 'RANKABLE' && token.alphaScore && token.alphaScore > 0.3) return true;
    if (token.roundTripLoss && token.roundTripLoss > 5 && token.roundTripLoss < 15) return true;
    return false;
}

function toSearchableToken(token: SmartToken): SearchableToken {
    return {
        mint: token.mint,
        symbol: token.symbol,
        valueInSOL: token.valueInSOL ?? 0,
        roundTripLoss: token.roundTripLoss ?? 99,
        hasRoute: token.hasRoute ?? false,
        liquidityScore: token.hasRoute ? 0.5 : 0,
        alphaScore: token.alphaScore,
        volatility: token.roundTripLoss ? token.roundTripLoss / 50 : 0,
        isStable: isStablecoin(token.symbol),
        isAlpha: isAlphaToken(token), // Critical for Volatility scenarios
        tier: token.safeTier ?? 'REJECTED',
        source: undefined,
    };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { startAmountSOL, tokens, startTokenMint, targetTokenMint, desiredROI } = body as {
            startAmountSOL: number;
            tokens: SmartToken[];
            startTokenMint?: string;
            targetTokenMint?: string;
            desiredROI?: number;
        };

        if (!startAmountSOL || startAmountSOL <= 0) {
            return NextResponse.json({ error: 'Invalid startAmountSOL' }, { status: 400 });
        }

        if (!tokens || !Array.isArray(tokens)) {
            return NextResponse.json({ error: 'Invalid tokens array' }, { status: 400 });
        }

        const SOL_MINT = 'So11111111111111111111111111111111111111112';
        const startMint = startTokenMint || SOL_MINT;
        const targetMint = targetTokenMint || SOL_MINT;

        // Apply ROI logic (cap at 20%)
        const effectiveROI = Math.min(Math.max(desiredROI || 0, 0), 0.2);
        const targetAmountSOL = startAmountSOL * (1 + effectiveROI);

        console.log(`[Scenario API] Starting multiversal search: ${startMint} -> ${targetMint}`);
        console.log(`[Scenario API] Amount: ${startAmountSOL} SOL -> ${targetAmountSOL.toFixed(4)} SOL (ROI: ${effectiveROI * 100}%)`);
        console.log(`[Scenario API] Universe: ${tokens.length} tokens`);

        // Convert tokens
        const universe: SearchableToken[] = tokens.map(toSearchableToken);

        // Define Base Goal (will be adapted per scenario)
        const baseGoal: BrainGoal = {
            startToken: startMint,
            targetToken: targetMint,
            startAmountSOL,
            targetAmountSOL,
            maxHops: 5, // Default, overridden by scenario
            maxTotalRTL: 10,
            maxPerHopRTL: 4,
        };

        // Run Scenarios
        const comparison = await ScenarioRunner.runAll(universe, baseGoal);

        return NextResponse.json({
            success: true,
            comparison
        });

    } catch (error: any) {
        console.error('[Scenario API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Scenario search failed' },
            { status: 500 }
        );
    }
}
