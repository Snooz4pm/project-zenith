import { NextResponse } from 'next/server';
import { ScenarioRunner } from '@/lib/smartswap/scenarios/ScenarioRunner';
import { BrainGoal, SearchableToken } from '@/types/LiquidityFilter';
import { SmartToken } from '@/types/SmartToken';
import { normalizeToSOL, getTokenPriceInSOL } from '@/lib/solana/price';

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

// ============================================================================
// VALUATION GATE - NO EXECUTION WITHOUT VALID PRICING
// ============================================================================

interface ValuationResult {
    token: string;
    symbol: string;
    valueInSOL: number;
    source: 'JUPITER' | 'NATIVE';
}

interface ValuationError {
    code: 'VALUATION_UNAVAILABLE';
    token: string;
    symbol: string;
    message: string;
    suggestion: string;
}

async function requireValuation(
    tokenMint: string,
    tokenSymbol: string,
    tokens: SmartToken[]
): Promise<ValuationResult | ValuationError> {
    // SOL is always 1:1
    if (tokenMint === SOL_MINT) {
        return { token: tokenMint, symbol: 'SOL', valueInSOL: 1, source: 'NATIVE' };
    }

    // Try Jupiter price API
    const price = await getTokenPriceInSOL(tokenMint);
    if (price !== null && price > 0) {
        return { token: tokenMint, symbol: tokenSymbol, valueInSOL: price, source: 'JUPITER' };
    }

    // Fallback: check if token exists in universe with valueInSOL
    const tokenData = tokens.find(t => t.mint === tokenMint);
    if (tokenData?.valueInSOL && tokenData.valueInSOL > 0) {
        return { token: tokenMint, symbol: tokenData.symbol, valueInSOL: tokenData.valueInSOL, source: 'JUPITER' };
    }

    // FAIL - cannot price this token
    return {
        code: 'VALUATION_UNAVAILABLE',
        token: tokenMint,
        symbol: tokenSymbol,
        message: `Unable to fetch reliable SOL valuation for ${tokenSymbol}`,
        suggestion: 'Try again later, or switch to a more liquid token (SOL/USDC)',
    };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            startAmount,
            startAmountSOL,
            tokens,
            startTokenMint,
            targetTokenMint,
            desiredROI,
            preservationMode
        } = body as {
            startAmount?: number;
            startAmountSOL?: number;
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

        // Get token symbols for error messages
        const startTokenData = tokens.find(t => t.mint === startMint);
        const targetTokenData = tokens.find(t => t.mint === targetMint);
        const startSymbol = startTokenData?.symbol || startMint.slice(0, 8);
        const targetSymbol = targetTokenData?.symbol || targetMint.slice(0, 8);

        // ============================================================
        // 🔴 VALUATION GATE - NON-NEGOTIABLE
        // Brain cannot run without valid pricing for BOTH tokens
        // ============================================================

        // Validate FROM token can be priced
        const fromValuation = await requireValuation(startMint, startSymbol, tokens);
        if ('code' in fromValuation) {
            console.error(`[Scenario API] ❌ Valuation gate FAILED for FROM token: ${startSymbol}`);
            return NextResponse.json({
                error: fromValuation.message,
                code: fromValuation.code,
                details: {
                    failedToken: 'FROM',
                    token: fromValuation.token,
                    symbol: fromValuation.symbol,
                    suggestion: fromValuation.suggestion,
                    canProceed: false,
                    roiDisabled: true,
                }
            }, { status: 422 });
        }

        // Validate TO token can be priced
        const toValuation = await requireValuation(targetMint, targetSymbol, tokens);
        if ('code' in toValuation) {
            console.error(`[Scenario API] ❌ Valuation gate FAILED for TO token: ${targetSymbol}`);
            return NextResponse.json({
                error: toValuation.message,
                code: toValuation.code,
                details: {
                    failedToken: 'TO',
                    token: toValuation.token,
                    symbol: toValuation.symbol,
                    suggestion: toValuation.suggestion,
                    canProceed: false,
                    roiDisabled: true,
                }
            }, { status: 422 });
        }

        console.log(`[Scenario API] ✅ Valuation gate PASSED`);
        console.log(`[Scenario API]   FROM: ${startSymbol} @ ${fromValuation.valueInSOL} SOL (${fromValuation.source})`);
        console.log(`[Scenario API]   TO: ${targetSymbol} @ ${toValuation.valueInSOL} SOL (${toValuation.source})`);

        // ============================================================
        // VALUE NORMALIZATION (now safe - valuation confirmed)
        // ============================================================
        let normalizedStartSOL: number;

        if (startAmountSOL && startAmountSOL > 0) {
            normalizedStartSOL = startAmountSOL;
        } else if (startAmount && startAmount > 0) {
            if (startMint === SOL_MINT) {
                normalizedStartSOL = startAmount;
            } else {
                // Safe to normalize - we know price exists
                normalizedStartSOL = startAmount * fromValuation.valueInSOL;
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

        // Define Base Goal (now with validated pricing)
        const baseGoal: BrainGoal = {
            startToken: startMint,
            targetToken: targetMint,
            startAmountSOL: normalizedStartSOL,
            targetAmountSOL,
            maxHops: 5,
            maxTotalRTL: 10,
            maxPerHopRTL: 4,
            roiIntent: {
                targetPct: effectiveROI * 100,
                tolerancePct: 1,
                maxOvershootPct: 5,
            },
            preservation: preservationMode !== false ? {
                enabled: true,
                maxAllowedDrawdownPct: 0.7
            } : undefined
        };

        // Run Scenarios (valuation is guaranteed)
        const comparison = await ScenarioRunner.runAll(universe, baseGoal);

        return NextResponse.json({
            success: true,
            comparison,
            valuation: {
                from: { symbol: startSymbol, priceSOL: fromValuation.valueInSOL },
                to: { symbol: targetSymbol, priceSOL: toValuation.valueInSOL },
            }
        });

    } catch (error: any) {
        console.error('[Scenario API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Scenario search failed' },
            { status: 500 }
        );
    }
}
