/**
 * THE TRUTH GATE IMPLEMENTATION
 * 
 * Shared logic for price fetching.
 * Used by:
 * 1. API Route (/api/price) - for client-side fetching
 * 2. Zenith Adapter - for server-side fetching
 */

export async function fetchAssetPrice(
    symbol: string,
    market: 'stock' | 'forex' | 'crypto'
): Promise<{ price: number; source: string; timestamp: number } | null> {

    const ALPHA_KEY = process.env.ALPHA_KEY;

    try {
        if (market === 'stock') {
            if (!ALPHA_KEY) throw new Error("Missing ALPHA_KEY");

            const res = await fetch(
                `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_KEY}`,
                { cache: 'no-store' }
            );
            const data = await res.json();
            const price = Number(data?.["Global Quote"]?.["05. price"]);

            if (!isNaN(price) && price > 0) {
                return { price, source: 'alpha_vantage', timestamp: Date.now() };
            }
        }

        if (market === 'forex') {
            if (!ALPHA_KEY) throw new Error("Missing ALPHA_KEY");

            let from = symbol;
            let to = "USD";

            if (symbol.includes("/")) {
                [from, to] = symbol.split("/");
            } else if (symbol.length === 6) {
                from = symbol.slice(0, 3);
                to = symbol.slice(3, 6);
            }

            const res = await fetch(
                `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${ALPHA_KEY}`,
                { cache: 'no-store' }
            );
            const data = await res.json();
            const price = Number(data?.["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"]);

            if (!isNaN(price) && price > 0) {
                return { price, source: 'alpha_vantage', timestamp: Date.now() };
            }
        }

        if (market === 'crypto') {
            const res = await fetch(
                `https://api.dexscreener.com/latest/dex/search?q=${symbol}`,
                { cache: 'no-store' }
            );
            const data = await res.json();
            const price = Number(data?.pairs?.[0]?.priceUsd);

            if (!isNaN(price) && price > 0) {
                return { price, source: 'dexscreener', timestamp: Date.now() };
            }
        }
    } catch (error) {
        console.warn(`[PriceFetch] Failed to fetch ${market}:${symbol}:`, error);
    }

    return null;
}
