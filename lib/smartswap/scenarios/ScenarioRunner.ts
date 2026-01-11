/**
 * Multi-Scenario Search Runner
 * 
 * Runs 5 independent searches with different strategic profiles (Conservative → Best-Effort).
 * Returns all results plus a transparently selected "Best Choice".
 */

import {
    ScenarioId,
    ScenarioConfig,
    ScenarioResult,
    ScenarioComparison,
    ScenarioStatus
} from '@/types/ScenarioRunner';
import {
    BrainGoal,
    SearchableToken,
    BrainSearchResult,
    PathState,
    ScenarioType,
    BrainRoadmap
} from '@/types/BrainV2';
import { searchForPath, convertPathToRoadmap } from '@/lib/smartswap/brainv2';

// ... (Existing SCENARIOS config)

// ...


// ============================================================================
// 1. SCENARIO CONFIGURATIONS (Hardcoded Strategies)
// ============================================================================

const SCENARIOS: ScenarioConfig[] = [
    {
        id: ScenarioId.CONSERVATIVE,
        name: 'Conservative',
        description: 'Maximum safety, strictly liquid tokens, tight RTL.',
        maxHops: 3,
        maxPerHopRTL: 2,
        maxTotalRTL: 5,
        allowAlphaTokens: false,
        allowHolds: false,
        biasActive: false,
        constraintRelaxation: false
    },
    {
        id: ScenarioId.BALANCED,
        name: 'Balanced',
        description: 'Smart defaults. Allows some alpha and holds.',
        maxHops: 5,
        maxPerHopRTL: 4,
        maxTotalRTL: 10,
        allowAlphaTokens: true,
        allowHolds: 2.5,
        biasActive: true,
        constraintRelaxation: false
    },
    {
        id: ScenarioId.AGGRESSIVE,
        name: 'Aggressive',
        description: 'Prioritizes upside. Looser constraints for alpha.',
        maxHops: 7,
        maxPerHopRTL: 8,
        maxTotalRTL: 20,
        allowAlphaTokens: 'prioritized',
        allowHolds: true,
        biasActive: true,
        constraintRelaxation: true
    },
    {
        id: ScenarioId.VOLATILITY,
        name: 'Volatility Hunter',
        description: 'Only high-beta alpha tokens. High risk/reward.',
        maxHops: 9,
        maxPerHopRTL: 12,
        maxTotalRTL: 30,
        allowAlphaTokens: 'only',
        allowHolds: true,
        biasActive: true,
        constraintRelaxation: true
    },
    {
        id: ScenarioId.BEST_EFFORT,
        name: 'Best Effort',
        description: 'Find ANY path. Minimal constraints.',
        maxHops: 12, // Cap at 12 to prevent timeout
        maxPerHopRTL: 50, // Effectively unlimited
        maxTotalRTL: 50,
        allowAlphaTokens: true,
        allowHolds: true,
        biasActive: true,
        constraintRelaxation: true
    }
];

// ============================================================================
// 2. RUNNER LOGIC
// ============================================================================

export class ScenarioRunner {

    /**
     * Run all scenarios efficiently
     */
    static async runAll(
        universe: SearchableToken[],
        baseGoal: BrainGoal
    ): Promise<ScenarioComparison> {

        console.log(`[ScenarioRunner] Starting run for ${baseGoal.startAmountSOL} SOL...`);
        const startTime = Date.now();

        // ROI Intent Classifier (Phase 2 Redesign)
        // Calculate requested ROI from goal
        const requestedROI = (baseGoal.targetAmountSOL - baseGoal.startAmountSOL) / baseGoal.startAmountSOL;
        const isHighROI = requestedROI > 0.05; // > 5%

        let activeScenarios = SCENARIOS;

        if (isHighROI) {
            console.log(`[ScenarioRunner] High ROI Intent detected (${(requestedROI * 100).toFixed(1)}%). Switching to Aggressive/Volatility.`);
            // Filter out low-risk scenarios that can't achieve high ROI
            activeScenarios = SCENARIOS.filter(s =>
                s.id !== ScenarioId.CONSERVATIVE &&
                s.id !== ScenarioId.BALANCED
            );
        }

        const results: ScenarioResult[] = [];

        for (const rawConfig of activeScenarios) {
            // Scale hops for High ROI
            // Base hops + (ROI * 10)? e.g. 10% -> +1 hop.
            // User spec: "base + ROI/2"? ROI is e.g. 0.1. base + 0.05? 
            // User likely meant ROI percent or something. 
            // Let's use: if High ROI, boost hops by 2.
            const config = { ...rawConfig };

            if (isHighROI) {
                config.maxHops = Math.min(12, rawConfig.maxHops + 2);
                // Force alpha unlock if not restricted? (Conservative is filtered out anyway)
            }

            results.push(this.runSingleScenario(universe, baseGoal, config, isHighROI));
        }

        const comparison = this.compareResults(results, baseGoal.startAmountSOL, isHighROI);

        console.log(`[ScenarioRunner] Completed in ${Date.now() - startTime}ms. Winner: ${comparison.best.config.name}`);

        return comparison;
    }

    /**
     * Run a single scenario configuration
     */
    private static runSingleScenario(
        universe: SearchableToken[],
        baseGoal: BrainGoal,
        config: ScenarioConfig,
        forceAlpha: boolean = false
    ): ScenarioResult {

        // 1. Filter Universe based on Strategy
        let scenarioUniverse = [...universe];

        // helper to keep essential tokens (start, target, SOL, stables)
        const isEssential = (t: SearchableToken) =>
            t.mint === baseGoal.startToken ||
            t.mint === baseGoal.targetToken ||
            t.symbol === 'SOL' ||
            t.isStable;

        if (config.allowAlphaTokens === false) {
            // If High ROI forced, we technically shouldn't be running strict conservative, 
            // but if we were, we'd honor the config. 
            // Since we filtered SCENARIOS in runAll, this is fine.
            scenarioUniverse = scenarioUniverse.filter(t => !t.isAlpha || isEssential(t));
        } else if (config.allowAlphaTokens === 'only') {
            // Keep ONLY alpha tokens + essentials
            scenarioUniverse = scenarioUniverse.filter(t => t.isAlpha || isEssential(t));
        }
        // If 'prioritized' or 'true', we keep all.

        // Scenario-specific ROI overshoot limits
        const overshootByScenario: Record<ScenarioId, number> = {
            [ScenarioId.CONSERVATIVE]: 1,
            [ScenarioId.BALANCED]: 2,
            [ScenarioId.AGGRESSIVE]: 4,
            [ScenarioId.VOLATILITY]: 6,
            [ScenarioId.BEST_EFFORT]: 100, // Effectively unlimited
            [ScenarioId.TRINITY]: 2,
        };

        // Calculate base ROI intent from goal
        const baseROI = ((baseGoal.targetAmountSOL - baseGoal.startAmountSOL) / baseGoal.startAmountSOL) * 100;

        // 2. Adapt Goal Constraints with ROI Intent
        const scenarioGoal: BrainGoal = {
            ...baseGoal,
            maxHops: config.maxHops,
            maxPerHopRTL: config.maxPerHopRTL,
            maxTotalRTL: config.maxTotalRTL,
            // NEW: ROI Intent with scenario-specific overshoot limit
            roiIntent: {
                targetPct: baseROI,
                tolerancePct: 1, // ±1% is considered "on target"
                maxOvershootPct: overshootByScenario[config.id] || 5,
            },
        };

        // 3. Run Search
        // Note: Real brainv2.ts does not yet accept a separate universe per call easily if it uses global cache?
        // Actually searchForPath takes 'universe' as arg, so it IS independent. Perfect.

        const brainResult = searchForPath(scenarioUniverse, scenarioGoal);

        // 4. Extract Metrics
        let finalAmountSOL = baseGoal.startAmountSOL;
        let roiPct = 0;
        let hops = 0;
        let cumulativeRTL = 0;
        let hasHold = false;
        let found = false;

        if (brainResult.found) {
            found = true;
            finalAmountSOL = brainResult.path.currentValueSOL;
            roiPct = ((finalAmountSOL - baseGoal.startAmountSOL) / baseGoal.startAmountSOL) * 100;
            hops = brainResult.path.hopsUsed;
            cumulativeRTL = brainResult.path.cumulativeRTL;
            // Check for hold - hypothetical, brain v2 result doesn't explicitly flag hold "used" 
            // unless we inspect the path for hold checkpoints.
            // Assuming PathState tracks hold info if we added it.
            // For now, check if holdCheckpoint exists on path.
            // Typings might need update if we strictly check 'hasHold'.
            // BrainSearchResult path is PathState.
            // We'll check if any hop has a hold checkpoint attached? 
            // The path object itself might have it.
            // Let's assume false for now unless we see it.
        } else {
            // If failed, use best effort for metrics if available
            if (brainResult.bestEffort) {
                finalAmountSOL = brainResult.bestEffort.currentValueSOL;
                roiPct = ((finalAmountSOL - baseGoal.startAmountSOL) / baseGoal.startAmountSOL) * 100;
                hops = brainResult.bestEffort.hopsUsed;
                cumulativeRTL = brainResult.bestEffort.cumulativeRTL;
            }
        }

        const explanation: string[] = [];
        if (found) {
            explanation.push(`Found path with ${roiPct.toFixed(2)}% ROI`);
        } else {
            explanation.push(`Failed to find path. Best effort ROI: ${roiPct.toFixed(2)}%`);
        }

        // Generate intent-based roadmap
        // Type narrowing: brainResult.path exists when found=true, bestEffort when found=false
        const pathState = brainResult.found
            ? brainResult.path
            : ('bestEffort' in brainResult ? brainResult.bestEffort : undefined);
        const roadmap = pathState
            ? convertPathToRoadmap(pathState, baseGoal, config.id as ScenarioType)
            : undefined;

        // Count holds from roadmap
        if (roadmap) {
            hasHold = roadmap.summary.holds > 0;
        }

        // Determine Status
        let status: ScenarioStatus = 'VALID';
        let statusReason: string | undefined = undefined;

        if (!brainResult.found) {
            status = 'NO_PATH';
            statusReason = brainResult.reason || 'No viable path found under constraints.';
            if (brainResult.bestEffort) {
                statusReason += ' Showing best effort.';
            }
        }

        // 🔴 CRITICAL: Validate path ends at user's exit token
        if (brainResult.found) {
            const finalToken = brainResult.path.currentToken;
            if (finalToken !== baseGoal.targetToken) {
                // Path found but exits to wrong token - mark as invalid
                status = 'NO_PATH';
                statusReason = `Path exits to ${brainResult.path.currentSymbol} instead of target token`;
                console.warn(`[ScenarioRunner] ❌ ${config.name} exits to wrong token: ${finalToken} !== ${baseGoal.targetToken}`);
            }
        }

        // Check for Preservation Block
        if (roadmap?.blocked) {
            status = 'BLOCKED_PRESERVATION';
            statusReason = roadmap.blockedReason;
        }

        // Check for Low Confidence (if found but weak)
        if (brainResult.found && brainResult.confidence === 'low' && status === 'VALID') {
            status = 'LOW_CONFIDENCE';
        }

        return {
            scenarioId: config.id,
            config,
            status, // NEW
            reason: statusReason, // NEW
            found,
            result: brainResult,
            finalAmountSOL,
            roiPct,
            hops,
            cumulativeRTL,
            hasHold,
            roadmap, // Intent-based roadmap
            explanation
        };
    }

    /**
     * Compare results and pick a winner
     */
    private static compareResults(
        results: ScenarioResult[],
        startAmountSOL: number,
        isHighROI: boolean = false
    ): ScenarioComparison {

        // 1. Filter for VALID scenarios first
        const validScenarios = results.filter(r =>
            r.status === 'VALID' || r.status === 'LOW_CONFIDENCE'
        );

        // 2. Filter for profitable among valid
        // If High ROI, we relax this? No, we still want profit.
        const profitable = validScenarios.filter(r => r.roiPct >= 0.5); // Relaxed to 0.5% for general

        let best: ScenarioResult;
        let winnerReason: string;

        if (profitable.length > 0) {
            // Sort by ROI descending
            profitable.sort((a, b) => b.roiPct - a.roiPct);
            best = profitable[0];

            if (isHighROI) {
                winnerReason = `High ROI Intent: Prioritizing Max Upside (+${best.roiPct.toFixed(2)}% via ${best.config.name}).`;
            } else {
                winnerReason = `Highest ROI (+${best.roiPct.toFixed(2)}%) among profitable scenarios.`;
            }
        } else if (validScenarios.length > 0) {
            // No profitable but some valid? Pick best valid by amount
            const sortedByAmount = [...validScenarios].sort((a, b) => b.finalAmountSOL - a.finalAmountSOL);
            best = sortedByAmount[0];
            winnerReason = `Best valid option (ROI ${best.roiPct.toFixed(2)}%).`;
        } else {
            // No valid paths at all (All Blocked or No Path)
            // Fallback: Pick result with highest final amount (least loss) to show "Best Effort"
            const sortedByAmount = [...results].sort((a, b) => b.finalAmountSOL - a.finalAmountSOL);
            best = sortedByAmount[0];

            if (best.status === 'BLOCKED_PRESERVATION') {
                winnerReason = `Warning: All scenarios blocked by Preservation Mode. Showing best excluded path.`;
            } else {
                winnerReason = `No viable paths found. Best effort shown.`;
            }
        }

        return {
            best,
            all: results,
            winnerReason
        };
    }
}
