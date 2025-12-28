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

// VERIFIED pair addresses for major tokens - prevents wrong matches
const VERIFIED_PAIRS: Record<string, { chain: string; pair: string }> = {
    'ETH': { chain: 'ethereum', pair: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640' },
    'SHIB': { chain: 'ethereum', pair: '0x811beed0119b4afce20d2583eb608c6f7af1954f' },
    'LINK': { chain: 'ethereum', pair: '0xa6cc3c2531fdaa6ae1a3ca84c2855806728693e8' },
    'PEPE': { chain: 'ethereum', pair: '0xa43fe16908251ee70ef74718545e4fe6c5ccec9f' },
    'SOL': { chain: 'solana', pair: 'So11111111111111111111111111111111111111112' },
    'BONK': { chain: 'solana', pair: '8QaXeHBrShJTdtN1rWCccBxpSVvKEeCxM6rJw5Mfqw6Y' },
    'WIF': { chain: 'solana', pair: 'EP2ib6dYdEeqD8MfE2ezHCxX3kP3K2eLKkirfPm5eU1X' },
    'BNB': { chain: 'bsc', pair: '0x58f876857a02d6762e0101bb5c46a8c1ed44dc16' },
    'DOGE': { chain: 'bsc', pair: '0xac109c8025f272414fd9e2faa805a583708a017f' },
};

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

        // Find best match: symbol matches AND highest volume/liquidity
        // Prioritize USD pairs
        const symbolUpper = symbol.toUpperCase();

        // Filter for matches
        const matches = pairs.filter(p =>
            p.baseToken.symbol.toUpperCase() === symbolUpper ||
            p.baseToken.symbol.toUpperCase() === symbolUpper.replace('USD', '')
        );

        const candidates = matches.length > 0 ? matches : pairs;

        // Prioritize USD quotes
        const validPairs = candidates.filter(p =>
            ['USDT', 'USDC', 'USD', 'DAI'].includes(p.quoteToken.symbol.toUpperCase())
        );

        // Sort by change data (primary) and volume (secondary)
        const sorted = (validPairs.length > 0 ? validPairs : candidates)
            .sort((a, b) => {
                // Prefer pairs with valid change data
                const changeA = Math.abs(a.priceChange?.h24 || 0);
                const changeB = Math.abs(b.priceChange?.h24 || 0);
                const hasChangeA = changeA > 0 ? 1 : 0;
                const hasChangeB = changeB > 0 ? 1 : 0;

                if (hasChangeA !== hasChangeB) return hasChangeB - hasChangeA;

                const volA = a.volume?.h24 || 0;
                const volB = b.volume?.h24 || 0;
                if (Math.abs(volA - volB) > 1000) return volB - volA; // Volume wins if significant diff
                return (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0); // Else liquidity
            });

        const best = sorted[0];

        console.log(`[CRYPTO] Found: ${best.baseToken.symbol}/${best.quoteToken.symbol} on ${best.chainId}, price: ${best.priceUsd}, vol: ${best.volume?.h24}, change: ${best.priceChange?.h24}%`);

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
        const upperSymbol = symbol.toUpperCase();
        let pair: DexscreenerPair | null = null;

        // Check verified pairs first for accurate pricing
        const verified = VERIFIED_PAIRS[upperSymbol];
        if (verified) {
            console.log(`[CRYPTO] Using verified pair for ${upperSymbol}`);
            pair = await fetchPairByAddress(verified.chain, verified.pair);
        }

        // Fallback to search if no verified pair
        if (!pair) {
            pair = await searchTokenPair(symbol);
        }

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

/**
 * Fetch top crypto symbols from DexScreener
 * Returns unique token symbols sorted by activity
 */
export async function fetchTopCryptoSymbols(limit: number = 50): Promise<string[]> {
    try {
        // Use the token-boosts/top endpoint for trending tokens
        const url = 'https://api.dexscreener.com/token-boosts/top/v1';

        console.log('[CRYPTO] Fetching top tokens from DexScreener...');

        const response = await fetch(url, {
            cache: 'no-store',
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            console.error(`[CRYPTO] DexScreener top tokens error: ${response.status}`);
            // Fallback to default list
            return getDefaultCryptoSymbols();
        }

        const data = await response.json();

        // Extract unique symbols from the response
        const symbols = new Set<string>();

        if (Array.isArray(data)) {
            for (const token of data) {
                if (token.tokenAddress && token.chainId) {
                    // Try to get symbol from token info
                    const symbol = token.symbol || token.name?.split(' ')[0];
                    if (symbol && symbol.length <= 10) {
                        symbols.add(symbol.toUpperCase());
                    }
                }
            }
        }

        const result = Array.from(symbols).slice(0, limit);
        console.log(`[CRYPTO] Found ${result.length} top tokens`);

        // If we got results, return them, otherwise fallback
        return result.length > 5 ? result : getDefaultCryptoSymbols();
    } catch (error) {
        console.error('[CRYPTO] Error fetching top symbols:', error);
        return getDefaultCryptoSymbols();
    }
}

/**
 * Default crypto symbols fallback
 */
function getDefaultCryptoSymbols(): string[] {
    return [
        'BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK', 'MATIC',
        'SHIB', 'LTC', 'UNI', 'ATOM', 'XLM', 'BCH', 'NEAR', 'FIL', 'APT', 'ARB',
        'OP', 'INJ', 'RENDER', 'IMX', 'SUI', 'SEI', 'TIA', 'JUP', 'PYTH', 'WIF'
    ];
}
