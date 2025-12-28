'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ThesisItem, LogEntry, MarketContext, JournalStatus } from '@/lib/types/notebook';

/**
 * Creates a new Trade Journal (Notebook) entry.
 * Initializes with "BRIEFING" status and captures market context if provided.
 */
export async function createJournalEntry(
    userId: string,
    title: string,
    assetSymbol?: string,
    marketContext?: MarketContext
) {
    try {
        const journal = await prisma.tradeJournal.create({
            data: {
                userId,
                title,
                assetSymbol,
                status: 'BRIEFING',
                marketContext: marketContext as any, // Cast to JSON compatible
                thesis: [],
                liveLog: [],
            },
        });

        revalidatePath('/notebook');
        return { success: true, data: journal };
    } catch (error) {
        console.error('Failed to create journal:', error);
        return { success: false, error: 'Failed to create journal entry' };
    }
}

/**
 * Updates the Thesis (Plan) of a journal.
 * Only allowed if status is 'BRIEFING'.
 */
export async function updateJournalThesis(
    journalId: string,
    userId: string,
    thesis: ThesisItem[]
) {
    try {
        // Verify ownership and status
        const journal = await prisma.tradeJournal.findUnique({
            where: { id: journalId },
        });

        if (!journal || journal.userId !== userId) {
            return { success: false, error: 'Unauthorized' };
        }

        if (journal.status !== 'BRIEFING') {
            return { success: false, error: 'Cannot edit Plan after Briefing phase is closed.' };
        }

        await prisma.tradeJournal.update({
            where: { id: journalId },
            data: { thesis: thesis as any },
        });

        revalidatePath(`/notebook/${journalId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to update thesis:', error);
        return { success: false, error: 'Database error' };
    }
}

/**
 * Appends a log entry to the Live Log (Flight Recorder).
 * Allowed in 'LIVE' and 'BRIEFING' modes, but primarily for LIVE.
 */
export async function appendLiveLog(
    journalId: string,
    userId: string,
    entry: LogEntry
) {
    try {
        const journal = await prisma.tradeJournal.findUnique({
            where: { id: journalId },
        });

        if (!journal || journal.userId !== userId) {
            return { success: false, error: 'Unauthorized' };
        }

        // Append to existing log
        const currentLog = (journal.liveLog as any) || [];
        const newLog = [...currentLog, entry];

        await prisma.tradeJournal.update({
            where: { id: journalId },
            data: { liveLog: newLog as any },
        });

        revalidatePath(`/notebook/${journalId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to append log:', error);
        return { success: false, error: 'Database error' };
    }
}

/**
 * Transitions the Journal Status (e.g., BRIEFING -> LIVE).
 */
export async function updateJournalStatus(
    journalId: string,
    userId: string,
    status: JournalStatus
) {
    try {
        await prisma.tradeJournal.update({
            where: { id: journalId, userId }, // Implicitly check ownership
            data: { status },
        });

        revalidatePath(`/notebook/${journalId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update status' };
    }
}

export async function getUserJournals(userId: string) {
    try {
        return await prisma.tradeJournal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    } catch (e) {
        return [];
    }
}

/**
 * Deletes a Trade Journal entry.
 */
export async function deleteJournal(journalId: string, userId: string) {
    try {
        // Verify ownership first (although deleteMany with where clause is safe too)
        const journal = await prisma.tradeJournal.findUnique({
            where: { id: journalId },
        });

        if (!journal || journal.userId !== userId) {
            return { success: false, error: 'Unauthorized' };
        }

        await prisma.tradeJournal.delete({
            where: { id: journalId },
        });

        revalidatePath('/notebook');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete journal:', error);
        return { success: false, error: 'Failed to delete journal' };
    }
}

// ============================================
// LINKED MISSION NOTEBOOK - Asset Page Actions
// ============================================

/**
 * Get active missions linked to a specific asset symbol.
 * Used by asset detail pages to show mission selector.
 */
export async function getAssetMissions(userId: string, assetSymbol: string) {
    try {
        return await prisma.tradeJournal.findMany({
            where: {
                userId,
                assetSymbol: assetSymbol.toUpperCase(),
                status: { in: ['BRIEFING', 'LIVE'] },
                type: 'mission'
            },
            orderBy: { createdAt: 'desc' },
            include: {
                missionUpdates: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
    } catch (e) {
        console.error('Failed to get asset missions:', e);
        return [];
    }
}

/**
 * Create a lightweight mission from an asset page.
 * Minimal input: title + optional hypothesis.
 */
export async function createLightweightMission(
    userId: string,
    assetSymbol: string,
    title: string,
    hypothesis?: string,
    currentPrice?: number
) {
    try {
        const thesis: ThesisItem[] = hypothesis ? [{
            id: crypto.randomUUID(),
            type: 'hypothesis',
            content: hypothesis,
            conviction: 50
        }] : [];

        const journal = await prisma.tradeJournal.create({
            data: {
                userId,
                title,
                assetSymbol: assetSymbol.toUpperCase(),
                type: 'mission',
                status: 'BRIEFING',
                thesis: thesis as any,
                liveLog: [],
                marketContext: currentPrice ? { priceAtCreation: currentPrice } : undefined
            }
        });

        revalidatePath('/notebook');
        return { success: true, data: journal };
    } catch (error) {
        console.error('Failed to create lightweight mission:', error);
        return { success: false, error: 'Failed to create mission' };
    }
}

/**
 * Append an update to a mission from an asset page.
 * This is append-only - never modifies core thesis.
 */
export async function appendMissionUpdate(
    journalId: string,
    userId: string,
    note: string,
    price?: number,
    source: 'asset_page' | 'notebook' = 'asset_page'
) {
    try {
        // Verify ownership
        const journal = await prisma.tradeJournal.findUnique({
            where: { id: journalId }
        });

        if (!journal || journal.userId !== userId) {
            return { success: false, error: 'Unauthorized' };
        }

        // Only allow updates on active missions
        if (!['BRIEFING', 'LIVE'].includes(journal.status)) {
            return { success: false, error: 'Mission is closed' };
        }

        const update = await prisma.missionUpdate.create({
            data: {
                journalId,
                note,
                price,
                source
            }
        });

        revalidatePath(`/notebook/${journalId}`);
        return { success: true, data: update };
    } catch (error) {
        console.error('Failed to append mission update:', error);
        return { success: false, error: 'Failed to add update' };
    }
}

/**
 * Get a mission with all its updates for display.
 */
export async function getMissionWithUpdates(journalId: string, userId: string) {
    try {
        const mission = await prisma.tradeJournal.findUnique({
            where: { id: journalId },
            include: {
                missionUpdates: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!mission || mission.userId !== userId) {
            return null;
        }

        return mission;
    } catch (e) {
        console.error('Failed to get mission:', e);
        return null;
    }
}
