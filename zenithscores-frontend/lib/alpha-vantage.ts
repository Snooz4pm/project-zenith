// Alpha Vantage API Client
// Documentation: https://www.alphavantage.co/documentation/

// ... existing imports
import { MarketPrice, AssetType } from '@/lib/market-data/types';

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

if (!API_KEY) {
    console.warn('⚠️ ALPHA_VANTAGE_API_KEY not set in .env');
}

export interface GlobalQuote {
    'Global Quote': {
        '01. symbol': string;
        '02. open': string;
        '03. high': string;
        '04. low': string;
        '05. price': string;
        '06. volume': string;
        '07. latest trading day': string;
        '08. previous close': string;
        '09. change': string;
        '10. change percent': string;
    };
}

export interface ExchangeRate {
    'Realtime Currency Exchange Rate': {
        '1. From_Currency Code': string;
        '2. From_Currency Name': string;
        '3. To_Currency Code': string;
        '4. To_Currency Name': string;
        '5. Exchange Rate': string;
        '6. Last Refreshed': string;
        '7. Time Zone': string;
        '8. Bid Price': string;
        '9. Ask Price': string;
    };
}

/**
 * Fetch real-time stock quote
 */
export async function getStockQuoteAV(symbol: string): Promise<GlobalQuote | null> {
    // ... existing implementation ... (keeping it for backward compatibility if needed, but fetchPriceAV uses it)
    try {
        const res = await fetch(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`, {
            next: { revalidate: 60 }
        });
        if (!res.ok) throw new Error(`AV API error: ${res.status}`);
        const data = await res.json();

        if (data['Note'] || data['Information']) {
            console.warn('Alpha Vantage Rate Limit or Info:', data);
            return null;
        }

        return data;
    } catch (e) {
        console.error(`Failed to fetch AV quote for ${symbol}`, e);
        return null;
    }
}

/**
 * Fetch real-time forex rate
 */
export async function getForexRateAV(from: string, to: string = 'USD'): Promise<ExchangeRate | null> {
    // ... existing implementation ...
    try {
        const res = await fetch(`${BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${API_KEY}`, {
            next: { revalidate: 60 }
        });
        if (!res.ok) throw new Error(`AV API error: ${res.status}`);
        const data = await res.json();

        return data;
    } catch (e) {
        console.error(`Failed to fetch AV forex for ${from}/${to}`, e);
        return null;
    }
}

/**
 * Unified Price Fetcher for Alpha Vantage
 */
/**
 * Unified Price Fetcher for Alpha Vantage
 */
import { fetchForex } from './market/providers/alphavantageForex';
import { normalizeToMarketPrice } from './market-data/normalizer';

export async function fetchPriceAV(symbol: string, assetType: AssetType = 'stock'): Promise<MarketPrice | null> {
    try {
        if (assetType === 'forex') {
            // Use correct FX_DAILY logic from provider
            const tick = await fetchForex(symbol);
            return {
                ...tick,
                symbol: tick.symbol,
                price: tick.price,
                change: tick.change,
                changePercent: tick.changePercent,
                timestamp: tick.timestamp,
                source: 'alpha_vantage',
                verificationStatus: 'unverified'
            } as MarketPrice;
        }

        // Stock
        const data = await getStockQuoteAV(symbol);
        if (!data || !data['Global Quote']) return null;

        // Use canonical normalization
        return normalizeToMarketPrice(data, 'alpha_vantage', 'stock');

    } catch (error) {
        console.error('FetchPriceAV Error:', error);
        return null;
    }
}
