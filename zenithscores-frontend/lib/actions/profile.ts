'use server';

import { prisma } from '@/lib/prisma';

export interface PublicProfile {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    experience: string | null;
    tradingStyle: unknown;
    preferredMarkets: string[];
    isProfilePublic: boolean;
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
                bio: true,
                experience: true,
                tradingStyle: true,
                preferredMarkets: true,
                isProfilePublic: true,
                created_at: true,
                roomMemberships: {
                    where: { leftAt: null },
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

        if (!user || !user.isProfilePublic) {
            return null;
        }

        return {
            id: user.id,
            name: user.name,
            image: user.image,
            bio: user.bio,
            experience: user.experience,
            tradingStyle: user.tradingStyle,
            preferredMarkets: user.preferredMarkets,
            isProfilePublic: user.isProfilePublic,
            createdAt: user.created_at,
            activeRooms: user.roomMemberships.map(m => m.room),
            recentPosts: user.posts
        };
    } catch (error) {
        console.error('Failed to get public profile:', error);
        return null;
    }
}

export async function updatePublicProfile(
    userId: string,
    data: {
        bio?: string;
        experience?: string;
        preferredMarkets?: string[];
        isProfilePublic?: boolean;
    }
) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                bio: data.bio,
                experience: data.experience,
                preferredMarkets: data.preferredMarkets,
                isProfilePublic: data.isProfilePublic
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to update profile:', error);
        return { success: false, error: 'Failed to update profile' };
    }
}
