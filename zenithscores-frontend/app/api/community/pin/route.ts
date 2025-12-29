import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/community/pin
 * Toggle pin on a post (only allowed for author)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { postId } = body;

        if (!postId) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        const post = await prisma.communityPost.findUnique({
            where: { id: postId },
            select: { authorId: true, isPinned: true }
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (post.authorId !== session.user.id) {
            return NextResponse.json({ error: 'Only the author can pin posts' }, { status: 403 });
        }

        // Toggle pinning
        const updatedPost = await prisma.communityPost.update({
            where: { id: postId },
            data: { isPinned: !post.isPinned }
        });

        return NextResponse.json({
            status: 'success',
            isPinned: updatedPost.isPinned,
            message: updatedPost.isPinned ? 'Post pinned to profile' : 'Post unpinned'
        });

    } catch (error) {
        console.error('[PIN API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
