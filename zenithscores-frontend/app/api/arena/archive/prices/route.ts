import { NextResponse } from 'next/server';
import { fetchAllTokenPrices } from '@/lib/arena/prices';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const prices = await fetchAllTokenPrices();
        return NextResponse.json({ prices });
    } catch (error) {
        console.error('Failed to fetch arena prices:', error);
        return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
    }
}
