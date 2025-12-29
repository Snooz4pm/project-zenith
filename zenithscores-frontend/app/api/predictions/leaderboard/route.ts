import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/predictions/leaderboard
 * Get prediction accuracy leaderboard
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        const leaders = await prisma.userPredictionStats.findMany({
            where: {
                totalPredictions: { gte: 3 } // Minimum 3 predictions to qualify
            },
            orderBy: [
                { accuracyRate: 'desc' },
                { totalPoints: 'desc' }
            ],
            take: limit
        });

        // Get user info
        const userIds = leaders.map(l => l.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, image: true }
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        const leaderboard = leaders.map((l, index) => ({
            rank: index + 1,
            user: userMap.get(l.userId) || { id: l.userId, name: 'Unknown', image: null },
            stats: {
                totalPredictions: l.totalPredictions,
                correctPredictions: l.correctPredictions,
                accuracyRate: l.accuracyRate,
                totalPoints: l.totalPoints,
                streak: l.streak,
                bestStreak: l.bestStreak
            }
        }));

        return NextResponse.json({ leaderboard });

    } catch (error) {
        console.error('[LEADERBOARD API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
