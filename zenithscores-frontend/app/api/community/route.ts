import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/community
 * Create a new community post (insight, thesis, or question)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, body: postBody, postType, asset, marketType } = body;

        if (!postBody) {
            return NextResponse.json({ error: 'Post content is required' }, { status: 400 });
        }

        const post = await prisma.communityPost.create({
            data: {
                authorId: session.user.id,
                title: title || postBody.substring(0, 50) + '...',
                body: postBody,
                postType: postType || 'insight',
                asset: asset,
                marketType: marketType,
            }
        });

        // Create notification for followers? (Optional for now)

        return NextResponse.json({
            status: 'success',
            post,
            message: 'Post published successfully'
        });

    } catch (error) {
        console.error('[COMMUNITY API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}

/**
 * GET /api/community
 * List community posts with filters
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const authorId = searchParams.get('authorId');

        const where: any = {};
        if (authorId) {
            where.authorId = authorId;
        }

        const posts = await prisma.communityPost.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                _count: {
                    select: {
                        comments: true
                    }
                }
            }
        });

        return NextResponse.json({ posts });

    } catch (error) {
        console.error('[COMMUNITY API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
