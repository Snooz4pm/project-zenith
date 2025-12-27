/**
 * DEXSCREENER LIVE FETCHER
 * 
 * RULES:
 * - Poll every 10-15 seconds (NOT faster)
 * - cache: "no-store"
 * - Price only changes when trades happen
 * - Show liquidity context ALWAYS
 * - NO fake movement, NO interpolation
 */

import {
    DexscreenerPair,
    CryptoLiveState,
    LiquidityTier,
    CryptoLiveStatus,
    LIQUIDITY_HIGH_THRESHOLD,
    LIQUIDITY_MEDIUM_THRESHOLD,
    LOW_ACTIVITY_THRESHOLD_MS,
} from './types';

const BASE_URL = 'https://api.dexscreener.com/latest/dex';

/**
 * Get liquidity tier from USD value
 */
function getLiquidityTier(liquidityUsd: number): LiquidityTier {
    if (liquidityUsd >= LIQUIDITY_HIGH_THRESHOLD) return 'HIGH';
    if (liquidityUsd >= LIQUIDITY_MEDIUM_THRESHOLD) return 'MEDIUM';
    return 'LOW';
}

/**
 * Determine status based on activity
 */
function getStatus(txnsH1: number, lastFetchSuccess: boolean): CryptoLiveStatus {
    if (!lastFetchSuccess) return 'DISCONNECTED';
    if (txnsH1 === 0) return 'LOW_ACTIVITY';
    return 'LIVE';
}

/**
 * Search for token pairs by symbol
 * Returns top pair by liquidity for the symbol
 */
export async function searchTokenPair(symbol: string): Promise<DexscreenerPair | null> {
    try {
        const url = `${BASE_URL}/search?q=${encodeURIComponent(symbol)}`;

        console.log(`[CRYPTO] Searching Dexscreener for: ${symbol}`);

        const response = await fetch(url, {
            cache: 'no-store',
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            console.error(`[CRYPTO] Dexscreener search error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const pairs: DexscreenerPair[] = data.pairs || [];

        if (pairs.length === 0) {
            console.warn(`[CRYPTO] No pairs found for ${symbol}`);
            return null;
        }

        // Find best match: symbol matches AND highest liquidity
        const symbolUpper = symbol.toUpperCase();
        const matching = pairs.filter(p =>
            p.baseToken.symbol.toUpperCase() === symbolUpper ||
            p.baseToken.symbol.toUpperCase() === symbolUpper.replace('USD', '')
        );

        // Sort by liquidity (highest first)
        const sorted = (matching.length > 0 ? matching : pairs)
            .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

        const best = sorted[0];

        console.log(`[CRYPTO] Found: ${best.baseToken.symbol}/${best.quoteToken.symbol} on ${best.chainId}, liquidity: $${best.liquidity?.usd?.toLocaleString()}`);

        return best;
    } catch (error) {
        console.error(`[CRYPTO] Search error for ${symbol}:`, error);
        return null;
    }
}

/**
 * Fetch pair by address (more reliable than search)
 */
export async function fetchPairByAddress(
    chain: string,
    pairAddress: string
): Promise<DexscreenerPair | null> {
    try {
        const url = `${BASE_URL}/pairs/${chain}/${pairAddress}`;

        const response = await fetch(url, {
            cache: 'no-store',
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            console.error(`[CRYPTO] Dexscreener pair fetch error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const pair: DexscreenerPair = data.pair || data.pairs?.[0];

        if (!pair) {
            console.warn(`[CRYPTO] Pair not found: ${chain}/${pairAddress}`);
            return null;
        }

        return pair;
    } catch (error) {
        console.error(`[CRYPTO] Pair fetch error:`, error);
        return null;
    }
}

/**
 * Fetch LIVE crypto price from Dexscreener
 * Main entry point for crypto LIVE data
 */
export async function fetchCryptoLive(symbol: string): Promise<CryptoLiveState | null> {
    try {
        const pair = await searchTokenPair(symbol);

        if (!pair) {
            return null;
        }

        const now = Date.now();
        const priceUsd = parseFloat(pair.priceUsd) || 0;
        const liquidityUsd = pair.liquidity?.usd || 0;
        const volume24h = pair.volume?.h24 || 0;
        const txnsH1 = (pair.txns?.h1?.buys || 0) + (pair.txns?.h1?.sells || 0);
        const priceChange24h = pair.priceChange?.h24 || 0;

        // Estimate last trade time from activity
        // If there are recent transactions, assume trade was recent
        const lastTradeTime = txnsH1 > 0 ? now : now - LOW_ACTIVITY_THRESHOLD_MS;

        const liquidityTier = getLiquidityTier(liquidityUsd);
        const status = getStatus(txnsH1, true);

        console.log(`[CRYPTO] ${pair.baseToken.symbol}: $${priceUsd.toFixed(6)}, liq: $${liquidityUsd.toLocaleString()}, tier: ${liquidityTier}, status: ${status}`);

        return {
            symbol: pair.baseToken.symbol,
            pairAddress: pair.pairAddress,
            chain: pair.chainId,
            priceUsd,
            priceChange24h,
            liquidityUsd,
            liquidityTier,
            volume24h,
            txnsH1,
            lastTradeTime,
            status,
            lastFetchedAt: now,
        };
    } catch (error) {
        console.error(`[CRYPTO] Live fetch error for ${symbol}:`, error);
        return null;
    }
}

/**
 * Fetch multiple crypto prices at once
 */
export async function fetchCryptoLiveBatch(symbols: string[]): Promise<Record<string, CryptoLiveState | null>> {
    const results: Record<string, CryptoLiveState | null> = {};

    // Fetch sequentially to avoid rate limits
    for (const symbol of symbols) {
        results[symbol] = await fetchCryptoLive(symbol);
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
}
