/**
 * Public Profile API
 * 
 * GET /api/profile/by-wallet/[wallet] - Get public profile by wallet address
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Params {
    params: { wallet: string };
}

// GET - Get public profile by wallet (public, no auth required)
export async function GET(req: NextRequest, { params }: Params) {
    const { wallet } = params;

    try {
        const user = await prisma.user.findUnique({
            where: { walletAddress: wallet },
            include: {
                profile: true,
                rooms: {
                    where: { isPrivate: false },
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        createdAt: true,
                        _count: {
                            select: { posts: true }
                        }
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if profile is public
        if (user.profile && !user.profile.isPublic) {
            return NextResponse.json({
                user: {
                    walletAddress: user.walletAddress,
                    username: user.username,
                    createdAt: user.createdAt
                },
                profile: { isPublic: false },
                rooms: []
            });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                username: user.username,
                createdAt: user.createdAt
            },
            profile: user.profile,
            rooms: user.rooms
        });

    } catch (error) {
        console.error('[Public Profile API] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}
