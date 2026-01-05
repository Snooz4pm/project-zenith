
export interface ZenithToken {
    mint: string;
    symbol: string;
    name: string;
    logoURI?: string;
    priceUsd: number;
    liquidityUsd: number;
    volume24hUsd: number;
    change24h: number;

    // Trust signals
    isJupiterListed: boolean;
    isZenithVerified: boolean;
}

// JUPITER STRICT LIST TYPE
interface JupiterToken {
    address: string;
    chainId: number;
    decimals: number;
    name: string;
    symbol: string;
    logoURI: string;
    tags?: string[];
}

// GECKO TERMINAL TYPES
interface GeckoPoolAttribute {
    name: string;
    address: string;
    base_token_price_usd: string;
    quote_token_price_usd: string;
    reserve_in_usd: string;
    volume_usd: { h24: string };
    price_change_percentage: { h24: string };
}

interface GeckoPool {
    id: string;
    attributes: GeckoPoolAttribute;
    relationships: {
        base_token: {
            data: { id: string } // format: network_base_token_address
        }
    }
}

// TRUST RULES
export function computeTrust(token: {
    mint: string;
    liquidityUsd: number;
    isJupiterListed: boolean;
}): boolean {
    return (
        token.isJupiterListed &&
        token.liquidityUsd >= 10_000 // Lowered slightly for trending pools
    );
}

// BUILD THE ENGINE (Trending Discovery)
export async function buildZenithTokens(): Promise<ZenithToken[]> {
    try {
        // 1. Load Jupiter registry (Metadata Authority)
        const jupiterTokens: JupiterToken[] = await fetch('https://token.jup.ag/strict').then(r => r.json());
        const jupiterMap = new Map<string, JupiterToken>(
            jupiterTokens.map((t) => [t.address, t])
        );

        // 2. Load GeckoTerminal Trending Pools (Free, No Key)
        // This gives us the hottest pools right now
        const res = await fetch('https://api.geckoterminal.com/api/v2/networks/solana/trending_pools?page=1');
        const data = await res.json();

        if (!data.data) return [];

        const pools: GeckoPool[] = data.data;

        // 3. Normalize to ZenithToken
        const rawTokens = pools.map((pool) => {
            // Gecko returns id like "solana_MINTADDRESS" for relations usually, but sometimes pool address.
            // For trending pools, relationships.base_token.data.id is "solana_<mint>"
            const baseTokenId = pool.relationships?.base_token?.data?.id;
            const mint = baseTokenId ? baseTokenId.replace('solana_', '') : '';

            if (!mint) return null;

            const jup = jupiterMap.get(mint);
            const isJupiterListed = Boolean(jup);

            const liq = parseFloat(pool.attributes.reserve_in_usd || '0');
            const price = parseFloat(pool.attributes.base_token_price_usd || '0');
            const vol = parseFloat(pool.attributes.volume_usd?.h24 || '0');
            const change = parseFloat(pool.attributes.price_change_percentage?.h24 || '0');

            return {
                mint,
                symbol: jup?.symbol || pool.attributes.name.split('/')[0].trim(), // Fallback parsing
                name: jup?.name || pool.attributes.name,
                logoURI: jup?.logoURI, // Gecko doesn't easily give logos in this list, rely on Jup
                priceUsd: price,
                liquidityUsd: liq,
                volume24hUsd: vol,
                change24h: change,

                isJupiterListed,
                isZenithVerified: computeTrust({ mint, liquidityUsd: liq, isJupiterListed })
            };
        });

        const tokens: ZenithToken[] = rawTokens
            .filter((t): t is ZenithToken => t !== null)
            .filter(t => t.liquidityUsd > 1000); // Filter dust

        // Dedup by mint
        const uniqueTokens = Array.from(
            new Map(tokens.map(t => [t.mint, t])).values()
        );

        return uniqueTokens;

    } catch (error) {
        console.error("Token Trust Engine Failed:", error);
        return [];
    }
}

// REAL-TIME PRICING (Jupiter Price API - Free)
export async function getLivePrice(mints: string[]): Promise<Record<string, number>> {
    try {
        if (mints.length === 0) return {};
        const query = mints.join(',');
        const res = await fetch(`https://price.jup.ag/v6/price?ids=${query}`);
        const data = await res.json();

        // Response format: { data: { MINT: { id, mintSymbol, vsToken, vsTokenSymbol, price } } }
        const prices: Record<string, number> = {};
        if (data.data) {
            Object.values(data.data).forEach((p: any) => {
                prices[p.id] = p.price;
            });
        }
        return prices;
    } catch (error) {
        console.error("Jupiter Price API Failed:", error);
        return {};
    }
}
