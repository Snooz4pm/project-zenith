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
}

// ========== TRENDING & DISCOVERY ENGINE (EXECUTION FIRST) ==========

interface ChainProfile {
    minLiquidity: number;
    minVolume24h: number;
    minTxns1h?: number;
    minAgeHours?: number;
    minFdv?: number;
}

const CHAIN_PROFILES: Record<string, ChainProfile> = {
    // Base: Retail execution, high velocity, lower barriers
    base: {
        minLiquidity: 15000,
        minVolume24h: 50000,
        minTxns1h: 50,
        minAgeHours: 24
    },
    // Arbitrum: Trader execution, higher depth required
    arbitrum: {
        minLiquidity: 50000,
        minVolume24h: 250000
    },
    // Ethereum: Whale execution, max trust and depth
    ethereum: {
        minLiquidity: 500000,
        minVolume24h: 1000000,
        minFdv: 5000000,
        minAgeHours: 168 // 7 days
    }
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
function validateTokenQuality(pair: DexPair, profile: ChainProfile): boolean {
    const liq = pair.liquidity?.usd || 0;
    const vol = pair.volume?.h24 || 0;
    const txns1h = (pair.txns?.h1?.buys || 0) + (pair.txns?.h1?.sells || 0);
    const fdv = pair.fdv || 0;
    const pairAgeHours = (Date.now() - (pair.pairCreatedAt || 0)) / (1000 * 60 * 60); // Note: pairCreatedAt might need to be fetched or inferred if not in DexPair, falling back if missing

    // 1. Hard Profile Limits
    if (liq < profile.minLiquidity) return false;
    if (vol < profile.minVolume24h) return false;
    if (profile.minTxns1h && txns1h < profile.minTxns1h) return false;
    if (profile.minFdv && fdv < profile.minFdv) return false;

    // 2. Honeypot / Scam Heuristics
    // If there are buys but absolutely ZERO sells in 24h, it's likely a honeypot
    const buys24 = pair.txns?.h24?.buys || 0;
    const sells24 = pair.txns?.h24?.sells || 0;
    if (buys24 > 10 && sells24 === 0) return false;

    // 3. Spreads & Routability (Implicit)
    // We only accept pairs with major quote tokens to ensure 0x routability
    const validQuotes = ['WETH', 'USDC', 'USDT', 'DAI', 'ETH'];
    if (!validQuotes.includes(pair.quoteToken.symbol.toUpperCase())) return false;

    return true;
}

const CHAIN_DISPLAY: Record<string, string> = {
    ethereum: 'Ethereum',
    base: 'Base',
    arbitrum: 'Arbitrum',
    polygon: 'Polygon',
    bsc: 'BNB Chain',
    solana: 'Solana',
}
function normalizePair(pair: DexPair): NormalizedToken {
    return {
        id: `${pair.chainId}-${pair.pairAddress}`,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        chainId: pair.chainId,
        chainName: CHAIN_DISPLAY[pair.chainId] || pair.chainId.toUpperCase(),
        address: pair.baseToken.address,
        priceUsd: parseFloat(pair.priceUsd || '0'),
        priceChange24h: pair.priceChange?.h24 || 0,
        liquidityUsd: pair.liquidity?.usd || 0,
        volume24hUsd: pair.volume?.h24 || 0,
        pairAddress: pair.pairAddress,
        dexUrl: pair.url,
    };
}

/**
 * Get trending tokens with strict "Execution First" logic.
 * Returns top 10 ranked tokens for the specific chain.
 */
export async function getTrendingTokens(targetChain: string = 'base'): Promise<NormalizedToken[]> {
    const chainId = targetChain.toLowerCase();
    const profile = CHAIN_PROFILES[chainId];

    // If chain not configured, return empty (Safe fail)
    if (!profile) return [];

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
            validateTokenQuality(p, profile)
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
            .filter((p: DexPair) =>
                ['ethereum', 'bsc', 'solana', 'base'].includes(p.chainId)
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
