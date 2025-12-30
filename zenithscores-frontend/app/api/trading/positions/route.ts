import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ positions: [] });
        }

        // TODO: Implement when Trade model is added to schema
        // For now, return empty array to prevent 404 errors
        const positions: any[] = [];

        return NextResponse.json({ positions });
    } catch (error) {
        console.error('[API] Failed to fetch positions:', error);
        return NextResponse.json({ positions: [] });
    }
}
