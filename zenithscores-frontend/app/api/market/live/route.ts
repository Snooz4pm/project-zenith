/**
 * LIVE PRICE API ROUTE
 * 
 * Server-side proxy for Finnhub API calls.
 * This keeps the API key secure on the server.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchLivePrice } from '@/lib/market/live/finnhub-live';

export const dynamic = 'force-dynamic'; // Never cache

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const assetType = searchParams.get('assetType') as 'stock' | 'forex' | null;

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    if (!assetType || !['stock', 'forex'].includes(assetType)) {
        return NextResponse.json({ error: 'assetType must be "stock" or "forex"' }, { status: 400 });
    }

    try {
        const data = await fetchLivePrice(symbol, assetType);

        if (!data) {
            return NextResponse.json({ error: 'Price data unavailable', symbol }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[API] Live price error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
