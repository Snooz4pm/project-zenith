// =============================================================================
// Alerts API - Notification Hub for Premium Users
// =============================================================================

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const wallet = searchParams.get('wallet');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!wallet) {
            return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
        }

        // Get user's alerts
        const alerts = await prisma.alert.findMany({
            where: { walletAddress: wallet },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        // If no alerts, create sample alerts for new users
        if (alerts.length === 0) {
            const sampleAlerts = [
                {
                    walletAddress: wallet,
                    type: 'whale_buy',
                    title: '🐋 Whale Activity Detected',
                    message: 'Large wallet bought $50,000 worth of SOL',
                    tokenMint: 'So11111111111111111111111111111111111111112',
                },
                {
                    walletAddress: wallet,
                    type: 'new_coin',
                    title: '🆕 High Score Token Launched',
                    message: 'New token with Ape Score 85 detected',
                    tokenMint: null,
                },
                {
                    walletAddress: wallet,
                    type: 'rug_risk',
                    title: '🚨 Rug Risk Alert',
                    message: 'Token in your watchlist flagged as risky (Risk Score: 75)',
                    tokenMint: null,
                },
            ];

            await prisma.alert.createMany({ data: sampleAlerts });

            return NextResponse.json({
                alerts: sampleAlerts.map((a, i) => ({
                    id: `sample-${i}`,
                    ...a,
                    isRead: false,
                    createdAt: new Date(),
                })),
                total: sampleAlerts.length,
                unread: sampleAlerts.length,
            });
        }

        const unread = alerts.filter(a => !a.isRead).length;

        return NextResponse.json({
            alerts,
            total: alerts.length,
            unread,
        });
    } catch (err: any) {
        console.error('[Alerts] GET Error:', err);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

// Mark alerts as read
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { wallet, alertIds, markAll } = body;

        if (!wallet) {
            return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
        }

        if (markAll) {
            await prisma.alert.updateMany({
                where: { walletAddress: wallet, isRead: false },
                data: { isRead: true },
            });
        } else if (alertIds?.length > 0) {
            await prisma.alert.updateMany({
                where: { id: { in: alertIds }, walletAddress: wallet },
                data: { isRead: true },
            });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Alerts] PATCH Error:', err);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

// Create new alert (internal use for background jobs)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { walletAddress, type, title, message, tokenMint, metadata } = body;

        if (!walletAddress || !type || !title || !message) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const alert = await prisma.alert.create({
            data: {
                walletAddress,
                type,
                title,
                message,
                tokenMint,
                metadata: metadata ? JSON.stringify(metadata) : null,
            },
        });

        return NextResponse.json({ alert, success: true });
    } catch (err: any) {
        console.error('[Alerts] POST Error:', err);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}

// Clear all alerts
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const wallet = searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
        }

        await prisma.alert.deleteMany({
            where: { walletAddress: wallet },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Alerts] DELETE Error:', err);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
