// =============================================================================
// New Coins API - Proprietary Ape Score Algorithm
// Real-time token discovery with quality scoring
// =============================================================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cache to prevent rate limiting
let cachedCoins: TokenData[] = [];
let lastFetch = 0;
const CACHE_DURATION = 30000; // 30 seconds

interface TokenData {
    id: string;
    name: string;
    symbol: string;
    logoURI?: string;
    launchedAt: number;
    ageMinutes: number;
    // Market data
    price: number;
    priceChange5m: number;
    priceChange1h: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    marketCap: number;
    // Premium: Ape Score
    apeScore?: number;
    verdict?: 'STRONG_APE' | 'CAUTIOUS' | 'HIGH_RISK' | 'DEGEN_ONLY';
    scoreBreakdown?: {
        liquidityScore: number;
        volumeScore: number;
        momentumScore: number;
        ageScore: number;
        stabilityScore: number;
    };
    whaleInterest?: boolean;
    signals?: string[];
}

// =============================================================================
// APE SCORE ALGORITHM (0-100)
// =============================================================================

function calculateApeScore(pair: any): {
    score: number;
    breakdown: any;
    verdict: 'STRONG_APE' | 'CAUTIOUS' | 'HIGH_RISK' | 'DEGEN_ONLY';
    signals: string[];
} {
    let score = 0;
    const signals: string[] = [];
    const breakdown = {
        liquidityScore: 0,
        volumeScore: 0,
        momentumScore: 0,
        ageScore: 0,
        stabilityScore: 0,
    };

    const liquidity = pair.liquidity?.usd || 0;
    const volume = pair.volume?.h24 || 0;
    const change1h = pair.priceChange?.h1 || 0;
    const change24h = pair.priceChange?.h24 || 0;
    const ageHours = pair.pairCreatedAt
        ? (Date.now() - pair.pairCreatedAt) / (1000 * 60 * 60)
        : 0;

    // 1. LIQUIDITY (0-25)
    if (liquidity >= 100000) { breakdown.liquidityScore = 25; signals.push('💎 Deep liquidity'); }
    else if (liquidity >= 50000) { breakdown.liquidityScore = 20; signals.push('💧 Solid liquidity'); }
    else if (liquidity >= 20000) { breakdown.liquidityScore = 15; }
    else if (liquidity >= 10000) { breakdown.liquidityScore = 10; }
    else if (liquidity >= 5000) { breakdown.liquidityScore = 5; signals.push('⚠️ Thin liquidity'); }
    else { breakdown.liquidityScore = 0; signals.push('🚨 Very low liquidity'); }
    score += breakdown.liquidityScore;

    // 2. VOLUME / LIQUIDITY RATIO (0-20)
    const volumeRatio = liquidity > 0 ? volume / liquidity : 0;
    if (volumeRatio >= 5) { breakdown.volumeScore = 20; signals.push('🔥 Extremely active'); }
    else if (volumeRatio >= 2) { breakdown.volumeScore = 16; signals.push('📊 High activity'); }
    else if (volumeRatio >= 1) { breakdown.volumeScore = 12; }
    else if (volumeRatio >= 0.5) { breakdown.volumeScore = 8; }
    else { breakdown.volumeScore = 4; }
    score += breakdown.volumeScore;

    // 3. MOMENTUM (0-25)
    if (change1h > 50 && change24h > 100) { breakdown.momentumScore = 25; signals.push('🚀 Explosive momentum'); }
    else if (change1h > 20 && change24h > 50) { breakdown.momentumScore = 20; signals.push('📈 Strong momentum'); }
    else if (change1h > 5 && change24h > 0) { breakdown.momentumScore = 15; }
    else if (change1h > 0) { breakdown.momentumScore = 10; }
    else if (change1h > -10) { breakdown.momentumScore = 5; }
    else { breakdown.momentumScore = 0; signals.push('📉 Losing momentum'); }
    score += breakdown.momentumScore;

    // 4. TOKEN AGE (0-15)
    if (ageHours >= 168) { breakdown.ageScore = 15; signals.push('✅ Battle tested'); }
    else if (ageHours >= 72) { breakdown.ageScore = 12; }
    else if (ageHours >= 24) { breakdown.ageScore = 8; signals.push('🆕 Young but surviving'); }
    else if (ageHours >= 6) { breakdown.ageScore = 4; signals.push('⚡ Fresh launch'); }
    else { breakdown.ageScore = 0; signals.push('🍼 Just born'); }
    score += breakdown.ageScore;

    // 5. STABILITY (0-15)
    const volatility = Math.abs(change1h - change24h / 24);
    if (volatility < 10) { breakdown.stabilityScore = 15; signals.push('🎯 Stable growth'); }
    else if (volatility < 25) { breakdown.stabilityScore = 12; }
    else if (volatility < 50) { breakdown.stabilityScore = 8; }
    else { breakdown.stabilityScore = 3; signals.push('🎢 High volatility'); }
    score += breakdown.stabilityScore;

    // Determine verdict
    let verdict: 'STRONG_APE' | 'CAUTIOUS' | 'HIGH_RISK' | 'DEGEN_ONLY';
    if (score >= 75) verdict = 'STRONG_APE';
    else if (score >= 55) verdict = 'CAUTIOUS';
    else if (score >= 35) verdict = 'HIGH_RISK';
    else verdict = 'DEGEN_ONLY';

    return { score, breakdown, verdict, signals: signals.slice(0, 3) };
}

// Check for whale activity signals
function detectWhaleInterest(pair: any): boolean {
    const volumeRatio = pair.liquidity?.usd ? (pair.volume?.h24 || 0) / pair.liquidity.usd : 0;
    const txCount = pair.txns?.h24?.buys || 0;
    return volumeRatio > 3 || txCount > 1000;
}

// =============================================================================
// DATA FETCHING (Source hidden from frontend)
// =============================================================================

async function fetchNewTokens(): Promise<any[]> {
    try {
        const res = await fetch('https://api.dexscreener.com/latest/dex/search?q=SOL', {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 30 },
        });

        if (!res.ok) return [];
        const data = await res.json();

        // Filter Solana + recently created + has liquidity
        const now = Date.now();
        return (data.pairs || [])
            .filter((p: any) =>
                p.chainId === 'solana' &&
                p.liquidity?.usd > 5000 &&
                p.pairCreatedAt &&
                (now - p.pairCreatedAt) < 7 * 24 * 60 * 60 * 1000 // 7 days
            )
            .slice(0, 50);
    } catch (err) {
        console.error('[NewCoins] Fetch error:', err);
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
        const now = Date.now();

        // Return cache if fresh
        if (cachedCoins.length > 0 && now - lastFetch < CACHE_DURATION) {
            const result = isPremium ? cachedCoins : cachedCoins.map(stripPremiumData);
            return NextResponse.json({ coins: result, cached: true, isPremium });
        }

        const rawPairs = await fetchNewTokens();
        const coins: TokenData[] = [];

        for (const pair of rawPairs) {
            if (!pair.baseToken?.address) continue;

            const { score, breakdown, verdict, signals } = calculateApeScore(pair);
            const whaleInterest = detectWhaleInterest(pair);
            const ageMs = pair.pairCreatedAt ? now - pair.pairCreatedAt : 0;

            coins.push({
                id: pair.baseToken.address,
                name: pair.baseToken.name || 'Unknown',
                symbol: pair.baseToken.symbol || '???',
                logoURI: pair.info?.imageUrl,
                launchedAt: pair.pairCreatedAt || 0,
                ageMinutes: Math.floor(ageMs / 60000),
                price: parseFloat(pair.priceUsd || '0'),
                priceChange5m: pair.priceChange?.m5 || 0,
                priceChange1h: pair.priceChange?.h1 || 0,
                priceChange24h: pair.priceChange?.h24 || 0,
                volume24h: pair.volume?.h24 || 0,
                liquidity: pair.liquidity?.usd || 0,
                marketCap: pair.fdv || 0,
                // Premium data
                apeScore: score,
                verdict,
                scoreBreakdown: breakdown,
                whaleInterest,
                signals,
            });
        }

        // Sort by Ape Score
        coins.sort((a, b) => (b.apeScore || 0) - (a.apeScore || 0));

        // Update cache
        cachedCoins = coins;
        lastFetch = now;

        const result = isPremium ? cachedCoins : cachedCoins.map(stripPremiumData);
        return NextResponse.json({
            coins: result,
            total: result.length,
            cached: false,
            isPremium,
        });
    } catch (err: any) {
        console.error('[NewCoins] Error:', err);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

// Strip premium data for free users - they see basic info only
function stripPremiumData(token: TokenData): Partial<TokenData> {
    return {
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        logoURI: token.logoURI,
        launchedAt: token.launchedAt,
        ageMinutes: token.ageMinutes,
        price: token.price,
        priceChange5m: token.priceChange5m,
        priceChange1h: token.priceChange1h,
        priceChange24h: token.priceChange24h,
        volume24h: token.volume24h,
        liquidity: token.liquidity,
        marketCap: token.marketCap,
        // Premium fields hidden
        apeScore: undefined,
        verdict: undefined,
        scoreBreakdown: undefined,
        whaleInterest: undefined,
        signals: undefined,
    };
}
