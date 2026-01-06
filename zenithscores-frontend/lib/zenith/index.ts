
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

        // 1. Fetch Trusted Data Sources
        // - Jupiter Strict: Validated, verified tokens (Core Trust).
        // - DexScreener: Real-time market data for trending/liquidity checks.
        const [jupStrict, pairs] = await Promise.all([
            fetchJupiterTokens(), // Now using Strict list internally or needs config
            fetchDexScreenerPools().catch(e => {
                console.warn("Zenith: DexScreener data unavailable", e);
                return [];
            })
        ]);

        // 2. Map Jupiter Data (Metadata Source)
        // Using 'strict' list ensures we start with ~600-800 high-quality tokens
        // rather than 20k+ garbage tokens.
        const tokenMap = jupStrict;

        let tokens: ZenithToken[] = [];

        // 3. Process DexScreener Pairs (Primary "Active" Source)
        if (pairs.length > 0) {
            tokens = pairs
                .map(pair => {
                    const jupInfo = tokenMap.get(pair.baseToken.address);
                    // Normalizer applies filters internally (Liq > 100k etc based on signals, but let's apply general Zenith filters here)
                    const normalized = normalizeToken(pair, jupInfo);

                    // "Grok-Style" Strict Filters for the Display Grid
                    if (!normalized) return null;

                    // Filter: Liquidity Depth > $50k (User Requirement)
                    if (normalized.liquidityUsd < 50000) return null;

                    // Filter: 24h Volume > $10k (User Requirement)
                    if (normalized.volume24hUsd < 10000) return null;

                    // Filter: Must have valid metadata (Icon/Symbol)
                    if (!normalized.logoURI && !jupInfo) return null; // Skip unknown junk

                    return normalized;
                })
                .filter((t): t is ZenithToken => t !== null)
                .sort((a, b) => b.zenithScore - a.zenithScore);
        }

        // 4. Fallback / Augmentation
        // If we have few tokens (API limit or market crash), fill with Top trusted assets from Jupiter
        if (tokens.length < 12) {
            console.warn("Zenith: Low signal count. Engaging Jupiter Trusted Fallback.");

            // Core Trusted Mints (SOL, USDC, USDT, JUP, RAY, BONK, WIF)
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
                    const jup = tokenMap.get(mint);
                    if (jup) {
                        tokens.push({
                            mint: jup.address,
                            symbol: jup.symbol,
                            name: jup.name,
                            logoURI: jup.logoURI,
                            // Mocks/Proxies for Fallback (safe assumptions for Majors)
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

        // 5. Dedup & Limit
        const seen = new Set<string>();
        const uniqueTokens: ZenithToken[] = [];

        for (const t of tokens) {
            if (!seen.has(t.mint)) {
                seen.add(t.mint);
                uniqueTokens.push(t);
            }
        }

        console.log(`Zenith: Engine ready. ${uniqueTokens.length} assets tracking.`);

        // Return Top 50 for UI performance
        return uniqueTokens.slice(0, 50);

    } catch (err) {
        console.error("Zenith: Engine Failure", err);
        return [];
    }
}
