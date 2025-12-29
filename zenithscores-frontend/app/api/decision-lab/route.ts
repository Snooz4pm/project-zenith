import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch minimal metadata only - NO chart data
        const scenarios = await prisma.decisionScenario.findMany({
            select: {
                id: true,
                title: true,
                marketType: true,
                symbol: true,
                timeframe: true,
                difficulty: true,
                isPremium: true,
                source: true,
                // Explicitly excluding chartData and annotations
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(scenarios);
    } catch (error) {
        console.error('Failed to fetch scenarios:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
