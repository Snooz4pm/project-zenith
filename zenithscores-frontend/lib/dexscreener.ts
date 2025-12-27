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
        'polygon': 'polygon',
        'arbitrum': 'arbitrum',
        'base': 'base',
        'solana': 'solana',
        'bsc': 'bsc',
        'avalanche': 'avalanche',
    };
    return chainMap[chain.toLowerCase()] || 'ethereum';
}
// ... existing code ...

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
