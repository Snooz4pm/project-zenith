
import { NextResponse } from 'next/server';
import { SmartSwapService } from '@/lib/smartswap/service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { swapId, toToken } = body;

        if (!swapId || !toToken) {
            return NextResponse.json({ error: 'Missing swapId or toToken' }, { status: 400 });
        }

        const txRes = await SmartSwapService.executeExit(swapId, toToken);

        return NextResponse.json(txRes);
    } catch (error: any) {
        console.error('[SmartSwap] Exit error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
