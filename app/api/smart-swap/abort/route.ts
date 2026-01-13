
import { NextResponse } from 'next/server';
import { SmartSwapService } from '@/lib/execution-engine/service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { swapId, reason } = body;

        if (!swapId) {
            return NextResponse.json({ error: 'Missing swapId' }, { status: 400 });
        }

        await SmartSwapService.abortSwap(swapId, reason || 'MANUAL_ABORT');

        return NextResponse.json({ status: 'ABORTED' });
    } catch (error: any) {
        console.error('[SmartSwap] Abort error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
