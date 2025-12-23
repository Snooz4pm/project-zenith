import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: { category: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { category } = params;
        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 1000);
        const minConfidence = parseFloat(searchParams.get('min_confidence') || '0');
        const sortBy = searchParams.get('sort_by') || 'confidence';

        let orderBy: any = [{ category_confidence: 'desc' }, { fetched_at: 'desc' }];
        if (sortBy === 'date') {
            orderBy = [{ fetched_at: 'desc' }];
        } else if (sortBy === 'importance') {
            orderBy = [{ importance_score: 'desc' }, { category_confidence: 'desc' }];
        }

        const articles = await prisma.articles.findMany({
            where: {
                category: category,
                category_confidence: { gte: minConfidence },
            },
            orderBy,
            take: limit,
            select: {
                id: true,
                title: true,
                article: true,
                url: true,
                source: true,
                category: true,
                category_confidence: true,
                matched_keywords: true,
                word_count: true,
                importance_score: true,
                sentiment_score: true,
                why_it_matters: true,
                fetched_at: true,
            },
        });

        const formattedArticles = articles.map(a => ({
            id: a.id,
            title: a.title,
            article: a.article.length > 500 ? a.article.slice(0, 500) + '...' : a.article,
            url: a.url,
            source: a.source,
            category: a.category,
            category_confidence: a.category_confidence ? Number(a.category_confidence) : 0,
            matched_keywords: a.matched_keywords || [],
            word_count: a.word_count,
            ai_importance: a.importance_score ? Number(a.importance_score) : 0,
            sentiment_score: a.sentiment_score ? Number(a.sentiment_score) : 0,
            why_it_matters: a.why_it_matters,
            fetched_at: a.fetched_at?.toISOString() || null,
        }));

        return NextResponse.json({
            articles: formattedArticles,
            count: formattedArticles.length,
        });
    } catch (error) {
        console.error('Category articles error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch articles by category' },
            { status: 500 }
        );
    }
}
