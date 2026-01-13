/**
 * Learning Persistence Layer
 * 
 * Immutable DB persistence for learning runs.
 * UI only READS - no edits, no overrides.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateRunParams {
    config: {
        maxCycles: number;
        tokensPerCycle: number;
        narrowingRatio: number;
    };
}

export interface CreateCycleParams {
    runId: string;
    cycleIndex: number;
    regime: string;
    regimeConfidence: number;
    accuracy: number;
    baselineRandom: number;
    baselineMomentum: number;
    opportunityScore: number;
    saturationHit: boolean;
    decision: string;
    tokensBefore: number;
    tokensAfter: number;
}

export interface CreateDecisionParams {
    runId: string;
    cycleIndex: number;
    token: string;
    mint: string;
    prediction: string;
    actual: string;
    scoreDelta: number;
    reasons: string[];
    eliminated: boolean;
}

/**
 * Create a new learning run (immutable)
 */
export async function createRun(params: CreateRunParams): Promise<string> {
    const run = await prisma.learningRun.create({
        data: {
            finalVerdict: 'PENDING',
            executionAllowed: false,
            config: params.config,
        },
    });
    console.log(`[DB] Created learning run: ${run.id}`);
    return run.id;
}

/**
 * Complete a learning run with final verdict
 */
export async function completeRun(
    runId: string,
    verdict: string,
    executionAllowed: boolean
): Promise<void> {
    await prisma.learningRun.update({
        where: { id: runId },
        data: {
            endedAt: new Date(),
            finalVerdict: verdict,
            executionAllowed,
        },
    });
    console.log(`[DB] Completed run ${runId}: ${verdict}`);
}

/**
 * Record a learning cycle
 */
export async function recordCycle(params: CreateCycleParams): Promise<void> {
    await prisma.learningCycle.create({
        data: params,
    });
    console.log(`[DB] Recorded cycle ${params.cycleIndex} for run ${params.runId}`);
}

/**
 * Record token decision (batch)
 */
export async function recordDecisions(decisions: CreateDecisionParams[]): Promise<void> {
    if (decisions.length === 0) return;

    await prisma.learningTokenDecision.createMany({
        data: decisions,
    });
    console.log(`[DB] Recorded ${decisions.length} token decisions`);
}

/**
 * Get all runs (for UI)
 */
export async function getRuns(limit: number = 20) {
    return prisma.learningRun.findMany({
        orderBy: { startedAt: 'desc' },
        take: limit,
        include: {
            cycles: true,
            _count: { select: { decisions: true } },
        },
    });
}

/**
 * Get run by ID with full details
 */
export async function getRunById(runId: string) {
    return prisma.learningRun.findUnique({
        where: { id: runId },
        include: {
            cycles: { orderBy: { cycleIndex: 'asc' } },
            decisions: { orderBy: { cycleIndex: 'asc' } },
        },
    });
}

/**
 * Get token decisions for a specific token
 */
export async function getTokenHistory(runId: string, token: string) {
    return prisma.learningTokenDecision.findMany({
        where: { runId, token },
        orderBy: { cycleIndex: 'asc' },
    });
}

export { prisma };
