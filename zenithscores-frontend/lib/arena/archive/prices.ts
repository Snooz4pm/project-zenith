// Arena Price Service - Real-time price feeds for trading arena
import { fetchAssetPrice } from '@/lib/market/price-source';

// Token to CoinGecko ID mapping
const TOKEN_IDS: Record<string, string> = {
    ETH: 'ethereum',
    WBTC: 'wrapped-bitcoin',
    SOL: 'solana',
    LINK: 'chainlink',
    UNI: 'uniswap',
    AAVE: 'aave',
    ARB: 'arbitrum',
    OP: 'optimism',
};

// Token to symbol mapping for internal price source
const TOKEN_SYMBOLS: Record<string, { symbol: string; market: 'stock' | 'forex' | 'crypto' }> = {
    ETH: { symbol: 'ethereum', market: 'crypto' },
    WBTC: { symbol: 'bitcoin', market: 'crypto' },
    SOL: { symbol: 'solana', market: 'crypto' },
    LINK: { symbol: 'chainlink', market: 'crypto' },
    UNI: { symbol: 'uniswap', market: 'crypto' },
};

export interface TokenPrice {
    symbol: string;
    price: number;
    change24h: number;
    timestamp: number;
    source: string;
}

/**
 * Fetch price for a single token using CoinGecko
 */
export async function fetchTokenPriceCoinGecko(symbol: string): Promise<TokenPrice | null> {
    const coinId = TOKEN_IDS[symbol];
    if (!coinId) return null;

    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
            { next: { revalidate: 30 } } // Cache for 30 seconds
        );

        if (!response.ok) return null;

        const data = await response.json();
        const coinData = data[coinId];

        if (!coinData) return null;

        return {
            symbol,
            price: coinData.usd,
            change24h: coinData.usd_24h_change || 0,
            timestamp: Date.now(),
            source: 'coingecko',
        };
    } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
        return null;
    }
}

/**
 * Fetch prices for multiple tokens
 */
export async function fetchAllTokenPrices(): Promise<Record<string, TokenPrice>> {
    const ids = Object.values(TOKEN_IDS).join(',');

    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
            { next: { revalidate: 30 } }
        );

        if (!response.ok) return {};

        const data = await response.json();
        const prices: Record<string, TokenPrice> = {};

        for (const [symbol, coinId] of Object.entries(TOKEN_IDS)) {
            const coinData = data[coinId];
            if (coinData) {
                prices[symbol] = {
                    symbol,
                    price: coinData.usd,
                    change24h: coinData.usd_24h_change || 0,
                    timestamp: Date.now(),
                    source: 'coingecko',
                };
            }
        }

        return prices;
    } catch (error) {
        console.error('Failed to fetch token prices:', error);
        return {};
    }
}

/**
 * Get price using internal price source (fallback)
 */
export async function fetchTokenPriceInternal(symbol: string): Promise<TokenPrice | null> {
    const config = TOKEN_SYMBOLS[symbol];
    if (!config) return null;

    try {
        const result = await fetchAssetPrice(config.symbol, config.market);
        if (!result) return null;

        return {
            symbol,
            price: result.price,
            change24h: result.changePercent,
            timestamp: result.timestamp,
            source: result.source,
        };
    } catch (error) {
        console.error(`Failed to fetch internal price for ${symbol}:`, error);
        return null;
    }
}

/**
 * Get price with fallback (CoinGecko -> Internal)
 */
export async function getTokenPrice(symbol: string): Promise<TokenPrice | null> {
    // Try CoinGecko first
    const cgPrice = await fetchTokenPriceCoinGecko(symbol);
    if (cgPrice) return cgPrice;

    // Fallback to internal
    return fetchTokenPriceInternal(symbol);
}
