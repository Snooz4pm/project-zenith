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
    decimals: number;
}

export interface DexMatchedToken {
    mint: string;
    symbol: string;
    pairAddress: string;
    volume5m: number | null;
    liquidityUSD: number | null;
    riskLevel: VolumeRiskLevel;
    price?: number;
    decimals: number;
}

const JUPITER_PROXY_URL = 'https://jupiter-proxy-production.up.railway.app';
const JUP_TOKEN_LIST_URL = 'https://token.jup.ag/all'; // More complete than strict
const MIN_VOLUME_24H = 1000; // $1k daily volume
const MIN_LIQUIDITY = 5000; // $5k liquidity

const observer = new VolumeObserver();

// Hardcoded decimals for common tokens to ensure test stability if token list fetch fails
const COMMON_DECIMALS: Record<string, number> = {
    'So11111111111111111111111111111111111111112': 9, // SOL
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 5, // BONK
    'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 6, // WIF
    '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYkW2hr': 9, // POPCAT
    'MEW1gQWJ3nEXg2qgPMIZuXaZCKam1oJ55Jk1hJp': 6,     // MEW
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 6, // USDC
    'Es9vMFrzaDCSTuNv6S69P7Ra3SPfPLB26gh5pXB9ftx': 6, // USDT
};

/**
 * Step 1: Fetch Jupiter Universe
 */
export async function fetchJupiterTokens(): Promise<JupiterToken[]> {
    try {
        // Direct fetch from Jupiter to ensure latest data and decimals
        const res = await fetch(JUP_TOKEN_LIST_URL);

        if (!res.ok) {
            console.warn(`[JupiterDexMerger] Failed to fetch jup token list. Using proxy fallback.`);
            const proxyRes = await fetch(`${JUPITER_PROXY_URL}/tokens`);
            if (!proxyRes.ok) return [];
            const proxyData = await proxyRes.json();
            const raw = Array.isArray(proxyData) ? proxyData : (proxyData.tokens || []);
            return raw.map((t: any) => ({
                mint: t.address || t.mint,
                symbol: t.symbol,
                name: t.name,
                decimals: t.decimals || COMMON_DECIMALS[t.address || t.mint] || 6
            }));
        }

        const data = await res.json();
        const tokensArray = Array.isArray(data) ? data : (data.tokens || []);

        return tokensArray.map((t: any) => ({
            mint: t.address || t.mint,
            symbol: t.symbol,
            name: t.name,
            decimals: t.decimals || COMMON_DECIMALS[t.address || t.mint] || 6,
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
    const startTime = Date.now();
    // 1. Jupiter = source of truth
    const jupiterTokens = await fetchJupiterTokens();

    const subsetTokens = jupiterTokens.slice(0, 1000);
    const matched: DexMatchedToken[] = [];
    const mints = subsetTokens.map(t => t.mint);

    const batches = chunk(mints, 30);
    console.log(`[JupiterDexMerger] Processing ${batches.length} batches for discovery...`);

    // Process batches in parallel chunks of 5 to avoid overwhelming DexScreener but stay fast
    const CONCURRENCY = 5;
    for (let i = 0; i < batches.length; i += CONCURRENCY) {
        const currentGroup = batches.slice(i, i + CONCURRENCY);

        await Promise.all(currentGroup.map(async (batch) => {
            try {
                const ids = batch.join(',');
                const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ids}`, {
                    signal: AbortSignal.timeout(5000)
                });
                if (!res.ok) return;

                const data = await res.json();
                const pairs = data.pairs || [];

                for (const mint of batch) {
                    const tokenPairs = pairs.filter((p: any) => p.baseToken.address === mint);
                    if (tokenPairs.length === 0) continue;

                    tokenPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
                    const bestPair = tokenPairs[0];
                    const assessment = observer.assess(bestPair);

                    if (assessment.riskLevel === 'CRITICAL') continue;
                    if (assessment.volume24hUsd < MIN_VOLUME_24H) continue;
                    if (assessment.liquidityUsd < MIN_LIQUIDITY) continue;
                    if (assessment.riskLevel === 'HIGH') continue;

                    matched.push({
                        mint: assessment.mint,
                        symbol: assessment.symbol,
                        pairAddress: bestPair.pairAddress,
                        volume5m: assessment.volume5mUsd,
                        liquidityUSD: assessment.liquidityUsd,
                        riskLevel: assessment.riskLevel,
                        price: assessment.priceUsd,
                        decimals: jupiterTokens.find(jt => jt.mint === assessment.mint)?.decimals || COMMON_DECIMALS[assessment.mint] || 6
                    });
                }
            } catch (err) {
                console.error(`[JupiterDexMerger] Batch failed`, err);
            }
        }));

        // Very small delay between groups
        if (i + CONCURRENCY < batches.length) {
            await new Promise(r => setTimeout(r, 50));
        }
    }

    console.log(`[JupiterDexMerger] Discovery complete in ${Date.now() - startTime}ms. Found ${matched.length} tokens.`);
    return matched;
}

/**
 * Step 3: Specific Portfolio Fetch (For Testing)
 */
export async function getVirtualPortfolioTokens(targetMints: string[]): Promise<DexMatchedToken[]> {
    const batches = chunk(targetMints, 30);
    const matched: DexMatchedToken[] = [];

    console.log(`[JupiterDexMerger] Fetching virtual portfolio of ${targetMints.length} tokens...`);

    // We also need decimals for the portfolio fetch
    const jupiterTokens = await fetchJupiterTokens();

    for (const batch of batches) {
        try {
            const results = await observer.analyzeBatch(batch);

            results.forEach(analysis => {
                if (analysis) {
                    const jupInfo = jupiterTokens.find(jt => jt.mint === analysis.mint);
                    matched.push({
                        mint: analysis.mint,
                        symbol: analysis.symbol,
                        pairAddress: "N/A",
                        volume5m: analysis.volume5mUsd,
                        liquidityUSD: analysis.liquidityUsd,
                        riskLevel: analysis.riskLevel as VolumeRiskLevel,
                        price: analysis.priceUsd,
                        decimals: jupInfo?.decimals || COMMON_DECIMALS[analysis.mint] || 6
                    });
                }
            });
        } catch (err) {
            console.error(`[JupiterDexMerger] Virtual batch failed`, err);
        }
    }

    return matched;
}
