/**
 * CRYPTO PRICE ENGINE - LAUNCH VERSION
 * 
 * RULE: Use Coinbase for all majors. Reject everything else.
 * NO DexScreener for launch to avoid $65k BTC bugs.
 */

// The only cryptos we support at launch
export const SUPPORTED_CRYPTOS = [
    'BTC', 'ETH', 'USDT', 'USDC',
    'BNB', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOGE',
    'LINK', 'MATIC', 'DOT', 'ATOM', 'LTC',
    'UNI', 'AAVE', 'ARB', 'OP', 'TON'
];

// Coinbase supports these - use their spot price API
const COINBASE_SYMBOLS: Record<string, string> = {
    'BTC': 'BTC',
    'ETH': 'ETH',
    'USDT': 'USDT',
    'USDC': 'USDC',
    'SOL': 'SOL',
    'XRP': 'XRP',
    'ADA': 'ADA',
    'AVAX': 'AVAX',
    'DOGE': 'DOGE',
    'LINK': 'LINK',
    'MATIC': 'MATIC',
    'DOT': 'DOT',
    'ATOM': 'ATOM',
    'LTC': 'LTC',
    'UNI': 'UNI',
    'AAVE': 'AAVE',
};

// These are NOT on Coinbase - use CoinGecko simple price
const COINGECKO_IDS: Record<string, string> = {
    'BNB': 'binancecoin',
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'TON': 'the-open-network',
};

export interface CryptoPrice {
    symbol: string;
    price: number;
    changePercent: number;
    source: string;
    timestamp: number;
}

/**
 * Fetch crypto price from the correct source
 */
export async function fetchCryptoPrice(symbol: string): Promise<CryptoPrice | null> {
    const upperSymbol = symbol.toUpperCase();

    // Reject unsupported
    if (!SUPPORTED_CRYPTOS.includes(upperSymbol)) {
        console.warn(`[CryptoEngine] ${upperSymbol} not in allowlist`);
        return null;
    }

    // Try Coinbase first
    if (COINBASE_SYMBOLS[upperSymbol]) {
        try {
            const res = await fetch(
                `https://api.coinbase.com/v2/prices/${upperSymbol}-USD/spot`,
                { cache: 'no-store' }
            );
            const data = await res.json();
            const price = Number(data?.data?.amount);

            if (!isNaN(price) && price > 0) {
                console.log(`[CryptoEngine] ${upperSymbol} from Coinbase: $${price}`);
                return {
                    symbol: upperSymbol,
                    price,
                    changePercent: 0,
                    source: 'coinbase',
                    timestamp: Date.now()
                };
            }
        } catch (e) {
            console.warn(`[CryptoEngine] Coinbase failed for ${upperSymbol}`);
        }
    }

    // Fallback: CoinGecko for non-Coinbase tokens
    const geckoId = COINGECKO_IDS[upperSymbol];
    if (geckoId) {
        try {
            const res = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd&include_24hr_change=true`,
                { cache: 'no-store' }
            );
            const data = await res.json();
            const price = data?.[geckoId]?.usd;
            const change = data?.[geckoId]?.usd_24h_change || 0;

            if (price && price > 0) {
                console.log(`[CryptoEngine] ${upperSymbol} from CoinGecko: $${price}`);
                return {
                    symbol: upperSymbol,
                    price,
                    changePercent: change,
                    source: 'coingecko',
                    timestamp: Date.now()
                };
            }
        } catch (e) {
            console.warn(`[CryptoEngine] CoinGecko failed for ${upperSymbol}`);
        }
    }

    return null;
}

/**
 * Fetch all supported crypto prices
 */
export async function fetchAllCryptoPrices(): Promise<CryptoPrice[]> {
    const results = await Promise.all(
        SUPPORTED_CRYPTOS.map(s => fetchCryptoPrice(s))
    );
    return results.filter(Boolean) as CryptoPrice[];
}
