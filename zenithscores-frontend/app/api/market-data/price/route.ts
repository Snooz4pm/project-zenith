import { NextRequest, NextResponse } from 'next/server';
import { getRealTimePrice } from '@/lib/market-data/price-engine';
import { AssetType } from '@/lib/market-data/types';

export const dynamic = 'force-dynamic'; // No caching at route level, handled by fetch

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const assetType = searchParams.get('assetType') as AssetType | null;

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    try {
        const data = await getRealTimePrice(symbol, assetType || 'stock');

        if (!data) {
            return NextResponse.json({ error: 'Price data unavailable' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Price API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
