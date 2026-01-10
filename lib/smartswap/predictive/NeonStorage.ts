/**
 * Neon Storage Adapter for Predictive Learning
 * 
 * Persistent storage via Prisma + Neon Database
 */

import { PrismaClient } from '@prisma/client';
import type { TokenLearning, SessionComparison } from '@/types/PredictiveMemory';

const prisma = new PrismaClient();

export class NeonStorageAdapter {
    /**
     * Get token learning data
     */
    async getTokenLearning(mint: string): Promise<TokenLearning | null> {
        try {
            const data = await prisma.tokenLearning.findUnique({
                where: { mint },
            });

            if (!data) return null;

            return {
                mint: data.mint,
                symbol: data.symbol,
                directionAccuracy: data.directionAccuracy,
                magnitudeBucketAccuracy: data.magnitudeBucketAccuracy,
                confidenceScore: data.confidenceScore,
                lastUpdated: data.lastUpdated.getTime(),
                typicalHoldMinutes: data.typicalHoldMinutes ?? undefined,
                volatilityProfile: data.volatilityProfile as 'LOW' | 'MEDIUM' | 'HIGH',
                learningCount: data.learningCount,
            };
        } catch (error) {
            console.error('[NeonStorage] Error getting token learning:', error);
            return null;
        }
    }

    /**
     * Update token learning data
     */
    async updateTokenLearning(learning: TokenLearning): Promise<void> {
        try {
            await prisma.tokenLearning.upsert({
                where: { mint: learning.mint },
                update: {
                    directionAccuracy: learning.directionAccuracy,
                    magnitudeBucketAccuracy: learning.magnitudeBucketAccuracy,
                    confidenceScore: learning.confidenceScore,
                    typicalHoldMinutes: learning.typicalHoldMinutes,
                    volatilityProfile: learning.volatilityProfile,
                    learningCount: learning.learningCount,
                },
                create: {
                    mint: learning.mint,
                    symbol: learning.symbol,
                    directionAccuracy: learning.directionAccuracy,
                    magnitudeBucketAccuracy: learning.magnitudeBucketAccuracy,
                    confidenceScore: learning.confidenceScore,
                    typicalHoldMinutes: learning.typicalHoldMinutes,
                    volatilityProfile: learning.volatilityProfile,
                    learningCount: learning.learningCount,
                },
            });
        } catch (error) {
            console.error('[NeonStorage] Error updating token learning:', error);
        }
    }

    /**
     * Record session comparison for learning
     */
    async recordSessionComparison(comparison: SessionComparison): Promise<void> {
        try {
            await prisma.sessionComparison.create({
                data: {
                    tokenMint: comparison.token,
                    tokenSymbol: comparison.token, // TODO: get symbol
                    actualDirection: comparison.actualDirection,
                    actualBucket: comparison.actualBucket,
                    actualPercentChange: comparison.actualPercentChange,
                    predictedDirection: comparison.predictedDirection,
                    predictedBucket: comparison.predictedBucket,
                    timeBetweenSessions: comparison.timeBetweenSessions,
                    marketRegime: comparison.marketRegime,
                    wasDirectionCorrect: comparison.wasDirectionCorrect,
                    wasBucketCorrect: comparison.wasBucketCorrect,
                },
            });
        } catch (error) {
            console.error('[NeonStorage] Error recording session:', error);
        }
    }

    /**
     * Get all learnings (with optional filter)
     */
    async getAllLearnings(params?: {
        minConfidence?: number;
        limit?: number;
    }): Promise<TokenLearning[]> {
        try {
            const data = await prisma.tokenLearning.findMany({
                where: params?.minConfidence
                    ? { confidenceScore: { gte: params.minConfidence } }
                    : undefined,
                orderBy: [
                    { confidenceScore: 'desc' },
                    { directionAccuracy: 'desc' },
                ],
                take: params?.limit ?? 100,
            });

            return data.map(d => ({
                mint: d.mint,
                symbol: d.symbol,
                directionAccuracy: d.directionAccuracy,
                magnitudeBucketAccuracy: d.magnitudeBucketAccuracy,
                confidenceScore: d.confidenceScore,
                lastUpdated: d.lastUpdated.getTime(),
                typicalHoldMinutes: d.typicalHoldMinutes ?? undefined,
                volatilityProfile: d.volatilityProfile as 'LOW' | 'MEDIUM' | 'HIGH',
                learningCount: d.learningCount,
            }));
        } catch (error) {
            console.error('[NeonStorage] Error getting all learnings:', error);
            return [];
        }
    }

    /**
     * Cleanup old data (optional maintenance)
     */
    async cleanupOldData(maxAgeDays: number = 30): Promise<void> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

            // Remove low-confidence learnings older than cutoff
            await prisma.tokenLearning.deleteMany({
                where: {
                    AND: [
                        { lastUpdated: { lt: cutoffDate } },
                        { confidenceScore: { lt: 0.3 } },
                    ],
                },
            });

            // Remove old session comparisons
            await prisma.sessionComparison.deleteMany({
                where: {
                    createdAt: { lt: cutoffDate },
                },
            });
        } catch (error) {
            console.error('[NeonStorage] Error cleaning up data:', error);
        }
    }

    /**
     * Get learning stats (for debugging/monitoring)
     */
    async getStats(): Promise<{
        totalLearnings: number;
        averageConfidence: number;
        topTokens: Array<{ mint: string; confidence: number }>;
    }> {
        try {
            const count = await prisma.tokenLearning.count();
            const avg = await prisma.tokenLearning.aggregate({
                _avg: { confidenceScore: true },
            });
            const top = await prisma.tokenLearning.findMany({
                select: { mint: true, confidenceScore: true },
                orderBy: { confidenceScore: 'desc' },
                take: 10,
            });

            return {
                totalLearnings: count,
                averageConfidence: avg._avg.confidenceScore ?? 0,
                topTokens: top.map(t => ({ mint: t.mint, confidence: t.confidenceScore })),
            };
        } catch (error) {
            console.error('[NeonStorage] Error getting stats:', error);
            return {
                totalLearnings: 0,
                averageConfidence: 0,
                topTokens: [],
            };
        }
    }
}

// Singleton instance
export const neonStorage = new NeonStorageAdapter();
