/**
 * THE TRUTH GATE IMPLEMENTATION 
 * 
 * Shared logic for price fetching.
 * Used by:
 * 1. API Route (/api/price) - for client-side fetching
 * 2. Zenith Adapter - for server-side fetching
 */
import { fetchPriceFinnhub } from '@/lib/finnhub';

export interface PriceResponse {
    price: number;
    changePercent: number;
    source: string;
    timestamp: number;
}

// Re-export SUPPORTED_CRYPTOS from centralized engine
export { SUPPORTED_CRYPTOS } from '@/lib/market/crypto-engine';

export async function fetchAssetPrice(
    symbol: string,
    market: 'stock' | 'forex' | 'crypto'
): Promise<PriceResponse | null> {

    const ALPHA_KEY = process.env.ALPHA_KEY;

    try {
        if (market === 'stock') {
            // RULE ZERO: Stocks -> Finnhub (Primary) -> Alpha Vantage (Fallback)

            // 1. Primary: Finnhub
            try {
                const fh = await fetchPriceFinnhub(symbol);
                if (fh && fh.price > 0) {
                    return { price: fh.price, changePercent: fh.changePercent, source: 'finnhub', timestamp: Date.now() };
                }
            } catch (e) {
                console.warn(`[PriceFetch] Finnhub Stock failed for ${symbol}`, e);
            }

            // 2. Secondary: Alpha Vantage
            if (!ALPHA_KEY) throw new Error("Missing ALPHA_KEY");

            const res = await fetch(
                `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_KEY}`,
                { cache: 'no-store' }
            );
            const data = await res.json();

            // RATE LIMIT GUARD
            if (data.Note || data.Information) {
                console.warn("[PriceFetch] Alpha Vantage Rate Limited (Stock)");
                return null;
            }

            const price = Number(data?.["Global Quote"]?.["05. price"]);
            const changeStr = data?.["Global Quote"]?.["10. change percent"] || "0%";
            const changePercent = parseFloat(changeStr.replace('%', ''));

            if (!isNaN(price) && price > 0) {
                return { price, changePercent, source: 'alpha_vantage', timestamp: Date.now() };
            }
        }

        if (market === 'forex') {
            // RULE ZERO: Forex -> Finnhub (Primary) -> Alpha Vantage -> Coinbase

            // 1. Primary: Finnhub (Fast & Robust)
            try {
                // Finnhub needs OANDA:EUR_USD format usually
                const fhSymbol = symbol.includes('/') ? `OANDA:${symbol.replace('/', '_')}` : symbol;
                const fh = await fetchPriceFinnhub(fhSymbol);
                if (fh && fh.price > 0) {
                    return { price: fh.price, changePercent: fh.changePercent, source: 'finnhub', timestamp: Date.now() };
                }
            } catch (e) {
                console.warn(`[PriceFetch] Finnhub Forex failed for ${symbol}`, e);
            }

            // 2. Secondary: Alpha Vantage (With strict parsing and guards)
            if (ALPHA_KEY) {
                let from = symbol, to = "USD";
                if (symbol.includes("/")) [from, to] = symbol.split("/");
                else if (symbol.length === 6) { from = symbol.slice(0, 3); to = symbol.slice(3, 6); }

                try {
                    const res = await fetch(
                        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${ALPHA_KEY}`,
                        { cache: 'no-store' }
                    );
                    const data = await res.json();

                    // RATE LIMIT GUARD
                    if (data.Note || data.Information) {
                        console.warn("[PriceFetch] Alpha Vantage Rate Limited (Forex)");
                    } else {
                        const price = Number(data?.["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"]);
                        if (!isNaN(price) && price > 0) {
                            return { price, changePercent: 0, source: 'alpha_vantage', timestamp: Date.now() };
                        }
                    }
                } catch (avErr) { }
            }

            // 3. Fallback: Coinbase
            try {
                let from = symbol, to = "USD";
                if (symbol.includes("/")) [from, to] = symbol.split("/");
                const cbRes = await fetch(`https://api.coinbase.com/v2/prices/${from}-${to}/spot`);
                const cbData = await cbRes.json();
                const price = Number(cbData?.data?.amount);
                if (!isNaN(price) && price > 0) {
                    return { price, changePercent: 0, source: 'coinbase', timestamp: Date.now() };
                }
            } catch (cbErr) { }
        }

        if (market === 'crypto') {
            // LAUNCH VERSION: Use crypto-engine (Coinbase/CoinGecko only, no DexScreener)
            const { fetchCryptoPrice } = await import('@/lib/market/crypto-engine');
            const result = await fetchCryptoPrice(symbol);
            if (result) {
                return {
                    price: result.price,
                    changePercent: result.changePercent,
                    source: result.source,
                    timestamp: result.timestamp
                };
            }
        }
    } catch (error) {
        console.warn(`[PriceFetch] Failed to fetch ${market}:${symbol}:`, error);
    }

    return null;
}
