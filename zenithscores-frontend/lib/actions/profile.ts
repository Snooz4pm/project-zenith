'use server';

import { prisma } from '@/lib/prisma';

export interface PublicProfile {
    id: string;
    name: string | null;
    image: string | null;
    createdAt: Date;
    activeRooms: { id: string; name: string; slug: string }[];
    recentPosts: {
        id: string;
        title: string;
        body: string;
        postType: string;
        createdAt: Date;
        _count: { comments: number };
    }[];
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                image: true,
                created_at: true,
                roomMemberships: {
                    include: {
                        room: {
                            select: { id: true, name: true, slug: true }
                        }
                    },
                    take: 5
                },
                posts: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        title: true,
                        body: true,
                        postType: true,
                        createdAt: true,
                        _count: { select: { comments: true } }
                    }
                }
            }
        });

        if (!user) {
            return null;
        }

        return {
            id: user.id,
            name: user.name,
            image: user.image,
            createdAt: user.created_at,
            activeRooms: user.roomMemberships.map(m => m.room),
            recentPosts: user.posts
        };
    } catch (error) {
        console.error('Failed to get public profile:', error);
        return null;
    }
}
