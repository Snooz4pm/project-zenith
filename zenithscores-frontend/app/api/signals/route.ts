import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isPremiumUser } from '@/lib/subscription';

export async function GET() {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - Please log in' },
                { status: 401 }
            );
        }

        // Premium check removed - Free for all users
        const isPremium = true;

        // TODO: Implement when Signal model is added to schema
        // For now, return empty array to prevent 404 errors
        const signals: any[] = [];

        return NextResponse.json({ signals, isPremium: true });
    } catch (error) {
        console.error('[API] Failed to fetch signals:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
