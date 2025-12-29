import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/users/suggested
 * Get random users to follow (excluding self and already following)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const currentUserId = session?.user?.id;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '5');
        const excludeUserId = searchParams.get('exclude'); // Exclude profile being viewed

        // Get IDs of users already being followed
        let followingIds: string[] = [];
        if (currentUserId) {
            const following = await prisma.community_follows.findMany({
                where: { follower_id: currentUserId },
                select: { following_id: true }
            });
            followingIds = following.map(f => f.following_id);
        }

        // Build exclusion list
        const excludeIds = [...followingIds];
        if (currentUserId) excludeIds.push(currentUserId);
        if (excludeUserId) excludeIds.push(excludeUserId);

        // Get random users - using orderBy with a random approach
        // First get total count
        const totalUsers = await prisma.user.count({
            where: {
                id: { notIn: excludeIds.length > 0 ? excludeIds : undefined },
                name: { not: null }
            }
        });

        if (totalUsers === 0) {
            return NextResponse.json({ users: [] });
        }

        // Get random offset
        const randomOffset = Math.floor(Math.random() * Math.max(0, totalUsers - limit));

        const users = await prisma.user.findMany({
            where: {
                id: { notIn: excludeIds.length > 0 ? excludeIds : undefined },
                name: { not: null }
            },
            select: {
                id: true,
                name: true,
                image: true,
            },
            skip: randomOffset,
            take: limit
        });

        // Get additional info for each user
        const userIds = users.map(u => u.id);

        // Get follower counts
        const followerCounts = await prisma.community_follows.groupBy({
            by: ['following_id'],
            where: { following_id: { in: userIds } },
            _count: { following_id: true }
        });
        const followerMap = new Map(followerCounts.map(f => [f.following_id, f._count.following_id]));

        // Get user profiles for bio/career
        const profiles = await prisma.user_profiles.findMany({
            where: { user_id: { in: userIds } },
            select: { user_id: true, bio: true, career_path: true }
        });
        const profileMap = new Map(profiles.map(p => [p.user_id, p]));

        const enrichedUsers = users.map(u => ({
            id: u.id,
            name: u.name,
            image: u.image,
            bio: profileMap.get(u.id)?.bio || null,
            careerPath: profileMap.get(u.id)?.career_path || null,
            followersCount: followerMap.get(u.id) || 0
        }));

        // Shuffle the results for more randomness
        const shuffled = enrichedUsers.sort(() => Math.random() - 0.5);

        return NextResponse.json({ users: shuffled });

    } catch (error) {
        console.error('[SUGGESTED USERS API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
