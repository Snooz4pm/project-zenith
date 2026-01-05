/**
 * Room Join Requests API
 * 
 * POST /api/rooms/[slug]/join - Request to join private room
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getWalletFromHeader, resolveWallet } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

interface Params {
    params: { slug: string };
}

// POST - Request to join private room
export async function POST(req: NextRequest, { params }: Params) {
    const { slug } = params;
    const walletAddress = getWalletFromHeader(req);
    const { user, error } = await resolveWallet(walletAddress);

    if (!user) {
        return NextResponse.json(
            { error: 'Connect wallet to join room' },
            { status: 401 }
        );
    }

    try {
        const room = await prisma.room.findUnique({
            where: { slug }
        });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // Public rooms don't need join requests
        if (!room.isPrivate) {
            return NextResponse.json(
                { error: 'Public rooms do not require join requests' },
                { status: 400 }
            );
        }

        // Can't request to join own room
        if (room.ownerId === user.id) {
            return NextResponse.json(
                { error: 'You own this room' },
                { status: 400 }
            );
        }

        // Check if already requested
        const existing = await prisma.roomJoinRequest.findUnique({
            where: {
                roomId_userId: {
                    roomId: room.id,
                    userId: user.id
                }
            }
        });

        if (existing) {
            return NextResponse.json({
                error: `Join request already ${existing.status}`,
                status: existing.status
            }, { status: 400 });
        }

        // Create join request
        const joinRequest = await prisma.roomJoinRequest.create({
            data: {
                roomId: room.id,
                userId: user.id,
                status: 'pending'
            }
        });

        // Create notification for room owner
        await prisma.notification.create({
            data: {
                userId: room.ownerId,
                type: 'join_request',
                payload: {
                    roomId: room.id,
                    roomTitle: room.title,
                    requesterId: user.id,
                    requesterWallet: user.walletAddress,
                    requesterUsername: user.username
                }
            }
        });

        return NextResponse.json({ 
            success: true,
            status: 'pending'
        }, { status: 201 });

    } catch (error) {
        console.error('[Room Join API] POST error:', error);
        return NextResponse.json({ error: 'Failed to create join request' }, { status: 500 });
    }
}
