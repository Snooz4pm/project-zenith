import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Get total articles count
        const totalArticles = await prisma.articles.count();

        // Get category stats
        const categoryStats = await prisma.articles.groupBy({
            by: ['category'],
            _count: { id: true },
            _avg: { category_confidence: true },
        });

        // Get source stats
        const sourceStats = await prisma.articles.groupBy({
            by: ['source'],
            _count: { id: true },
            _avg: { category_confidence: true },
            orderBy: { _count: { id: 'desc' } },
            take: 20,
        });

        return NextResponse.json({
            total_articles: totalArticles,
            categories: categoryStats.map(c => ({
                name: c.category,
                count: c._count.id,
                avg_confidence: c._avg.category_confidence ? Number(c._avg.category_confidence) : 0,
            })),
            top_sources: sourceStats.map(s => ({
                source: s.source,
                count: s._count.id,
                avg_confidence: s._avg.category_confidence ? Number(s._avg.category_confidence) : 0,
            })),
        });
    } catch (error) {
        console.error('News stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch news stats' },
            { status: 500 }
        );
    }
}
