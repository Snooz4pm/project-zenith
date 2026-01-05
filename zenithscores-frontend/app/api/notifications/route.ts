/**
 * Notifications API
 * 
 * GET   /api/notifications - List my notifications
 * PATCH /api/notifications - Mark notifications as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getWalletFromHeader, resolveWallet } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

// GET - List notifications
export async function GET(req: NextRequest) {
    const walletAddress = getWalletFromHeader(req);
    const { user } = await resolveWallet(walletAddress);

    if (!user) {
        return NextResponse.json(
            { error: 'Connect wallet to view notifications' },
            { status: 401 }
        );
    }

    try {
        const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true';
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

        const notifications = await prisma.notification.findMany({
            where: {
                userId: user.id,
                ...(unreadOnly && { isRead: false })
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        const unreadCount = await prisma.notification.count({
            where: {
                userId: user.id,
                isRead: false
            }
        });

        return NextResponse.json({ notifications, unreadCount });

    } catch (error) {
        console.error('[Notifications API] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// PATCH - Mark notifications as read
export async function PATCH(req: NextRequest) {
    const walletAddress = getWalletFromHeader(req);
    const { user } = await resolveWallet(walletAddress);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { notificationIds, markAll } = body;

        if (markAll) {
            // Mark all as read
            await prisma.notification.updateMany({
                where: {
                    userId: user.id,
                    isRead: false
                },
                data: { isRead: true }
            });
        } else if (notificationIds && Array.isArray(notificationIds)) {
            // Mark specific notifications as read
            await prisma.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: user.id
                },
                data: { isRead: true }
            });
        } else {
            return NextResponse.json(
                { error: 'Provide notificationIds array or markAll: true' },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Notifications API] PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }
}
