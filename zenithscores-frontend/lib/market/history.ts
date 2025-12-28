/**
 * Zenith Market History - Persistence Layer
 * Handles safe storage and retrieval of historical candles.
 * Enforces SOURCE DISCIPLINE: Never overwrite high-quality data with lower quality.
 */

import { prisma } from '@/lib/prisma';
import { OHLCV, AssetType } from '@/lib/market-data/types';
import { Prisma } from '@prisma/client';

// Source Priority: Higher # = More trusted
const SOURCE_PRIORITY: Record<string, number> = {
    'verified_dual': 100,
    'alpha_vantage': 80, // Primary Stock/Forex
    'dexscreener': 80,   // Primary Crypto
    'finnhub': 50,       // Secondary Stock
    'unknown': 0
};

export async function saveCandles(
    candles: OHLCV[],
    symbol: string,
    timeframe: string,
    source: string
) {
    if (!candles || candles.length === 0) return;

    const sourceScore = SOURCE_PRIORITY[source] || 0;

    // Use transaction for batch safety
    await prisma.$transaction(async (tx) => {
        for (const c of candles) {
            // Check existence logic could be slow for bulk.
            // For V1, we use upsert but with a check or 'update' that respects source.
            // Since Prisma upsert update is blindly applied, we arguably should read first OR 
            // use raw query for "ON CONFLICT DO UPDATE SET ... WHERE source_priority < new_priority"

            // For robust TS implementation without raw SQL complexity:
            // 1. Try find existing
            const existing = await tx.marketCandle.findUnique({
                where: {
                    symbol_timeframe_timestamp: {
                        symbol,
                        timeframe,
                        timestamp: new Date(c.time)
                    }
                },
                select: { source: true }
            });

            if (existing) {
                const existingScore = SOURCE_PRIORITY[existing.source] || 0;
                if (existingScore > sourceScore) {
                    continue; // Skip, existing is better
                }
            }

            // Safe to write/overwrite
            await tx.marketCandle.upsert({
                where: {
                    symbol_timeframe_timestamp: {
                        symbol,
                        timeframe,
                        timestamp: new Date(c.time)
                    }
                },
                update: {
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                    volume: c.volume,
                    source: source
                },
                create: {
                    symbol,
                    timeframe,
                    timestamp: new Date(c.time),
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                    volume: c.volume,
                    source: source
                }
            });
        }
    });
}

export async function getHistory(
    symbol: string,
    timeframe: string,
    startTime?: number,
    endTime?: number
): Promise<OHLCV[]> {
    const candles = await prisma.marketCandle.findMany({
        where: {
            symbol,
            timeframe,
            timestamp: {
                gte: startTime ? new Date(startTime) : undefined,
                lte: endTime ? new Date(endTime) : undefined
            }
        },
        orderBy: { timestamp: 'asc' }
    });

    return candles.map(c => ({
        timestamp: c.timestamp.getTime(),
        time: Math.floor(c.timestamp.getTime() / 1000),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: Number(c.volume)
    }));
}
