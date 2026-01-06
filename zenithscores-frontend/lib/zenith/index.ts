import { fetchJupiterTokens, getLivePrice } from './fetch/jupiter';
import { fetchDexScreenerPools } from './fetch/dexScreener';
import { normalizeToken } from './normalize/mapper';
import { computeZenithScore } from './normalize/scoring';
import { ZenithToken } from './types';

export type { ZenithToken } from './types';
export { getLivePrice } from './fetch/jupiter';

// ============================================
// 3-LAYER ARCHITECTURE
// ============================================
// LAYER 1: Jupiter Token Universe (~14k)
// LAYER 2: Filter by liquidity (implicit in DexScreener)
// LAYER 3: Enrich with market data (DexScreener prices/volume)
// ============================================

export async function buildZenithTokenList(): Promise<ZenithToken[]> {
    try {
        console.log("Zenith: Initializing Token Intelligence Engine...");

        // LAYER 1: Fetch Jupiter token universe (14k+ tokens)
        const jupiterTokens = await fetchJupiterTokens();
        console.log(`[Layer 1] Jupiter universe: ${jupiterTokens.size} tokens`);

        // LAYER 3: Fetch market data (prices, volume, liquidity)
        const PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'http://localhost:3001';
        const marketRes = await fetch(`${PROXY_URL}/market-data`).catch(() => null);

        let marketPairs: any[] = [];
        if (marketRes && marketRes.ok) {
            const marketData = await marketRes.json();
            marketPairs = marketData.pairs || [];
            console.log(`[Layer 3] Market data: ${marketPairs.length} Solana pairs`);
        } else {
            console.warn("[Layer 3] Market data unavailable - using fallback");
        }

        // Merge Layers: Match market data with Jupiter metadata
        let tokens: ZenithToken[] = [];

        if (marketPairs.length > 0) {
            // Primary: DexScreener pairs enriched with Jupiter metadata
            tokens = marketPairs
                .map(pair => {
                    const jupMetadata = jupiterTokens.get(pair.baseToken.address);
                    const normalized = normalizeToken(pair, jupMetadata);

                    // Apply Zenith Trust Engine filters
                    if (!normalized) return null;
                    if (normalized.liquidityUsd < 50000) return null;
                    if (normalized.volume24hUsd < 10000) return null;

                    return normalized;
                })
                .filter((t): t is ZenithToken => t !== null);
        }

        // Fallback: If market data failed, use top Jupiter tokens
        if (tokens.length < 12) {
            console.warn("Zenith: Low signal count. Engaging Jupiter Trusted Fallback.");

            const fallbackMints = [
                'So11111111111111111111111111111111111111112', // SOL
                'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
                'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
                'JUPyiwrYJFskUPiHa7hkeR8VUtkTrVMk1L2RCueP84', // JUP
                '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
                'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
                'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
            ];

            const existingMints = new Set(tokens.map(t => t.mint));

            fallbackMints.forEach(mint => {
                if (!existingMints.has(mint)) {
                    const jup = jupiterTokens.get(mint);
                    if (jup) {
                        tokens.push({
                            mint: jup.address,
                            symbol: jup.symbol,
                            name: jup.name,
                            logoURI: jup.logoURI,
                            priceUsd: 0,
                            liquidityUsd: 10000000,
                            volume24hUsd: 10000000,
                            txCount24h: 5000,
                            priceChange24h: 0,
                            zenithScore: 90
                        });
                    }
                }
            });
        }

        // Compute scores
        tokens.forEach(token => {
            token.zenithScore = computeZenithScore(token);
        });

        // Sort by score
        tokens.sort((a, b) => b.zenithScore - a.zenithScore);

        // Dedup
        const seen = new Set<string>();
        const uniqueTokens: ZenithToken[] = [];
        for (const t of tokens) {
            if (!seen.has(t.mint)) {
                seen.add(t.mint);
                uniqueTokens.push(t);
            }
        }

        console.log(`Zenith: Engine ready. ${uniqueTokens.length} assets tracking.`);

        return uniqueTokens.slice(0, 50);

    } catch (err) {
        console.error("Zenith: Engine Failure", err);
        return [];
    }
}
