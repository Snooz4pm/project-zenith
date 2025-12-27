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

export async function fetchAssetPrice(
    symbol: string,
    market: 'stock' | 'forex' | 'crypto'
): Promise<PriceResponse | null> {

    const ALPHA_KEY = process.env.ALPHA_KEY;

    try {
        if (market === 'stock') {
            if (!ALPHA_KEY) throw new Error("Missing ALPHA_KEY");

            const res = await fetch(
                `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_KEY}`,
                { cache: 'no-store' }
            );
            const data = await res.json();

            // RATE LIMIT GUARD
            if (data.Note || data.Information) {
                console.warn("[PriceFetch] Alpha Vantage Rate Limited (Stock)");
                // Fallback to Finnhub if AV fails
                const fh = await fetchPriceFinnhub(symbol);
                if (fh) return { price: fh.price, changePercent: fh.changePercent, source: 'finnhub', timestamp: Date.now() };
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
                    // console.log(`[PriceFetch] Forex Finnhub Success: ${fhSymbol} $${fh.price}`);
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
                        // Note: AV Forex endpoint doesn't return change percent in CURRENCY_EXCHANGE_RATE directly.
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
            // RULE ZERO: DexScreener ONLY, strictly filtered for major chains/high-volume
            const query = symbol.replace('/', '');
            // Prevent cache completely
            const res = await fetch(
                `https://api.dexscreener.com/latest/dex/search?q=${query}&t=${Date.now()}`,
                { cache: 'no-store' }
            );
            const data = await res.json();

            if (data?.pairs && Array.isArray(data.pairs)) {
                // Pre-filter for main chains
                let candidates = data.pairs.filter((p: any) =>
                    ['ethereum', 'bsc', 'solana', 'base'].includes(p.chainId)
                );

                // Filter by Symbol (BTC or WBTC)
                candidates = candidates.filter((p: any) =>
                    p.baseToken.symbol.toUpperCase() === symbol.toUpperCase() ||
                    p.baseToken.symbol.toUpperCase() === 'W' + symbol.toUpperCase()
                );

                // Sort by Liquidity
                candidates.sort((a: any, b: any) => Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0));

                // Find first "Healthy" pair
                // Lowered thresholds for debugging/safety: Liq > 100k, Vol > 50k
                const bestPair = candidates.find((p: any) =>
                    Number(p.liquidity?.usd || 0) > 100000 &&
                    Number(p.volume?.h24 || 0) > 50000
                );

                if (!bestPair) {
                    console.warn(`[PriceFetch] No healthy pair found for ${symbol} (Checked ${candidates.length} candidates)`);
                    // Debug log the first raw candidate if any
                    if (candidates.length > 0) {
                        console.warn(`Top Rejected Candidate: ${candidates[0].chainId} Liq:${candidates[0].liquidity?.usd}`);
                    }
                    return null;
                }

                const price = Number(bestPair?.priceUsd);
                const changePercent = Number(bestPair?.priceChange?.h24 || 0);

                // BTC SANITY ANCHOR
                if (symbol.toUpperCase() === 'BTC') {
                    if (price < 10000 || price > 150000) {
                        console.error(`[PriceFetch] INSANE BTC PRICE: ${price} - REJECTING`);
                        console.error(`Rejected Pair: ${bestPair.chainId} ${bestPair.pairAddress}`);
                        return null;
                    }
                }

                if (!isNaN(price) && price > 0) {
                    return { price, changePercent, source: `dexscreener:${bestPair.chainId}`, timestamp: Date.now() };
                }
            }
        }
    } catch (error) {
        console.warn(`[PriceFetch] Failed to fetch ${market}:${symbol}:`, error);
    }

    return null;
}
