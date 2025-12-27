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

            // console.log(`[PriceFetch] Forex Request: ${from} -> ${to}`);

            try {
                const res = await fetch(
                    `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${ALPHA_KEY}`,
                    { cache: 'no-store' }
                );
                const data = await res.json();
                const price = Number(data?.["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"]);

                if (!isNaN(price) && price > 0) {
                    return { price, source: 'alpha_vantage', timestamp: Date.now() };
                }
            } catch (avErr) {
                console.warn("[PriceFetch] Alpha Vantage Forex failed, trying fallback...", avErr);
            }

            // FALLBACK: Coinbase (Free, No Key required for major pairs)
            try {
                const cbRes = await fetch(`https://api.coinbase.com/v2/prices/${from}-${to}/spot`);
                const cbData = await cbRes.json();
                const price = Number(cbData?.data?.amount);
                if (!isNaN(price) && price > 0) {
                    return { price, source: 'coinbase', timestamp: Date.now() };
                }
            } catch (cbErr) {
                console.warn("[PriceFetch] Forex fallback failed:", cbErr);
            }
        }

        if (market === 'crypto') {
            // DexScreener often returns garbage first. We need to find the most liquid USD pair.
            const query = symbol.replace('/', ''); // Ensure clean symbol like BTCUSDT not BTC/USDT
            const res = await fetch(
                `https://api.dexscreener.com/latest/dex/search?q=${query}`,
                { cache: 'no-store' }
            );
            const data = await res.json();

            if (data?.pairs && Array.isArray(data.pairs)) {
                // Find best pair:
                // 1. Match base token (BTC)
                // 2. Quote is stable (USDT, USDC, USD, DAI)
                // 3. Highest liquidity

                const validPairs = data.pairs.filter((p: any) =>
                    (p.baseToken.symbol.toUpperCase() === symbol.toUpperCase() ||
                    p.baseToken.symbol.toUpperCase() === 'W' + symbol.toUpperCase()) &&
                    ['USDT', 'USDC', 'USD', 'DAI', 'BUSD'].includes(p.quoteToken.symbol.toUpperCase())
                );

                if (validPairs.length === 0) {
                   // Fallback to any pair if no USD pair found
                   validPairs.push(...data.pairs.filter((p: any) => 
                       p.baseToken.symbol.toUpperCase() === symbol.toUpperCase() ||
                       p.baseToken.symbol.toUpperCase() === 'W' + symbol.toUpperCase()
                   ));
                }

                // SORT BY VOLUME (h24) - This is the key to avoiding stale "liquidity traps"
                validPairs.sort((a: any, b: any) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));

                const bestPair = validPairs[0];
                const price = Number(bestPair?.priceUsd);

                if (!isNaN(price) && price > 0) {
                    return { price, source: `dexscreener:${bestPair.chainId}`, timestamp: Date.now() };
                }
            }
        }
    } catch (error) {
        console.warn(`[PriceFetch] Failed to fetch ${market}:${symbol}:`, error);
    }

    return null;
}
