'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ========================
// ROOM QUERIES
// ========================

export async function getAllRooms() {
  return await prisma.room.findMany({
    where: { isActive: true },
    orderBy: [
      { marketType: 'asc' },
      { name: 'asc' }
    ],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      marketType: true,
      memberCount: true,
      postCount: true,
      isSystem: true,
      isPublic: true,
      requiresApproval: true,
      creatorId: true
    }
  });
}

export async function getRoomBySlug(slug: string) {
  return await prisma.room.findUnique({
    where: { slug },
    include: {
      creator: {
        select: { id: true, name: true, image: true }
      },
      _count: {
        select: { members: true, posts: true }
      }
    }
  });
}

export async function getUserRooms(userId: string) {
  if (!userId) return [];

  const memberships = await prisma.roomMembership.findMany({
    where: { userId },
    include: {
      room: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          marketType: true,
          memberCount: true,
          isSystem: true,
          requiresApproval: true
        }
      }
    },
    orderBy: { joinedAt: 'desc' }
  });

  return memberships.map(m => m.room);
}

export async function isUserInRoom(userId: string, roomId: string): Promise<boolean> {
  if (!userId || !roomId) return false;

  const membership = await prisma.roomMembership.findUnique({
    where: {
      userId_roomId: { userId, roomId }
    }
  });

  return !!membership;
}

export async function getUserCreatedRooms(userId: string) {
  if (!userId) return [];

  return await prisma.room.findMany({
    where: { creatorId: userId, isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { members: true, posts: true, joinRequests: true }
      }
    }
  });
}

// ========================
// ROOM CREATION (V2)
// ========================

export async function createRoom(
  userId: string,
  data: {
    name: string;
    slug: string;
    description: string;
    marketType: 'crypto' | 'stock' | 'forex';
    isPublic?: boolean;
    requiresApproval?: boolean;
    maxMembers?: number;
  }
) {
  if (!userId) throw new Error('Unauthorized');
  if (!data.name || data.name.length > 100) {
    throw new Error('Name required (max 100 chars)');
  }
  if (!data.slug || data.slug.length > 50) {
    throw new Error('Slug required (max 50 chars)');
  }
  if (!data.description || data.description.length > 300) {
    throw new Error('Description required (max 300 chars)');
  }

  // Check if slug is already taken
  const existing = await prisma.room.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error('Room slug already taken');

  // Create room and auto-join creator
  const room = await prisma.$transaction(async (tx) => {
    const newRoom = await tx.room.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        marketType: data.marketType,
        creatorId: userId,
        isSystem: false,
        isPublic: data.isPublic ?? true,
        requiresApproval: data.requiresApproval ?? false,
        maxMembers: data.maxMembers,
        memberCount: 1
      }
    });

    // Auto-join creator
    await tx.roomMembership.create({
      data: {
        userId,
        roomId: newRoom.id
      }
    });

    return newRoom;
  });

  revalidatePath('/community');
  return room;
}

// ========================
// ROOM ACTIONS
// ========================

export async function joinRoom(userId: string, roomId: string) {
  if (!userId) throw new Error('Unauthorized');

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error('Room not found');
  if (!room.isActive) throw new Error('Room is not active');

  // Private rooms must have approval enabled to allow join requests
  if (!room.isPublic && !room.requiresApproval) {
    throw new Error('This is a private invite-only room');
  }

  // Check if already a member
  const existing = await prisma.roomMembership.findUnique({
    where: { userId_roomId: { userId, roomId } }
  });

  if (existing) return { success: true, alreadyMember: true };

  // Check if requires approval (for both public and private rooms)
  if (room.requiresApproval) {
    // Check if already has pending request
    const existingRequest = await prisma.roomJoinRequest.findUnique({
      where: { userId_roomId: { userId, roomId } }
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return { success: true, requestPending: true };
      }
      if (existingRequest.status === 'rejected') {
        throw new Error('Your join request was rejected');
      }
    }

    // Create join request
    await prisma.roomJoinRequest.create({
      data: { userId, roomId }
    });

    // Notify room creator
    if (room.creatorId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      await prisma.notification.create({
        data: {
          userId: room.creatorId,
          type: 'ROOM_JOIN_REQUEST',
          sourceUserId: userId,
          sourceEntityId: roomId,
          message: `${user?.name || 'Someone'} wants to join ${room.name}`
        }
      });
    }

    return { success: true, requestPending: true };
  }

  // Check max members
  if (room.maxMembers && room.memberCount >= room.maxMembers) {
    throw new Error('Room is full');
  }

  // Create membership
  await prisma.$transaction([
    prisma.roomMembership.create({
      data: { userId, roomId }
    }),
    prisma.room.update({
      where: { id: roomId },
      data: { memberCount: { increment: 1 } }
    })
  ]);

  revalidatePath('/community');
  revalidatePath(`/community/rooms/${room.slug}`);

  return { success: true, alreadyMember: false };
}

export async function leaveRoom(userId: string, roomId: string) {
  if (!userId) throw new Error('Unauthorized');

  const membership = await prisma.roomMembership.findUnique({
    where: { userId_roomId: { userId, roomId } }
  });

  if (!membership) return { success: true, notMember: true };

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error('Room not found');

  // Don't allow creator to leave their own room
  if (room.creatorId === userId && !room.isSystem) {
    throw new Error('Room creator cannot leave. Delete the room instead.');
  }

  // Delete membership
  await prisma.$transaction([
    prisma.roomMembership.delete({
      where: { userId_roomId: { userId, roomId } }
    }),
    prisma.room.update({
      where: { id: roomId },
      data: { memberCount: { decrement: 1 } }
    })
  ]);

  revalidatePath('/community');
  revalidatePath(`/community/rooms/${room.slug}`);

  return { success: true, notMember: false };
}

// ========================
// JOIN REQUEST MANAGEMENT (V2)
// ========================

export async function getPendingJoinRequests(userId: string, roomId: string) {
  if (!userId) throw new Error('Unauthorized');

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error('Room not found');
  if (room.creatorId !== userId) throw new Error('Not authorized');

  return await prisma.roomJoinRequest.findMany({
    where: { roomId, status: 'pending' },
    include: {
      user: {
        select: { id: true, name: true, image: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
}

export async function approveJoinRequest(userId: string, requestId: string) {
  if (!userId) throw new Error('Unauthorized');

  const request = await prisma.roomJoinRequest.findUnique({
    where: { id: requestId },
    include: { room: true }
  });

  if (!request) throw new Error('Request not found');
  if (request.room.creatorId !== userId) throw new Error('Not authorized');
  if (request.status !== 'pending') throw new Error('Request already processed');

  // Check max members
  if (request.room.maxMembers && request.room.memberCount >= request.room.maxMembers) {
    throw new Error('Room is full');
  }

  await prisma.$transaction([
    // Update request
    prisma.roomJoinRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: userId
      }
    }),
    // Create membership
    prisma.roomMembership.create({
      data: {
        userId: request.userId,
        roomId: request.roomId
      }
    }),
    // Increment member count
    prisma.room.update({
      where: { id: request.roomId },
      data: { memberCount: { increment: 1 } }
    })
  ]);

  // Notify user
  await prisma.notification.create({
    data: {
      userId: request.userId,
      type: 'ROOM_JOIN_APPROVED',
      sourceUserId: userId,
      sourceEntityId: request.roomId,
      message: `Your request to join ${request.room.name} was approved`
    }
  });

  revalidatePath(`/community/rooms/${request.room.slug}`);
  return { success: true };
}

export async function rejectJoinRequest(userId: string, requestId: string) {
  if (!userId) throw new Error('Unauthorized');

  const request = await prisma.roomJoinRequest.findUnique({
    where: { id: requestId },
    include: { room: true }
  });

  if (!request) throw new Error('Request not found');
  if (request.room.creatorId !== userId) throw new Error('Not authorized');
  if (request.status !== 'pending') throw new Error('Request already processed');

  await prisma.roomJoinRequest.update({
    where: { id: requestId },
    data: {
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: userId
    }
  });

  return { success: true };
}

// ========================
// ROOM POSTS
// ========================

export async function getRoomPosts(roomId: string, cursor?: string, limit: number = 20) {
  const posts = await prisma.communityPost.findMany({
    where: { roomId },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, name: true, image: true } },
      _count: { select: { comments: true } }
    }
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, -1) : posts;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return { posts: items, nextCursor };
}

export async function createRoomPost(
  userId: string,
  roomId: string,
  input: {
    title: string;
    body: string;
    postType?: 'question' | 'insight' | 'thesis';
    asset?: string;
    marketType?: string;
    imageUrl?: string;
  }
) {
  if (!userId) throw new Error('Unauthorized');

  // Verify user is a member of the room
  const isMember = await isUserInRoom(userId, roomId);
  if (!isMember) throw new Error('You must join the room before posting');

  if (!input.title || input.title.length > 200) {
    throw new Error('Title required (max 200 chars)');
  }
  if (!input.body || input.body.length > 2000) {
    throw new Error('Body required (max 2000 chars)');
  }

  const post = await prisma.$transaction(async (tx) => {
    const newPost = await tx.communityPost.create({
      data: {
        authorId: userId,
        roomId,
        asset: input.asset?.toUpperCase() || null,
        marketType: input.marketType || null,
        postType: input.postType || 'insight',
        title: input.title.trim(),
        body: input.body.trim(),
        imageUrl: input.imageUrl || null
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { comments: true } }
      }
    });

    // Increment room post count
    await tx.room.update({
      where: { id: roomId },
      data: { postCount: { increment: 1 } }
    });

    return newPost;
  });

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  revalidatePath('/community');
  revalidatePath(`/community/rooms/${room?.slug}`);

  return post;
}

// ========================
// ROOM DELETION (V2)
// ========================

export async function deleteRoom(userId: string, roomId: string) {
  if (!userId) throw new Error('Unauthorized');

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error('Room not found');
  if (room.isSystem) throw new Error('Cannot delete system rooms');
  if (room.creatorId !== userId) throw new Error('Not authorized');

  await prisma.room.delete({ where: { id: roomId } });

  revalidatePath('/community');
  return { success: true };
}

export async function updateRoom(
  userId: string,
  roomId: string,
  data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
    requiresApproval?: boolean;
    maxMembers?: number | null;
  }
) {
  if (!userId) throw new Error('Unauthorized');

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error('Room not found');
  if (room.isSystem) throw new Error('Cannot update system rooms');
  if (room.creatorId !== userId) throw new Error('Not authorized');

  if (data.name && data.name.length > 100) {
    throw new Error('Name too long (max 100 chars)');
  }
  if (data.description && data.description.length > 300) {
    throw new Error('Description too long (max 300 chars)');
  }

  await prisma.room.update({
    where: { id: roomId },
    data: {
      name: data.name,
      description: data.description,
      isPublic: data.isPublic,
      requiresApproval: data.requiresApproval,
      maxMembers: data.maxMembers
    }
  });

  revalidatePath('/community');
  revalidatePath(`/community/rooms/${room.slug}`);
  revalidatePath(`/community/rooms/${room.slug}/settings`);

  return { success: true };
}
