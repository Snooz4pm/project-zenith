import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

/**
 * POST /api/calibration/complete
 * Marks user as calibrated and saves trading style
 */
export async function POST(request: NextRequest) {
    console.log("=== CALIBRATION API: POST START ===")

    try {
        // Step 1: Get session
        console.log("Step 1: Getting server session...")
        const session = await getServerSession(authOptions)
        const walletAddress = (session?.user as any)?.walletAddress
        console.log("Session result:", {
            hasSession: !!session,
            userId: session?.user?.id || "MISSING",
            walletAddress: walletAddress || "MISSING",
        })

        // Check for user by id OR wallet address
        if (!session?.user?.id && !walletAddress) {
            console.log("ERROR: No session user id or wallet address")
            return NextResponse.json({
                error: "Unauthorized",
                debug: "No session.user.id or walletAddress"
            }, { status: 401 })
        }

        // Step 2: Parse body
        console.log("Step 2: Parsing request body...")
        const body = await request.json()
        const { tradingStyle } = body
        console.log("Body parsed:", { hasTradingStyle: !!tradingStyle })

        // Step 3: Find user by ID or wallet address
        console.log("Step 3: Finding user...")
        let userId = session?.user?.id

        if (!userId && walletAddress) {
            console.log("No userId in session, looking up by wallet:", walletAddress)
            const dbUser = await prisma.user.findUnique({
                where: { walletAddress },
                select: { id: true }
            })
            console.log("DB lookup result:", dbUser)
            if (dbUser) {
                userId = dbUser.id
            }
        }

        if (!userId) {
            console.log("ERROR: Could not find user ID")
            return NextResponse.json({
                error: "User not found",
                debug: `Wallet: ${walletAddress}, but no DB record found`
            }, { status: 404 })
        }

        console.log("User ID resolved:", userId)

        // Step 4: Update user as calibrated
        console.log("Step 4: Updating user in database...")
        const updateResult = await prisma.user.update({
            where: { id: userId },
            data: {
                calibrationCompleted: true,
                tradingStyle: tradingStyle || null,
            }
        })
        console.log("Update result:", {
            id: updateResult.id,
            calibrationCompleted: updateResult.calibrationCompleted,
            hasTradingStyle: !!updateResult.tradingStyle
        })

        // Step 5: Log activity (non-critical)
        console.log("Step 5: Logging activity...")
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
            console.log("Activity logged successfully")
        } catch (e) {
            console.warn("Failed to log calibration activity:", e)
        }

        console.log("=== CALIBRATION API: SUCCESS ===")
        return NextResponse.json({
            status: "success",
            message: "Calibration completed",
            redirect: "/command-center",
            debug: {
                userId,
                calibrationCompleted: true
            }
        })
    } catch (error: any) {
        console.error("=== CALIBRATION API: ERROR ===", error)
        return NextResponse.json({
            error: "Failed to complete calibration",
            debug: error?.message || String(error)
        }, { status: 500 })
    }
}

/**
 * GET /api/calibration/complete
 * Check if user is calibrated
 */
export async function GET(request: NextRequest) {
    console.log("=== CALIBRATION API: GET START ===")

    try {
        const session = await getServerSession(authOptions)
        const walletAddress = (session?.user as any)?.walletAddress
        console.log("Session:", {
            hasSession: !!session,
            userId: session?.user?.id || "MISSING",
            walletAddress: walletAddress || "MISSING",
        })

        if (!session?.user?.id && !walletAddress) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Find user by ID or wallet address
        let user = null
        if (session?.user?.id) {
            user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { id: true, calibrationCompleted: true, tradingStyle: true }
            })
        } else if (walletAddress) {
            user = await prisma.user.findUnique({
                where: { walletAddress },
                select: { id: true, calibrationCompleted: true, tradingStyle: true }
            })
        }

        return NextResponse.json({
            status: "success",
            calibrationCompleted: user?.calibrationCompleted || false,
            tradingStyle: user?.tradingStyle || null,
        })
    } catch (error: any) {
        console.error("Calibration check error:", error)
        return NextResponse.json({
            error: "Failed to check calibration",
            debug: error?.message || String(error)
        }, { status: 500 })
    }
}
