import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/community/my-engagements
 * Returns likes and comments received on the current user's posts
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ engagements: [] });
        }

        // Get the current user
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser) {
            return NextResponse.json({ engagements: [] });
        }

        // Get all posts by this user
        const myPosts = await prisma.community_posts.findMany({
            where: { userId: currentUser.id },
            select: { id: true, content: true }
        });

        const myPostIds = myPosts.map(p => p.id);

        if (myPostIds.length === 0) {
            return NextResponse.json({ engagements: [] });
        }

        // Get likes on my posts (from other users)
        const likes = await prisma.community_likes.findMany({
            where: {
                postId: { in: myPostIds },
                userId: { not: currentUser.id } // Exclude self-likes
            },
            include: {
                user: { select: { name: true, email: true } },
                post: { select: { content: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Get comments on my posts (from other users) - if comments table exists
        let comments: any[] = [];
        try {
            comments = await prisma.community_comments.findMany({
                where: {
                    postId: { in: myPostIds },
                    userId: { not: currentUser.id }
                },
                include: {
                    user: { select: { name: true, email: true } },
                    post: { select: { content: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 20
            });
        } catch (e) {
            // Comments table might not exist yet
            console.log('Comments table not available');
        }

        // Combine and format engagements
        const engagements = [
            ...likes.map(like => ({
                id: `like-${like.id}`,
                type: 'like' as const,
                postTitle: truncateText(like.post.content, 40),
                fromUser: like.user.name || like.user.email?.split('@')[0] || 'Someone',
                timestamp: like.createdAt,
                read: false
            })),
            ...comments.map((comment: any) => ({
                id: `comment-${comment.id}`,
                type: 'comment' as const,
                postTitle: truncateText(comment.post.content, 40),
                fromUser: comment.user.name || comment.user.email?.split('@')[0] || 'Someone',
                timestamp: comment.createdAt,
                read: false
            }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 20);

        return NextResponse.json({ engagements });
    } catch (error) {
        console.error('Error fetching engagements:', error);
        return NextResponse.json({ engagements: [] });
    }
}

function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
