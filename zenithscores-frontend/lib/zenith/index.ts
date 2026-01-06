
import { fetchJupiterTokens, getLivePrice } from './fetch/jupiter';
import { fetchDexScreenerPools } from './fetch/dexScreener';
import { normalizeToken } from './normalize/mapper';
import { ZenithToken } from './types';

// Export types and functions
export { getLivePrice };
export type { ZenithToken };

/**
 * ZENITH TOKEN ENGINE
 * Entry Point: Builds a curated list of trusted, high-quality tokens for the Trending section.
 */
export async function buildZenithTokenList(): Promise<ZenithToken[]> {
    try {
        console.log("Zenith: Initializing Token Intelligence Engine...");

        // 1. Fetch RAW Data Sources
        // - Jupiter: The Universe of valid tokens (Source of Truth)
        // - DexScreener: Metrics (Liquidity, Volume, Price)
        const [jupTokenMap, dexPairs] = await Promise.all([
            fetchJupiterTokens(),
            fetchDexScreenerPools()
        ]);

        console.log(`Zenith: Raw Inputs - Jupiter: ${jupTokenMap.size}, DexScreener: ${dexPairs.length}`);

        // 2. Build Metrics Map (Fast Lookup)
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

        // 3. Merge & Filter (Revenue Focused)
        // - Minimum Liquidity: $10k
        // - Minimum Volume: $1k
        const MIN_LIQUIDITY = 10000;
        const MIN_VOLUME = 1000;

        // Iterate over Jupiter universe to ensure we match official metadata
        const tokens: ZenithToken[] = [];

        // If map is empty (DexScreener failed), fallback to just returning top Jupiter tokens with 0 metrics
        // But ideally we want metrics.

        jupTokenMap.forEach((jupToken) => {
            const metrics = metricsMap.get(jupToken.address);

            // If we have metrics, check filters
            if (metrics) {
                if (metrics.liquidity >= MIN_LIQUIDITY && metrics.volume24h >= MIN_VOLUME) {
                    tokens.push({
                        mint: jupToken.address,
                        symbol: jupToken.symbol,
                        name: jupToken.name,
                        logoURI: jupToken.logoURI,
                        decimals: jupToken.decimals,
                        // Metrics
                        priceUsd: metrics.priceUsd,
                        liquidityUsd: metrics.liquidity,
                        volume24hUsd: metrics.volume24h,
                        priceChange24h: metrics.priceChange24h,
                        txCount24h: 0, // Not available directly in pair summary easily
                        zenithScore: 80 // Default high score for tradeable assets
                    });
                }
            }
            // Optional: If you want to show tokens even without DexScreener data (e.g. major tokens might be missing from 'search?q=SOL')
            // For now, let's stick to enriched tokens to ensure quality.
        });

        // 4. Sort by Revenue Potential (Volume * 0.7 + Liquidity * 0.3)
        tokens.sort((a, b) => {
            const scoreA = (a.volume24hUsd * 0.7) + (a.liquidityUsd * 0.3);
            const scoreB = (b.volume24hUsd * 0.7) + (b.liquidityUsd * 0.3);
            return scoreB - scoreA;
        });

        console.log(`Zenith: Engine Ready. ${tokens.length} tradeable assets tracking.`);

        // 5. Emergency Fallback (if DexScreener failed or filters too strict)
        if (tokens.length < 5) {
            console.warn("Zenith: Low meaningful data. Injecting Majors.");
            const majors = ['So11111111111111111111111111111111111111112', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'];
            majors.forEach(mint => {
                const t = jupTokenMap.get(mint);
                if (t) {
                    tokens.push({
                        mint: t.address,
                        symbol: t.symbol,
                        name: t.name,
                        logoURI: t.logoURI,
                        decimals: t.decimals,
                        priceUsd: 0,
                        liquidityUsd: 1000000,
                        volume24hUsd: 1000000,
                        priceChange24h: 0,
                        txCount24h: 0,
                        zenithScore: 99
                    });
                }
            });
        }

        return tokens.slice(0, 100);

    } catch (err) {
        console.error("Zenith: Engine Failure", err);
        return [];
    }
}
