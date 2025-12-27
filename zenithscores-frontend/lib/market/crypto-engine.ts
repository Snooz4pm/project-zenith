/**
 * CRYPTO PRICE ENGINE - LAUNCH VERSION
 * 
 * RULE: Use Coinbase for all majors. Reject everything else.
 * NO DexScreener for launch to avoid $65k BTC bugs.
 * 
 * FEATURES:
 * - 5s timeout on all API calls
 * - Sanity bounds for BTC and stablecoins
 * - Centralized crypto metadata
 */

// The only cryptos we support at launch
export const SUPPORTED_CRYPTOS = [
    'BTC', 'ETH', 'USDT', 'USDC',
    'BNB', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOGE',
    'LINK', 'MATIC', 'DOT', 'ATOM', 'LTC',
    'UNI', 'AAVE', 'ARB', 'OP', 'TON'
] as const;

export type SupportedCrypto = typeof SUPPORTED_CRYPTOS[number];

// Display names for UI
export const CRYPTO_NAMES: Record<string, string> = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'USDT': 'Tether',
    'USDC': 'USD Coin',
    'BNB': 'BNB',
    'SOL': 'Solana',
    'XRP': 'XRP',
    'ADA': 'Cardano',
    'AVAX': 'Avalanche',
    'DOGE': 'Dogecoin',
    'LINK': 'Chainlink',
    'MATIC': 'Polygon',
    'DOT': 'Polkadot',
    'ATOM': 'Cosmos',
    'LTC': 'Litecoin',
    'UNI': 'Uniswap',
    'AAVE': 'Aave',
    'ARB': 'Arbitrum',
    'OP': 'Optimism',
    'TON': 'Toncoin',
};

// Coinbase supports these
const COINBASE_SYMBOLS = new Set([
    'BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOGE',
    'LINK', 'MATIC', 'DOT', 'ATOM', 'LTC', 'UNI', 'AAVE'
]);

// CoinGecko fallback for non-Coinbase tokens
const COINGECKO_IDS: Record<string, string> = {
    'BNB': 'binancecoin',
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'TON': 'the-open-network',
};

// Sanity bounds
const SANITY_BOUNDS: Record<string, { min: number; max: number }> = {
    'BTC': { min: 50000, max: 150000 },
    'ETH': { min: 1500, max: 10000 },
    'USDT': { min: 0.95, max: 1.05 },
    'USDC': { min: 0.95, max: 1.05 },
};

export interface CryptoPrice {
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
    source: string;
    timestamp: number;
}

// Timeout wrapper for fetch
async function fetchWithTimeout(url: string, timeoutMs: number = 5000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            cache: 'no-store'
        });
        return response;
    } finally {
        clearTimeout(id);
    }
}

// Sanity check
function passedSanityCheck(symbol: string, price: number): boolean {
    const bounds = SANITY_BOUNDS[symbol];
    if (bounds) {
        if (price < bounds.min || price > bounds.max) {
            console.error(`[CryptoEngine] SANITY FAIL: ${symbol} price $${price} outside [${bounds.min}, ${bounds.max}]`);
            return false;
        }
    }
    return price > 0;
}

/**
 * Fetch crypto price from the correct source
 */
export async function fetchCryptoPrice(symbol: string): Promise<CryptoPrice | null> {
    const upperSymbol = symbol.toUpperCase();

    // Reject unsupported
    if (!SUPPORTED_CRYPTOS.includes(upperSymbol as SupportedCrypto)) {
        return null;
    }

    const name = CRYPTO_NAMES[upperSymbol] || upperSymbol;

    // Try Coinbase first
    if (COINBASE_SYMBOLS.has(upperSymbol)) {
        try {
            const res = await fetchWithTimeout(
                `https://api.coinbase.com/v2/prices/${upperSymbol}-USD/spot`
            );
            const data = await res.json();
            const price = Number(data?.data?.amount);

            if (passedSanityCheck(upperSymbol, price)) {
                return {
                    symbol: upperSymbol,
                    name,
                    price,
                    changePercent: 0,
                    source: 'coinbase',
                    timestamp: Date.now()
                };
            }
        } catch (e) {
            // Timeout or network error - silent fallthrough
        }
    }

    // Fallback: CoinGecko for non-Coinbase tokens
    const geckoId = COINGECKO_IDS[upperSymbol];
    if (geckoId) {
        try {
            const res = await fetchWithTimeout(
                `https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd&include_24hr_change=true`
            );
            const data = await res.json();
            const price = data?.[geckoId]?.usd;
            const change = data?.[geckoId]?.usd_24h_change || 0;

            if (passedSanityCheck(upperSymbol, price)) {
                return {
                    symbol: upperSymbol,
                    name,
                    price,
                    changePercent: change,
                    source: 'coingecko',
                    timestamp: Date.now()
                };
            }
        } catch (e) {
            // Timeout or network error - silent
        }
    }

    return null;
}

/**
 * Check if a symbol is supported
 */
export function isSupportedCrypto(symbol: string): boolean {
    return SUPPORTED_CRYPTOS.includes(symbol.toUpperCase() as SupportedCrypto);
}

/**
 * Get display name for a crypto
 */
export function getCryptoName(symbol: string): string {
    return CRYPTO_NAMES[symbol.toUpperCase()] || symbol.toUpperCase();
}

/**
 * Fetch all supported crypto prices (for list pages)
 */
export async function fetchAllCryptoPrices(): Promise<CryptoPrice[]> {
    const results = await Promise.allSettled(
        SUPPORTED_CRYPTOS.map(s => fetchCryptoPrice(s))
    );

    return results
        .filter((r): r is PromiseFulfilledResult<CryptoPrice | null> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter((p): p is CryptoPrice => p !== null);
}
