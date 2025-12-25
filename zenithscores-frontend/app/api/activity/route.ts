import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// POST /api/activity - Log an activity
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { type, targetId, targetType, metadata } = body

        // Validate required fields
        if (!type) {
            return NextResponse.json(
                { error: "type is required" },
                { status: 400 }
            )
        }

        // Valid activity types
        const validTypes = ["view", "note", "watchlist", "lesson", "trade_mock"]
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
                { status: 400 }
            )
        }

        const activity = await prisma.activity.create({
            data: {
                userId: session.user.id,
                type,
                targetId: targetId || null,
                targetType: targetType || null,
                metadata: metadata || null,
            }
        })

        return NextResponse.json({
            status: "success",
            data: activity
        })
    } catch (error) {
        console.error("Activity API error:", error)
        return NextResponse.json(
            { error: "Failed to log activity" },
            { status: 500 }
        )
    }
}

// GET /api/activity - Get user's activities
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const type = searchParams.get("type")
        const limit = parseInt(searchParams.get("limit") || "20")

        const activities = await prisma.activity.findMany({
            where: {
                userId: session.user.id,
                ...(type && { type }),
            },
            orderBy: { createdAt: "desc" },
            take: Math.min(limit, 100),
        })

        return NextResponse.json({
            status: "success",
            data: activities,
        })
    } catch (error) {
        console.error("Activity GET error:", error)
        return NextResponse.json(
            { error: "Failed to fetch activities" },
            { status: 500 }
        )
    }
}
