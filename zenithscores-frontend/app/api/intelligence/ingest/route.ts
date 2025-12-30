import { NextResponse } from 'next/server';
import { triggerIngest } from '@/lib/intelligence/actions';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('[Intelligence] Manual ingestion triggered via API');
        const result = await triggerIngest();
        return NextResponse.json({
            success: true,
            message: 'News ingestion successful',
            ...result
        });
    } catch (error) {
        console.error('[Intelligence] API ingestion error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
