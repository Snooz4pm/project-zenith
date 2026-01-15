/**
 * Capital Lifecycle Manager
 * 
 * Implements the 5-Phase Capital Lifecycle:
 * OBSERVING → SEEDING → SCALING → HARVESTING → RECYCLE
 * 
 * Each phase has strict promotion/kill rules with mathematical formulas.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================================================
// TYPES
// =============================================================================

export type LifecyclePhase = 'OBSERVING' | 'SEEDING' | 'SCALING' | 'HARVESTING' | 'RECYCLE';

export interface LifecycleConfig {
    // Risk Management
    maxRiskPct: number;          // Rmax: Max risk per opportunity (default 2%)
    seedAllocationPct: number;   // Sseed: Seed allocation (default 15%)
    scaleStepPct: number;        // Sscale: Scale step (default 25%)

    // Seeding Thresholds
    maxSlippagePct: number;      // Max allowed slippage (default 2%)
    minConfidence: number;       // Min physics confidence (default 0.6)

    // Scaling Thresholds
    minPnlForScale: number;      // Min unrealized PnL to scale (default 1.5%)
    maxDrawdownPct: number;      // Max drawdown during scale (default 0.8%)

    // Harvesting Thresholds
    harvestThresholdPct: number; // Min PnL to harvest (default 8%)
    harvestPct: number;          // % of position to harvest (default 50%)
    trailingStopPct: number;     // Emergency exit (default 5%)

    // Recycle
    reinvestPct: number;         // % of profit to reinvest (default 70%)
    cooldownMs: number;          // Cooldown duration (default 5 min)
}

export const DEFAULT_LIFECYCLE_CONFIG: LifecycleConfig = {
    maxRiskPct: 0.02,
    seedAllocationPct: 0.15,
    scaleStepPct: 0.25,
    maxSlippagePct: 0.02,
    minConfidence: 0.6,
    minPnlForScale: 0.015,
    maxDrawdownPct: 0.008,
    harvestThresholdPct: 0.08,
    harvestPct: 0.50,
    trailingStopPct: 0.05,
    reinvestPct: 0.70,
    cooldownMs: 5 * 60 * 1000,
};

// =============================================================================
// FORMULA IMPLEMENTATIONS
// =============================================================================

/**
 * Calculate seed size: min(P × Sseed, E × Rmax)
 */
export function calculateSeedSize(
    freeCapital: number,
    totalEquity: number,
    config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): number {
    const byAllocation = freeCapital * config.seedAllocationPct;
    const byRisk = totalEquity * config.maxRiskPct;
    return Math.min(byAllocation, byRisk);
}

/**
 * Calculate scale increment: min(P × Sscale, E × Rmax)
 */
export function calculateScaleAdd(
    freeCapital: number,
    totalEquity: number,
    config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): number {
    const byStep = freeCapital * config.scaleStepPct;
    const byRisk = totalEquity * config.maxRiskPct;
    return Math.min(byStep, byRisk);
}

/**
 * Calculate harvest amount: Position × HarvestPct
 */
export function calculateHarvestAmount(
    positionSize: number,
    config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): { harvestAmount: number; moonbagSize: number } {
    const harvestAmount = positionSize * config.harvestPct;
    const moonbagSize = positionSize - harvestAmount;
    return { harvestAmount, moonbagSize };
}

/**
 * Calculate recycle capital: RealizedProfit × ReinvestPct
 */
export function calculateRecycleCapital(
    realizedProfit: number,
    config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): number {
    return realizedProfit * config.reinvestPct;
}

// =============================================================================
// PHASE TRANSITION LOGIC
// =============================================================================

export interface PhaseTransitionResult {
    newPhase: LifecyclePhase;
    action: 'HOLD' | 'SEED' | 'SCALE' | 'HARVEST' | 'EXIT' | 'RECYCLE';
    amount?: number;
    reason: string;
    blacklist?: boolean;
}

/**
 * Evaluate OBSERVING → SEEDING transition
 */
export function evaluateObserving(
    shadowPnl: number,
    confidence: number,
    blacklisted: boolean,
    freeCapital: number,
    totalEquity: number,
    config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): PhaseTransitionResult {
    if (blacklisted) {
        return { newPhase: 'OBSERVING', action: 'HOLD', reason: 'Blacklisted' };
    }

    if (shadowPnl > 0 && confidence >= config.minConfidence) {
        const seedSize = calculateSeedSize(freeCapital, totalEquity, config);
        return {
            newPhase: 'SEEDING',
            action: 'SEED',
            amount: seedSize,
            reason: `Promotion: shadow_pnl=${shadowPnl.toFixed(2)}%, conf=${confidence.toFixed(2)}`
        };
    }

    return { newPhase: 'OBSERVING', action: 'HOLD', reason: 'Observing' };
}

/**
 * Evaluate SEEDING → SCALING or EXIT
 */
export function evaluateSeeding(
    slippage: number,
    pnl: number,
    drawdown: number,
    freeCapital: number,
    totalEquity: number,
    config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): PhaseTransitionResult {
    // Failure: slippage > 2%
    if (slippage > config.maxSlippagePct) {
        return {
            newPhase: 'OBSERVING',
            action: 'EXIT',
            reason: `FAKE liquidity: slippage=${(slippage * 100).toFixed(2)}%`,
            blacklist: true
        };
    }

    // Promotion: PnL positive + drawdown acceptable
    if (pnl >= config.minPnlForScale && drawdown < config.maxDrawdownPct) {
        const scaleAdd = calculateScaleAdd(freeCapital, totalEquity, config);
        return {
            newPhase: 'SCALING',
            action: 'SCALE',
            amount: scaleAdd,
            reason: `Scaling: pnl=${(pnl * 100).toFixed(2)}%, dd=${(drawdown * 100).toFixed(2)}%`
        };
    }

    return { newPhase: 'SEEDING', action: 'HOLD', reason: 'Seeding: monitoring' };
}

/**
 * Evaluate SCALING → HARVESTING or reduce
 */
export function evaluateScaling(
    pnl: number,
    drawdown: number,
    volatilitySpike: boolean,
    positionSize: number,
    config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): PhaseTransitionResult {
    // Abort: drawdown spike
    if (drawdown >= config.maxDrawdownPct || volatilitySpike) {
        return {
            newPhase: 'SEEDING',
            action: 'EXIT',
            amount: positionSize * 0.5, // Reduce position
            reason: `Scaling abort: dd=${(drawdown * 100).toFixed(2)}%`
        };
    }

    // Promotion: hit harvest threshold
    if (pnl >= config.harvestThresholdPct) {
        const { harvestAmount } = calculateHarvestAmount(positionSize, config);
        return {
            newPhase: 'HARVESTING',
            action: 'HARVEST',
            amount: harvestAmount,
            reason: `Harvest trigger: pnl=${(pnl * 100).toFixed(2)}%`
        };
    }

    return { newPhase: 'SCALING', action: 'HOLD', reason: 'Scaling: monitoring' };
}

/**
 * Evaluate HARVESTING → RECYCLE
 */
export function evaluateHarvesting(
    harvestComplete: boolean,
    pnlDropped: boolean,
    positionSize: number,
    config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): PhaseTransitionResult {
    // Emergency: trailing stop hit
    if (pnlDropped) {
        return {
            newPhase: 'RECYCLE',
            action: 'EXIT',
            amount: positionSize,
            reason: 'Emergency exit: trailing stop'
        };
    }

    // Complete: move to recycle
    if (harvestComplete) {
        return {
            newPhase: 'RECYCLE',
            action: 'RECYCLE',
            reason: 'Harvest complete'
        };
    }

    return { newPhase: 'HARVESTING', action: 'HOLD', reason: 'Harvesting: in progress' };
}

/**
 * Evaluate RECYCLE → OBSERVING
 */
export function evaluateRecycle(
    cooldownUntil: Date | null,
    realizedProfit: number,
    highVolatility: boolean,
    config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): PhaseTransitionResult {
    const now = new Date();

    // Safety: delay if volatile
    if (highVolatility) {
        return { newPhase: 'RECYCLE', action: 'HOLD', reason: 'Recycle delayed: high volatility' };
    }

    // Cooldown check
    if (cooldownUntil && now < cooldownUntil) {
        const remaining = Math.ceil((cooldownUntil.getTime() - now.getTime()) / 1000);
        return { newPhase: 'RECYCLE', action: 'HOLD', reason: `Cooldown: ${remaining}s` };
    }

    // Reinject capital
    const recycleAmount = calculateRecycleCapital(realizedProfit, config);
    return {
        newPhase: 'OBSERVING',
        action: 'RECYCLE',
        amount: recycleAmount,
        reason: `Capital recycled: ${recycleAmount.toFixed(4)} SOL`
    };
}

// =============================================================================
// DB LEDGER HELPERS
// =============================================================================

export async function recordCapitalMovement(
    type: 'seed' | 'scale' | 'harvest' | 'recycle' | 'fee' | 'loss' | 'profit',
    amount: number,
    fromBucket: string,
    toBucket: string,
    opportunityId?: string,
    reason?: string
) {
    return prisma.capitalMovement.create({
        data: {
            type,
            amount,
            fromBucket,
            toBucket,
            opportunityId,
            reason
        }
    });
}

export async function checkInvariant(): Promise<boolean> {
    const portfolio = await prisma.enginePortfolio.findUnique({ where: { id: 'main' } });
    if (!portfolio) return false;

    const expectedEquity = portfolio.freeCapital + portfolio.allocatedCapital;
    const actualEquity = portfolio.initialCapital + portfolio.realizedPnl;

    const drift = Math.abs(expectedEquity - actualEquity);
    return drift < 0.0001; // Tolerance for float precision
}
