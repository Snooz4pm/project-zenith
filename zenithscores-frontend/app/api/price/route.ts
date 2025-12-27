import { NextResponse } from 'next/server';
import { fetchAssetPrice } from '@/lib/market/price-source';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");
    const market = searchParams.get("market"); // stock | forex | crypto

    if (!symbol || !market) {
        return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    try {
        const result = await fetchAssetPrice(symbol, market as any);

        if (!result) {
            throw new Error("Price unavailable");
        }

        return NextResponse.json({
            symbol,
            market,
            price: result.price,
            source: result.source,
            timestamp: result.timestamp
        });
    } catch (error) {
        console.error(`Price fetch error for ${market}/${symbol}:`, error);
        return NextResponse.json(
            { symbol, market, price: null, status: "unavailable" },
            { status: 200 } // Return 200 so frontend doesn't crash, just shows unavailable
        );
    }
}
