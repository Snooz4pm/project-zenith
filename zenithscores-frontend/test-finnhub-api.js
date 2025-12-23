// TEST SCRIPT - Run this to debug Finnhub API responses
// Usage: node test-finnhub-api.js

const FINNHUB_API_KEY = 'd55b3mpr01qljfdegh50d55b3mpr01qljfdegh5g';
const BASE_URL = 'https://finnhub.io/api/v1';

async function testStockCandles() {
    try {
        const now = Math.floor(Date.now() / 1000);
        const hour = 60 * 60;

        console.log('\n=== Testing Stock Candles (AAPL, 1m resolution) ===');
        const from = now - hour;
        const to = now;

        const url = `${BASE_URL}/stock/candle?symbol=AAPL&resolution=1&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
        console.log('URL:', url);

        const response = await fetch(url);
        const data = await response.json();

        console.log('\nResponse Status:', data.s);
        console.log('Data Points:', data.t ? data.t.length : 0);

        if (data.t && data.t.length > 0) {
            console.log('\nFirst 3 candles:');
            for (let i = 0; i < Math.min(3, data.t.length); i++) {
                console.log({
                    time: new Date(data.t[i] * 1000).toLocaleString(),
                    open: data.o[i],
                    high: data.h[i],
                    low: data.l[i],
                    close: data.c[i],
                    volume: data.v[i]
                });
            }

            console.log('\nLast 3 candles:');
            for (let i = Math.max(0, data.t.length - 3); i < data.t.length; i++) {
                console.log({
                    time: new Date(data.t[i] * 1000).toLocaleString(),
                    open: data.o[i],
                    high: data.h[i],
                    low: data.l[i],
                    close: data.c[i],
                    volume: data.v[i]
                });
            }
        } else {
            console.log('NO DATA RETURNED');
            console.log('Full response:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

async function testForexCandles() {
    try {
        const now = Math.floor(Date.now() / 1000);
        const hour = 60 * 60;

        console.log('\n\n=== Testing Forex Candles (EUR/USD, 1m resolution) ===');
        const from = now - hour;
        const to = now;

        const url = `${BASE_URL}/forex/candle?symbol=OANDA:EUR_USD&resolution=1&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
        console.log('URL:', url);

        const response = await fetch(url);
        const data = await response.json();

        console.log('\nResponse Status:', data.s);
        console.log('Data Points:', data.t ? data.t.length : 0);

        if (data.t && data.t.length > 0) {
            console.log('\nFirst 3 candles:');
            for (let i = 0; i < Math.min(3, data.t.length); i++) {
                console.log({
                    time: new Date(data.t[i] * 1000).toLocaleString(),
                    open: data.o[i],
                    high: data.h[i],
                    low: data.l[i],
                    close: data.c[i]
                });
            }
        } else {
            console.log('NO DATA RETURNED');
            console.log('Full response:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run tests
testStockCandles().then(() => testForexCandles());
