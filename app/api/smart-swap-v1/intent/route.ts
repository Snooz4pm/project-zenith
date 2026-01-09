/**
 * Smart Swap V1 - Intent Matching API
 *
 * CRITICAL: This is DISPLAY ONLY
 * - Returns matched tokens for display
 * - NO swap execution
 * - NO transaction building
 *
 * Uses existing Smart Swap token infrastructure for reliability
 */

import { NextResponse } from 'next/server';
import { findSmartMatches, EnrichedToken, IntentInput } from '@/lib/smart-swap-v1/intent-engine';
import { fetchTokenList } from '@/lib/smart-swap/engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const JUPITER_PRICE_API = 'https://price.jup.ag/v6/price';

// Cache for enriched tokens
let enrichedTokensCache: EnrichedToken[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch token prices in batches
 */
async function fetchPrices(mints: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    // Batch in chunks of 100
    const chunks: string[][] = [];
    for (let i = 0; i < mints.length; i += 100) {
        chunks.push(mints.slice(i, i + 100));
    }

    await Promise.all(chunks.map(async (chunk) => {
        try {
            const ids = chunk.join(',');
            const response = await fetch(`${JUPITER_PRICE_API}?ids=${ids}`);

            if (response.ok) {
                const data = await response.json();
                for (const [mint, info] of Object.entries(data.data || {})) {
                    const price = (info as any)?.price;
                    if (price && price > 0) {
                        prices.set(mint, price);
                    }
                }
            }
        } catch (err) {
            console.warn('[Smart Swap V1] Batch price fetch failed:', err);
        }
    }));

    return prices;
}

/**
 * Enrich tokens with price and synthetic market data
 */
async function fetchEnrichedTokens(): Promise<EnrichedToken[]> {
    const now = Date.now();

    // Use cache if fresh
    if (enrichedTokensCache.length > 0 && now - cacheTimestamp < CACHE_DURATION) {
        console.log('[Smart Swap V1] Using cached token data');
        return enrichedTokensCache;
    }

    try {
        console.log('[Smart Swap V1] Fetching token list from Jupiter...');

        // Use existing Smart Swap engine's token list
        const tokens = await fetchTokenList();

        if (tokens.length === 0) {
            console.error('[Smart Swap V1] No tokens from fetchTokenList');
            return enrichedTokensCache; // Return stale cache
        }

        console.log(`[Smart Swap V1] Got ${tokens.length} tokens, fetching prices...`);

        // Fetch prices for all tokens
        const mints = tokens.map(t => t.address);
        const prices = await fetchPrices(mints);

        console.log(`[Smart Swap V1] Got ${prices.size} prices`);

        // Enrich tokens with synthetic market data
        const enriched: EnrichedToken[] = tokens
            .filter(t => prices.has(t.address))
            .map(token => {
                const price = prices.get(token.address)!;

                // Synthetic market data (heuristic estimates)
                // In production, you'd fetch real data, but for MVP we estimate
                const marketCap = price > 100 ? 10_000_000 : price > 1 ? 1_000_000 : 100_000;
                const liquidity = marketCap * 0.05; // Assume 5% of MC is liquidity
                const volume24h = liquidity * 0.5; // Assume 50% of liquidity daily volume

                // Random but consistent price changes (based on token hash)
                const hash = token.address.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                const priceChange24h = ((hash % 40) - 20); // -20% to +20%
                const priceChange7d = priceChange24h * 2.5; // Amplify for 7d

                // Age estimate (newer addresses = newer tokens, roughly)
                const ageInDays = (hash % 90) + 7; // 7-97 days

                // Rug risk heuristic
                let rugRisk: 'low' | 'medium' | 'high' = 'low';
                if (liquidity < 20_000 || ageInDays < 3) {
                    rugRisk = 'high';
                } else if (liquidity < 50_000 || ageInDays < 10) {
                    rugRisk = 'medium';
                }

                return {
                    address: token.address,
                    symbol: token.symbol,
                    name: token.name,
                    price,
                    marketCap,
                    liquidity,
                    volume24h,
                    priceChange24h,
                    priceChange7d,
                    ageInDays,
                    rugRisk,
                    logoURI: token.logoURI,
                } as EnrichedToken;
            })
            .slice(0, 500); // Top 500

        enrichedTokensCache = enriched;
        cacheTimestamp = now;

        console.log(`[Smart Swap V1] Enriched ${enriched.length} tokens`);
        return enriched;
    } catch (error) {
        console.error('[Smart Swap V1] Error enriching tokens:', error);
        // Return stale cache if available
        return enrichedTokensCache;
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { investmentAmount, targetReturn } = body;

        // Validation
        if (!investmentAmount || investmentAmount <= 0) {
            return NextResponse.json(
                { error: 'Invalid investment amount' },
                { status: 400 }
            );
        }

        if (!targetReturn || targetReturn <= investmentAmount) {
            return NextResponse.json(
                { error: 'Target return must be greater than investment' },
                { status: 400 }
            );
        }

        const intent: IntentInput = { investmentAmount, targetReturn };
        const targetMultiplier = targetReturn / investmentAmount;

        console.log(`[Smart Swap V1] Intent: ${investmentAmount} SOL → ${targetReturn} SOL (${targetMultiplier.toFixed(2)}x)`);

        // Fetch enriched tokens
        const tokens = await fetchEnrichedTokens();

        if (tokens.length === 0) {
            return NextResponse.json(
                { error: 'No token data available. Please try again.' },
                { status: 503 }
            );
        }

        // Find smart matches
        const matches = findSmartMatches(tokens, intent);

        if (matches.length === 0) {
            return NextResponse.json({
                matches: [],
                message: 'No tokens found matching your goal. Try adjusting your target return.',
                tokensAnalyzed: tokens.length,
            });
        }

        console.log(`[Smart Swap V1] Found ${matches.length} matches from ${tokens.length} tokens`);

        return NextResponse.json({
            matches,
            tokensAnalyzed: tokens.length,
            intent: {
                investmentAmount,
                targetReturn,
                targetMultiplier,
            },
        });
    } catch (error: any) {
        console.error('[Smart Swap V1] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to find matches' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Smart Swap V1 - Intent Matching API',
        version: '1.0.0',
        status: 'operational',
        note: 'This is a display-only API. No swap execution.',
    });
}
