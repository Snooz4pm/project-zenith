
interface DexScreenerPair {
    baseToken: { address: string; symbol: string; name: string };
    priceUsd: string;
    liquidity?: { usd: number };
    volume?: { h24: number };
    txns?: { h24: { buys: number; sells: number } };
    priceChange?: { h24: number };
}

export async function fetchDexScreenerPools(): Promise<DexScreenerPair[]> {
    try {
        console.log("Fetching DexScreener pools for enrichment...");
        // Search for top Solana pairs
        const res = await fetch('https://api.dexscreener.com/latest/dex/search?q=SOL', {
            next: { revalidate: 60 }
        });

        if (!res.ok) throw new Error('DexScreener fetch failed');

        const data = await res.json();
        return data.pairs || [];
    } catch (e) {
        console.warn('DexScreener enrichment failed:', e);
        return [];
    }
}
