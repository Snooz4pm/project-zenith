/**
 * Room Join Request Management API
 * 
 * GET   /api/rooms/[slug]/requests - List join requests (owner only)
 * PATCH /api/rooms/[slug]/requests - Approve/reject request (owner only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getWalletFromHeader, resolveWallet } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

interface Params {
    params: { slug: string };
}

// GET - List pending join requests (owner only)
export async function GET(req: NextRequest, { params }: Params) {
    const { slug } = params;
    const walletAddress = getWalletFromHeader(req);
    const { user, error } = await resolveWallet(walletAddress);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const room = await prisma.room.findUnique({
            where: { slug }
        });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        if (room.ownerId !== user.id) {
            return NextResponse.json({ error: 'Only owner can view requests' }, { status: 403 });
        }

        const requests = await prisma.roomJoinRequest.findMany({
            where: { roomId: room.id },
            include: {
                user: {
                    select: {
                        id: true,
                        walletAddress: true,
                        username: true,
                        profile: { select: { avatar: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ requests });

    } catch (error) {
        console.error('[Room Requests API] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

// PATCH - Approve or reject a join request (owner only)
export async function PATCH(req: NextRequest, { params }: Params) {
    const { slug } = params;
    const walletAddress = getWalletFromHeader(req);
    const { user, error } = await resolveWallet(walletAddress);

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { requestId, action } = body;

        if (!requestId || !['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'requestId and action (approve/reject) required' },
                { status: 400 }
            );
        }

        const room = await prisma.room.findUnique({
            where: { slug }
        });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        if (room.ownerId !== user.id) {
            return NextResponse.json({ error: 'Only owner can manage requests' }, { status: 403 });
        }

        const joinRequest = await prisma.roomJoinRequest.findFirst({
            where: {
                id: requestId,
                roomId: room.id
            }
        });

        if (!joinRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        await prisma.roomJoinRequest.update({
            where: { id: requestId },
            data: { status: newStatus }
        });

        // Notify the requester
        await prisma.notification.create({
            data: {
                userId: joinRequest.userId,
                type: action === 'approve' ? 'request_approved' : 'request_rejected',
                payload: {
                    roomId: room.id,
                    roomTitle: room.title,
                    roomSlug: room.slug
                }
            }
        });

        return NextResponse.json({ success: true, status: newStatus });

    } catch (error) {
        console.error('[Room Requests API] PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }
}
