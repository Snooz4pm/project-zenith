import { NextResponse } from 'next/server';
import { fetchMarket } from '@/lib/market/fetcher';
import { AssetType } from '@/lib/market/types';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type') as AssetType;

    if (!symbol || !type) {
        return NextResponse.json({ error: 'Missing symbol or type' }, { status: 400 });
    }

    // Use hardened fetcher
    // This handles errors gracefully and returns null on failure
    const tick = await fetchMarket(symbol, type);

    if (!tick) {
        // Return 404 or just null data depending on preference. 
        // Hardened fetcher implies we don't crash UI, so 404 is fine, UI keeps old data.
        return NextResponse.json({ error: 'Data unavailable' }, { status: 404 });
    }

    return NextResponse.json(tick);
}
