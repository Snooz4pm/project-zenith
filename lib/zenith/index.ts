
import { fetchJupiterTokens, getLivePrice } from './fetch/jupiter';
import { fetchDexScreenerPools } from './fetch/dexScreener';
import { normalizeToken } from './normalize/mapper';
import { ZenithToken } from './types';

// Export types and functions
export { getLivePrice };
export type { ZenithToken };

/**
 * ZENITH TOKEN ENGINE (LAYER 1 - UNIVERSE)
 * 
 * Returns the FULL Jupiter token universe with optional metric enrichment.
 * NO strict filtering - display all valid tokens.
 * Metrics (liquidity, volume) are for sorting/badging only.
 */
export async function buildZenithTokenList(): Promise<ZenithToken[]> {
    try {
        console.log("Zenith: Initializing Token Universe...");

        // 1. Fetch RAW Data Sources
        const [jupTokenMap, dexPairs] = await Promise.all([
            fetchJupiterTokens(),
            fetchDexScreenerPools()
        ]);

        console.log(`Zenith: Raw Inputs - Jupiter: ${jupTokenMap.size}, DexScreener: ${dexPairs.length}`);

        // 2. Build Metrics Map (Optional Enrichment)
        const metricsMap = new Map<string, any>();
        for (const pair of dexPairs) {
            if (!pair.baseToken?.address) continue;

            const addr = pair.baseToken.address;
            const liquidity = Number(pair.liquidity?.usd || 0);
            const volume24h = Number(pair.volume?.h24 || 0);

            // Keep the BEST pool per token (highest liquidity)
            if (!metricsMap.has(addr) || metricsMap.get(addr).liquidity < liquidity) {
                metricsMap.set(addr, {
                    liquidity,
                    volume24h,
                    priceUsd: Number(pair.priceUsd || 0),
                    priceChange24h: Number(pair.priceChange?.h24 || 0)
                });
            }
        }

        // 3. Build Full Universe (NO FILTERING)
        const tokens: ZenithToken[] = [];

        jupTokenMap.forEach((jupToken) => {
            // Basic validation only
            if (!jupToken.address || !jupToken.symbol) return;

            const metrics = metricsMap.get(jupToken.address);

            tokens.push({
                mint: jupToken.address,
                symbol: jupToken.symbol,
                name: jupToken.name,
                logoURI: jupToken.logoURI,
                decimals: jupToken.decimals,
                // Metrics (optional, may be 0)
                priceUsd: metrics?.priceUsd || 0,
                liquidityUsd: metrics?.liquidity || 0,
                volume24hUsd: metrics?.volume24h || 0,
                priceChange24h: metrics?.priceChange24h || 0,
                txCount24h: 0,
                zenithScore: metrics ? 80 : 50 // Lower score if no metrics
            });
        });

        // 4. Sort by Quality (but don't filter)
        // Tokens with metrics first, then by liquidity/volume
        tokens.sort((a, b) => {
            const scoreA = (a.volume24hUsd * 0.7) + (a.liquidityUsd * 0.3);
            const scoreB = (b.volume24hUsd * 0.7) + (b.liquidityUsd * 0.3);
            return scoreB - scoreA;
        });

        console.log(`Zenith: Universe Ready. ${tokens.length} tokens available.`);
        console.log(`Zenith: ${tokens.filter(t => t.liquidityUsd > 0).length} tokens with liquidity data.`);

        return tokens;

    } catch (err) {
        console.error("Zenith: Engine Failure", err);
        return [];
    }
}
