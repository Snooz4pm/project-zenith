import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getIntelligenceBadge } from '@/lib/intelligence/actions';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const badge = await getIntelligenceBadge(session.user.id);

        // Also get current market regime (dummy logic for now, could be dynamic)
        const marketRegime = {
            status: 'Risk-On',
            sentiment: 'Bullish',
            confidence: 0.85
        };

        return NextResponse.json({
            ...badge,
            marketRegime
        });
    } catch (error) {
        console.error('[Intelligence Status] Error:', error);
        return NextResponse.json({
            count: 0,
            hasNew: false,
            color: 'blue'
        });
    }
}
