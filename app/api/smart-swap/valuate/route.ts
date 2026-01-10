/**
 * Smart Swap Valuation API - STEP 2A/2B
 *
 * Bidirectional liquidity checking:
 * 1. Token → SOL (forward)
 * 2. SOL → Token → SOL (reverse + round-trip)
 * 3. Calculate round-trip loss
 * 4. Apply hard safety filters
 *
 * Only tokens that can be ENTERED and EXITED safely pass.
 *
 * POST /api/smart-swap/valuate
 * Body: { tokens: Array<{ mint: string, decimals?: number }> }
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const JUPITER_PROXY_QUOTE = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL
    ? `${process.env.NEXT_PUBLIC_JUPITER_PROXY_URL}/quote`
    : 'https://jupiter-proxy-production.up.railway.app/quote';

// TUNED THRESHOLDS (safe but more permissive)
const PROBE_TIMEOUT = 800;
const MAX_PRICE_IMPACT = 20; // Increased from 15% to 20%
const BATCH_SIZE = 25;

// THREE-TIER SYSTEM: SAFE → RANKABLE → REJECTED
const SAFE_ROUND_TRIP_LOSS = 15; // % - SAFE tier (executable, low risk)
const RANKABLE_ROUND_TRIP_LOSS = 35; // % - RANKABLE tier (observable, high risk)
// Above 35% = REJECTED (hard reject, trash)

type TokenInput = {
    mint: string;
    decimals?: number;
};

type ValuationResult = {
    mint: string;
    valueInSOL?: number;
    priceImpactPct?: number;
    hasRoute: boolean;
    decimals?: number;
    canReverse?: boolean;
    roundTripLoss?: number;
    isSafe?: boolean;
    safeTier?: 'SAFE' | 'RANKABLE' | 'REJECTED'; // Three-tier system
    alphaScore?: number; // For RANKABLE tokens
    riskReason?: string; // Why it's risky (for RANKABLE)
    error?: string;
};

async function getQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    controller: AbortController
): Promise<any> {
    const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount,
        slippageBps: '50',
    });

    const url = `${JUPITER_PROXY_QUOTE}?${params.toString()}`;
    const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Calculate AlphaScore for RANKABLE tokens
 *
 * Score = LiquidityScore + RouteStabilityScore - ExitFriction - SlippagePenalty
 *
 * This is RELATIVE, not predictive.
 * Answers: "Which risky tokens are less stupid than others?"
 */
function calculateAlphaScore(
    valueInSOL: number,
    priceImpactPct: number,
    roundTripLoss: number,
    canReverse: boolean
): number {
    // Liquidity score (higher SOL value = better)
    const liquidityScore = Math.min(valueInSOL * 100, 50); // Cap at 50

    // Route stability (lower price impact = better)
    const routeStabilityScore = Math.max(20 - priceImpactPct, 0);

    // Exit friction (can't reverse = huge penalty)
    const exitFriction = canReverse ? 0 : 40;

    // Slippage penalty (round-trip loss)
    const slippagePenalty = roundTripLoss;

    const score = liquidityScore + routeStabilityScore - exitFriction - slippagePenalty;

    // Normalize to 0-100 range
    return Math.max(0, Math.min(100, score));
}

/**
 * Determine why a token is RANKABLE (not SAFE)
 */
function getRiskReason(
    roundTripLoss: number,
    priceImpactPct: number,
    canReverse: boolean
): string {
    const reasons: string[] = [];

    if (roundTripLoss > SAFE_ROUND_TRIP_LOSS) {
        reasons.push(`High round-trip loss (${roundTripLoss.toFixed(1)}%)`);
    }

    if (priceImpactPct > 15) {
        reasons.push(`High slippage (${priceImpactPct.toFixed(1)}%)`);
    }

    if (!canReverse) {
        reasons.push('Exit route weak');
    }

    return reasons.join(', ') || 'Thin liquidity';
}

async function probeToken(mint: string, decimals: number = 6): Promise<ValuationResult> {
    if (mint === SOL_MINT) {
        return {
            mint,
            valueInSOL: 1,
            priceImpactPct: 0,
            hasRoute: true,
            canReverse: true,
            roundTripLoss: 0,
            isSafe: true,
            decimals: 9,
        };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT * 2); // 2x timeout for bidirectional

    try {
        const probeAmount = Math.pow(10, decimals);

        // STEP 1: Token → SOL (forward check)
        const forwardQuote = await getQuote(mint, SOL_MINT, probeAmount.toString(), controller);

        if (!forwardQuote || !forwardQuote.outAmount || forwardQuote.outAmount === '0') {
            clearTimeout(timeoutId);
            return { mint, hasRoute: false, canReverse: false, isSafe: false, error: 'No forward output' };
        }

        if (!forwardQuote.routePlan || forwardQuote.routePlan.length === 0) {
            clearTimeout(timeoutId);
            return { mint, hasRoute: false, canReverse: false, isSafe: false, error: 'No forward route' };
        }

        const solOutLamports = parseInt(forwardQuote.outAmount);
        const forwardImpact = forwardQuote.priceImpactPct
            ? Math.abs(parseFloat(forwardQuote.priceImpactPct))
            : 0;

        // Hard filter: forward price impact
        if (forwardImpact > MAX_PRICE_IMPACT) {
            clearTimeout(timeoutId);
            return {
                mint,
                hasRoute: true,
                canReverse: false,
                isSafe: false,
                error: `Forward impact ${forwardImpact.toFixed(1)}%`,
            };
        }

        // STEP 2: SOL → Token (reverse check using exact output from step 1)
        let reverseQuote;
        try {
            reverseQuote = await getQuote(SOL_MINT, mint, solOutLamports.toString(), controller);
        } catch (reverseError: any) {
            clearTimeout(timeoutId);
            return {
                mint,
                hasRoute: true,
                canReverse: false,
                isSafe: false,
                valueInSOL: solOutLamports / Math.pow(10, 9),
                priceImpactPct: forwardImpact,
                error: 'Reverse quote failed',
            };
        }

        if (!reverseQuote || !reverseQuote.outAmount || reverseQuote.outAmount === '0') {
            clearTimeout(timeoutId);
            return {
                mint,
                hasRoute: true,
                canReverse: false,
                isSafe: false,
                valueInSOL: solOutLamports / Math.pow(10, 9),
                priceImpactPct: forwardImpact,
                error: 'No reverse output',
            };
        }

        if (!reverseQuote.routePlan || reverseQuote.routePlan.length === 0) {
            clearTimeout(timeoutId);
            return {
                mint,
                hasRoute: true,
                canReverse: false,
                isSafe: false,
                valueInSOL: solOutLamports / Math.pow(10, 9),
                priceImpactPct: forwardImpact,
                error: 'No reverse route',
            };
        }

        // STEP 3: Calculate round-trip loss
        const tokenOutAfterReverse = parseInt(reverseQuote.outAmount);
        const roundTripLoss = (1 - tokenOutAfterReverse / probeAmount) * 100;

        clearTimeout(timeoutId);

        const valueInSOL = solOutLamports / Math.pow(10, 9);

        // THREE-TIER CLASSIFICATION
        let safeTier: 'SAFE' | 'RANKABLE' | 'REJECTED';
        let isSafe: boolean;
        let alphaScore: number | undefined;
        let riskReason: string | undefined;

        if (roundTripLoss > RANKABLE_ROUND_TRIP_LOSS) {
            // TIER C: REJECTED - Hard reject, never touch
            safeTier = 'REJECTED';
            isSafe = false;
            return {
                mint,
                hasRoute: true,
                canReverse: true,
                isSafe: false,
                safeTier,
                valueInSOL,
                priceImpactPct: forwardImpact,
                roundTripLoss,
                error: `Round-trip loss too high (${roundTripLoss.toFixed(1)}%)`,
            };
        } else if (roundTripLoss <= SAFE_ROUND_TRIP_LOSS && forwardImpact <= 15) {
            // TIER A: SAFE - Executable, auto-swappable
            safeTier = 'SAFE';
            isSafe = true;
        } else {
            // TIER B: RANKABLE - Observable, high risk, NOT executable
            safeTier = 'RANKABLE';
            isSafe = false;
            alphaScore = calculateAlphaScore(valueInSOL, forwardImpact, roundTripLoss, true);
            riskReason = getRiskReason(roundTripLoss, forwardImpact, true);
        }

        // Return result
        return {
            mint,
            valueInSOL,
            priceImpactPct: forwardImpact,
            hasRoute: true,
            canReverse: true,
            roundTripLoss,
            isSafe,
            safeTier,
            alphaScore,
            riskReason,
            decimals,
        };
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            return { mint, hasRoute: false, canReverse: false, isSafe: false, error: 'Timeout' };
        }
        return { mint, hasRoute: false, canReverse: false, isSafe: false, error: 'Error' };
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const tokens: TokenInput[] = body.tokens || [];

        if (!Array.isArray(tokens) || tokens.length === 0) {
            return NextResponse.json({ error: 'Invalid tokens array' }, { status: 400 });
        }

        // Limit to prevent abuse
        const limited = tokens.slice(0, 1000);
        const results: ValuationResult[] = [];

        console.log(`[Valuate] Starting bidirectional check of ${limited.length} tokens`);

        // Process in batches
        for (let i = 0; i < limited.length; i += BATCH_SIZE) {
            const batch = limited.slice(i, i + BATCH_SIZE);

            const batchResults = await Promise.all(
                batch.map(t => probeToken(t.mint, t.decimals || 6))
            );

            results.push(...batchResults);

            // Log batch progress
            const safeSoFar = results.filter(r => r.isSafe).length;
            console.log(
                `[Valuate] Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${safeSoFar} safe tokens so far`
            );

            // Small delay between batches
            if (i + BATCH_SIZE < limited.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // THREE-TIER STATISTICS
        const safeTokens = results.filter(r => r.safeTier === 'SAFE');
        const rankableTokens = results.filter(r => r.safeTier === 'RANKABLE');
        const rejectedTokens = results.filter(r => r.safeTier === 'REJECTED');

        // Rank RANKABLE tokens by alphaScore (descending)
        const rankedTokens = rankableTokens
            .filter(r => r.alphaScore !== undefined)
            .sort((a, b) => (b.alphaScore || 0) - (a.alphaScore || 0));

        console.log(`[Valuate] THREE-TIER RESULTS:`);
        console.log(`  Total probed: ${results.length}`);
        console.log(`  🟢 TIER A - SAFE: ${safeTokens.length} (executable)`);
        console.log(`  🟡 TIER B - RANKABLE: ${rankableTokens.length} (observable, risky)`);
        console.log(`  🔴 TIER C - REJECTED: ${rejectedTokens.length} (hard reject)`);
        if (rankedTokens.length > 0) {
            console.log(`  Top RANKABLE alpha score: ${rankedTokens[0].alphaScore?.toFixed(1)}`);
        }

        return NextResponse.json({
            total: results.length,
            safe: safeTokens.length,
            rankable: rankableTokens.length,
            rejected: rejectedTokens.length,
            results: results,
        });
    } catch (error: any) {
        console.error('[Valuate] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Valuation failed' },
            { status: 500 }
        );
    }
}