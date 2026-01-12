/**
 * Trust Evaluator - Pillar 9
 * 
 * Main evaluator that derives trust state from DB.
 * Stateless in memory - all state comes from Neon/Prisma.
 * Deterministic and explainable.
 */

import { PrismaClient, TrustHistory } from '@prisma/client';
import { TrustLevel, getTrustConfig, getTrustLevelName } from './trustLevels';
import { TrustDecision, TrustHistorySummary, TrustChange } from './trustDecision';
import { evaluatePromotion, PromotionSignals } from './promotionRules';
import { evaluateDemotion, DemotionSignals } from './demotionRules';

const prisma = new PrismaClient();

/**
 * Evaluate current trust level based on historical data
 */
export async function evaluateTrust(): Promise<TrustDecision> {
    // Get history summary from DB
    const history = await getTrustHistory();

    // Get current trust state
    const currentState = await getCurrentTrustState();
    const currentLevel = currentState?.trustLevel ?? TrustLevel.LEVEL_0_OBSERVER;

    // Build signals
    const promotionSignals = buildPromotionSignals(history);
    const demotionSignals = buildDemotionSignals(history);

    // Check demotion first (takes priority)
    const demotionResult = evaluateDemotion(currentLevel, demotionSignals);
    if (demotionResult.shouldDemote) {
        await recordTrustChange(currentLevel, demotionResult.toLevel, demotionResult.reason);
        await updateTrustState(demotionResult.toLevel);

        const config = getTrustConfig(demotionResult.toLevel);
        return buildDecision(demotionResult.toLevel, config, demotionResult.reason, history);
    }

    // Check promotion
    const promotionResult = evaluatePromotion(currentLevel, history, promotionSignals);
    if (promotionResult.shouldPromote) {
        await recordTrustChange(currentLevel, promotionResult.toLevel, promotionResult.reason);
        await updateTrustState(promotionResult.toLevel);

        const config = getTrustConfig(promotionResult.toLevel);
        return buildDecision(promotionResult.toLevel, config, promotionResult.reason, history);
    }

    // No change
    const config = getTrustConfig(currentLevel);
    return buildDecision(currentLevel, config, 'No change in trust level', history);
}

/**
 * Get trust history from DB
 */
async function getTrustHistory(): Promise<TrustHistorySummary> {
    let runs: any[] = [];

    try {
        runs = await prisma.learningRun.findMany({
            orderBy: { startedAt: 'desc' },
            take: 100, // Last 100 runs
            select: {
                id: true,
                finalVerdict: true,
                executionAllowed: true,
                startedAt: true,
            },
        }) || [];
    } catch (error) {
        console.error('[TrustEvaluator] Failed to fetch learning runs:', error);
        runs = [];
    }

    const totalRuns = runs.length;
    const edgeValidatedRuns = runs.filter(r => r.finalVerdict === 'EDGE_VALIDATED').length;
    const noEdgeRuns = runs.filter(r => r.finalVerdict === 'NO_EDGE_BASELINE_BEATS_BRAIN').length;
    const noTradeRuns = runs.filter(r => r.finalVerdict === 'NO_TRADE_LOW_OPPORTUNITY').length;
    const chaosAborts = runs.filter(r => r.finalVerdict === 'CHAOS_ABORT').length;

    // Calculate consecutive streaks
    let consecutiveEdgeValidated = 0;
    let consecutiveNoEdge = 0;

    for (const run of runs) {
        if (run.finalVerdict === 'EDGE_VALIDATED') {
            if (consecutiveNoEdge === 0) consecutiveEdgeValidated++;
            else break;
        } else {
            if (consecutiveEdgeValidated === 0 && run.finalVerdict === 'NO_EDGE_BASELINE_BEATS_BRAIN') {
                consecutiveNoEdge++;
            } else if (consecutiveEdgeValidated > 0) {
                break;
            }
        }
    }

    // Get trust changes
    let changes: TrustHistory[] = [];
    try {
        changes = await prisma.trustHistory.findMany({
            orderBy: { timestamp: 'desc' },
            take: 20,
        }) || [];
    } catch (error) {
        console.error('[TrustEvaluator] Failed to fetch trust history:', error);
        changes = [];
    }

    const promotions: TrustChange[] = (changes || [])
        .filter((c: TrustHistory) => c.toLevel > c.fromLevel)
        .map((c: TrustHistory) => ({ fromLevel: c.fromLevel as TrustLevel, toLevel: c.toLevel as TrustLevel, reason: c.reason, timestamp: c.timestamp }));

    const demotions: TrustChange[] = (changes || [])
        .filter((c: TrustHistory) => c.toLevel < c.fromLevel)
        .map((c: TrustHistory) => ({ fromLevel: c.fromLevel as TrustLevel, toLevel: c.toLevel as TrustLevel, reason: c.reason, timestamp: c.timestamp }));

    return {
        totalRuns,
        edgeValidatedRuns,
        noEdgeRuns,
        noTradeRuns,
        chaosAborts,
        consecutiveEdgeValidated,
        consecutiveNoEdge,
        violations: [], // Would come from violation tracking
        promotions,
        demotions,
    };
}

/**
 * Get current trust state from DB
 */
async function getCurrentTrustState() {
    return prisma.trustState.findFirst({
        orderBy: { updatedAt: 'desc' },
    });
}

/**
 * Update trust state in DB
 */
async function updateTrustState(level: TrustLevel): Promise<void> {
    await prisma.trustState.upsert({
        where: { id: 'current' },
        create: { id: 'current', trustLevel: level },
        update: { trustLevel: level },
    });
}

/**
 * Record trust change for audit
 */
async function recordTrustChange(from: TrustLevel, to: TrustLevel, reason: string): Promise<void> {
    await prisma.trustHistory.create({
        data: {
            fromLevel: from,
            toLevel: to,
            reason,
        },
    });
    console.log(`[Trust] ${getTrustLevelName(from)} → ${getTrustLevelName(to)}: ${reason}`);
}

/**
 * Build promotion signals from history
 */
function buildPromotionSignals(history: TrustHistorySummary): PromotionSignals {
    return {
        consecutiveEdgeValidated: history.consecutiveEdgeValidated,
        totalRuns: history.totalRuns,
        violations: history.violations.length,
        correctNoTradeDecisions: history.noTradeRuns,
        saturationStopsRespected: 0, // Would need cycle-level analysis
        chaosAbortsRespected: history.chaosAborts,
        baselineBeatenRate: history.totalRuns > 0
            ? history.edgeValidatedRuns / history.totalRuns
            : 0,
    };
}

/**
 * Build demotion signals from history
 */
function buildDemotionSignals(history: TrustHistorySummary): DemotionSignals {
    return {
        consecutiveNoEdge: history.consecutiveNoEdge,
        executedWithoutEdge: false, // Would need execution tracking
        exceededTradeLimit: false,
        exceededSolLimit: false,
        ignoredChaosRegime: false,
        overtrading: false,
        baselineBeatsConsecutive: history.consecutiveNoEdge,
    };
}

/**
 * Build final trust decision
 */
function buildDecision(
    level: TrustLevel,
    config: ReturnType<typeof getTrustConfig>,
    reason: string,
    history: TrustHistorySummary
): TrustDecision {
    return {
        trustLevel: level,
        maxTradesAllowed: config.maxTrades,
        executionType: config.executionType,
        maxSolPerTrade: config.maxSolPerTrade,
        reason,
        timestamp: Date.now(),
        consecutiveEdgeValidated: history.consecutiveEdgeValidated || 0,
        totalRuns: history.totalRuns || 0,
        violations: (history.violations || []).length,
        lastPromotion: (history.promotions || [])[0]?.timestamp ?? null,
        lastDemotion: (history.demotions || [])[0]?.timestamp ?? null,
    };
}

export { prisma };
