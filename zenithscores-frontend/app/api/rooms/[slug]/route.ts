/**
 * Single Room API
 * 
 * GET    /api/rooms/[slug] - Get room details (public read)
 * DELETE /api/rooms/[slug] - Delete room (owner only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getWalletFromHeader, resolveWallet } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

interface Params {
    params: { slug: string };
}

// GET - Get room by slug (public, no auth required)
export async function GET(req: NextRequest, { params }: Params) {
    const { slug } = params;
    const walletAddress = getWalletFromHeader(req);

    try {
        const room = await prisma.room.findUnique({
            where: { slug },
            include: {
                owner: {
                    select: {
                        id: true,
                        walletAddress: true,
                        username: true,
                        profile: { select: { avatar: true } }
                    }
                },
                posts: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                    include: {
                        user: {
                            select: {
                                id: true,
                                walletAddress: true,
                                username: true,
                                profile: { select: { avatar: true } }
                            }
                        }
                    }
                },
                _count: {
                    select: { posts: true, messages: true }
                }
            }
        });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // Check if user can post (for private rooms)
        let canPost = false;
        let joinRequestStatus: string | null = null;

        if (!room.isPrivate) {
            // Public room - anyone with wallet can post
            canPost = !!walletAddress;
        } else if (walletAddress) {
            // Private room - check if owner or approved
            const { user } = await resolveWallet(walletAddress);
            if (user) {
                if (room.ownerId === user.id) {
                    canPost = true;
                } else {
                    // Check join request status
                    const joinRequest = await prisma.roomJoinRequest.findUnique({
                        where: {
                            roomId_userId: {
                                roomId: room.id,
                                userId: user.id
                            }
                        }
                    });
                    joinRequestStatus = joinRequest?.status || null;
                    canPost = joinRequest?.status === 'approved';
                }
            }
        }

        return NextResponse.json({
            room,
            canPost,
            joinRequestStatus
        });
    } catch (error) {
        console.error('[Room API] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 });
    }
}

// DELETE - Delete room (owner only)
export async function DELETE(req: NextRequest, { params }: Params) {
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
            return NextResponse.json({ error: 'Only owner can delete room' }, { status: 403 });
        }

        await prisma.room.delete({
            where: { id: room.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Room API] DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
    }
}
