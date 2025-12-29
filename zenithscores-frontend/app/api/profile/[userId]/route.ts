import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/profile/[userId]
 * Fetch public profile for a specific user
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const userId = params.userId;

        console.log('[PROFILE API] Fetching profile for:', userId);

        // Fetch user basic info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                emailVerified: true,
                createdAt: true,
            }
        });

        if (!user) {
            console.log('[PROFILE API] User not found:', userId);
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Fetch user profile info
        const profile = await prisma.user_profiles.findUnique({
            where: { user_id: userId }
        });

        // Fetch badges
        const badges = await prisma.user_badges.findMany({
            where: { user_id: userId },
            include: {
                badge: true
            }
        });

        // Count completed courses
        const coursesCompleted = await prisma.userCourseProgress.count({
            where: {
                userId: userId,
                completed: true
            }
        });

        const publicProfile = {
            id: user.id,
            name: user.name,
            image: user.image,
            createdAt: user.createdAt,
            bio: profile?.bio || null,
            careerPath: profile?.career_path || null,
            experienceLevel: profile?.experience_level || 'beginner',
            badges: badges.map(b => ({
                id: b.badge.id,
                name: b.badge.name,
                icon: b.badge.icon,
                category: b.badge.category,
                rarity: b.badge.rarity,
                earnedAt: b.earned_at
            })),
            coursesCompleted,
            isPublic: profile?.is_public ?? true,
            showTrades: profile?.show_trades ?? false,
            showBadges: profile?.show_badges ?? true,
        };

        console.log('[PROFILE API] Profile fetched successfully');
        return NextResponse.json(publicProfile);

    } catch (error) {
        console.error('[PROFILE API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
