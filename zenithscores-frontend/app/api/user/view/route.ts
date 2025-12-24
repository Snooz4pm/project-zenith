import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // If not logged in, return success (tracking happens client-side in localStorage)
        if (!session?.user?.email) {
            return NextResponse.json({
                success: true,
                message: 'Anonymous tracking handled client-side'
            });
        }

        // Get user ID from email
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({
                success: true,
                message: 'User not found, tracking skipped'
            });
        }

        const { assetType, symbol, name } = await req.json();

        // Validate inputs
        if (!assetType || !symbol) {
            return NextResponse.json(
                { error: 'assetType and symbol are required' },
                { status: 400 }
            );
        }

        // Validate assetType
        if (!['crypto', 'stocks', 'forex'].includes(assetType)) {
            return NextResponse.json(
                { error: 'Invalid assetType. Must be crypto, stocks, or forex' },
                { status: 400 }
            );
        }

        // Upsert view tracking
        const view = await prisma.userAssetView.upsert({
            where: {
                userId_assetType_symbol: {
                    userId: user.id,
                    assetType,
                    symbol
                }
            },
            update: {
                viewCount: { increment: 1 },
                lastViewed: new Date(),
                name: name || undefined
            },
            create: {
                userId: user.id,
                assetType,
                symbol,
                name,
                viewCount: 1,
                firstViewed: new Date(),
                lastViewed: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            viewCount: view.viewCount,
            message: 'View tracked successfully'
        });

    } catch (error) {
        console.error('Error tracking view:', error);
        return NextResponse.json(
            { error: 'Failed to track view' },
            { status: 500 }
        );
    }
}
