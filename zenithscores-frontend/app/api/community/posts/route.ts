import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET all posts
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.email; // Using email as user_id for community

        const posts = await prisma.community_posts.findMany({
            orderBy: { created_at: 'desc' },
            take: 50,
        });

        // If logged in, check which posts the user has liked
        let likedPostIds: number[] = [];
        if (userId) {
            const likes = await prisma.community_likes.findMany({
                where: { user_id: userId },
            });
            likedPostIds = likes.map(l => l.post_id);
        }

        // Check follows if needed (optional for now)

        const formattedPosts = posts.map(post => ({
            id: post.id.toString(),
            userId: post.user_id,
            username: post.username,
            avatar: post.avatar,
            type: post.type,
            content: post.content,
            sharedTrade: post.asset ? JSON.parse(post.asset as string) : undefined,
            likes: post.likes_count || 0,
            comments: post.comments_count || 0,
            timestamp: post.created_at,
            liked: likedPostIds.includes(post.id),
            isOwnPost: post.user_id === userId,
        }));

        return NextResponse.json(formattedPosts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

// POST new post
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, content, asset } = await req.json();

        const post = await prisma.community_posts.create({
            data: {
                user_id: session.user.email!,
                username: session.user.name || 'Anonymous',
                avatar: session.user.image,
                type,
                content,
                asset: asset ? JSON.stringify(asset) : undefined,
                likes_count: 0,
                comments_count: 0,
            },
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}
