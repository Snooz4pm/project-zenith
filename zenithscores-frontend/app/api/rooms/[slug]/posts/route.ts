/**
 * Room Posts API
 * 
 * GET  /api/rooms/[slug]/posts - List posts (public read)
 * POST /api/rooms/[slug]/posts - Create post (requires auth + permission)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getWalletFromHeader, resolveWallet } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

interface Params {
    params: { slug: string };
}

// GET - List posts (public, no auth required)
export async function GET(req: NextRequest, { params }: Params) {
    const { slug } = params;
    const cursor = req.nextUrl.searchParams.get('cursor');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');

    try {
        const room = await prisma.room.findUnique({
            where: { slug }
        });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        const posts = await prisma.post.findMany({
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

        const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;

        return NextResponse.json({ posts, nextCursor });

    } catch (error) {
        console.error('[Posts API] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

// POST - Create post (requires wallet + permission)
export async function POST(req: NextRequest, { params }: Params) {
    const { slug } = params;
    const walletAddress = getWalletFromHeader(req);
    const { user, error } = await resolveWallet(walletAddress);

    if (!user) {
        return NextResponse.json(
            { error: 'Connect wallet to post' },
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
                    { error: 'You must be approved to post in this room' },
                    { status: 403 }
                );
            }
        }

        const body = await req.json();
        const { content } = body;

        if (!content || content.trim().length < 1) {
            return NextResponse.json(
                { error: 'Post content is required' },
                { status: 400 }
            );
        }

        const post = await prisma.post.create({
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

        return NextResponse.json({ post }, { status: 201 });

    } catch (error) {
        console.error('[Posts API] POST error:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}
