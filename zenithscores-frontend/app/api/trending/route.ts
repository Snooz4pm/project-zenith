import { NextResponse } from 'next/server';
import { getTrendingTokens } from '@/lib/dexscreener';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain') || 'base';

    try {
        const tokens = await getTrendingTokens(chain as any);
        return NextResponse.json({ tokens });
    } catch (error) {
        console.error('API Trending Error:', error);
        return NextResponse.json({ error: 'Failed to fetch trending tokens' }, { status: 500 });
    }
}
