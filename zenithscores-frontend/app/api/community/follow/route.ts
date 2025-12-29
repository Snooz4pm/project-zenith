import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/community/follow
 * Toggle follow/unfollow a user
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { targetUserId } = await request.json();

        if (!targetUserId) {
            return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
        }

        if (targetUserId === session.user.id) {
            return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
        }

        // Check if already following
        const existingFollow = await prisma.community_follows.findUnique({
            where: {
                follower_id_following_id: {
                    follower_id: session.user.id,
                    following_id: targetUserId
                }
            }
        });

        if (existingFollow) {
            // Unfollow
            await prisma.community_follows.delete({
                where: { id: existingFollow.id }
            });

            return NextResponse.json({
                status: 'success',
                action: 'unfollowed',
                message: 'Unfollowed successfully'
            });
        } else {
            // Follow
            await prisma.community_follows.create({
                data: {
                    follower_id: session.user.id,
                    following_id: targetUserId
                }
            });

            // Create notification for the target user
            try {
                await prisma.notification.create({
                    data: {
                        userId: targetUserId,
                        type: 'NEW_FOLLOWER',
                        sourceUserId: session.user.id,
                        sourceEntityId: session.user.id,
                        message: `${session.user.name || 'Someone'} started following you`
                    }
                });
            } catch (e) {
                console.log('Notification creation failed:', e);
            }

            return NextResponse.json({
                status: 'success',
                action: 'followed',
                message: 'Followed successfully'
            });
        }

    } catch (error) {
        console.error('[FOLLOW API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}

/**
 * GET /api/community/follow?userId=xxx
 * Check if current user is following target user
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ isFollowing: false });
        }

        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get('userId');

        if (!targetUserId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const existingFollow = await prisma.community_follows.findUnique({
            where: {
                follower_id_following_id: {
                    follower_id: session.user.id,
                    following_id: targetUserId
                }
            }
        });

        return NextResponse.json({ isFollowing: !!existingFollow });

    } catch (error) {
        console.error('[FOLLOW API] Error:', error);
        return NextResponse.json({ isFollowing: false });
    }
}
