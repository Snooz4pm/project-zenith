// Intelligence Feed - Enrichment Logic

import { prisma } from '@/lib/prisma';
import type { IntelligenceItem, UserIntelProfile, TradeJournal } from '@prisma/client';

interface EnrichedItem extends IntelligenceItem {
    relevanceScore: number;
    urgency: 'info' | 'watch' | 'opportunity' | 'conflict';
    whyMatters: string;
    conflictsWith?: string; // Mission title if conflicts
}

/**
 * Score relevance of a news item for a specific user
 * Formula: (assetMatch × 40) + (recency × 30) + (impact × 20) + (sentiment × 10)
 */
export function scoreRelevance(
    item: IntelligenceItem,
    profile: UserIntelProfile | null,
    activeMissions: TradeJournal[]
): number {
    let score = 0;

    // 1. Asset Match Score (0-40)
    if (profile?.watchedAssets && item.assetTags.length > 0) {
        const watchedSet = new Set(profile.watchedAssets);
        const matchCount = item.assetTags.filter((tag: string) => watchedSet.has(tag)).length;
        score += Math.min(40, matchCount * 20);
    }

    // Check if matches any active mission assets
    const missionAssets = activeMissions.map(m => m.assetSymbol?.toUpperCase()).filter(Boolean);
    if (missionAssets.some(asset => item.assetTags.includes(asset!))) {
        score += 15; // Bonus for mission-relevant news
    }

    // 2. Recency Score (0-30)
    const ageHours = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60);
    if (ageHours < 1) score += 30;
    else if (ageHours < 6) score += 25;
    else if (ageHours < 12) score += 20;
    else if (ageHours < 24) score += 15;
    else if (ageHours < 48) score += 10;
    else score += 5;

    // 3. Impact Score (0-20)
    score += (item.impactScore || 0) * 0.2;

    // 4. Sentiment Relevance (0-10)
    // Strong sentiment (either direction) is more relevant
    score += Math.abs(item.sentiment || 0) * 10;

    return Math.min(100, Math.round(score));
}

/**
 * Detect if news conflicts with user's active thesis
 */
export function detectConflict(
    item: IntelligenceItem,
    missions: TradeJournal[]
): { conflicts: boolean; missionTitle?: string } {
    for (const mission of missions) {
        if (!mission.assetSymbol || !item.assetTags.includes(mission.assetSymbol.toUpperCase())) {
            continue;
        }

        // Parse thesis to check bias
        const thesis = mission.thesis as any[] | null;
        if (!thesis || thesis.length === 0) continue;

        const hypotheses = thesis.filter(t => t.type === 'hypothesis');
        if (hypotheses.length === 0) continue;

        // Very simple conflict detection based on sentiment vs thesis wording
        const thesisText = hypotheses[0]?.content?.toLowerCase() || '';
        const isBullishThesis = thesisText.includes('bull') || thesisText.includes('long') || thesisText.includes('buy');
        const isBearishThesis = thesisText.includes('bear') || thesisText.includes('short') || thesisText.includes('sell');

        const sentiment = item.sentiment || 0;

        // Conflict if thesis and sentiment are opposite
        if ((isBullishThesis && sentiment < -0.3) || (isBearishThesis && sentiment > 0.3)) {
            return { conflicts: true, missionTitle: mission.title || 'Active Mission' };
        }
    }

    return { conflicts: false };
}

/**
 * Classify urgency level for a news item
 */
export function classifyUrgency(
    item: IntelligenceItem,
    profile: UserIntelProfile | null,
    conflicts: boolean
): 'info' | 'watch' | 'opportunity' | 'conflict' {
    if (conflicts) return 'conflict';

    const sentiment = item.sentiment || 0;
    const impact = item.impactScore || 0;

    // Strong positive sentiment on watched asset = opportunity
    if (sentiment > 0.4 && impact > 60) return 'opportunity';

    // High impact news = watch
    if (impact > 70) return 'watch';

    // Medium impact or relevant = info
    return 'info';
}

/**
 * Generate "why this matters" text for a news item
 */
export function generateWhyMatters(
    item: IntelligenceItem,
    profile: UserIntelProfile | null,
    missions: TradeJournal[],
    conflicts: boolean,
    conflictMission?: string
): string {
    if (conflicts && conflictMission) {
        return `This may conflict with your ${conflictMission} thesis.`;
    }

    // Check if matches watched assets
    if (profile?.watchedAssets && item.assetTags.length > 0) {
        const matched = item.assetTags.filter((tag: string) =>
            profile.watchedAssets.includes(tag)
        );
        if (matched.length > 0) {
            return `Affects ${matched.join(', ')} which you follow.`;
        }
    }

    // Check if matches active mission
    for (const mission of missions) {
        if (mission.assetSymbol && item.assetTags.includes(mission.assetSymbol.toUpperCase())) {
            return `Related to your active ${mission.assetSymbol} mission.`;
        }
    }

    // Category-based fallback
    if (item.category === 'macro') {
        return 'Macro news may affect multiple positions.';
    }

    const sentiment = item.sentiment || 0;
    if (sentiment > 0.3) return 'Positive market signal detected.';
    if (sentiment < -0.3) return 'Negative market signal detected.';

    return 'Relevant to your trading interests.';
}

/**
 * Enrich a news item with user-specific context
 */
export async function enrichItem(
    item: IntelligenceItem,
    userId: string
): Promise<EnrichedItem> {
    // Get user profile
    const profile = await prisma.userIntelProfile.findUnique({
        where: { userId }
    });

    // Get active missions
    const missions = await prisma.tradeJournal.findMany({
        where: {
            userId,
            status: { in: ['BRIEFING', 'LIVE'] }
        }
    });

    const relevanceScore = scoreRelevance(item, profile, missions);
    const { conflicts, missionTitle } = detectConflict(item, missions);
    const urgency = classifyUrgency(item, profile, conflicts);
    const whyMatters = generateWhyMatters(item, profile, missions, conflicts, missionTitle);

    return {
        ...item,
        relevanceScore,
        urgency,
        whyMatters,
        conflictsWith: missionTitle
    };
}

/**
 * Get enriched intelligence feed for a user
 */
export async function getEnrichedFeed(userId: string, limit: number = 8): Promise<EnrichedItem[]> {
    // Get recent items
    const items = await prisma.intelligenceItem.findMany({
        orderBy: { publishedAt: 'desc' },
        take: 50 // Fetch more, then filter/rank
    });

    // Enrich each item
    const enrichedItems = await Promise.all(
        items.map(item => enrichItem(item, userId))
    );

    // Sort by relevance and return top items
    return enrichedItems
        .sort((a: EnrichedItem, b: EnrichedItem) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
}
