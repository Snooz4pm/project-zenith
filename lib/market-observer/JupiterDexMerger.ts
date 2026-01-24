/**
 * New Module: JupiterDexMerger.ts
 * Location: lib/market-observer/JupiterDexMerger.ts
 *
 * Responsibility (Very Narrow)
 * “Given Jupiter’s universe, tell me which tokens actually trade according to DexScreener.”
 */

import { VolumeObserver, VolumeRiskLevel } from './VolumeObserver';
import { getJupiterTokens } from '@/lib/solana/jupiter-token-cache';

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
    riskScore: number;
    price?: number;
    decimals: number;
    supply?: number;
    name?: string;
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
 * Helius Metadata Fallback (The Trench Scanner)
 */
async function fetchHeliusMetadata(mint: string): Promise<JupiterToken | null> {
    const HELIUS_KEY = process.env.HELIUS_API_KEY;
    if (!HELIUS_KEY) return null;

    const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;

    try {
        const body = {
            jsonrpc: "2.0",
            id: "metadata",
            method: "getAsset",
            params: {
                id: mint,
                displayOptions: { showFungible: true }
            }
        };

        const res = await fetch(HELIUS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(3000)
        });

        if (!res.ok) return null;
        const json = await res.json();
        const asset = json.result;

        if (!asset) return null;

        return {
            mint: asset.id,
            symbol: asset.token_info?.symbol || asset.content?.metadata?.symbol || "UNKNOWN",
            name: asset.content?.metadata?.name || asset.id,
            decimals: asset.token_info?.decimals || 6,
            supply: Number(asset.token_info?.supply || 0) / Math.pow(10, asset.token_info?.decimals || 6)
        };
    } catch (e) {
        console.error(`[HeliusMeta] Failed for ${mint}:`, e);
        return null;
    }
}

/**
 * Step 1: Fetch Jupiter Universe (Cached Singleton)
 */
export async function fetchJupiterTokens(uiLogs?: string[]): Promise<JupiterToken[]> {
    return getJupiterTokens(uiLogs);
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
export async function getDexMatchedTokens(uiLogs?: string[]): Promise<DexMatchedToken[]> {
    const startTime = Date.now();
    // 1. Jupiter = source of truth
    const jupiterTokens = await fetchJupiterTokens(uiLogs);

    if (jupiterTokens.length === 0) {
        uiLogs?.push(`[!! BUG] Discovery: Jupiter Universe is empty. Market scan aborted.`);
        return [];
    }

    const whitelistMints = [
        'So11111111111111111111111111111111111111112', // SOL
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'Es9vMFrzaDCSTuNv6S69P7Ra3SPfPLB26gh5pXB9ftx', // USDT
        'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
        'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
    ];

    const CORE_SAFE_MINTS = new Set(whitelistMints);

    // SCAN LIMIT: Large universes kill the server. We prioritize whitelist + top 500.
    const subsetTokens = [
        ...jupiterTokens.filter(t => whitelistMints.includes(t.mint)),
        ...jupiterTokens.filter(t => !whitelistMints.includes(t.mint)).slice(0, 500)
    ];

    const jupMap = new Map<string, JupiterToken>();
    jupiterTokens.forEach(t => jupMap.set(t.mint, t));

    const matched: DexMatchedToken[] = [];
    const mints = subsetTokens.map(t => t.mint);

    const batches = chunk(mints, 30);
    console.log(`[JupiterDexMerger] Source of Truth: ${subsetTokens.length} tokens (Capped for speed).`);

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
                    const normalizedMint = mint.toLowerCase();
                    const tokenPairs = pairs.filter((p: any) => p.baseToken.address.toLowerCase() === normalizedMint);
                    const isWhitelisted = whitelistMints.map(m => m.toLowerCase()).includes(normalizedMint);

                    if (tokenPairs.length === 0) {
                        if (isWhitelisted) {
                            const jupInfo = jupMap.get(mint);
                            matched.push({
                                mint,
                                symbol: jupInfo?.symbol || 'CORE',
                                pairAddress: 'CORE_SAFE_BYPASS',
                                volume5m: 10000000,
                                liquidityUSD: 10000000,
                                riskLevel: 'SAFE',
                                riskScore: 0,
                                price: 0,
                                decimals: jupInfo?.decimals || 9
                            });
                        }
                        continue;
                    }

                    tokenPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
                    const bestPair = tokenPairs[0];
                    const assessment = observer.assess(bestPair);

                    if (!isWhitelisted) {
                        if (assessment.volume24hUsd < 100) continue;
                        if (assessment.liquidityUsd < 500) continue;
                    }

                    matched.push({
                        mint: assessment.mint,
                        symbol: assessment.symbol,
                        pairAddress: bestPair.pairAddress,
                        volume5m: assessment.volume5mUsd,
                        liquidityUSD: assessment.liquidityUsd,
                        riskLevel: assessment.riskLevel,
                        riskScore: assessment.riskScore,
                        price: assessment.priceUsd,
                        decimals: jupMap.get(assessment.mint)?.decimals || COMMON_DECIMALS[assessment.mint] || 6,
                        supply: assessment.fdv && assessment.priceUsd > 0 ? assessment.fdv / assessment.priceUsd : 0
                    });
                }
            } catch (err: any) {
                // Silently skip batch errors to keep discovery moving
            }
        }));

        if (i + CONCURRENCY < batches.length) {
            await new Promise(r => setTimeout(r, 50));
        }
    }

    uiLogs?.push(`[INFRA] Discovery: Matched ${matched.length}/${subsetTokens.length} tokens in ${Date.now() - startTime}ms`);
    return matched;
}

/**
 * Step 3: Specific Portfolio Fetch (For Testing)
 */
export async function getVirtualPortfolioTokens(targetMints: string[], uiLogs?: string[]): Promise<DexMatchedToken[]> {
    uiLogs?.push(`[INFRA] Portfolio: Fetching data for ${targetMints.length} positions...`);

    // 1. Fetch metadata in parallel with analysis
    const jupiterTokensPromise = fetchJupiterTokens(uiLogs);
    const analysisPromise = observer.analyzeBatch(targetMints);

    const [jupiterTokens, analysisResults] = await Promise.all([jupiterTokensPromise, analysisPromise]);

    // 2. Build Map for O(1) lookup (Critical for 100k+ lists)
    const jupMap = new Map<string, JupiterToken>();
    jupiterTokens.forEach(t => jupMap.set(t.mint, t));

    const matched: DexMatchedToken[] = [];
    const missingMetadataMints: string[] = [];

    // 3. First pass: Match available metadata
    const stubs: { mint: string, analysis: any }[] = [];
    for (let idx = 0; idx < targetMints.length; idx++) {
        const mint = targetMints[idx];
        const analysis = analysisResults[idx];
        const jupInfo = jupMap.get(mint);

        if (!jupInfo) {
            missingMetadataMints.push(mint);
        }

        stubs.push({ mint, analysis });
    }

    // 4. Fetch missing metadata in parallel (Trench Scanner)
    const heliusMetadataMap = new Map<string, JupiterToken>();
    if (missingMetadataMints.length > 0) {
        const heliusResults = await Promise.all(
            missingMetadataMints.map(mint => fetchHeliusMetadata(mint))
        );
        heliusResults.forEach(res => {
            if (res) heliusMetadataMap.set(res.mint, res);
        });
    }

    // 5. Final Assembly
    for (const item of stubs) {
        const { mint, analysis } = item;
        const metadata = jupMap.get(mint) || heliusMetadataMap.get(mint);

        if (analysis) {
            matched.push({
                mint: analysis.mint,
                symbol: analysis.symbol || metadata?.symbol || mint.slice(0, 6),
                pairAddress: "N/A",
                volume5m: analysis.volume5mUsd,
                liquidityUSD: analysis.liquidityUsd,
                riskLevel: analysis.riskLevel as VolumeRiskLevel,
                riskScore: analysis.riskScore,
                price: analysis.priceUsd,
                decimals: metadata?.decimals || COMMON_DECIMALS[mint] || 6
            });
        } else {
            matched.push({
                mint,
                symbol: metadata?.symbol || mint.slice(0, 6),
                pairAddress: "STUB_MISSING_DATA",
                volume5m: 0,
                liquidityUSD: 0,
                riskLevel: 'HIGH',
                riskScore: 99,
                price: 0,
                decimals: metadata?.decimals || COMMON_DECIMALS[mint] || 6
            });
        }
    }

    return matched;
}
