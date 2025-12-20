import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const categoryStats = await prisma.articles.groupBy({
            by: ['category'],
            _count: { id: true },
            _avg: { category_confidence: true },
            _max: { fetched_at: true },
        });

        const categories = categoryStats.map(c => ({
            category: c.category,
            article_count: c._count.id,
            avg_confidence: c._avg.category_confidence ? Number(c._avg.category_confidence) : 0,
            last_fetched: c._max.fetched_at?.toISOString() || null,
        }));

        return NextResponse.json({ categories });
    } catch (error) {
        console.error('Categories error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}
