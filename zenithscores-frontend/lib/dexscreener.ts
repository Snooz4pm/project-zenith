// DexScreener API Integration
// API Docs: https://docs.dexscreener.com/api/reference
// Rate Limits: 300 req/min for pairs, 60 req/min for tokens

const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com/latest';

export interface DexPair {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceNative: string;
    priceUsd?: string;
    txns: {
        m5: { buys: number; sells: number };
        h1: { buys: number; sells: number };
        h6: { buys: number; sells: number };
        h24: { buys: number; sells: number };
    };
    volume: {
        h24: number;
        h6: number;
        h1: number;
        m5: number;
    };
    priceChange: {
        m5: number;
        h1: number;
        h6: number;
        h24: number;
    };
    liquidity?: {
        usd?: number;
        base: number;
        quote: number;
    };
    fdv?: number;
    marketCap?: number;
    pairCreatedAt?: number;
}

export interface TokenProfile {
    chainId: string;
    tokenAddress: string;
    icon?: string;
    header?: string;
    description?: string;
    links?: Array<{ type: string; label: string; url: string }>;
}

/**
 * Search for pairs by query (token address, name, or symbol)
 */
export async function searchPairs(query: string): Promise<DexPair[]> {
    try {
        const response = await fetch(
            `${DEXSCREENER_BASE_URL}/dex/search?q=${encodeURIComponent(query)}`,
            { cache: 'no-store' }
        );
        if (!response.ok) throw new Error(`DexScreener API error: ${response.status}`);

        const data = await response.json();
        return data.pairs || [];
    } catch (error) {
        console.error('DexScreener search error:', error);
        return [];
    }
}

/**
 * Get pair data by chain and pair address
 */
export async function getPair(chainId: string, pairAddress: string): Promise<DexPair | null> {
    try {
        const response = await fetch(`${DEXSCREENER_BASE_URL}/dex/pairs/${chainId}/${pairAddress}`);
        if (!response.ok) throw new Error(`DexScreener API error: ${response.status}`);

        const data = await response.json();
        return data.pair || null;
    } catch (error) {
        console.error('DexScreener getPair error:', error);
        return null;
    }
}

/**
 * Get multiple pairs by token addresses
 */
export async function getPairsByTokens(tokenAddresses: string[]): Promise<DexPair[]> {
    try {
        const addresses = tokenAddresses.join(',');
        const response = await fetch(`${DEXSCREENER_BASE_URL}/dex/tokens/${addresses}`);
        if (!response.ok) throw new Error(`DexScreener API error: ${response.status}`);

        const data = await response.json();
        return data.pairs || [];
    } catch (error) {
        console.error('DexScreener getPairsByTokens error:', error);
        return [];
    }
}

/**
 * Get latest token profiles
 */
export async function getLatestTokenProfiles(): Promise<TokenProfile[]> {
    try {
        const response = await fetch(`${DEXSCREENER_BASE_URL}/token-profiles/latest/v1`);
        if (!response.ok) throw new Error(`DexScreener API error: ${response.status}`);

        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('DexScreener getLatestTokenProfiles error:', error);
        return [];
    }
}

/**
 * Get latest boosted tokens
 */
export async function getBoostedTokens(): Promise<any[]> {
    try {
        const response = await fetch(`${DEXSCREENER_BASE_URL}/token-boosts/latest/v1`);
        if (!response.ok) throw new Error(`DexScreener API error: ${response.status}`);

        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('DexScreener getBoostedTokens error:', error);
        return [];
    }
}

/**
 * Get top tokens by chain
 */
export async function getTopTokensByChain(chainId: string, limit: number = 20): Promise<DexPair[]> {
    try {
        // Search for top pairs on the chain
        const response = await fetch(`${DEXSCREENER_BASE_URL}/dex/search?q=${chainId}`);
        if (!response.ok) throw new Error(`DexScreener API error: ${response.status}`);

        const data = await response.json();
        const pairs = data.pairs || [];

        // Sort by liquidity and volume
        return pairs
            .filter((p: DexPair) => p.chainId === chainId && p.liquidity?.usd)
            .sort((a: DexPair, b: DexPair) => {
                const aScore = (a.liquidity?.usd || 0) + (a.volume.h24 || 0);
                const bScore = (b.liquidity?.usd || 0) + (b.volume.h24 || 0);
                return bScore - aScore;
            })
            .slice(0, limit);
    } catch (error) {
        console.error('DexScreener getTopTokensByChain error:', error);
        return [];
    }
}

/**
 * Helper: Convert chain name to DexScreener chain ID
 */
export function getChainId(chain: string): string {
    const chainMap: Record<string, string> = {
        'ethereum': 'ethereum',
        'arbitrum': 'arbitrum',
        'base': 'base',
    };
    return chainMap[chain.toLowerCase()] || 'ethereum';
}

// ========== TERMINAL TYPES AND FUNCTIONS ==========

export interface NormalizedToken {
    id: string;
    symbol: string;
    name: string;
    chainId: string;
    chainName: string;
    address: string;
    priceUsd: number;
    priceChange24h: number;
    liquidityUsd: number;
    volume24hUsd: number;
    pairAddress: string;
    dexUrl: string;
    isMeme?: boolean;
}

// ========== TRENDING & DISCOVERY ENGINE (EXECUTION FIRST) ==========

// 1️⃣ SINGLE SOURCE OF TRUTH
// ===== EXECUTION CHAINS (FEE-GENERATING ONLY) =====
export const EXECUTION_CHAINS = ['ethereum', 'base', 'arbitrum'] as const;
export type ExecutionChain = typeof EXECUTION_CHAINS[number];

// ===== MEME TOKEN HEURISTICS =====
const MEME_KEYWORDS = [
    'inu', 'dog', 'doge', 'pepe', 'frog', 'cat', 'wojak', 'shib', 'elon', 'bonk', 'based', 'mog', 'chad', 'meme',
];

function isMemeToken(pair: DexPair): boolean {
    const name = pair.baseToken.name.toLowerCase();
    const symbol = pair.baseToken.symbol.toLowerCase();

    return MEME_KEYWORDS.some(k =>
        name.includes(k) || symbol.includes(k)
    );
}

/**
 * IMPORTANT:
 * This engine ONLY surfaces tokens that can be swapped
 * via 0x on supported EVM chains.
 * If a token cannot generate affiliate fees, it MUST NOT appear.
 */

interface ChainProfile {
    minLiquidity: number;
    minVolume24h: number;
    minTxns1h?: number;
    minAgeHours?: number;
    minFdv?: number;
}

interface MemeProfile {
    minLiquidity: number;
    minVolume24h: number;
    minTxns1h: number;
    minAgeHours: number;
}

// 3️⃣ REVENUE-OPTIMIZED THRESHOLDS (LOWER = MORE TOKENS = MORE SWAPS)
const CHAIN_PROFILES: Record<ExecutionChain, ChainProfile> = {
    base: {
        minLiquidity: 3000,      // Lowered from 15k - allow newer tokens
        minVolume24h: 2000,      // Lowered from 50k - capture early movers
        minTxns1h: 5,            // Lowered from 50 - show active pairs
        minAgeHours: 1           // Lowered from 24 - fresh tokens allowed
    },
    arbitrum: {
        minLiquidity: 5000,      // Lowered from 50k
        minVolume24h: 5000       // Lowered from 250k
    },
    ethereum: {
        minLiquidity: 25000,     // Lowered from 500k
        minVolume24h: 25000,     // Lowered from 1M
        minFdv: 100000,          // Lowered from 5M
        minAgeHours: 6           // Lowered from 168 (7 days)
    }
};

const MEME_PROFILES: Record<ExecutionChain, MemeProfile> = {
    base: {
        minLiquidity: 2000,      // Lowered from 25k - catch meme pumps early
        minVolume24h: 1000,      // Lowered from 100k - viral potential
        minTxns1h: 3,            // Lowered from 100 - active community
        minAgeHours: 0.5,        // Lowered from 12 - brand new memes allowed
    },
    arbitrum: {
        minLiquidity: 3000,      // Lowered from 75k
        minVolume24h: 3000,      // Lowered from 300k
        minTxns1h: 5,            // Lowered from 150
        minAgeHours: 1,          // Lowered from 24
    },
    ethereum: {
        minLiquidity: 10000,     // Lowered from 750k
        minVolume24h: 10000,     // Lowered from 2M
        minTxns1h: 10,           // Lowered from 200
        minAgeHours: 2,          // Lowered from 72
    },
};

/**
 * Calculates the "Execution Rank" for a pair.
 * Formula: (Volume Velocity) * (Liquidity Depth) * (Trend Strength)
 * Prioritizes active, liquid, moving assets.
 */
function calculateRankScore(pair: DexPair): number {
    const vol1h = pair.volume?.h1 || 0;
    const vol24h = pair.volume?.h24 || 0;
    const liq = pair.liquidity?.usd || 0;
    const change1h = Math.abs(pair.priceChange?.h1 || 0);

    // 1. Volume Velocity (Weighted recent activity)
    // 4x multiplier on 1h volume to capture "now"
    const velocityScore = (vol1h * 4) + vol24h;

    // 2. Liquidity Depth Factor (Logarithmic)
    // Prevents massive MCaps from totally dominating, but requires baseline
    const depthFactor = Math.log10(liq + 1);

    // 3. Trend Strength
    // Assets in motion get clicks. Min multiplier 1 to avoid zeroing.
    const trendFactor = Math.max(1, change1h);

    return velocityScore * depthFactor * trendFactor;
}

/**
 * Validates if a token is safe and viable for 0x execution
 */
function validateTokenQuality(pair: DexPair, profile: ChainProfile, chain: ExecutionChain): boolean {
    const liq = pair.liquidity?.usd || 0;
    const vol = pair.volume?.h24 || 0;
    const txns1h = (pair.txns?.h1?.buys || 0) + (pair.txns?.h1?.sells || 0);
    const fdv = pair.fdv || 0;
    const pairAgeHours = (Date.now() - (pair.pairCreatedAt || 0)) / (1000 * 60 * 60);

    const isMeme = isMemeToken(pair);

    // ===== ROUTABILITY (NON-NEGOTIABLE) =====
    const validQuotes = ['WETH', 'USDC', 'USDT', 'DAI', 'ETH'];
    if (!validQuotes.includes(pair.quoteToken.symbol.toUpperCase())) return false;

    // ===== HONEYPOT CHECK =====
    const buys24 = pair.txns?.h24?.buys || 0;
    const sells24 = pair.txns?.h24?.sells || 0;
    if (buys24 > 20 && sells24 === 0) return false;

    // ===== MEME PATH =====
    if (isMeme) {
        const memeProfile = MEME_PROFILES[chain];
        if (liq < memeProfile.minLiquidity) return false;
        if (vol < memeProfile.minVolume24h) return false;
        if (txns1h < memeProfile.minTxns1h) return false;
        if (pairAgeHours < memeProfile.minAgeHours) return false;
        return true;
    }

    // ===== NORMAL TOKEN PATH =====
    if (liq < profile.minLiquidity) return false;
    if (vol < profile.minVolume24h) return false;
    if (profile.minTxns1h && txns1h < profile.minTxns1h) return false;
    if (profile.minAgeHours && pairAgeHours < profile.minAgeHours) return false;
    if (profile.minFdv && fdv < profile.minFdv) return false;

    return true;
}


// 2️⃣ FIX CHAIN_DISPLAY (UI ONLY, EXECUTION SAFE)
const CHAIN_DISPLAY: Record<ExecutionChain, string> = {
    ethereum: 'Ethereum',
    base: 'Base',
    arbitrum: 'Arbitrum',
};

// 5️⃣ FIX normalizePair (CHAIN NAME SAFETY)
function normalizePair(pair: DexPair): NormalizedToken {
    return {
        id: `${pair.chainId}-${pair.pairAddress}`,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        chainId: pair.chainId,
        chainName: CHAIN_DISPLAY[pair.chainId as ExecutionChain] || pair.chainId.toUpperCase(),
        address: pair.baseToken.address,
        priceUsd: parseFloat(pair.priceUsd || '0'),
        priceChange24h: pair.priceChange?.h24 || 0,
        liquidityUsd: pair.liquidity?.usd || 0,
        volume24hUsd: pair.volume?.h24 || 0,
        pairAddress: pair.pairAddress,
        dexUrl: pair.url,
        isMeme: isMemeToken(pair),
    };
}

// 4️⃣ FIX getTrendingTokens (CRITICAL)
export async function getTrendingTokens(targetChain: ExecutionChain = 'base'): Promise<NormalizedToken[]> {
    const chainId = targetChain.toLowerCase();

    // ADD HARD GUARD
    if (!EXECUTION_CHAINS.includes(chainId as ExecutionChain)) return [];

    const profile = CHAIN_PROFILES[chainId as ExecutionChain];

    try {
        // Fetch broad search for chain to get candidates
        const response = await fetch(
            `${DEXSCREENER_BASE_URL}/dex/search?q=${chainId}`,
            { next: { revalidate: 30 } } // 30s cache for "live" feel
        );

        if (!response.ok) return [];

        const data = await response.json();
        let pairs: DexPair[] = data.pairs || [];

        // 1. Filter: Chain Match + Quality Gates
        const validPairs = pairs.filter(p =>
            p.chainId === chainId &&
            validateTokenQuality(p, profile, chainId as ExecutionChain)
        );

        // 2. Rank: Execution Score
        const rankedPairs = validPairs.sort((a, b) => {
            return calculateRankScore(b) - calculateRankScore(a);
        });

        // 3. Deduplicate (Keep highest ranked pair for each token symbol)
        const seenSymbols = new Set<string>();
        const uniqueTokens: NormalizedToken[] = [];

        for (const pair of rankedPairs) {
            if (uniqueTokens.length >= 10) break; // Hard limit 10

            const symbol = pair.baseToken.symbol.toUpperCase();
            if (seenSymbols.has(symbol)) continue;

            // EXCLUDE Wrapped Native (WETH) from trending if it's just the base pair
            // We want tradeable tokens, not just WETH/USDC volume
            if (symbol === 'WETH' || symbol === 'ETH') continue;

            seenSymbols.add(symbol);
            uniqueTokens.push(normalizePair(pair));
        }

        return uniqueTokens;

    } catch (e) {
        console.error(`TrendingEngine: Failed to fetch for ${chainId}`, e);
        return [];
    }
}

// ========== LEGACY PRICE FETCHER ==========

/**
 * Unified Price Fetcher for DexScreener
 */
import { MarketPrice } from '@/lib/market-data/types';

export async function fetchPriceDex(symbol: string): Promise<MarketPrice | null> {
    try {
        const query = symbol.replace('/', '');
        const pairs = await searchPairs(query);

        // SECURE SELECTION LOGIC (Rule Zero)
        const validPairs = pairs
            // 6️⃣ FIX fetchPriceDex (HIDDEN LEAK)
            .filter((p: DexPair) =>
                EXECUTION_CHAINS.includes(p.chainId as ExecutionChain)
            )
            .filter((p: DexPair) =>
                Number(p.liquidity?.usd || 0) > 100000 &&
                Number(p.volume?.h24 || 0) > 50000
            )
            .filter((p: DexPair) =>
                p.baseToken.symbol.toUpperCase() === symbol.toUpperCase() ||
                p.baseToken.symbol.toUpperCase() === 'W' + symbol.toUpperCase()
            )
            .sort((a: DexPair, b: DexPair) =>
                Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0)
            );

        const pair = validPairs[0];

        if (!pair) {
            console.warn(`[DexScreener] No liquid pair found for ${symbol}`);
            return null;
        }

        const price = parseFloat(pair.priceUsd || '0');

        // BTC SANITY ANCHOR
        if (symbol.toUpperCase() === 'BTC') {
            if (price < 10000 || price > 150000) {
                console.error(`[DexScreener] INSANE BTC PRICE: ${price}`);
                return null;
            }
        }

        return {
            symbol: pair.baseToken.symbol,
            price: price,
            change: pair.priceChange.h24,
            changePercent: pair.priceChange.h24,
            volume: pair.volume.h24,
            timestamp: Date.now(),
            source: `dexscreener:${pair.chainId}`,
            verificationStatus: 'verified'
        };
    } catch (error) {
        console.error('FetchPriceDex Error:', error);
        return null;
    }
}
