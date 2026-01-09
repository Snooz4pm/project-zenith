// =============================================================================
// Pump.fun Scanner API - Hidden Gems Discovery
// =============================================================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cache
let cachedTokens: any[] = [];
let lastFetch = 0;
const CACHE_DURATION = 60000; // 1 minute

interface PumpToken {
    mint: string;
    name: string;
    symbol: string;
    description?: string;
    imageUri?: string;
    createdAt: number;
    ageMinutes: number;

    // Bonding curve data
    marketCap: number;
    bondingProgress: number; // 0-100%

    // Activity
    volume24h: number;
    holders: number;

    // Our scoring
    pumpScore: number;
    badges: string[];
    stage: 'EARLY' | 'BONDING' | 'GRADUATED' | 'DEAD';
}

// =============================================================================
// PUMP SCORE ALGORITHM
// =============================================================================

function calculatePumpScore(token: any): { score: number; badges: string[]; stage: 'EARLY' | 'BONDING' | 'GRADUATED' | 'DEAD' } {
    let score = 0;
    const badges: string[] = [];

    const bondingProgress = token.bondingCurveProgress || token.progress || 0;
    const volume = token.volume24h || token.volume || 0;
    const holders = token.holders || token.holderCount || 0;
    const ageHours = token.createdTimestamp
        ? (Date.now() - token.createdTimestamp) / (1000 * 60 * 60)
        : 24;

    // 1. BONDING PROGRESS (0-30 points)
    if (bondingProgress >= 90) {
        score += 30;
        badges.push('🎓 About to Graduate');
    } else if (bondingProgress >= 70) {
        score += 25;
        badges.push('🚀 Mooning');
    } else if (bondingProgress >= 50) {
        score += 20;
        badges.push('📈 Growing');
    } else if (bondingProgress >= 20) {
        score += 12;
    } else {
        score += 5;
        badges.push('🐸 Early Bird');
    }

    // 2. HOLDER COUNT (0-25 points)
    if (holders >= 1000) {
        score += 25;
        badges.push('👥 Strong Community');
    } else if (holders >= 500) {
        score += 20;
    } else if (holders >= 100) {
        score += 12;
    } else if (holders >= 50) {
        score += 5;
    } else {
        score += 2;
    }

    // 3. VOLUME (0-25 points)
    if (volume >= 100000) {
        score += 25;
        badges.push('🔥 High Volume');
    } else if (volume >= 50000) {
        score += 20;
    } else if (volume >= 10000) {
        score += 12;
    } else if (volume >= 1000) {
        score += 5;
    } else {
        score += 2;
    }

    // 4. AGE SCORE (0-20 points) - newer is better for pump plays
    if (ageHours < 1) {
        score += 20;
        badges.push('⚡ Just Launched');
    } else if (ageHours < 6) {
        score += 15;
        badges.push('🆕 Fresh');
    } else if (ageHours < 24) {
        score += 10;
    } else if (ageHours < 72) {
        score += 5;
    } else {
        score += 0;
    }

    // Determine stage
    let stage: 'EARLY' | 'BONDING' | 'GRADUATED' | 'DEAD';
    if (bondingProgress >= 100) stage = 'GRADUATED';
    else if (bondingProgress >= 50) stage = 'BONDING';
    else if (bondingProgress > 0) stage = 'EARLY';
    else stage = 'DEAD';

    return { score, badges: badges.slice(0, 3), stage };
}

// =============================================================================
// FETCH FROM PUMP.FUN
// =============================================================================

async function fetchPumpFunTokens(): Promise<any[]> {
    try {
        // Pump.fun public API for new tokens
        const res = await fetch('https://frontend-api.pump.fun/coins?limit=50&sort=created_timestamp&order=desc', {
            headers: { 'Accept': 'application/json' },
        });

        if (!res.ok) {
            console.error('[Pump.fun] API error:', res.status);
            // Fallback to DEXScreener for pump.fun tokens
            return await fetchFromDexScreener();
        }

        const data = await res.json();
        return data.coins || data || [];
    } catch (err) {
        console.error('[Pump.fun] Fetch error:', err);
        return await fetchFromDexScreener();
    }
}

async function fetchFromDexScreener(): Promise<any[]> {
    try {
        // Search DEXScreener for Pump.fun tokens
        const res = await fetch('https://api.dexscreener.com/latest/dex/search?q=pump.fun', {
            headers: { 'Accept': 'application/json' },
        });

        if (!res.ok) return [];
        const data = await res.json();

        return (data.pairs || [])
            .filter((p: any) => p.chainId === 'solana' && p.dexId === 'raydium')
            .slice(0, 30);
    } catch (err) {
        console.error('[Pump.fun] DEXScreener fallback error:', err);
        return [];
    }
}

// =============================================================================
// API HANDLER
// =============================================================================

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const isPremium = searchParams.get('premium') === 'true';
        const minScore = parseInt(searchParams.get('minScore') || '0');

        const now = Date.now();

        // Return cache if fresh
        if (cachedTokens.length > 0 && now - lastFetch < CACHE_DURATION) {
            const filtered = minScore > 0
                ? cachedTokens.filter(t => t.pumpScore >= minScore)
                : cachedTokens;
            return NextResponse.json({
                tokens: isPremium ? filtered : filtered.map(stripPremiumData),
                total: filtered.length,
                cached: true,
                isPremium,
            });
        }

        const rawTokens = await fetchPumpFunTokens();
        const tokens: PumpToken[] = [];

        for (const token of rawTokens) {
            const { score, badges, stage } = calculatePumpScore(token);
            const ageMs = token.createdTimestamp ? now - token.createdTimestamp : 0;

            tokens.push({
                mint: token.mint || token.baseToken?.address || '',
                name: token.name || token.baseToken?.name || 'Unknown',
                symbol: token.symbol || token.baseToken?.symbol || '???',
                description: token.description,
                imageUri: token.uri || token.image_uri || token.info?.imageUrl,
                createdAt: token.createdTimestamp || token.pairCreatedAt || 0,
                ageMinutes: Math.floor(ageMs / 60000),
                marketCap: token.usd_market_cap || token.marketCap || token.fdv || 0,
                bondingProgress: token.bondingCurveProgress || token.progress || 0,
                volume24h: token.volume?.h24 || token.volume24h || 0,
                holders: token.holders || token.holderCount || 0,
                pumpScore: score,
                badges,
                stage,
            });
        }

        // Sort by pump score
        tokens.sort((a, b) => b.pumpScore - a.pumpScore);

        // Update cache
        cachedTokens = tokens.slice(0, 50);
        lastFetch = now;

        const filtered = minScore > 0
            ? cachedTokens.filter(t => t.pumpScore >= minScore)
            : cachedTokens;

        return NextResponse.json({
            tokens: isPremium ? filtered : filtered.map(stripPremiumData),
            total: filtered.length,
            cached: false,
            isPremium,
            source: 'pumpfun',
        });
    } catch (err: any) {
        console.error('[Pump.fun] Error:', err);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

// Strip premium data for free users
function stripPremiumData(token: PumpToken): Partial<PumpToken> {
    return {
        mint: token.mint,
        name: token.name,
        symbol: token.symbol,
        imageUri: token.imageUri,
        createdAt: token.createdAt,
        ageMinutes: token.ageMinutes,
        marketCap: token.marketCap,
        bondingProgress: token.bondingProgress,
        volume24h: token.volume24h,
        holders: token.holders,
        // Premium fields hidden
        pumpScore: undefined,
        badges: token.badges.slice(0, 1),
        stage: token.stage,
    };
}
