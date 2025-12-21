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
            where: { user_id: currentUser.id },
            select: { id: true, content: true }
        });

        const myPostIds = myPosts.map(p => p.id);

        if (myPostIds.length === 0) {
            return NextResponse.json({ engagements: [] });
        }

        // Get likes on my posts (from other users)
        const likes = await prisma.community_likes.findMany({
            where: {
                post_id: { in: myPostIds },
                user_id: { not: currentUser.id } // Exclude self-likes
            },
            take: 20
        });

        // Get comments on my posts (from other users) - if comments table exists
        let comments: any[] = [];
        try {
            comments = await prisma.community_comments.findMany({
                where: {
                    post_id: { in: myPostIds },
                    user_id: { not: currentUser.id }
                },
                orderBy: { created_at: 'desc' },
                take: 20
            });
        } catch (e) {
            // Comments table might not exist yet
            console.log('Comments table not available');
        }

        // Combine and format engagements
        // Note: community_likes doesn't have created_at or relations in the current schema
        const engagements = [
            ...likes.map(like => ({
                id: `like-${like.user_id}-${like.post_id}`,
                type: 'like' as const,
                postTitle: 'Your post', // Can't fetch title without relations
                fromUser: 'Someone', // Can't fetch name without relations
                timestamp: new Date(), // Dummy timestamp
                read: false
            })),
            ...comments.map((comment: any) => ({
                id: `comment-${comment.id}`,
                type: 'comment' as const,
                postTitle: 'Your post',
                fromUser: comment.username || 'Someone',
                timestamp: comment.created_at || new Date(),
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
