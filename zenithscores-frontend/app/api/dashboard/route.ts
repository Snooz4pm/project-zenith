/**
 * Dashboard API - Personal data aggregation
 * 
 * GET /api/dashboard - Get all personal data for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getWalletFromHeader, resolveWallet } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const walletAddress = getWalletFromHeader(req);
    const { user } = await resolveWallet(walletAddress);

    if (!user) {
        return NextResponse.json(
            { error: 'Connect wallet to access dashboard' },
            { status: 401 }
        );
    }

    try {
        // Fetch all personal data in parallel
        const [
            profile,
            notes,
            progresses,
            ownedRooms,
            joinRequests,
            pendingRequestsForMyRooms,
            notifications
        ] = await Promise.all([
            // Profile
            prisma.profile.findUnique({
                where: { userId: user.id }
            }),

            // Recent notes
            prisma.note.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),

            // Course progress
            prisma.courseProgress.findMany({
                where: { userId: user.id },
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true
                        }
                    }
                }
            }),

            // Rooms I own
            prisma.room.findMany({
                where: { ownerId: user.id },
                include: {
                    _count: {
                        select: { posts: true, messages: true }
                    }
                }
            }),

            // My join requests to other rooms
            prisma.roomJoinRequest.findMany({
                where: { userId: user.id },
                include: {
                    room: {
                        select: {
                            id: true,
                            title: true,
                            slug: true
                        }
                    }
                }
            }),

            // Pending requests for rooms I own
            prisma.roomJoinRequest.findMany({
                where: {
                    room: { ownerId: user.id },
                    status: 'pending'
                },
                include: {
                    room: {
                        select: { id: true, title: true, slug: true }
                    },
                    user: {
                        select: {
                            id: true,
                            walletAddress: true,
                            username: true,
                            profile: { select: { avatar: true } }
                        }
                    }
                }
            }),

            // Notifications (recent, unread first)
            prisma.notification.findMany({
                where: { userId: user.id },
                orderBy: [
                    { isRead: 'asc' },
                    { createdAt: 'desc' }
                ],
                take: 20
            })
        ]);

        return NextResponse.json({
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                username: user.username
            },
            profile,
            notes,
            learning: {
                progresses,
                totalCourses: progresses.length,
                completedCourses: progresses.filter(p => p.progress >= 100).length
            },
            rooms: {
                owned: ownedRooms,
                joinRequests
            },
            pendingRequestsForMyRooms,
            notifications,
            unreadCount: notifications.filter(n => !n.isRead).length
        });

    } catch (error) {
        console.error('[Dashboard API] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
