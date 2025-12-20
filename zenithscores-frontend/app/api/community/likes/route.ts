import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { postId } = await req.json();
        const userId = session.user.email!;
        const id = parseInt(postId);

        // Check if liked
        const existingLike = await prisma.community_likes.findUnique({
            where: {
                user_id_post_id: {
                    user_id: userId,
                    post_id: id,
                },
            },
        });

        if (existingLike) {
            // Unlike
            await prisma.community_likes.delete({
                where: {
                    user_id_post_id: {
                        user_id: userId,
                        post_id: id,
                    },
                },
            });

            await prisma.community_posts.update({
                where: { id },
                data: { likes_count: { decrement: 1 } },
            });

            return NextResponse.json({ liked: false });
        } else {
            // Like
            await prisma.community_likes.create({
                data: {
                    user_id: userId,
                    post_id: id,
                },
            });

            await prisma.community_posts.update({
                where: { id },
                data: { likes_count: { increment: 1 } },
            });

            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        // Return graceful response to prevent frontend crash
        return NextResponse.json({ error: 'Unable to toggle like', liked: false }, { status: 200 });
    }
}
