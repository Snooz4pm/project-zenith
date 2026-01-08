// =============================================================================
// New Coins API - Fetches fresh token launches from Pump.fun and Birdeye
// =============================================================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cache to prevent rate limiting
let cachedCoins: any[] = [];
let lastFetch = 0;
const CACHE_DURATION = 60000; // 1 minute

interface NewCoin {
    mint: string;
    name: string;
    symbol: string;
    createdAt: number;
    initialLiquidity: number;
    currentPrice: number;
    priceChange24h: number;
    volume24h: number;
    holders: number;
    source: 'pumpfun' | 'raydium' | 'unknown';
    risk: 'low' | 'medium' | 'high';
    logoURI?: string;
}

export async function GET() {
    try {
        const now = Date.now();

        // Return cache if fresh
        if (cachedCoins.length > 0 && now - lastFetch < CACHE_DURATION) {
            return NextResponse.json({ coins: cachedCoins, cached: true });
        }

        const coins: NewCoin[] = [];

        // 1. Fetch from Birdeye (new tokens in last 24h)
        try {
            const birdeyeRes = await fetch(
                'https://public-api.birdeye.so/defi/tokenlist?sort_by=v24hChangePercent&sort_type=desc&offset=0&limit=20',
                {
                    headers: {
                        'X-API-KEY': process.env.BIRDEYE_API_KEY || '',
                        'x-chain': 'solana',
                    },
                }
            );

            if (birdeyeRes.ok) {
                const data = await birdeyeRes.json();
                const tokens = data.data?.tokens || [];

                for (const token of tokens) {
                    // Only include tokens created in last 7 days
                    const createdAt = token.createdAt || 0;
                    const isNew = now - createdAt < 7 * 24 * 60 * 60 * 1000;

                    if (isNew && token.liquidity > 1000) {
                        coins.push({
                            mint: token.address,
                            name: token.name || 'Unknown',
                            symbol: token.symbol || '???',
                            createdAt,
                            initialLiquidity: token.liquidity || 0,
                            currentPrice: token.price || 0,
                            priceChange24h: token.v24hChangePercent || 0,
                            volume24h: token.v24hUSD || 0,
                            holders: token.holder || 0,
                            source: 'raydium',
                            risk: token.liquidity < 10000 ? 'high' : token.liquidity < 50000 ? 'medium' : 'low',
                            logoURI: token.logoURI,
                        });
                    }
                }
            }
        } catch (err) {
            console.error('[NewCoins] Birdeye fetch error:', err);
        }

        // 2. Fetch from Jupiter strict list for validation
        try {
            const jupRes = await fetch('https://token.jup.ag/strict');
            if (jupRes.ok) {
                const jupTokens = await jupRes.json();
                const jupMints = new Set(jupTokens.map((t: any) => t.address));

                // Mark coins as lower risk if on Jupiter strict list
                for (const coin of coins) {
                    if (jupMints.has(coin.mint)) {
                        coin.risk = 'low';
                    }
                }
            }
        } catch {
            // Non-critical
        }

        // Sort by creation time (newest first)
        coins.sort((a, b) => b.createdAt - a.createdAt);

        // Update cache
        cachedCoins = coins.slice(0, 50);
        lastFetch = now;

        return NextResponse.json({
            coins: cachedCoins,
            total: coins.length,
            cached: false,
        });
    } catch (err: any) {
        console.error('[NewCoins] Error:', err);
        return NextResponse.json({ error: 'Failed to fetch new coins' }, { status: 500 });
    }
}
