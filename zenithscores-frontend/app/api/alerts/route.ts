/**
 * Price Alert API
 * 
 * POST - Create new price alert
 * GET - List user's alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            symbol,
            assetType,
            targetPrice,
            direction,
            note,
            predictedDirection,
            predictedWithin,
            priceAtCreation
        } = body;

        if (!symbol || !assetType || !targetPrice || !direction) {
            return NextResponse.json(
                { error: 'Missing required fields: symbol, assetType, targetPrice, direction' },
                { status: 400 }
            );
        }

        const alert = await prisma.priceAlert.create({
            data: {
                userId: session.user.id,
                symbol: symbol.toUpperCase(),
                assetType,
                targetPrice,
                direction,
                note: note || `Alert: ${symbol} ${direction} $${targetPrice}`,
                predictedDirection,
                predictedWithin,
                priceAtCreation: priceAtCreation || targetPrice,
                status: 'active',
                expiresAt: predictedWithin
                    ? new Date(Date.now() + predictedWithin * 60 * 60 * 1000)
                    : null
            }
        });

        return NextResponse.json({
            success: true,
            alert,
            message: `Alert created: ${symbol} ${direction} $${targetPrice}`
        });

    } catch (error) {
        console.error('[Price Alert API] Error:', error);
        return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'active';
        const symbol = searchParams.get('symbol');

        const where: any = { userId: session.user.id };
        if (status !== 'all') where.status = status;
        if (symbol) where.symbol = symbol.toUpperCase();

        const alerts = await prisma.priceAlert.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json({ alerts });

    } catch (error) {
        console.error('[Price Alert API] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }
}
