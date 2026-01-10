/**
 * Smart Swap Tokens API
 * 
 * Server-side proxy for Railway token list
 * Avoids CORS issues by fetching on server
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RAILWAY_PROXY_TOKENS = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL
    ? `${process.env.NEXT_PUBLIC_JUPITER_PROXY_URL}/tokens`
    : 'https://jupiter-proxy-production.up.railway.app/tokens';

// Cache tokens for 5 minutes
let tokenCache: { tokens: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
    try {
        // Check cache first
        if (tokenCache && Date.now() - tokenCache.timestamp < CACHE_DURATION) {
            console.log(`[Smart Swap Tokens] Returning ${tokenCache.tokens.length} cached tokens`);
            return NextResponse.json({
                source: 'cache',
                count: tokenCache.tokens.length,
                tokens: tokenCache.tokens,
            });
        }

        console.log(`[Smart Swap Tokens] Fetching from: ${RAILWAY_PROXY_TOKENS}`);

        const response = await fetch(RAILWAY_PROXY_TOKENS, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 300 }, // Cache for 5 minutes
        });

        if (!response.ok) {
            console.error(`[Smart Swap Tokens] Railway proxy error: ${response.status}`);
            throw new Error(`Failed to fetch tokens: ${response.status}`);
        }

        const data = await response.json();
        const tokens = data.tokens || [];

        // Update cache
        tokenCache = {
            tokens: tokens.slice(0, 1000), // Limit to 1000
            timestamp: Date.now(),
        };

        console.log(`[Smart Swap Tokens] Fetched ${tokenCache.tokens.length} tokens`);

        return NextResponse.json({
            source: 'railway',
            count: tokenCache.tokens.length,
            tokens: tokenCache.tokens,
        });
    } catch (error: any) {
        console.error('[Smart Swap Tokens] Error:', error);

        // Return cached tokens if available, even if stale
        if (tokenCache) {
            console.log('[Smart Swap Tokens] Returning stale cache due to error');
            return NextResponse.json({
                source: 'stale-cache',
                count: tokenCache.tokens.length,
                tokens: tokenCache.tokens,
            });
        }

        return NextResponse.json(
            { error: error.message || 'Failed to fetch tokens' },
            { status: 500 }
        );
    }
}
