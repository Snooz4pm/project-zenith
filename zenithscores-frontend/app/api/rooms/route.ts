/**
 * Rooms API
 * 
 * GET  /api/rooms - List all rooms (public read)
 * POST /api/rooms - Create room (requires wallet)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getWalletFromHeader, resolveWallet } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

// GET - List all rooms (public, no auth required)
export async function GET(req: NextRequest) {
    try {
        const rooms = await prisma.room.findMany({
            include: {
                owner: {
                    select: {
                        id: true,
                        walletAddress: true,
                        username: true,
                        profile: {
                            select: { avatar: true }
                        }
                    }
                },
                _count: {
                    select: {
                        posts: true,
                        messages: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ rooms });
    } catch (error) {
        console.error('[Rooms API] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
    }
}

// POST - Create room (requires wallet)
export async function POST(req: NextRequest) {
    const walletAddress = getWalletFromHeader(req);
    const { user, error } = await resolveWallet(walletAddress);

    if (!user) {
        return NextResponse.json(
            { error: 'Connect wallet to create a room' },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { title, description, isPrivate } = body;

        if (!title || title.trim().length < 2) {
            return NextResponse.json(
                { error: 'Room title is required (min 2 characters)' },
                { status: 400 }
            );
        }

        // Generate slug from title
        const baseSlug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        
        // Make slug unique
        const existingRoom = await prisma.room.findUnique({
            where: { slug: baseSlug }
        });
        
        const slug = existingRoom 
            ? `${baseSlug}-${Date.now().toString(36)}`
            : baseSlug;

        const room = await prisma.room.create({
            data: {
                title: title.trim(),
                description: description?.trim() || null,
                slug,
                isPrivate: isPrivate || false,
                ownerId: user.id
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        walletAddress: true,
                        username: true
                    }
                }
            }
        });

        return NextResponse.json({ room }, { status: 201 });
    } catch (error) {
        console.error('[Rooms API] POST error:', error);
        return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }
}
