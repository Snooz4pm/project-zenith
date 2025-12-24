import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Return empty array for anonymous users
        if (!session?.user?.id) {
            return NextResponse.json({ items: [] });
        }

        // Get query parameters
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const assetType = searchParams.get('assetType'); // Optional filter

        // Build where clause
        const where: any = { userId: session.user.id };
        if (assetType && ['crypto', 'stocks', 'forex'].includes(assetType)) {
            where.assetType = assetType;
        }

        // Fetch recently viewed assets
        const recentViews = await prisma.userAssetView.findMany({
            where,
            orderBy: { lastViewed: 'desc' },
            take: Math.min(limit, 50), // Cap at 50
            select: {
                assetType: true,
                symbol: true,
                name: true,
                lastViewed: true,
                viewCount: true,
                firstViewed: true
            }
        });

        return NextResponse.json({
            items: recentViews,
            count: recentViews.length
        });

    } catch (error) {
        console.error('Error fetching recently viewed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recently viewed assets' },
            { status: 500 }
        );
    }
}
