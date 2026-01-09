// =============================================================================
// Live Token Discovery API - DEXScreener + Pump.fun
// Fetches new tokens, applies trust scoring, and returns with badges
// =============================================================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cache
let cachedTokens: any[] = [];
let lastFetch = 0;
const CACHE_DURATION = 30000; // 30 seconds

interface TokenWithScore {
    // Basic info
    address: string;
    name: string;
    symbol: string;
    logoURI?: string;
    createdAt: number;
    ageMinutes: number;

    // Market data
    price: number;
    priceUsd: number;
    priceChange5m: number;
    priceChange1h: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    marketCap: number;

    // Source
    source: 'dexscreener' | 'pumpfun' | 'birdeye';
    pairAddress?: string;
    dexUrl?: string;

    // Trust Score (0-100)
    trustScore: number;
    trustBadge: 'VERIFIED' | 'TRUSTED' | 'NEW' | 'CAUTION' | 'RISKY';

    // Premium: Detailed breakdown
    scoreBreakdown?: {
        liquidityScore: number;
        volumeScore: number;
        ageScore: number;
        holderScore: number;
        socialScore: number;
    };

    // Badges
    badges: string[];

    // Premium: Projection
    projection?: {
        trend: 'bullish' | 'bearish' | 'neutral';
        confidence: number;
        reason: string;
    };
}

// =============================================================================
// TRUST SCORE ALGORITHM
// =============================================================================

function calculateTrustScore(token: any): { score: number; breakdown: any; badges: string[] } {
    let score = 0;
    const badges: string[] = [];
    const breakdown = {
        liquidityScore: 0,
        volumeScore: 0,
        ageScore: 0,
        holderScore: 0,
        socialScore: 0,
    };

    const liquidity = token.liquidity?.usd || token.liquidity || 0;
    const volume = token.volume?.h24 || token.v24hUSD || 0;
    const ageHours = token.pairCreatedAt
        ? (Date.now() - token.pairCreatedAt) / (1000 * 60 * 60)
        : 0;

    // 1. LIQUIDITY SCORE (0-30)
    if (liquidity >= 100000) { breakdown.liquidityScore = 30; badges.push('💎 High Liquidity'); }
    else if (liquidity >= 50000) { breakdown.liquidityScore = 25; badges.push('💧 Good Liquidity'); }
    else if (liquidity >= 20000) { breakdown.liquidityScore = 18; }
    else if (liquidity >= 10000) { breakdown.liquidityScore = 12; }
    else if (liquidity >= 5000) { breakdown.liquidityScore = 6; }
    else { breakdown.liquidityScore = 0; badges.push('⚠️ Low Liquidity'); }
    score += breakdown.liquidityScore;

    // 2. VOLUME SCORE (0-25)
    const volumeToLiq = liquidity > 0 ? volume / liquidity : 0;
    if (volumeToLiq >= 5) { breakdown.volumeScore = 25; badges.push('🔥 High Volume'); }
    else if (volumeToLiq >= 2) { breakdown.volumeScore = 20; }
    else if (volumeToLiq >= 1) { breakdown.volumeScore = 15; }
    else if (volumeToLiq >= 0.5) { breakdown.volumeScore = 10; }
    else { breakdown.volumeScore = 5; }
    score += breakdown.volumeScore;

    // 3. AGE SCORE (0-20)
    if (ageHours >= 168) { breakdown.ageScore = 20; badges.push('✅ Established'); }
    else if (ageHours >= 72) { breakdown.ageScore = 15; }
    else if (ageHours >= 24) { breakdown.ageScore = 10; }
    else if (ageHours >= 6) { breakdown.ageScore = 5; badges.push('🆕 New Token'); }
    else { breakdown.ageScore = 0; badges.push('⚡ Just Launched'); }
    score += breakdown.ageScore;

    // 4. PRICE ACTION (0-15)
    const change = token.priceChange?.h24 || 0;
    if (change > 100) { breakdown.socialScore = 15; badges.push('🚀 Mooning'); }
    else if (change > 20) { breakdown.socialScore = 12; badges.push('📈 Pumping'); }
    else if (change > 0) { breakdown.socialScore = 8; }
    else if (change > -20) { breakdown.socialScore = 5; }
    else { breakdown.socialScore = 0; badges.push('📉 Dumping'); }
    score += breakdown.socialScore;

    // 5. DEX CHECK (0-10)
    if (token.dexId === 'raydium' || token.dexId === 'orca') {
        breakdown.holderScore = 10;
        badges.push('🏛️ Major DEX');
    } else {
        breakdown.holderScore = 5;
    }
    score += breakdown.holderScore;

    return { score, breakdown, badges };
}

function getTrustBadge(score: number): 'VERIFIED' | 'TRUSTED' | 'NEW' | 'CAUTION' | 'RISKY' {
    if (score >= 80) return 'VERIFIED';
    if (score >= 60) return 'TRUSTED';
    if (score >= 40) return 'NEW';
    if (score >= 25) return 'CAUTION';
    return 'RISKY';
}

function getProjection(token: any, score: number): { trend: 'bullish' | 'bearish' | 'neutral'; confidence: number; reason: string } {
    const change1h = token.priceChange?.h1 || 0;
    const change24h = token.priceChange?.h24 || 0;
    const volumeToLiq = token.liquidity?.usd ? (token.volume?.h24 || 0) / token.liquidity.usd : 0;

    if (score >= 70 && change1h > 0 && volumeToLiq > 2) {
        return { trend: 'bullish', confidence: 75, reason: 'Strong fundamentals + momentum' };
    }
    if (score >= 50 && change1h > 10) {
        return { trend: 'bullish', confidence: 60, reason: 'Good traction forming' };
    }
    if (change24h < -30 || score < 30) {
        return { trend: 'bearish', confidence: 65, reason: 'Weak signals - caution advised' };
    }
    return { trend: 'neutral', confidence: 50, reason: 'Mixed signals - monitor closely' };
}

// =============================================================================
// FETCH FROM DEXSCREENER
// =============================================================================

async function fetchDexScreener(): Promise<any[]> {
    try {
        // Get latest Solana pairs using search
        const res = await fetch('https://api.dexscreener.com/latest/dex/search?q=SOL', {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 30 },
        });

        if (!res.ok) {
            console.error('[Discovery] DEXScreener response not OK:', res.status);
            return [];
        }

        const data = await res.json();

        // Filter for Solana chain only
        const solanaPairs = (data.pairs || []).filter((p: any) => p.chainId === 'solana');

        console.log(`[Discovery] Fetched ${solanaPairs.length} Solana pairs from DEXScreener`);

        return solanaPairs.slice(0, 100);
    } catch (err) {
        console.error('[Discovery] DEXScreener error:', err);
        return [];
    }
}

// =============================================================================
// MAIN API
// =============================================================================

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const isPremium = searchParams.get('premium') === 'true';
        const source = searchParams.get('source') || 'all';
        const minLiquidity = parseInt(searchParams.get('minLiq') || '5000');

        const now = Date.now();

        // Return cache if fresh
        if (cachedTokens.length > 0 && now - lastFetch < CACHE_DURATION) {
            const filtered = cachedTokens.filter(t => t.liquidity >= minLiquidity);
            return NextResponse.json({
                tokens: isPremium ? filtered : filtered.map(stripPremiumData),
                total: filtered.length,
                cached: true,
                isPremium,
            });
        }

        // Fetch from sources
        const dexTokens = await fetchDexScreener();

        // Process and score tokens
        const tokens: TokenWithScore[] = [];

        for (const pair of dexTokens) {
            if (!pair.baseToken?.address) continue;

            const { score, breakdown, badges } = calculateTrustScore(pair);
            const trustBadge = getTrustBadge(score);
            const projection = getProjection(pair, score);

            const ageMs = pair.pairCreatedAt ? now - pair.pairCreatedAt : 0;

            tokens.push({
                address: pair.baseToken.address,
                name: pair.baseToken.name || 'Unknown',
                symbol: pair.baseToken.symbol || '???',
                logoURI: pair.info?.imageUrl,
                createdAt: pair.pairCreatedAt || 0,
                ageMinutes: Math.floor(ageMs / 60000),

                price: parseFloat(pair.priceNative || '0'),
                priceUsd: parseFloat(pair.priceUsd || '0'),
                priceChange5m: pair.priceChange?.m5 || 0,
                priceChange1h: pair.priceChange?.h1 || 0,
                priceChange24h: pair.priceChange?.h24 || 0,
                volume24h: pair.volume?.h24 || 0,
                liquidity: pair.liquidity?.usd || 0,
                marketCap: pair.fdv || 0,

                source: 'dexscreener',
                pairAddress: pair.pairAddress,
                dexUrl: pair.url,

                trustScore: score,
                trustBadge,
                scoreBreakdown: breakdown,
                badges,
                projection,
            });
        }

        // Sort by trust score (highest first)
        tokens.sort((a, b) => b.trustScore - a.trustScore);

        // Update cache
        cachedTokens = tokens.slice(0, 100);
        lastFetch = now;

        // Filter and return
        const filtered = cachedTokens.filter(t => t.liquidity >= minLiquidity);

        return NextResponse.json({
            tokens: isPremium ? filtered : filtered.map(stripPremiumData),
            total: filtered.length,
            cached: false,
            isPremium,
            lastUpdate: new Date().toISOString(),
        });
    } catch (err: any) {
        console.error('[Discovery] Error:', err);
        return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
    }
}

// Strip premium-only data for free users
function stripPremiumData(token: TokenWithScore): Partial<TokenWithScore> {
    return {
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        logoURI: token.logoURI,
        createdAt: token.createdAt,
        ageMinutes: token.ageMinutes,
        price: token.price,
        priceUsd: token.priceUsd,
        priceChange5m: token.priceChange5m,
        priceChange1h: token.priceChange1h,
        priceChange24h: token.priceChange24h,
        volume24h: token.volume24h,
        liquidity: token.liquidity,
        marketCap: token.marketCap,
        source: token.source,
        dexUrl: token.dexUrl,
        // Trust data is premium - show only basic badge for free
        trustScore: undefined,
        trustBadge: token.trustBadge === 'VERIFIED' || token.trustBadge === 'TRUSTED' ? token.trustBadge : undefined,
        scoreBreakdown: undefined,
        badges: token.badges.slice(0, 1), // Only show first badge for free users
        projection: undefined,
    };
}
