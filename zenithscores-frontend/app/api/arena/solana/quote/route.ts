export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

/**
 * Solana Quote API (Jupiter Proxy)
 * 
 * Lightweight proxy to Jupiter v6 Quote API.
 * Used for route verification and price discovery.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const inputMint = searchParams.get('inputMint');
        const outputMint = searchParams.get('outputMint');
        const amount = searchParams.get('amount');

        if (!inputMint || !outputMint || !amount) {
            return NextResponse.json({ error: 'Missing params (inputMint, outputMint, amount)' }, { status: 400 });
        }

        const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`;

        const res = await fetch(url, {
            cache: 'no-store',
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await res.json();

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API Solana Quote] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quote from Jupiter' },
            { status: 500 }
        );
    }
}
