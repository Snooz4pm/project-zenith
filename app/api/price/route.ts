/**
 * Price Preview API
 * 
 * GET /api/price?mint=XXX&amount=YYY
 * 
 * Returns the SOL equivalent value for a given token amount.
 * Used by the Brain Test UI for real-time normalization preview.
 */

import { NextResponse } from 'next/server';
import { normalizeToSOL, getTokenPriceInSOL } from '@/lib/solana/price';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const mint = searchParams.get('mint');
        const amountStr = searchParams.get('amount');

        if (!mint) {
            return NextResponse.json({ error: 'Missing mint parameter' }, { status: 400 });
        }

        const amount = amountStr ? parseFloat(amountStr) : 1;
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const priceInSOL = await getTokenPriceInSOL(mint);
        if (priceInSOL === null) {
            return NextResponse.json({
                error: 'Price unavailable',
                code: 'PRICE_UNAVAILABLE'
            }, { status: 404 });
        }

        const valueInSOL = amount * priceInSOL;

        return NextResponse.json({
            mint,
            amount,
            priceInSOL,
            valueInSOL
        });

    } catch (error: any) {
        console.error('[Price API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Price lookup failed' },
            { status: 500 }
        );
    }
}
