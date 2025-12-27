/**
 * UNIFIED LIVE PRICE FETCHER
 * 
 * Refactored to use the Truth Gate (fetchAssetPrice)
 * Ensures consistent data, fallbacks, and error handling.
 */

import { fetchAssetPrice } from '@/lib/market/price-source';
import { LivePriceResult, DELAY_THRESHOLD_MS } from './types';

/**
 * Fetch LIVE price using the Truth Gate
 */
export async function fetchLivePrice(
    symbol: string,
    assetType: 'stock' | 'forex'
): Promise<LivePriceResult | null> {

    // Normalize Forex symbol for the Truth Gate
    if (assetType === 'forex' && !symbol.includes('/')) {
        // Assume format like "EURUSD" needs to be "EUR/USD" or "OANDA:..." handled by internal logic
        // But price-source handles "EURUSD" fine if length is 6
    }

    const result = await fetchAssetPrice(symbol, assetType);

    if (!result) return null;

    const now = Date.now();
    const latency = now - result.timestamp;
    const isDelayed = latency > DELAY_THRESHOLD_MS;

    return {
        symbol: symbol,
        price: result.price,
        changePercent: result.changePercent,
        previousClose: result.price, // Approximate since simple API might not return PC
        high: result.price, // Approximate
        low: result.price, // Approximate
        open: result.price, // Approximate
        timestamp: result.timestamp,
        isDelayed: isDelayed,
        delaySeconds: Math.round(latency / 1000),
        source: result.source
    };
}

// Re-export specific helpers if needed, but they should just wrap the main function
export async function fetchLiveStockPrice(symbol: string) {
    return fetchLivePrice(symbol, 'stock');
}

export async function fetchLiveForexPrice(symbol: string) {
    return fetchLivePrice(symbol, 'forex');
}
