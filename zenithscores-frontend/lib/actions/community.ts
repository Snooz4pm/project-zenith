'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ========================
// POSTS
// ========================

interface CreatePostInput {
    asset?: string;
    marketType?: string;
    postType?: 'question' | 'insight' | 'thesis';
    title: string;
    body: string;
}

export async function createPost(userId: string, input: CreatePostInput) {
    if (!userId) throw new Error('Unauthorized');
    if (!input.title || input.title.length > 200) throw new Error('Title required (max 200 chars)');
    if (!input.body || input.body.length > 2000) throw new Error('Body required (max 2000 chars)');

    const post = await prisma.communityPost.create({
        data: {
            authorId: userId,
            asset: input.asset?.toUpperCase() || null,
            marketType: input.marketType || null,
            postType: input.postType || 'insight',
            title: input.title.trim(),
            body: input.body.trim()
        },
        include: {
            author: { select: { id: true, name: true, image: true } },
            _count: { select: { comments: true } }
        }
    });

    revalidatePath('/community');
    return post;
}

export async function getPosts(cursor?: string, limit: number = 20) {
    const posts = await prisma.communityPost.findMany({
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

export async function getPostsByAsset(asset: string, limit: number = 10) {
    return await prisma.communityPost.findMany({
        where: { asset: asset.toUpperCase() },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            author: { select: { id: true, name: true, image: true } },
            _count: { select: { comments: true } }
        }
    });
}

export async function getPostById(postId: string) {
    return await prisma.communityPost.findUnique({
        where: { id: postId },
        include: {
            author: { select: { id: true, name: true, image: true } },
            comments: {
                where: { parentId: null },
                orderBy: { createdAt: 'asc' },
                include: {
                    author: { select: { id: true, name: true, image: true } },
                    replies: {
                        orderBy: { createdAt: 'asc' },
                        include: {
                            author: { select: { id: true, name: true, image: true } }
                        }
                    }
                }
            },
            _count: { select: { comments: true } }
        }
    });
}

export async function deletePost(userId: string, postId: string) {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    if (post.authorId !== userId) throw new Error('Not authorized');

    await prisma.communityPost.delete({ where: { id: postId } });
    revalidatePath('/community');
    return { success: true };
}

export async function markPostResolved(userId: string, postId: string) {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    if (post.authorId !== userId) throw new Error('Not authorized');

    await prisma.communityPost.update({
        where: { id: postId },
        data: { resolved: true }
    });

    revalidatePath(`/community/${postId}`);
    return { success: true };
}

// ========================
// COMMENTS
// ========================

export async function createComment(
    userId: string,
    postId: string,
    body: string,
    parentId?: string
) {
    if (!userId) throw new Error('Unauthorized');
    if (!body || body.length > 1000) throw new Error('Comment required (max 1000 chars)');

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');

    // If replying to a comment, validate parent and enforce max depth 1
    if (parentId) {
        const parent = await prisma.comment.findUnique({ where: { id: parentId } });
        if (!parent) throw new Error('Parent comment not found');
        if (parent.parentId) throw new Error('Cannot reply to a reply (max depth 1)');
    }

    const comment = await prisma.comment.create({
        data: {
            postId,
            authorId: userId,
            parentId: parentId || null,
            body: body.trim()
        },
        include: {
            author: { select: { id: true, name: true, image: true } }
        }
    });

    // Create notification for post author (unless commenting on own post)
    if (post.authorId !== userId) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        await prisma.notification.create({
            data: {
                userId: post.authorId,
                type: 'COMMENT_ON_POST',
                sourceUserId: userId,
                sourceEntityId: postId,
                message: `${user?.name || 'Someone'} commented on your post`
            }
        });
    }

    revalidatePath(`/community/${postId}`);
    return comment;
}

export async function deleteComment(userId: string, commentId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new Error('Comment not found');
    if (comment.authorId !== userId) throw new Error('Not authorized');

    await prisma.comment.delete({ where: { id: commentId } });
    revalidatePath(`/community/${comment.postId}`);
    return { success: true };
}

// ========================
// NOTIFICATIONS
// ========================

export async function getNotifications(userId: string, unreadOnly: boolean = false) {
    if (!userId) throw new Error('Unauthorized');

    return await prisma.notification.findMany({
        where: {
            userId,
            ...(unreadOnly && { read: false })
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            sourceUser: { select: { id: true, name: true, image: true } }
        }
    });
}

export async function getUnreadNotificationCount(userId: string) {
    if (!userId) return 0;

    return await prisma.notification.count({
        where: { userId, read: false }
    });
}

export async function markNotificationRead(userId: string, notificationId: string) {
    await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { read: true }
    });
    return { success: true };
}

export async function markAllNotificationsRead(userId: string) {
    await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
    });
    return { success: true };
}

// ========================
// DIRECT MESSAGES
// ========================

function normalizeParticipants(userA: string, userB: string): [string, string] {
    return userA < userB ? [userA, userB] : [userB, userA];
}

export async function getOrCreateConversation(
    userId: string,
    otherUserId: string,
    context?: { type: 'post' | 'comment'; id: string }
) {
    if (!userId || !otherUserId) throw new Error('Invalid users');
    if (userId === otherUserId) throw new Error('Cannot message yourself');

    const [participantA, participantB] = normalizeParticipants(userId, otherUserId);

    // Try to find existing conversation
    let conversation = await prisma.conversation.findUnique({
        where: { participantA_participantB: { participantA, participantB } }
    });

    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                participantA,
                participantB,
                contextType: context?.type || null,
                contextId: context?.id || null
            }
        });
    }

    return conversation;
}

export async function sendMessage(userId: string, conversationId: string, body: string) {
    if (!userId) throw new Error('Unauthorized');
    if (!body || body.length > 2000) throw new Error('Message required (max 2000 chars)');

    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
    });

    if (!conversation) throw new Error('Conversation not found');
    if (conversation.participantA !== userId && conversation.participantB !== userId) {
        throw new Error('Not authorized');
    }

    const message = await prisma.directMessage.create({
        data: {
            conversationId,
            senderId: userId,
            body: body.trim()
        },
        include: {
            sender: { select: { id: true, name: true, image: true } }
        }
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
    });

    // Notify the other participant
    const recipientId = conversation.participantA === userId
        ? conversation.participantB
        : conversation.participantA;

    const sender = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await prisma.notification.create({
        data: {
            userId: recipientId,
            type: 'DIRECT_MESSAGE',
            sourceUserId: userId,
            sourceEntityId: conversationId,
            message: `${sender?.name || 'Someone'} sent you a message`
        }
    });

    revalidatePath('/messages');
    return message;
}

export async function getConversations(userId: string) {
    if (!userId) throw new Error('Unauthorized');

    const conversations = await prisma.conversation.findMany({
        where: {
            OR: [
                { participantA: userId },
                { participantB: userId }
            ]
        },
        orderBy: { lastMessageAt: 'desc' },
        include: {
            userA: { select: { id: true, name: true, image: true } },
            userB: { select: { id: true, name: true, image: true } },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                    sender: { select: { id: true, name: true } }
                }
            }
        }
    });

    // Transform to show the "other" user
    return conversations.map(conv => ({
        id: conv.id,
        otherUser: conv.participantA === userId ? conv.userB : conv.userA,
        lastMessage: conv.messages[0] || null,
        lastMessageAt: conv.lastMessageAt,
        contextType: conv.contextType,
        contextId: conv.contextId
    }));
}

export async function getMessages(conversationId: string, userId: string, cursor?: string) {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
    });

    if (!conversation) throw new Error('Conversation not found');
    if (conversation.participantA !== userId && conversation.participantB !== userId) {
        throw new Error('Not authorized');
    }

    const messages = await prisma.directMessage.findMany({
        where: { conversationId },
        take: 50,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
            sender: { select: { id: true, name: true, image: true } }
        }
    });

    return messages.reverse(); // Return in chronological order
}

export async function markConversationNotificationsRead(userId: string, conversationId: string) {
    await prisma.notification.updateMany({
        where: {
            userId,
            sourceEntityId: conversationId,
            type: 'DIRECT_MESSAGE',
            read: false
        },
        data: { read: true }
    });
    return { success: true };
}
