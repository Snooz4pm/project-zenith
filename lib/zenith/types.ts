
export interface ZenithToken {
    mint: string;
    address?: string;
    symbol: string; // Alias for mint (normalized)
    name: string;
    decimals?: number;
    logoURI?: string;

    priceUsd: number;
    liquidityUsd: number;
    volume24hUsd: number;
    txCount24h: number;
    priceChange24h: number;

    zenithScore: number;
}
