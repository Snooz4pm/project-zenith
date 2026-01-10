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
    ScenarioComparison
} from '@/types/ScenarioRunner';
import {
    BrainGoal,
    SearchableToken,
    BrainSearchResult,
    PathState
} from '@/types/BrainV2';
import { searchForPath } from '@/lib/smartswap/brainv2';

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

        // Run specific scenarios in parallel? 
        // JS is single-threaded but async. 
        // Since searchForPath is heavy CPU (sync), they will run sequentially effectively.
        // But we can pretend structure for now.

        const results: ScenarioResult[] = [];

        for (const config of SCENARIOS) {
            results.push(this.runSingleScenario(universe, baseGoal, config));
        }

        const comparison = this.compareResults(results, baseGoal.startAmountSOL);

        console.log(`[ScenarioRunner] Completed in ${Date.now() - startTime}ms. Winner: ${comparison.best.config.name}`);

        return comparison;
    }

    /**
     * Run a single scenario configuration
     */
    private static runSingleScenario(
        universe: SearchableToken[],
        baseGoal: BrainGoal,
        config: ScenarioConfig
    ): ScenarioResult {

        // 1. Filter Universe based on Strategy
        let scenarioUniverse = [...universe];

        if (config.allowAlphaTokens === false) {
            // Remove alpha tokens
            scenarioUniverse = scenarioUniverse.filter(t => !t.isAlpha);
        } else if (config.allowAlphaTokens === 'only') {
            // Keep ONLY alpha tokens (plus staples for routing if needed, but let's be strict for VOLATILITY)
            // Note: Might need stables/SOL to route. 
            // Let's keep IS_ALPHA OR IS_STABLE OR IS_MAJOR to ensure connectivity?
            // "Volatility Hunter" usually implies finding alpha.
            // Strict interpretation: isAlpha tokens only.
            scenarioUniverse = scenarioUniverse.filter(t => t.isAlpha || t.symbol === 'SOL' || t.isStable);
        }

        // 2. Adapt Goal Constraints
        const scenarioGoal: BrainGoal = {
            ...baseGoal,
            maxHops: config.maxHops,
            maxPerHopRTL: config.maxPerHopRTL,
            maxTotalRTL: config.maxTotalRTL,
            // We don't pass 'biasActive' etc to BrainGoal yet as BrainV2 doesn't expect them in the type
            // They are handled by how we construct the universe or constraints here.
            // Implementation Note: BrainV2 searchForPath uses 'SearchableToken' biases if present.
            // If config.biasActive is true, we assume PredictiveEngine has populated biases on tokens.
            // If false, we might want to clear them? 
            // For MVP, we stick to constraint modification.
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
            finalAmountSOL = brainResult.path.currentAmountSOL;
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
                finalAmountSOL = brainResult.bestEffort.currentAmountSOL;
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

        return {
            scenarioId: config.id,
            config,
            found,
            result: brainResult,
            finalAmountSOL,
            roiPct,
            hops,
            cumulativeRTL,
            hasHold, // Placeholder
            explanation
        };
    }

    /**
     * Compare results and pick a winner
     */
    private static compareResults(
        results: ScenarioResult[],
        startAmountSOL: number
    ): ScenarioComparison {

        // 1. Filter for profitable paths (ROI >= 1%)
        const profitable = results.filter(r => r.found && r.roiPct >= 1.0);

        let best: ScenarioResult;
        let winnerReason: string;

        if (profitable.length > 0) {
            // Sort by ROI descending
            profitable.sort((a, b) => b.roiPct - a.roiPct);
            best = profitable[0];
            winnerReason = `Highest ROI (+${best.roiPct.toFixed(2)}%) among profitable scenarios.`;
        } else {
            // No profitable paths found?
            // Fallback: Pick result with highest final amount (least loss)
            // Sort all by finalAmountSOL descending
            const sortedByAmount = [...results].sort((a, b) => b.finalAmountSOL - a.finalAmountSOL);
            best = sortedByAmount[0];

            if (best.roiPct >= 0) {
                winnerReason = `positive return (+${best.roiPct.toFixed(2)}%) but below 1% threshold.`;
            } else {
                winnerReason = `Loss minimization (ROI ${best.roiPct.toFixed(2)}%). Best available option.`;
            }
        }

        // Special case: If Conservative found a path and it's close to best (within 10%), prefer safety?
        // User spec: "profitable (>=1% ROI), then select best by ROI if any; otherwise, best by final SOL"
        // We stick to the spec.

        return {
            best,
            all: results,
            winnerReason
        };
    }
}
