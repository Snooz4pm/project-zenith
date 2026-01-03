import { NextRequest, NextResponse } from 'next/server';
import { buildLongSwap, buildCloseLongSwap } from '@/lib/arena/archive/execution';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, tokenAddress, amount, takerAddress } = body;

        if (!tokenAddress || !amount || !takerAddress) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let quote = null;

        if (action === 'open-long') {
            // Get quote for USDC -> Token swap
            quote = await buildLongSwap(tokenAddress, amount, takerAddress);
        } else if (action === 'close-long') {
            // Get quote for Token -> USDC swap
            quote = await buildCloseLongSwap(tokenAddress, amount, takerAddress);
        } else {
            return NextResponse.json({ error: 'Invalid action. Use "open-long" or "close-long"' }, { status: 400 });
        }

        if (!quote) {
            return NextResponse.json({ error: 'Failed to get swap quote' }, { status: 500 });
        }

        return NextResponse.json({ success: true, quote });
    } catch (error) {
        console.error('Error getting swap quote:', error);
        return NextResponse.json({ error: 'Failed to get quote' }, { status: 500 });
    }
}
