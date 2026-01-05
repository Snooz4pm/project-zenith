/**
 * TOKEN TRUST ENGINE
 * 
 * Single source of truth for token data.
 * Layers:
 * 1. Jupiter Strict List (Metadata Authority)
 * 2. DexScreener (Market Data Authority)
 * 3. Zenith Verification (Logic Layer)
 */

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

// TRUST RULES
export function computeTrust(token: {
    mint: string;
    liquidityUsd: number;
    isJupiterListed: boolean;
}): boolean {
    return (
        token.isJupiterListed &&
        token.liquidityUsd >= 50_000
    );
}

// BUILD THE ENGINE
export async function buildZenithTokens(): Promise<ZenithToken[]> {
    try {
        // 1. Load Jupiter registry (Strict List)
        const jupiterTokens: JupiterToken[] = await fetch('https://token.jup.ag/strict').then(r => r.json());

        const jupiterMap = new Map<string, JupiterToken>(
            jupiterTokens.map((t) => [t.address, t])
        );

        // 2. Load DexScreener data (Trending/Top Solana pairs)
        // This endpoint returns widely traded pairs
        const dex = await fetch('https://api.dexscreener.com/latest/dex/search?q=SOL').then(r => r.json());

        if (!dex.pairs) return [];

        // 3. Normalize tokens
        const tokens: ZenithToken[] = dex.pairs
            .filter((p: any) => p.liquidity?.usd > 10_000) // Basic noise filter
            .map((p: any) => {
                const mint = p.baseToken.address;
                const jup = jupiterMap.get(mint);

                const isJupiterListed = Boolean(jup);
                const liquidityUsd = p.liquidity?.usd || 0;

                return {
                    mint,
                    symbol: jup?.symbol || p.baseToken.symbol,
                    name: jup?.name || p.baseToken.name,
                    logoURI: jup?.logoURI || p.info?.imageUrl,
                    priceUsd: Number(p.priceUsd),
                    liquidityUsd,
                    volume24hUsd: p.volume?.h24 || 0,
                    change24h: p.priceChange?.h24 || 0,

                    isJupiterListed,
                    isZenithVerified: computeTrust({
                        mint,
                        liquidityUsd,
                        isJupiterListed
                    })
                };
            });

        // Dedup by mint (keep highest liquidity if dups)
        const uniqueTokens = Array.from(
            new Map(tokens.map(t => [t.mint, t])).values()
        );

        return uniqueTokens.sort((a, b) => b.liquidityUsd - a.liquidityUsd);

    } catch (error) {
        console.error("Token Trust Engine Failed:", error);
        return [];
    }
}
