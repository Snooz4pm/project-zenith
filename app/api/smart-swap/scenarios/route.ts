import { NextResponse } from 'next/server';
import { ScenarioRunner } from '@/lib/smartswap/scenarios/ScenarioRunner';
import { BrainGoal, SearchableToken } from '@/types/BrainV2';
import { SmartToken } from '@/types/SmartToken';
import { normalizeToSOL } from '@/lib/solana/price';

export const dynamic = 'force-dynamic';

const STABLECOINS = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'FRAX'];
const SOL_MINT = 'So11111111111111111111111111111111111111112';

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
        isAlpha: isAlphaToken(token),
        tier: token.safeTier ?? 'REJECTED',
        source: undefined,
    };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            startAmount,           // Raw token amount (e.g., 100 for "100 USDC")
            startAmountSOL,        // Legacy: Direct SOL value (deprecated but supported)
            tokens,
            startTokenMint,
            targetTokenMint,
            desiredROI,
            preservationMode
        } = body as {
            startAmount?: number;      // NEW: Raw amount in token units
            startAmountSOL?: number;   // LEGACY: Direct SOL value
            tokens: SmartToken[];
            startTokenMint?: string;
            targetTokenMint?: string;
            desiredROI?: number;
            preservationMode?: boolean;
        };

        if (!tokens || !Array.isArray(tokens)) {
            return NextResponse.json({ error: 'Invalid tokens array' }, { status: 400 });
        }

        const startMint = startTokenMint || SOL_MINT;
        const targetMint = targetTokenMint || SOL_MINT;

        // === VALUE NORMALIZATION (Phase 2.5 Fix) ===
        let normalizedStartSOL: number;

        if (startAmountSOL && startAmountSOL > 0) {
            // Legacy path: Direct SOL amount provided
            normalizedStartSOL = startAmountSOL;
        } else if (startAmount && startAmount > 0) {
            // New path: Normalize token amount to SOL
            if (startMint === SOL_MINT) {
                normalizedStartSOL = startAmount;
            } else {
                const normalized = await normalizeToSOL(startMint, startAmount);
                if (normalized === null) {
                    return NextResponse.json({
                        error: `Unable to fetch price for ${startMint}. Try again or enter SOL equivalent.`,
                        code: 'PRICE_UNAVAILABLE'
                    }, { status: 400 });
                }
                normalizedStartSOL = normalized;
            }
        } else {
            return NextResponse.json({ error: 'Invalid start amount' }, { status: 400 });
        }

        // Apply ROI logic (cap at 20%)
        const effectiveROI = Math.min(Math.max(desiredROI || 0, 0), 0.2);
        const targetAmountSOL = normalizedStartSOL * (1 + effectiveROI);

        console.log(`[Scenario API] Starting multiversal search: ${startMint} -> ${targetMint}`);
        console.log(`[Scenario API] Raw Input: ${startAmount || startAmountSOL} -> Normalized: ${normalizedStartSOL.toFixed(6)} SOL`);
        console.log(`[Scenario API] Target: ${targetAmountSOL.toFixed(6)} SOL (ROI: ${effectiveROI * 100}%)`);
        console.log(`[Scenario API] Preservation Mode: ${preservationMode}`);
        console.log(`[Scenario API] Universe: ${tokens.length} tokens`);

        // Convert tokens
        const universe: SearchableToken[] = tokens.map(toSearchableToken);

        // Define Base Goal
        const baseGoal: BrainGoal = {
            startToken: startMint,
            targetToken: targetMint,
            startAmountSOL: normalizedStartSOL,
            targetAmountSOL,
            maxHops: 5,
            maxTotalRTL: 10,
            maxPerHopRTL: 4,
            preservation: preservationMode !== false ? {
                enabled: true,
                maxAllowedDrawdownPct: 0.7
            } : undefined
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
