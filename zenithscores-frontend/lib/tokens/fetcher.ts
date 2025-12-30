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

// 0x Token API
async function fetch0xTokens(chainId: number): Promise<TokenInfo[]> {
    try {
        const apiKey = process.env.NEXT_PUBLIC_0X_API_KEY;
        if (!apiKey) return [];

        const baseUrl = chainId === 1 ? 'https://api.0x.org' :
            chainId === 8453 ? 'https://base.api.0x.org' :
                chainId === 42161 ? 'https://arbitrum.api.0x.org' : '';

        if (!baseUrl) return [];

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

// DexScreener API
async function fetchDexScreenerTokens(chainId: number): Promise<TokenInfo[]> {
    try {
        const chainSlug = chainId === 1 ? 'ethereum' : chainId === 8453 ? 'base' : chainId === 42161 ? 'arbitrum' : '';
        if (!chainSlug) return [];

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
            decimals: 18, // Fallback, DexScreener doesn't always provide decimals in search
            chainId: p.chainId === 'ethereum' ? 1 : p.chainId === 'base' ? 8453 : 42161,
            priceUsd: p.priceUsd,
            logoURI: p.info?.imageUrl,
            source: 'dexscreener'
        })).filter((t: any) => t.chainId === chainId); // Double check chain match
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
