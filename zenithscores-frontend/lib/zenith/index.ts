import { fetchJupiterTokens } from './fetch/jupiter';
import { ZenithToken } from './types';

export type { ZenithToken } from './types';
export { getLivePrice } from './fetch/jupiter';

/**
 * Build Zenith Token List
 * 
 * Jupiter v6/tokens returns ONLY swappable tokens with routes.
 * No additional filtering needed - trust Jupiter's curation.
 */
export async function buildZenithTokenList(): Promise<ZenithToken[]> {
    try {
        console.log("Zenith: Initializing Token Intelligence Engine...");

        // Fetch Jupiter's swappable token universe (~12-14k)
        const jupiterTokens = await fetchJupiterTokens();
        console.log(`[Zenith] Jupiter returned ${jupiterTokens.size} swappable tokens`);

        // Convert Map to Array and create ZenithToken objects
        const tokens: ZenithToken[] = Array.from(jupiterTokens.values()).map(jup => ({
            mint: jup.address,
            symbol: jup.symbol,
            name: jup.name,
            logoURI: jup.logoURI,
            // Placeholder values - will be enriched on-demand or via separate price feed
            priceUsd: 0,
            liquidityUsd: 0,
            volume24hUsd: 0,
            txCount24h: 0,
            priceChange24h: 0,
            zenithScore: 50 // Neutral score
        }));

        // Return top tokens by symbol popularity (for now)
        // In future: sort by actual trading volume/liquidity
        const prioritySymbols = ['SOL', 'USDC', 'USDT', 'JUP', 'RAY', 'BONK', 'WIF', 'PYTH', 'JTO'];
        const prioritized = tokens.sort((a, b) => {
            const aIdx = prioritySymbols.indexOf(a.symbol);
            const bIdx = prioritySymbols.indexOf(b.symbol);
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
            if (aIdx !== -1) return -1;
            if (bIdx !== -1) return 1;
            return a.symbol.localeCompare(b.symbol);
        });

        console.log(`Zenith: Engine ready. ${tokens.length} swappable assets available.`);

        // Return top 100 for UI performance
        return prioritized.slice(0, 100);

    } catch (err) {
        console.error("Zenith: Engine Failure", err);

        // Minimal fallback
        return [{
            mint: 'So11111111111111111111111111111111111111112',
            symbol: 'SOL',
            name: 'Solana',
            logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
            priceUsd: 0,
            liquidityUsd: 0,
            volume24hUsd: 0,
            txCount24h: 0,
            priceChange24h: 0,
            zenithScore: 100
        }];
    }
}
