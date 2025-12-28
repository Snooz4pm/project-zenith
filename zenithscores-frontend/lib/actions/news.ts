'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export type NewsBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNCLEAR';

/**
 * Record user's market bias for a news article
 * Upserts to allow changing response
 */
export async function recordNewsBias(articleId: number, bias: NewsBias) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    const response = await (prisma as any).newsResponse.upsert({
      where: {
        userId_articleId: {
          userId: session.user.id,
          articleId: articleId,
        },
      },
      update: {
        bias,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        articleId,
        bias,
      },
    });

    return { success: true, response };
  } catch (error) {
    console.error('Failed to record news bias:', error);
    return { error: 'Failed to save response' };
  }
}

/**
 * Get user's response for a specific article
 */
export async function getUserNewsBias(articleId: number) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  try {
    const response = await (prisma as any).newsResponse.findUnique({
      where: {
        userId_articleId: {
          userId: session.user.id,
          articleId,
        },
      },
    });

    return response;
  } catch (error) {
    console.error('Failed to get user news bias:', error);
    return null;
  }
}

/**
 * Batch fetch user biases for multiple articles
 * Used for showing user's previous responses in feed
 */
export async function getUserNewsBiasesBatch(articleIds: number[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {};
  }

  try {
    const responses = await (prisma as any).newsResponse.findMany({
      where: {
        userId: session.user.id,
        articleId: { in: articleIds },
      },
    });

    // Convert to map for O(1) lookup
    return responses.reduce((acc: Record<number, string>, r: any) => {
      acc[r.articleId] = r.bias;
      return acc;
    }, {} as Record<number, string>);
  } catch (error) {
    console.error('Failed to get user news biases:', error);
    return {};
  }
}
