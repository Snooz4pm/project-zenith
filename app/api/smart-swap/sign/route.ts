
import { NextResponse } from 'next/server';
import { SmartSwapService } from '@/lib/execution-engine/service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { swapId, stepIndex } = body;

        if (!swapId || stepIndex === undefined) {
            return NextResponse.json({ error: 'Missing swapId or stepIndex' }, { status: 400 });
        }

        const result = await SmartSwapService.prepareForSign(swapId, stepIndex);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[SmartSwap] Prepare Sign error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
