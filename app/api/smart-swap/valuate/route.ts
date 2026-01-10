/**
 * Smart Swap Valuation API
 *
 * Probes tokens for SOL value using Jupiter quotes (read-only)
 * Batched, safe, with aggressive timeouts
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

const PROBE_TIMEOUT = 800;
const MAX_PRICE_IMPACT = 15;
const BATCH_SIZE = 25;

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
    error?: string;
};

async function probeToken(mint: string, decimals: number = 6): Promise<ValuationResult> {
    if (mint === SOL_MINT) {
        return {
            mint,
            valueInSOL: 1,
            priceImpactPct: 0,
            hasRoute: true,
            decimals: 9,
        };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT);

    try {
        const probeAmount = Math.pow(10, decimals);
        const params = new URLSearchParams({
            inputMint: mint,
            outputMint: SOL_MINT,
            amount: probeAmount.toString(),
            slippageBps: '50',
        });

        const url = `${JUPITER_PROXY_QUOTE}?${params.toString()}`;
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return { mint, hasRoute: false, error: `HTTP ${response.status}` };
        }

        const quote = await response.json();

        if (!quote || !quote.outAmount || quote.outAmount === '0') {
            return { mint, hasRoute: false, error: 'No output' };
        }

        if (!quote.routePlan || quote.routePlan.length === 0) {
            return { mint, hasRoute: false, error: 'No route' };
        }

        const outAmountLamports = parseInt(quote.outAmount);
        const priceImpactPct = quote.priceImpactPct
            ? Math.abs(parseFloat(quote.priceImpactPct))
            : 0;

        if (priceImpactPct > MAX_PRICE_IMPACT) {
            return {
                mint,
                hasRoute: false,
                error: `Impact ${priceImpactPct.toFixed(1)}%`,
            };
        }

        const valueInSOL = outAmountLamports / Math.pow(10, 9);

        return {
            mint,
            valueInSOL,
            priceImpactPct,
            hasRoute: true,
            decimals,
        };
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            return { mint, hasRoute: false, error: 'Timeout' };
        }
        return { mint, hasRoute: false, error: 'Error' };
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

        console.log(`[Valuate] Starting valuation of ${limited.length} tokens`);

        // Process in batches
        for (let i = 0; i < limited.length; i += BATCH_SIZE) {
            const batch = limited.slice(i, i + BATCH_SIZE);

            const batchResults = await Promise.all(
                batch.map(t => probeToken(t.mint, t.decimals || 6))
            );

            results.push(...batchResults);

            // Small delay between batches
            if (i + BATCH_SIZE < limited.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        const actionable = results.filter(r => r.hasRoute && r.valueInSOL && r.valueInSOL > 0);

        console.log(`[Valuate] Complete: ${actionable.length}/${results.length} tokens have value`);

        return NextResponse.json({
            total: results.length,
            actionable: actionable.length,
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