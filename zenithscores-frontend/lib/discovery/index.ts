import { GlobalToken, ChainId, getChainType } from './normalize';
import { filterTokens, calculateQualityScore } from './filters';

/**
 * Global Token Discovery
 * 
 * Fetches tokens from ALL chains via DexScreener API
 * NO wallet logic - pure discovery
 */

interface DexScreenerPair {
    chainId: string;
    dexId: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceUsd: string;
    volume: {
        h24: number;
    };
    priceChange: {
        h24: number;
    };
    liquidity: {
        usd: number;
    };
    info?: {
        imageUrl?: string;
    };
}

/**
 * Normalize DexScreener pair to GlobalToken
 */
function normalizePair(pair: DexScreenerPair): GlobalToken | null {
    try {
        const chainId = normalizeChainId(pair.chainId);

        return {
            id: `${chainId}-${pair.baseToken.address}`,
            chainId,
            chainType: getChainType(chainId),
            address: pair.baseToken.address,
            symbol: pair.baseToken.symbol,
            name: pair.baseToken.name,
            logo: pair.info?.imageUrl,
            liquidityUsd: pair.liquidity?.usd || 0,
            volume24h: pair.volume?.h24 || 0,
            priceUsd: parseFloat(pair.priceUsd || '0'),
            priceChange24h: pair.priceChange?.h24 || 0,
            dex: pair.dexId,
        };
    } catch (error) {
        console.error('[Discovery] Failed to normalize pair:', error);
        return null;
    }
}

/**
 * Normalize DexScreener chain ID to our ChainId type
 */
function normalizeChainId(dexScreenerChainId: string): ChainId {
    const mapping: Record<string, ChainId> = {
        'solana': 'solana',
        'ethereum': '1',
        'bsc': '56',
        'base': '8453',
        'polygon': '137',
        'arbitrum': '42161',
        'optimism': '10',
        'avalanche': '43114',
        'fantom': '250',
        'gnosis': '100',
    };

    return mapping[dexScreenerChainId.toLowerCase()] || '1';
}

/**
 * Fetch tokens from DexScreener
 * Returns tokens from ALL supported chains
 */
export async function discoverTokens(limit = 100): Promise<GlobalToken[]> {
    try {
        // Fetch from DexScreener trending endpoint
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/trending', {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`DexScreener API error: ${response.status}`);
        }

        const data = await response.json();
        const pairs: DexScreenerPair[] = data.pairs || [];

        // Normalize all pairs
        const tokens: GlobalToken[] = pairs
            .map(normalizePair)
            .filter((t): t is GlobalToken => t !== null);

        // Apply filters
        const filtered = filterTokens(tokens);

        // Sort by quality score
        const sorted = filtered.sort((a, b) =>
            calculateQualityScore(b) - calculateQualityScore(a)
        );

        // Limit results
        return sorted.slice(0, limit);
    } catch (error) {
        console.error('[Discovery] Failed to fetch tokens:', error);
        return [];
    }
}

/**
 * Fetch tokens for specific chains
 */
export async function discoverTokensByChains(
    chainIds: ChainId[],
    limit = 50
): Promise<GlobalToken[]> {
    const allTokens = await discoverTokens(limit * chainIds.length);

    return allTokens.filter(token =>
        chainIds.includes(token.chainId as ChainId)
    ).slice(0, limit);
}

/**
 * Search tokens by symbol or name
 */
export async function searchTokens(query: string): Promise<GlobalToken[]> {
    try {
        const response = await fetch(
            `https://api.dexscreener.com/latest/dex/search/?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            throw new Error(`DexScreener search error: ${response.status}`);
        }

        const data = await response.json();
        const pairs: DexScreenerPair[] = data.pairs || [];

        const tokens: GlobalToken[] = pairs
            .map(normalizePair)
            .filter((t): t is GlobalToken => t !== null);

        return filterTokens(tokens);
    } catch (error) {
        console.error('[Discovery] Search failed:', error);
        return [];
    }
}
