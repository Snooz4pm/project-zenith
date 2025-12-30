import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ingestNews } from '@/lib/intelligence/ingest';

export const dynamic = 'force-dynamic';

// Real news API that returns latest intelligence items
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10', 10);

        // Optional: Trigger background ingestion if empty
        const count = await prisma.intelligenceItem.count();
        if (count === 0) {
            await ingestNews();
        }

        const items = await prisma.intelligenceItem.findMany({
            orderBy: { publishedAt: 'desc' },
            take: limit
        });

        // Map to expected format
        const news = items.map(item => ({
            id: item.id,
            title: item.headline,
            summary: item.summary,
            category: item.category,
            source: item.source,
            publishedAt: item.publishedAt.toISOString(),
            url: item.url
        }));

        return NextResponse.json({ news });
    } catch (error) {
        console.error('[API] Failed to fetch news:', error);
        return NextResponse.json({ news: [] });
    }
}
