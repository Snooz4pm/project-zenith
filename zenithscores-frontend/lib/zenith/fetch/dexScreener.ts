
interface DexScreenerPair {
    baseToken: { address: string; symbol: string; name: string };
    priceUsd: string;
    liquidity?: { usd: number };
    volume?: { h24: number };
    txns?: { h24: { buys: number; sells: number } };
    priceChange?: { h24: number };
}

export async function fetchDexScreenerPools(): Promise<DexScreenerPair[]> {
    // NOTE: DexScreener data is now fetched via Railway backend /tokens endpoint
    // This function is deprecated and should not be called directly
    // The backend already handles DexScreener as a fallback to Jupiter
    console.warn('fetchDexScreenerPools is deprecated - use fetchJupiterTokens (proxy) instead');
    return [];
}
