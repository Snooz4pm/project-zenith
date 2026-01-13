/**
 * New Module: JupiterDexMerger.ts
 * Location: lib/market-observer/JupiterDexMerger.ts
 *
 * Responsibility (Very Narrow)
 * “Given Jupiter’s universe, tell me which tokens actually trade according to DexScreener.”
 */

import { VolumeObserver, VolumeRiskLevel } from './VolumeObserver';

// Types
export interface JupiterToken {
    mint: string;
    symbol: string;
    name?: string;
}

export interface DexMatchedToken {
    mint: string;
    symbol: string;
    pairAddress: string;
    volume5m: number | null;
    liquidityUSD: number | null;
    riskLevel: VolumeRiskLevel;
}

const JUPITER_PROXY_URL = 'https://jupiter-proxy-production.up.railway.app';
const MIN_VOLUME_24H = 1000; // $1k daily volume
const MIN_LIQUIDITY = 5000; // $5k liquidity

const observer = new VolumeObserver();

/**
 * Step 1: Fetch Jupiter Universe
 */
export async function fetchJupiterTokens(): Promise<JupiterToken[]> {
    try {
        const res = await fetch(`${JUPITER_PROXY_URL}/tokens`);

        if (!res.ok) {
            throw new Error(`Failed to fetch Jupiter universe: ${res.statusText}`);
        }

        const data = await res.json();

        if (!data.tokens || !Array.isArray(data.tokens)) {
            if (Array.isArray(data)) {
                return data.map((t: any) => ({
                    mint: t.address,
                    symbol: t.symbol,
                    name: t.name,
                }));
            }
            return [];
        }

        return data.tokens.map((t: any) => ({
            mint: t.address,
            symbol: t.symbol,
            name: t.name,
        }));
    } catch (error) {
        console.error("JupiterDexMerger: Fetch failed", error);
        return [];
    }
}

/**
 * Helper: Chunk array
 */
function chunk<T>(arr: T[], size: number): T[][] {
    const out = [];
    for (let i = 0; i < arr.length; i += size) {
        out.push(arr.slice(i, i + size));
    }
    return out;
}

/**
 * Step 2: Merge with VolumeObserver
 */
export async function getDexMatchedTokens(): Promise<DexMatchedToken[]> {
    // 1. Jupiter = source of truth
    const jupiterTokens = await fetchJupiterTokens();

    // [DEBUG] Limit to 50 tokens for fast verification if needed, 
    // but in production we might want more. 
    // Keeping the subset logic from previous version for consistency 
    // unless user wants full scan. Let's keep a larger subset or full?
    // User didn't specify, but "Market Scanner" usually implies full.
    // However, fetching 10k tokens against DexScreener is heavy.
    // Let's stick to the subset pattern for the "Observer" slice but maybe bump it to 100.
    const subsetTokens = jupiterTokens.slice(0, 100);

    const matched: DexMatchedToken[] = [];
    const mints = subsetTokens.map(t => t.mint);

    // Batch fetch from DexScreener (max 30 per request is safe)
    const batches = chunk(mints, 30);

    for (const batch of batches) {
        try {
            const ids = batch.join(',');
            const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ids}`);
            const data = await res.json();
            const pairs = data.pairs || [];

            // Process each requested mint
            for (const mint of batch) {
                // Find all pairs for this mint
                const tokenPairs = pairs.filter((p: any) => p.baseToken.address === mint);

                if (tokenPairs.length === 0) continue;

                // Pick best pair (highest liquidity)
                tokenPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
                const bestPair = tokenPairs[0];

                // Assess volume risk
                const assessment = observer.assess(bestPair);

                // Apply Hard Filters
                // 1. Critical Risk (Rug pulls)
                if (assessment.riskLevel === 'CRITICAL') continue;

                // 2. Minimum Viable Stats
                if (assessment.volume24hUsd < MIN_VOLUME_24H) continue;
                if (assessment.liquidityUsd < MIN_LIQUIDITY) continue;

                // 3. Stagnation Check (Medium Risk) - Optional: Do we exclude Medium?
                // Previously we were strict. Let's exclude "High" risk too?
                // The prompt for VolumeObserver had HIGH for "thin market" or "collapse".
                // We probably want to exclude HIGH too for a "Safe" merger.
                if (assessment.riskLevel === 'HIGH') continue;

                matched.push({
                    mint: assessment.mint,
                    symbol: assessment.symbol,
                    pairAddress: bestPair.pairAddress,
                    volume5m: assessment.volume5mUsd,
                    liquidityUSD: assessment.liquidityUsd,
                    riskLevel: assessment.riskLevel
                });
            }

            // Respect rate limits slightly
            await new Promise(r => setTimeout(r, 200));

        } catch (err) {
            console.error(`[JupiterDexMerger] Batch fetch failed`, err);
        }
    }

    console.log(`[JupiterDexMerger] Input: ${subsetTokens.length} tokens`);
    console.log(`[JupiterDexMerger] Verified: ${matched.length} tokens`);

    return matched;
}
