/**
 * Test Script: History Idempotency & Source Discipline
 * Run with: npx tsx scripts/test-history.ts
 */

import { saveCandles, getHistory } from '../lib/market/history';
import { OHLCV } from '../lib/market-data/types';
import { prisma } from '../lib/prisma';

async function testIdempotency() {
    console.log('🧪 Starting History Idempotency Test...');

    const symbol = 'TEST-BTC';
    const timeframe = '1h';
    const now = Math.floor(Date.now() / 1000) * 1000;

    // Clean up previous test
    await prisma.marketCandle.deleteMany({
        where: { symbol: symbol }
    });
    console.log('🧹 Cleaned up old test data');

    const candles: OHLCV[] = [
        { time: now, open: 50000, high: 51000, low: 49000, close: 50500, volume: 100 },
        { time: now + 3600000, open: 50500, high: 52000, low: 50000, close: 51500, volume: 150 }
    ];

    // 1. Save Initial (Alpha Vantage - Priority 80)
    console.log('1️⃣ Saving Initial (Alpha Vantage)...');
    await saveCandles(candles, symbol, timeframe, 'alpha_vantage');

    let stored = await getHistory(symbol, timeframe);
    if (stored.length !== 2 || stored[0].close !== 50500) {
        throw new Error('❌ Initial save failed');
    }
    console.log('✅ Initial save verified');

    // 2. Try Overwrite from Lower Priority (Finnhub - Priority 50)
    // We change the data to prove it didn't overwrite
    const badCandles = candles.map(c => ({ ...c, close: 99999 }));
    console.log('2️⃣ Attempting Lower Priority Overwrite (Finnhub)...');
    await saveCandles(badCandles, symbol, timeframe, 'finnhub');

    stored = await getHistory(symbol, timeframe);
    if (stored[0].close === 99999) {
        throw new Error('❌ Source discipline failed! Low priority overwrote high priority.');
    }
    console.log('✅ Source discipline verified (Lower priority rejected)');

    // 3. Try Overwrite from Higher Priority (Verified - Priority 100)
    const goodCandles = candles.map(c => ({ ...c, close: 50501 })); // slightly adjusted verified price
    console.log('3️⃣ Attempting Higher Priority Overwrite (Verified)...');
    await saveCandles(goodCandles, symbol, timeframe, 'verified_dual');

    stored = await getHistory(symbol, timeframe);
    if (stored[0].close !== 50501) {
        throw new Error('❌ Upgrade failed! High priority did not update.');
    }
    console.log('✅ Upgrade verified (Higher priority applied)');

    console.log('🎉 ALL TESTS PASSED');
    process.exit(0);
}

testIdempotency().catch(e => {
    console.error(e);
    process.exit(1);
});
