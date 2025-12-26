/**
 * Market Data OHLCV API
 * GET /api/market-data/ohlcv?symbol=AAPL&timeframe=1D&range=1M
 */

import { NextResponse } from 'next/server';
import { getOHLCV } from '@/lib/market-data';
import type { Timeframe, DataRange, AssetType } from '@/lib/market-data/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const symbol = searchParams.get('symbol');
        const timeframe = (searchParams.get('timeframe') || '1D') as Timeframe;
        const range = (searchParams.get('range') || '1M') as DataRange;
        const assetType = searchParams.get('assetType') as AssetType | undefined;

        if (!symbol) {
            return NextResponse.json(
                { error: 'Symbol is required' },
                { status: 400 }
            );
        }

        const response = await getOHLCV(symbol, timeframe, range, assetType || undefined);

        return NextResponse.json(response);

    } catch (error) {
        console.error('[OHLCV API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch market data' },
            { status: 500 }
        );
    }
}
