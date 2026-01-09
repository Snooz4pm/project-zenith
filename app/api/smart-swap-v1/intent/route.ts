/**
 * Smart Swap V1 - Intent Matching API
 *
 * CRITICAL: This is DISPLAY ONLY
 * - Returns matched tokens for display
 * - NO swap execution
 * - NO transaction building
 */

import { NextResponse } from 'next/server';
import { findSmartMatches, EnrichedToken, IntentInput } from '@/lib/smart-swap-v1/intent-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Cache for enriched tokens
let enrichedTokensCache: EnrichedToken[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch and enrich token data from DexScreener
 */
async function fetchEnrichedTokens(): Promise<EnrichedToken[]> {
    const now = Date.now();

    // Use cache if fresh
    if (enrichedTokensCache.length > 0 && now - cacheTimestamp < CACHE_DURATION) {
        console.log('[Smart Swap V1] Using cached token data');
        return enrichedTokensCache;
    }

    try {
        console.log('[Smart Swap V1] Fetching fresh token data from DexScreener...');

        // Fetch trending SOL pairs
        const response = await fetch(`${DEXSCREENER_API}/tokens/${SOL_MINT}`);
        if (!response.ok) throw new Error('Failed to fetch token data');

        const data = await response.json();
        const pairs = data.pairs || [];

        // Enrich and filter tokens
        const enriched: EnrichedToken[] = pairs
            .filter((pair: any) => {
                // Basic filters
                if (pair.chainId !== 'solana') return false;
                if (!pair.baseToken?.address) return false;
                if (pair.baseToken.address === SOL_MINT) return false;

                // Must have minimum data
                if (!pair.liquidity?.usd || !pair.volume?.h24) return false;
                if (pair.liquidity.usd < 5_000) return false; // Minimum $5k liquidity

                return true;
            })
            .map((pair: any) => {
                // Calculate age
                const ageInDays = pair.pairCreatedAt
                    ? Math.floor((Date.now() - pair.pairCreatedAt) / (1000 * 60 * 60 * 24))
                    : 30;

                // Assess rug risk (simplified heuristic)
                let rugRisk: 'low' | 'medium' | 'high' = 'low';
                if (pair.liquidity.usd < 20_000 || ageInDays < 2) {
                    rugRisk = 'high';
                } else if (pair.liquidity.usd < 50_000 || ageInDays < 7) {
                    rugRisk = 'medium';
                }

                return {
                    address: pair.baseToken.address,
                    symbol: pair.baseToken.symbol || 'UNKNOWN',
                    name: pair.baseToken.name || 'Unknown Token',
                    price: parseFloat(pair.priceUsd || '0'),
                    marketCap: pair.fdv || pair.marketCap || 0,
                    liquidity: pair.liquidity.usd,
                    volume24h: pair.volume?.h24 || 0,
                    priceChange24h: pair.priceChange?.h24 || 0,
                    priceChange7d: pair.priceChange?.h24 * 3 || 0, // Approximate 7d from 24h
                    ageInDays,
                    rugRisk,
                } as EnrichedToken;
            })
            .slice(0, 500); // Limit to 500 most liquid tokens

        enrichedTokensCache = enriched;
        cacheTimestamp = now;

        console.log(`[Smart Swap V1] Cached ${enriched.length} enriched tokens`);
        return enriched;
    } catch (error) {
        console.error('[Smart Swap V1] Error fetching token data:', error);
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
