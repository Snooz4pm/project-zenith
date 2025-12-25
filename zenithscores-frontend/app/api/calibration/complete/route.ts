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

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { tradingStyle } = body

        // Update user as calibrated
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                calibrationCompleted: true,
                tradingStyle: tradingStyle || null,
            }
        })

        // Log activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                type: "lesson",
                targetId: "calibration",
                targetType: "onboarding",
                metadata: { completed: true },
            }
        })

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

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { calibrationCompleted: true, tradingStyle: true }
        })

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
