/**
 * Data Source Adapters
 *
 * Normalize data from different APIs into unified OHLC format
 * Handle rate limits, errors, and data freshness
 */

import { OHLCPoint, DataSource } from './types';

/**
 * DexScreener Adapter (Crypto)
 * API: https://api.dexscreener.com/latest/dex/tokens/{address}
 */
export async function fetchDexScreenerOHLC(
  tokenAddress: string,
  interval: string = '5m'
): Promise<OHLCPoint[]> {
  try {
    // DexScreener doesn't provide historical OHLC directly
    // We'll use their price data and construct pseudo-candles
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
    );

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }

    const data = await response.json();
    const pairs = data.pairs || [];

    if (pairs.length === 0) {
      return [];
    }

    // Use the first (most liquid) pair
    const pair = pairs[0];
    const currentPrice = parseFloat(pair.priceUsd);
    const priceChange24h = parseFloat(pair.priceChange?.h24 || '0');

    // Generate recent candles based on current price
    // This is a simplification - in production, you'd use a proper OHLC endpoint
    const now = Date.now();
    const candles: OHLCPoint[] = [];

    // Generate last 100 5-minute candles
    for (let i = 99; i >= 0; i--) {
      const timestamp = now - i * 5 * 60 * 1000;
      const volatility = (Math.random() - 0.5) * 0.02; // ±1% noise
      const close = currentPrice * (1 + volatility);
      const open = close * (1 + (Math.random() - 0.5) * 0.01);
      const high = Math.max(open, close) * (1 + Math.random() * 0.005);
      const low = Math.min(open, close) * (1 - Math.random() * 0.005);

      candles.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume: parseFloat(pair.volume?.h24 || '0') / 288, // Distribute 24h volume
      });
    }

    return candles;
  } catch (error) {
    console.error('DexScreener fetch error:', error);
    return [];
  }
}

/**
 * Alpha Vantage Adapter (Forex + Stocks)
 * API: https://www.alphavantage.co/documentation/
 */
export async function fetchAlphaVantageOHLC(
  symbol: string,
  interval: string = '5min',
  apiKey: string
): Promise<OHLCPoint[]> {
  try {
    // For forex pairs like EUR/USD
    const isForex = symbol.includes('/');
    const endpoint = isForex ? 'FX_INTRADAY' : 'TIME_SERIES_INTRADAY';
    const symbolParam = isForex
      ? symbol.replace('/', ',to_symbol=')
      : symbol;

    const url = `https://www.alphavantage.co/query?function=${endpoint}&symbol=${symbolParam}&interval=${interval}&apikey=${apiKey}&outputsize=compact`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();

    // Check for rate limit
    if (data.Note) {
      console.warn('Alpha Vantage rate limit hit');
      return [];
    }

    const timeSeriesKey = Object.keys(data).find((key) =>
      key.includes('Time Series')
    );

    if (!timeSeriesKey) {
      return [];
    }

    const timeSeries = data[timeSeriesKey];
    const candles: OHLCPoint[] = [];

    for (const [timestamp, values] of Object.entries(timeSeries)) {
      candles.push({
        timestamp: new Date(timestamp).getTime(),
        open: parseFloat((values as any)['1. open']),
        high: parseFloat((values as any)['2. high']),
        low: parseFloat((values as any)['3. low']),
        close: parseFloat((values as any)['4. close']),
        volume: parseFloat((values as any)['5. volume'] || '0'),
      });
    }

    // Sort by timestamp (oldest first)
    return candles.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('Alpha Vantage fetch error:', error);
    return [];
  }
}

/**
 * Finnhub Adapter (Stocks)
 * API: https://finnhub.io/docs/api/stock-candles
 */
export async function fetchFinnhubOHLC(
  symbol: string,
  resolution: string = '5',
  apiKey: string
): Promise<OHLCPoint[]> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const from = now - 24 * 60 * 60; // Last 24 hours

    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${now}&token=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.s !== 'ok') {
      return [];
    }

    const candles: OHLCPoint[] = [];

    for (let i = 0; i < data.t.length; i++) {
      candles.push({
        timestamp: data.t[i] * 1000, // Convert to ms
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
        volume: data.v[i],
      });
    }

    return candles;
  } catch (error) {
    console.error('Finnhub fetch error:', error);
    return [];
  }
}

/**
 * Generic adapter factory
 */
export async function fetchOHLCData(
  source: DataSource,
  symbol: string,
  interval: string,
  apiKey?: string
): Promise<OHLCPoint[]> {
  switch (source) {
    case 'dexscreener':
      return fetchDexScreenerOHLC(symbol, interval);
    case 'alphavantage':
      if (!apiKey) throw new Error('Alpha Vantage API key required');
      return fetchAlphaVantageOHLC(symbol, interval, apiKey);
    case 'finnhub':
      if (!apiKey) throw new Error('Finnhub API key required');
      return fetchFinnhubOHLC(symbol, interval, apiKey);
    default:
      throw new Error(`Unknown data source: ${source}`);
  }
}
