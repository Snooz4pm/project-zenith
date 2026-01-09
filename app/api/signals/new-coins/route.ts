// =============================================================================
// New Coins API with Ape Score Algorithm
// BASIC: Raw token list | PREMIUM: Ape Score + Analysis
// =============================================================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cache to prevent rate limiting
let cachedCoins: any[] = [];
let lastFetch = 0;
const CACHE_DURATION = 30000; // 30 seconds

interface TokenData {
    mint: string;
    name: string;
    symbol: string;
    createdAt: number;
    logoURI?: string;
    // Basic data (free)
    price: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    // Premium data (paid)
    apeScore?: number;
    scoreBreakdown?: {
        liquidityScore: number;
        holderScore: number;
        devWalletScore: number;
        socialScore: number;
        ageScore: number;
    };
    verdict?: 'STRONG_APE' | 'CAUTIOUS' | 'HIGH_RISK' | 'DEGEN_ONLY';
    whaleInterest?: boolean;
    similarTo?: string;
}

// =============================================================================
// APE SCORE ALGORITHM (0-100)
// =============================================================================

function calculateApeScore(token: any): { score: number; breakdown: any; verdict: string } {
    let score = 0;
    const breakdown = {
        liquidityScore: 0,
        holderScore: 0,
        devWalletScore: 0,
        socialScore: 0,
        ageScore: 0,
    };

    // 1. LIQUIDITY SCORE (0-25 points)
    // Higher liquidity = safer to ape
    const liquidity = token.liquidity || 0;
    if (liquidity >= 100000) breakdown.liquidityScore = 25;
    else if (liquidity >= 50000) breakdown.liquidityScore = 20;
    else if (liquidity >= 20000) breakdown.liquidityScore = 15;
    else if (liquidity >= 10000) breakdown.liquidityScore = 10;
    else if (liquidity >= 5000) breakdown.liquidityScore = 5;
    else breakdown.liquidityScore = 0;
    score += breakdown.liquidityScore;

    // 2. HOLDER DISTRIBUTION SCORE (0-20 points)
    // More distributed = less rug risk
    const holders = token.holder || token.uniqueWallets || 0;
    if (holders >= 1000) breakdown.holderScore = 20;
    else if (holders >= 500) breakdown.holderScore = 15;
    else if (holders >= 100) breakdown.holderScore = 10;
    else if (holders >= 50) breakdown.holderScore = 5;
    else breakdown.holderScore = 0;
    score += breakdown.holderScore;

    // 3. DEV WALLET SCORE (0-20 points)
    // Lower dev holding = safer
    const topHolderPct = token.topHolderPct || 50;
    if (topHolderPct <= 5) breakdown.devWalletScore = 20;
    else if (topHolderPct <= 10) breakdown.devWalletScore = 15;
    else if (topHolderPct <= 20) breakdown.devWalletScore = 10;
    else if (topHolderPct <= 30) breakdown.devWalletScore = 5;
    else breakdown.devWalletScore = 0;
    score += breakdown.devWalletScore;

    // 4. SOCIAL/VOLUME VELOCITY (0-20 points)
    // High volume relative to liquidity = momentum
    const volumeToLiq = liquidity > 0 ? (token.v24hUSD || 0) / liquidity : 0;
    if (volumeToLiq >= 5) breakdown.socialScore = 20;
    else if (volumeToLiq >= 2) breakdown.socialScore = 15;
    else if (volumeToLiq >= 1) breakdown.socialScore = 10;
    else if (volumeToLiq >= 0.5) breakdown.socialScore = 5;
    else breakdown.socialScore = 0;
    score += breakdown.socialScore;

    // 5. TOKEN AGE SCORE (0-15 points)
    // Survived early = proven
    const ageHours = token.createdAt
        ? (Date.now() - token.createdAt) / (1000 * 60 * 60)
        : 0;
    if (ageHours >= 168) breakdown.ageScore = 15; // 7+ days
    else if (ageHours >= 72) breakdown.ageScore = 12; // 3+ days
    else if (ageHours >= 24) breakdown.ageScore = 8; // 1+ day
    else if (ageHours >= 6) breakdown.ageScore = 4; // 6+ hours
    else breakdown.ageScore = 0; // Very new
    score += breakdown.ageScore;

    // Determine verdict
    let verdict: string;
    if (score >= 80) verdict = 'STRONG_APE';
    else if (score >= 60) verdict = 'CAUTIOUS';
    else if (score >= 40) verdict = 'HIGH_RISK';
    else verdict = 'DEGEN_ONLY';

    return { score, breakdown, verdict };
}

// Detect if whale wallets are interested
function detectWhaleInterest(token: any): boolean {
    // This would check against known whale wallet database
    // Placeholder: based on volume/liquidity ratio
    const volumeToLiq = token.liquidity > 0 ? (token.v24hUSD || 0) / token.liquidity : 0;
    return volumeToLiq > 3; // High activity suggests whale interest
}

// Pattern matching against known successful tokens
function findSimilarToken(token: any): string | null {
    // Simple pattern matching based on name/symbol patterns
    const symbol = token.symbol?.toLowerCase() || '';
    const name = token.name?.toLowerCase() || '';

    if (symbol.includes('pepe') || name.includes('pepe')) return 'PEPE';
    if (symbol.includes('dog') || name.includes('dog')) return 'DOGE';
    if (symbol.includes('cat') || name.includes('cat')) return 'POPCAT';
    if (symbol.includes('wif') || name.includes('wif')) return 'WIF';
    if (symbol.includes('bonk') || name.includes('bonk')) return 'BONK';

    return null;
}

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

        const coins: TokenData[] = [];

        // Fetch from Birdeye
        try {
            const birdeyeRes = await fetch(
                'https://public-api.birdeye.so/defi/tokenlist?sort_by=v24hChangePercent&sort_type=desc&offset=0&limit=30',
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
                    const createdAt = token.createdAt || 0;
                    const isNew = now - createdAt < 7 * 24 * 60 * 60 * 1000; // 7 days

                    if (isNew && token.liquidity > 1000) {
                        // Calculate APE score
                        const { score, breakdown, verdict } = calculateApeScore(token);
                        const whaleInterest = detectWhaleInterest(token);
                        const similarTo = findSimilarToken(token);

                        coins.push({
                            mint: token.address,
                            name: token.name || 'Unknown',
                            symbol: token.symbol || '???',
                            createdAt,
                            logoURI: token.logoURI,
                            // Basic (free)
                            price: token.price || 0,
                            priceChange24h: token.v24hChangePercent || 0,
                            volume24h: token.v24hUSD || 0,
                            liquidity: token.liquidity || 0,
                            // Premium
                            apeScore: score,
                            scoreBreakdown: breakdown,
                            verdict,
                            whaleInterest,
                            similarTo: similarTo || undefined,
                        });
                    }
                }
            }
        } catch (err) {
            console.error('[NewCoins] Birdeye fetch error:', err);
        }

        // Sort by Ape Score (highest first)
        coins.sort((a, b) => (b.apeScore || 0) - (a.apeScore || 0));

        // Update cache
        cachedCoins = coins.slice(0, 50);
        lastFetch = now;

        // Return based on access level
        const result = isPremium ? cachedCoins : cachedCoins.map(stripPremiumData);

        return NextResponse.json({
            coins: result,
            total: coins.length,
            cached: false,
            isPremium,
        });
    } catch (err: any) {
        console.error('[NewCoins] Error:', err);
        return NextResponse.json({ error: 'Failed to fetch new coins' }, { status: 500 });
    }
}

// Remove premium-only data for free users
function stripPremiumData(token: TokenData): Partial<TokenData> {
    return {
        mint: token.mint,
        name: token.name,
        symbol: token.symbol,
        createdAt: token.createdAt,
        logoURI: token.logoURI,
        price: token.price,
        priceChange24h: token.priceChange24h,
        volume24h: token.volume24h,
        liquidity: token.liquidity,
        // Premium fields hidden - show teaser
        apeScore: undefined,
        scoreBreakdown: undefined,
        verdict: undefined,
        whaleInterest: undefined,
        similarTo: undefined,
    };
}
