import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

/**
 * GET /api/dashboard/stats
 * Returns real dashboard data for the command center
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = session.user.id

        // Parallel queries for dashboard stats
        const [
            recentViews,
            notesCount,
            watchlistCount,
            user,
            recentActivity,
        ] = await Promise.all([
            // Recently viewed assets (from Activity)
            prisma.activity.findMany({
                where: { userId, type: "view" },
                orderBy: { createdAt: "desc" },
                take: 5,
                distinct: ["targetId"],
            }),
            // Notes count
            prisma.tradingNote.count({
                where: { userId },
            }),
            // Watchlist count
            prisma.userWatchlist.count({
                where: { userId },
            }),
            // User created date for "days active"
            prisma.user.findUnique({
                where: { id: userId },
                select: { created_at: true },
            }),
            // Recent activity (last 10)
            prisma.activity.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
        ])

        // Calculate days active
        const daysActive = user?.created_at
            ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) + 1
            : 1

        return NextResponse.json({
            status: "success",
            data: {
                recentViews: recentViews.map(a => ({
                    symbol: a.targetId,
                    type: a.targetType,
                    viewedAt: a.createdAt,
                })),
                notesCount,
                watchlistCount,
                daysActive,
                recentActivity: recentActivity.map(a => ({
                    type: a.type,
                    targetId: a.targetId,
                    targetType: a.targetType,
                    createdAt: a.createdAt,
                })),
                isEmpty: recentViews.length === 0 && notesCount === 0 && watchlistCount === 0,
            },
        })
    } catch (error) {
        console.error("Dashboard stats error:", error)
        return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
    }
}
