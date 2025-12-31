import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const PAGE_SIZE = 20;

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get page from query params (default to 1)
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const marketType = searchParams.get('marketType'); // Optional filter

        // Build where clause for optional filtering
        const where = marketType && marketType !== 'ALL'
            ? { marketType: marketType.toLowerCase() }
            : {};

        // Get total count for pagination
        const totalCount = await prisma.decisionScenario.count({ where });
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);

        // Fetch scenarios from database with pagination
        const dbScenarios = await prisma.decisionScenario.findMany({
            where,
            select: {
                id: true,
                title: true,
                marketType: true,
                symbol: true,
                timeframe: true,
                difficulty: true,
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        });

        // Map to expected format - ALL scenarios are FREE
        const scenarios = dbScenarios.map((s) => ({
            id: s.id,
            title: s.title,
            marketType: s.marketType,
            symbol: s.symbol,
            timeframe: s.timeframe,
            difficulty: s.difficulty,
            isPremium: false, // All free
            locked: false // Never locked
        }));

        return NextResponse.json({
            scenarios,
            pagination: {
                page,
                pageSize: PAGE_SIZE,
                totalCount,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Failed to fetch scenarios:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
