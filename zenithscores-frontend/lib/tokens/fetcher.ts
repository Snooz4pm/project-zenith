import { CANONICAL_TOKENS } from './canonical';

export const TOKEN_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export interface TokenInfo {
    symbol: string;
    name?: string;
    address: string;
    decimals: number;
    logoURI?: string;
    source: 'canonical' | '0x' | 'dexscreener';
    chainId: number;
    priceUsd?: string;
}

// 0x Token API - BSC ONLY
async function fetch0xTokens(chainId: number): Promise<TokenInfo[]> {
    try {
        const apiKey = process.env.ZEROX_API_KEY || process.env.OX_API_KEY || process.env.NEXT_PUBLIC_0X_API_KEY;
        if (!apiKey) return [];

        // Only BSC is supported
        if (chainId !== 56) return [];
        const baseUrl = 'https://bsc.api.0x.org';

        const res = await fetch(
            `${baseUrl}/swap/v1/tokens`,
            {
                headers: {
                    '0x-api-key': apiKey,
                    'Accept': 'application/json',
                },
                next: { revalidate: 3600 } // Cache for 1 hour
            }
        );

        if (!res.ok) {
            console.warn(`0x token fetch failed for chain ${chainId}: ${res.status}`);
            return [];
        }

        const data = await res.json();
        return (data.records || []).map((t: any) => ({
            symbol: t.symbol,
            name: t.name,
            address: t.address,
            decimals: t.decimals,
            logoURI: t.logoURI,
            source: '0x',
            chainId
        }));
    } catch (e) {
        console.error('0x fetch error:', e);
        return [];
    }
}

// DexScreener API - BSC ONLY
async function fetchDexScreenerTokens(chainId: number): Promise<TokenInfo[]> {
    try {
        // Only BSC is supported
        if (chainId !== 56) return [];
        const chainSlug = 'bsc';

        const res = await fetch(
            `https://api.dexscreener.com/latest/dex/search?q=${chainSlug}`,
            { next: { revalidate: 300 } }
        );

        if (!res.ok) return [];

        const data = await res.json();
        return (data.pairs || []).map((p: any) => ({
            symbol: p.baseToken.symbol,
            name: p.baseToken.name,
            address: p.baseToken.address,
            decimals: 18,
            chainId: 56, // BSC only
            priceUsd: p.priceUsd,
            logoURI: p.info?.imageUrl,
            source: 'dexscreener'
        })).filter((t: any) => t.chainId === 56);
    } catch (e) {
        console.error('DexScreener fetch error:', e);
        return [];
    }
}

function mergeTokens(...lists: TokenInfo[][]): TokenInfo[] {
    const map = new Map<string, TokenInfo>();

    for (const list of lists) {
        for (const t of list) {
            // Key by address + chain to be safe
            const key = `${t.chainId}-${t.address.toLowerCase()}`;
            if (!map.has(key)) {
                map.set(key, t);
            }
        }
    }

    return Array.from(map.values());
}

export async function getAllTokens(chainId: number): Promise<TokenInfo[]> {
    const canonical = (CANONICAL_TOKENS[chainId] || []).map(t => ({
        ...t,
        chainId,
        source: 'canonical'
    })) as TokenInfo[];

    const [zeroX, dex] = await Promise.allSettled([
        fetch0xTokens(chainId),
        fetchDexScreenerTokens(chainId)
    ]);

    return mergeTokens(
        canonical,
        zeroX.status === 'fulfilled' ? zeroX.value : [],
        dex.status === 'fulfilled' ? dex.value : []
    );
}

export function isSwappable(token: TokenInfo): boolean {
    // Canonical and 0x tokens are generally safe to route. DexScreener tokens might need 0x to know them.
    // If it's from DexScreener, it might not be routable on 0x yet if 0x hasn't indexed it.
    // But we'll try anyway. The real check is if quote returns.
    return true;
}
