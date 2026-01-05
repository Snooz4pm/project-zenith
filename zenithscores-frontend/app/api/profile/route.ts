/**
 * Profile API
 * 
 * GET   /api/profile/[wallet] - Get public profile (public read)
 * PATCH /api/profile - Update my profile (requires auth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getWalletFromHeader, resolveWallet } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

// GET /api/profile - Get my profile
export async function GET(req: NextRequest) {
    const walletAddress = getWalletFromHeader(req);
    const { user } = await resolveWallet(walletAddress);

    if (!user) {
        return NextResponse.json(
            { error: 'Connect wallet to view profile' },
            { status: 401 }
        );
    }

    try {
        const profile = await prisma.profile.findUnique({
            where: { userId: user.id }
        });

        return NextResponse.json({
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                username: user.username
            },
            profile
        });

    } catch (error) {
        console.error('[Profile API] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

// PATCH /api/profile - Update my profile
export async function PATCH(req: NextRequest) {
    const walletAddress = getWalletFromHeader(req);
    const { user } = await resolveWallet(walletAddress);

    if (!user) {
        return NextResponse.json(
            { error: 'Connect wallet to update profile' },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { username, bio, avatar, isPublic } = body;

        // Update user if username provided
        if (username !== undefined) {
            // Check username uniqueness
            if (username) {
                const existing = await prisma.user.findFirst({
                    where: {
                        username,
                        id: { not: user.id }
                    }
                });
                if (existing) {
                    return NextResponse.json(
                        { error: 'Username already taken' },
                        { status: 400 }
                    );
                }
            }

            await prisma.user.update({
                where: { id: user.id },
                data: { username: username || null }
            });
        }

        // Update profile
        const profile = await prisma.profile.upsert({
            where: { userId: user.id },
            update: {
                ...(bio !== undefined && { bio }),
                ...(avatar !== undefined && { avatar }),
                ...(isPublic !== undefined && { isPublic })
            },
            create: {
                userId: user.id,
                bio: bio || null,
                avatar: avatar || null,
                isPublic: isPublic ?? true
            }
        });

        return NextResponse.json({ success: true, profile });

    } catch (error) {
        console.error('[Profile API] PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
