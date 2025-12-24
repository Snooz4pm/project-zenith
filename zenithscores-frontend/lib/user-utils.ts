import { prisma } from '@/lib/prisma';

export interface UserPreferences {
    riskTolerance: number | null;
    timeHorizon: string | null;
    analysisStyle: string | null;
    patienceLevel: number | null;
    learningBias: number | null;
    userArchetype: string | null;
    isCalibrated: boolean;
}

/**
 * Get user preferences and calibration status
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
        const prefs = await prisma.userPreferences.findUnique({
            where: { userId },
            select: {
                riskTolerance: true,
                timeHorizon: true,
                analysisStyle: true,
                patienceLevel: true,
                learningBias: true,
                userArchetype: true
            }
        });

        return {
            riskTolerance: prefs?.riskTolerance || null,
            timeHorizon: prefs?.timeHorizon || null,
            analysisStyle: prefs?.analysisStyle || null,
            patienceLevel: prefs?.patienceLevel || null,
            learningBias: prefs?.learningBias || null,
            userArchetype: prefs?.userArchetype || null,
            isCalibrated: !!prefs?.userArchetype
        };
    } catch (error) {
        console.error('Error fetching user preferences:', error);
        return {
            riskTolerance: null,
            timeHorizon: null,
            analysisStyle: null,
            patienceLevel: null,
            learningBias: null,
            userArchetype: null,
            isCalibrated: false
        };
    }
}

/**
 * Check if a risk score is above user's tolerance
 * Returns null if user not calibrated
 */
export function isRiskAboveTolerance(
    riskScore: number,
    userTolerance: number | null
): boolean | null {
    if (userTolerance === null) return null;
    return riskScore > userTolerance;
}

/**
 * Get personalized risk message
 */
export function getPersonalizedRiskMessage(
    riskScore: number,
    userTolerance: number | null
): string | null {
    if (userTolerance === null) return null;

    if (riskScore > userTolerance) {
        return '⚠️ Above your threshold';
    } else {
        return '✓ Within your comfort zone';
    }
}

/**
 * Calculate user's "edge" on an asset based on past interactions
 */
export async function getUserEdge(
    userId: string,
    assetType: string,
    symbol: string
) {
    try {
        // Get view history
        const view = await prisma.userAssetView.findUnique({
            where: {
                userId_assetType_symbol: {
                    userId,
                    assetType,
                    symbol
                }
            },
            select: {
                viewCount: true,
                firstViewed: true,
                winLoss: true,
                userRating: true
            }
        });

        // Get signal interactions for similar assets
        const similarInteractions = await prisma.userSignalInteraction.findMany({
            where: {
                userId,
                assetType,
                actedUpon: true,
                profitLoss: { not: null }
            },
            select: {
                profitLoss: true,
                confidence: true
            }
        });

        // Calculate win rate
        const wins = similarInteractions.filter(i => (i.profitLoss || 0) > 0).length;
        const total = similarInteractions.length;
        const winRate = total > 0 ? (wins / total) * 100 : null;

        return {
            viewCount: view?.viewCount || 0,
            firstViewed: view?.firstViewed || null,
            similarTrades: total,
            winRate,
            avgConfidence: total > 0
                ? similarInteractions.reduce((acc, i) => acc + (i.confidence || 5), 0) / total
                : null
        };
    } catch (error) {
        console.error('Error calculating user edge:', error);
        return null;
    }
}
