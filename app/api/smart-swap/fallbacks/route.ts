
import { NextResponse } from 'next/server';
import { SmartSwapService } from '@/lib/execution-engine/service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const swapId = searchParams.get('swapId');

        if (!swapId) {
            return NextResponse.json({ error: 'Missing swapId' }, { status: 400 });
        }

        const fallbacks = await SmartSwapService.getFallbacks(swapId);

        return NextResponse.json(fallbacks);
    } catch (error: any) {
        console.error('[SmartSwap] Fallbacks error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 }); // Likely 400/409 if not aborted
    }
}
