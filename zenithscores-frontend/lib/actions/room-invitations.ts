'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { RoomInvitationStatus } from '@prisma/client';

// ========================
// ROOM INVITATION ACTIONS
// ========================

/**
 * Send a room invitation to a user.
 * SECURITY: Inviter must be a member, invitee must not be a member, no self-invites.
 */
export async function sendRoomInvitation(
    inviterId: string,
    inviteeId: string,
    roomId: string,
    message?: string
) {
    // SECURITY: Prevent self-invites
    if (inviterId === inviteeId) {
        throw new Error('Cannot invite yourself');
    }

    // SECURITY: Verify inviter is a room member
    const inviterMembership = await prisma.roomMembership.findUnique({
        where: { userId_roomId: { userId: inviterId, roomId } }
    });

    if (!inviterMembership) {
        throw new Error('You must be a member of this room to invite others');
    }

    // SECURITY: Check invitee is not already a member
    const existingMembership = await prisma.roomMembership.findUnique({
        where: { userId_roomId: { userId: inviteeId, roomId } }
    });

    if (existingMembership) {
        throw new Error('User is already a member of this room');
    }

    // Create invitation (unique constraint prevents duplicates)
    try {
        const invitation = await prisma.roomInvitation.create({
            data: {
                roomId,
                inviterId,
                inviteeId,
                message: message?.slice(0, 200),
                status: RoomInvitationStatus.pending
            },
            include: {
                room: { select: { name: true } },
                inviter: { select: { name: true, image: true } }
            }
        });

        // Create idempotent notification (upsert to prevent duplicates)
        await prisma.notification.upsert({
            where: {
                // Create a composite key using sourceEntityId
                userId_sourceEntityId: {
                    userId: inviteeId,
                    sourceEntityId: invitation.id
                }
            },
            update: {}, // No update needed if exists
            create: {
                userId: inviteeId,
                type: 'ROOM_INVITATION',
                sourceUserId: inviterId,
                sourceEntityId: invitation.id,
                message: `${invitation.inviter.name || 'Someone'} invited you to join ${invitation.room.name}`,
                read: false
            }
        });

        revalidatePath('/messages');
        return { success: true, invitation };
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error('Invitation already sent to this user');
        }
        throw error;
    }
}

/**
 * Get all pending invitations for a user (inbox).
 */
export async function getPendingInvitations(userId: string) {
    return prisma.roomInvitation.findMany({
        where: {
            inviteeId: userId,
            status: RoomInvitationStatus.pending
        },
        include: {
            room: { select: { id: true, name: true, slug: true, marketType: true } },
            inviter: { select: { id: true, name: true, image: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
}

/**
 * Accept an invitation and join the room.
 * SECURITY: Uses transaction to prevent race conditions.
 */
export async function acceptInvitation(invitationId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
        // Fetch and validate invitation
        const invitation = await tx.roomInvitation.findFirst({
            where: {
                id: invitationId,
                inviteeId: userId,
                status: RoomInvitationStatus.pending
            },
            include: {
                room: { select: { id: true, name: true, slug: true } }
            }
        });

        if (!invitation) {
            throw new Error('Invalid or expired invitation');
        }

        // Check if already a member (race condition protection)
        const existing = await tx.roomMembership.findUnique({
            where: { userId_roomId: { userId, roomId: invitation.roomId } }
        });

        if (existing) {
            // Already a member, just mark invitation as accepted
            await tx.roomInvitation.update({
                where: { id: invitationId },
                data: { status: RoomInvitationStatus.accepted, respondedAt: new Date() }
            });
            return { success: true, alreadyMember: true, room: invitation.room };
        }

        // Add user to room
        await tx.roomMembership.create({
            data: {
                roomId: invitation.roomId,
                userId
            }
        });

        // Update member count
        await tx.room.update({
            where: { id: invitation.roomId },
            data: { memberCount: { increment: 1 } }
        });

        // Mark invitation as accepted
        await tx.roomInvitation.update({
            where: { id: invitationId },
            data: { status: RoomInvitationStatus.accepted, respondedAt: new Date() }
        });

        // Mark notification as read
        await tx.notification.updateMany({
            where: {
                userId,
                sourceEntityId: invitationId,
                type: 'ROOM_INVITATION'
            },
            data: { read: true }
        });

        revalidatePath('/community');
        revalidatePath('/messages');

        return {
            success: true,
            alreadyMember: false,
            room: invitation.room,
            message: `You joined ${invitation.room.name}!`
        };
    });
}

/**
 * Reject an invitation.
 * SECURITY: Only invitee can reject.
 */
export async function rejectInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.roomInvitation.findFirst({
        where: {
            id: invitationId,
            inviteeId: userId,
            status: RoomInvitationStatus.pending
        }
    });

    if (!invitation) {
        throw new Error('Invalid or expired invitation');
    }

    await prisma.roomInvitation.update({
        where: { id: invitationId },
        data: { status: RoomInvitationStatus.rejected, respondedAt: new Date() }
    });

    // Mark notification as read
    await prisma.notification.updateMany({
        where: {
            userId,
            sourceEntityId: invitationId,
            type: 'ROOM_INVITATION'
        },
        data: { read: true }
    });

    revalidatePath('/messages');
    return { success: true };
}

/**
 * Search users to invite (excludes current user, members, and pending invites).
 */
export async function searchUsersToInvite(
    query: string,
    roomId: string,
    currentUserId: string,
    limit: number = 10
) {
    if (!query || query.length < 2) return [];

    return prisma.user.findMany({
        where: {
            AND: [
                { id: { not: currentUserId } },
                // Not already a member
                { roomMemberships: { none: { roomId } } },
                // No pending invitation
                { receivedInvitations: { none: { roomId, status: RoomInvitationStatus.pending } } },
                // Match name or email
                {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } }
                    ]
                }
            ]
        },
        select: {
            id: true,
            name: true,
            image: true,
            email: true
        },
        take: limit
    });
}

/**
 * Get sent invitations for a user (to track who they've invited).
 */
export async function getSentInvitations(userId: string, roomId?: string) {
    return prisma.roomInvitation.findMany({
        where: {
            inviterId: userId,
            ...(roomId && { roomId })
        },
        include: {
            room: { select: { name: true, slug: true } },
            invitee: { select: { id: true, name: true, image: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
}
