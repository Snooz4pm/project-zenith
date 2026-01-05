
import { fetchJupiterTokens, getLivePrice } from './fetch/jupiter';
import { fetchDexScreenerPools } from './fetch/dexScreener';
import { normalizeToken } from './normalize/mapper';
import { ZenithToken } from './types';

export { getLivePrice };
export type { ZenithToken };

export async function buildZenithTokenList(): Promise<ZenithToken[]> {
    try {
        // Parallel Fetch
        const [jupMap, pairs] = await Promise.all([
            fetchJupiterTokens(),
            fetchDexScreenerPools()
        ]);

        // Normalize & Filter & Score
        const tokens = pairs
            .map(pair => normalizeToken(pair, jupMap.get(pair.baseToken.address)))
            .filter((t): t is ZenithToken => t !== null)
            .sort((a, b) => b.zenithScore - a.zenithScore);

        // Dedup (Keep highest score if dupes exist, though Map prevents distinct mints usually, 
        // DexScreener might have multiple pairs for same token. We want best pair.)
        const seen = new Set<string>();
        const uniqueTokens: ZenithToken[] = [];

        for (const t of tokens) {
            if (!seen.has(t.mint)) {
                seen.add(t.mint);
                uniqueTokens.push(t);
            }
        }

        return uniqueTokens.slice(0, 40); // Hard Limit 40

    } catch (err) {
        console.error("Zenith Build Failed", err);
        return [];
    }
}
