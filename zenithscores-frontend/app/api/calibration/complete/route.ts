import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

/**
 * POST /api/calibration/complete
 * Marks user as calibrated and saves trading style
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        // Check for user by id OR email (fallback for OAuth)
        if (!session?.user?.id && !session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { tradingStyle } = body

        // Find user by ID or email
        let userId = session.user.id

        if (!userId && session.user.email) {
            const dbUser = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true }
            })
            if (dbUser) {
                userId = dbUser.id
            }
        }

        if (!userId) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Update user as calibrated
        await prisma.user.update({
            where: { id: userId },
            data: {
                calibrationCompleted: true,
                tradingStyle: tradingStyle || null,
            }
        })

        // Log activity
        try {
            await prisma.activity.create({
                data: {
                    userId: userId,
                    type: "lesson",
                    targetId: "calibration",
                    targetType: "onboarding",
                    metadata: { completed: true },
                }
            })
        } catch (e) {
            // Activity logging is non-critical
            console.warn("Failed to log calibration activity:", e)
        }

        return NextResponse.json({
            status: "success",
            message: "Calibration completed",
            redirect: "/command-center",
        })
    } catch (error) {
        console.error("Calibration complete error:", error)
        return NextResponse.json({ error: "Failed to complete calibration" }, { status: 500 })
    }
}

/**
 * GET /api/calibration/complete
 * Check if user is calibrated
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id && !session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Find user by ID or email
        let user = null
        if (session.user.id) {
            user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { calibrationCompleted: true, tradingStyle: true }
            })
        } else if (session.user.email) {
            user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { calibrationCompleted: true, tradingStyle: true }
            })
        }

        return NextResponse.json({
            status: "success",
            data: {
                calibrationCompleted: user?.calibrationCompleted || false,
                tradingStyle: user?.tradingStyle || null,
            }
        })
    } catch (error) {
        console.error("Calibration check error:", error)
        return NextResponse.json({ error: "Failed to check calibration" }, { status: 500 })
    }
}
