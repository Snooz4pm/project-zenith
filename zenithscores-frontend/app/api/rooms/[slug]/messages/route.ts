/**
 * Room Messages API (Chat)
 * 
 * GET  /api/rooms/[slug]/messages - List messages (public read)
 * POST /api/rooms/[slug]/messages - Send message (requires auth + permission)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getWalletFromHeader, resolveWallet } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

interface Params {
    params: { slug: string };
}

// GET - List messages (public, no auth required)
export async function GET(req: NextRequest, { params }: Params) {
    const { slug } = params;
    const cursor = req.nextUrl.searchParams.get('cursor');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    try {
        const room = await prisma.room.findUnique({
            where: { slug }
        });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        const messages = await prisma.message.findMany({
            where: { roomId: room.id },
            take: limit,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor }
            }),
            orderBy: { createdAt: 'desc' },
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
        });

        // Reverse for chronological order in chat
        const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

        return NextResponse.json({ 
            messages: messages.reverse(), 
            nextCursor 
        });

    } catch (error) {
        console.error('[Messages API] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

// POST - Send message (requires wallet + permission)
export async function POST(req: NextRequest, { params }: Params) {
    const { slug } = params;
    const walletAddress = getWalletFromHeader(req);
    const { user, error } = await resolveWallet(walletAddress);

    if (!user) {
        return NextResponse.json(
            { error: 'Connect wallet to send messages' },
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

        // Check permission for private rooms
        if (room.isPrivate && room.ownerId !== user.id) {
            const joinRequest = await prisma.roomJoinRequest.findUnique({
                where: {
                    roomId_userId: {
                        roomId: room.id,
                        userId: user.id
                    }
                }
            });

            if (joinRequest?.status !== 'approved') {
                return NextResponse.json(
                    { error: 'You must be approved to message in this room' },
                    { status: 403 }
                );
            }
        }

        const body = await req.json();
        const { content } = body;

        if (!content || content.trim().length < 1) {
            return NextResponse.json(
                { error: 'Message content is required' },
                { status: 400 }
            );
        }

        const message = await prisma.message.create({
            data: {
                roomId: room.id,
                userId: user.id,
                content: content.trim()
            },
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
        });

        return NextResponse.json({ message }, { status: 201 });

    } catch (error) {
        console.error('[Messages API] POST error:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
