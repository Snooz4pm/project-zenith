'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ingestNews } from './ingest';
import { getEnrichedFeed } from './enrichment';

/**
 * Get or create user intelligence profile
 */
export async function getUserIntelProfile(userId: string) {
    let profile = await prisma.userIntelProfile.findUnique({
        where: { userId }
    });

    if (!profile) {
        profile = await prisma.userIntelProfile.create({
            data: {
                userId,
                watchedAssets: [],
                attentionBias: { crypto: 0.33, stocks: 0.34, forex: 0.33 }
            }
        });
    }

    return profile;
}

/**
 * Record when user views/clicks an intelligence item
 */
export async function recordItemView(userId: string, itemId: string) {
    const profile = await getUserIntelProfile(userId);
    const clickHistory = (profile.clickHistory as any[]) || [];

    // Add new click
    clickHistory.unshift({
        itemId,
        timestamp: new Date().toISOString()
    });

    // Keep only last 50 clicks
    const trimmedHistory = clickHistory.slice(0, 50);

    await prisma.userIntelProfile.update({
        where: { userId },
        data: {
            clickHistory: trimmedHistory,
            lastViewed: new Date()
        }
    });

    return { success: true };
}

/**
 * Update user's watched assets list
 */
export async function updateWatchedAssets(userId: string, assets: string[]) {
    await prisma.userIntelProfile.upsert({
        where: { userId },
        update: { watchedAssets: assets },
        create: {
            userId,
            watchedAssets: assets,
            attentionBias: { crypto: 0.33, stocks: 0.34, forex: 0.33 }
        }
    });

    return { success: true };
}

/**
 * Add an asset to watched list
 */
export async function addWatchedAsset(userId: string, asset: string) {
    const profile = await getUserIntelProfile(userId);
    const watchedAssets = profile.watchedAssets || [];

    if (!watchedAssets.includes(asset.toUpperCase())) {
        await prisma.userIntelProfile.update({
            where: { userId },
            data: {
                watchedAssets: [...watchedAssets, asset.toUpperCase()]
            }
        });
    }

    return { success: true };
}

/**
 * Get personalized intelligence feed for user
 */
export async function getPersonalizedFeed(userId: string, limit: number = 8) {
    // Ensure we have fresh data
    await ingestNews();

    // Get enriched, ranked feed
    const feed = await getEnrichedFeed(userId, limit);

    return feed;
}

/**
 * Get count of new important items (for notification badge)
 */
export async function getIntelligenceBadge(userId: string) {
    const profile = await prisma.userIntelProfile.findUnique({
        where: { userId }
    });

    const lastViewed = profile?.lastViewed || new Date(0);

    // Count items since last viewed
    const newItems = await prisma.intelligenceItem.count({
        where: {
            publishedAt: { gt: lastViewed },
            impactScore: { gte: 50 } // Only count impactful items
        }
    });

    // Determine badge color based on content
    const conflictItems = await prisma.intelligenceItem.findMany({
        where: {
            publishedAt: { gt: lastViewed },
            sentiment: { lte: -0.3 }
        },
        take: 1
    });

    const opportunityItems = await prisma.intelligenceItem.findMany({
        where: {
            publishedAt: { gt: lastViewed },
            sentiment: { gte: 0.3 },
            impactScore: { gte: 60 }
        },
        take: 1
    });

    let color: 'blue' | 'amber' | 'green' | 'red' = 'blue';
    if (conflictItems.length > 0) color = 'red';
    else if (opportunityItems.length > 0) color = 'green';
    else if (newItems > 3) color = 'amber';

    return {
        count: Math.min(newItems, 9), // Cap at 9+
        color,
        hasNew: newItems > 0
    };
}

/**
 * Trigger manual news ingestion (for admin/cron)
 */
export async function triggerIngest() {
    const result = await ingestNews();
    revalidatePath('/command-center');
    return result;
}
