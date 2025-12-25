import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

/**
 * GET /api/watchlist
 * Get user's watchlist with optional filtering
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const assetType = searchParams.get("type")

        const watchlist = await prisma.userWatchlist.findMany({
            where: {
                userId: session.user.id,
                ...(assetType && { assetType }),
            },
            orderBy: { addedAt: "desc" },
        })

        return NextResponse.json({
            status: "success",
            data: watchlist,
            count: watchlist.length,
        })
    } catch (error) {
        console.error("Watchlist GET error:", error)
        return NextResponse.json({ error: "Failed to fetch watchlist" }, { status: 500 })
    }
}

/**
 * POST /api/watchlist
 * Add asset to watchlist
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { symbol, assetType, name, notes } = body

        if (!symbol || !assetType) {
            return NextResponse.json(
                { error: "symbol and assetType are required" },
                { status: 400 }
            )
        }

        // Check if already in watchlist
        const existing = await prisma.userWatchlist.findUnique({
            where: {
                userId_assetType_symbol: {
                    userId: session.user.id,
                    assetType,
                    symbol,
                }
            }
        })

        if (existing) {
            return NextResponse.json(
                { error: "Asset already in watchlist", data: existing },
                { status: 409 }
            )
        }

        const entry = await prisma.userWatchlist.create({
            data: {
                userId: session.user.id,
                symbol,
                assetType,
                name: name || symbol,
                notes: notes || null,
            }
        })

        // Log activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                type: "watchlist",
                targetId: symbol,
                targetType: assetType,
                metadata: { action: "add" },
            }
        })

        return NextResponse.json({ status: "success", data: entry })
    } catch (error) {
        console.error("Watchlist POST error:", error)
        return NextResponse.json({ error: "Failed to add to watchlist" }, { status: 500 })
    }
}

/**
 * DELETE /api/watchlist
 * Remove asset from watchlist
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const symbol = searchParams.get("symbol")
        const assetType = searchParams.get("type")

        if (!symbol || !assetType) {
            return NextResponse.json(
                { error: "symbol and type are required" },
                { status: 400 }
            )
        }

        // Find and delete
        const existing = await prisma.userWatchlist.findUnique({
            where: {
                userId_assetType_symbol: {
                    userId: session.user.id,
                    assetType,
                    symbol,
                }
            }
        })

        if (!existing) {
            return NextResponse.json(
                { error: "Asset not in watchlist" },
                { status: 404 }
            )
        }

        await prisma.userWatchlist.delete({
            where: { id: existing.id }
        })

        // Log activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                type: "watchlist",
                targetId: symbol,
                targetType: assetType,
                metadata: { action: "remove" },
            }
        })

        return NextResponse.json({ status: "success", message: "Removed from watchlist" })
    } catch (error) {
        console.error("Watchlist DELETE error:", error)
        return NextResponse.json({ error: "Failed to remove from watchlist" }, { status: 500 })
    }
}
