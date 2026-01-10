/**
 * Smart Swap Brain v2 - Beam Search Pathfinder
 *
 * Graph search engine for token liquidity graph.
 * Uses beam search to find paths from SOL → target SOL amount.
 *
 * HONEST: Most searches will fail. That's a feature.
 */

import {
    BrainGoal,
    PathState,
    PathHop,
    BrainSearchResult,
    SearchableToken,
    SEARCH_CONFIG,
    HEURISTIC_WEIGHTS,
} from '@/types/BrainV2';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const STABLECOINS = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'FRAX'];

/**
 * Check if token is a stablecoin
 */
function isStablecoin(symbol: string): boolean {
    return STABLECOINS.includes(symbol.toUpperCase());
}

/**
 * Count how many times a specific pair (from → to) appears in path
 */
function countPairOccurrences(path: PathHop[], fromMint: string, toMint: string): number {
    return path.filter(h => h.fromToken === fromMint && h.toToken === toMint).length;
}

/**
 * Heuristic Score - THE NEURAL PART
 *
 * Decides which paths survive beam search.
 */
function calculateHeuristicScore(state: PathState, goal: BrainGoal, alphaScore: number = 0): number {
    // Growth component (log scale to avoid explosion)
    const growthRatio = state.currentAmountSOL / goal.startAmountSOL;
    const growthScore = Math.log(growthRatio) * HEURISTIC_WEIGHTS.growthMultiplier;

    // Risk penalty (cumulative RTL)
    const rtlPenalty = state.cumulativeRTL * HEURISTIC_WEIGHTS.rtlPenalty;

    // Hop penalty (prevents endless looping)
    const hopPenalty = state.hopsUsed * HEURISTIC_WEIGHTS.hopPenalty;

    // Alpha momentum boost (rewards volatility at early hops)
    const alphaMomentumBoost = alphaScore * HEURISTIC_WEIGHTS.alphaMomentumBoost;

    // Alpha fuel boost after hop 2 (encourages breakout to alpha tokens)
    let alphaFuelBoost = 0;
    if (state.hopsUsed >= 2 && alphaScore > 0.3) {
        alphaFuelBoost = 0.2 * alphaScore; // 20% boost scaled by alpha
    }

    const score = growthScore - rtlPenalty - hopPenalty + alphaMomentumBoost + alphaFuelBoost;

    return score;
}

/**
 * Check if expanding this path violates hard rules
 * HOP-AWARE FILTERING: early hops = safe fuel, mid hops = alpha allowed
 */
function violatesHardRules(
    currentState: PathState,
    candidateToken: SearchableToken,
    goal: BrainGoal
): { violated: boolean; reason?: string } {
    // 1. Same token twice in a row
    if (currentState.path.length > 0) {
        const lastHop = currentState.path[currentState.path.length - 1];
        if (lastHop.toToken === candidateToken.mint) {
            return { violated: true, reason: 'Same token twice in a row' };
        }
    }

    // 2. Stable → Stable forbidden
    if (currentState.currentSymbol && isStablecoin(currentState.currentSymbol)) {
        if (isStablecoin(candidateToken.symbol)) {
            return { violated: true, reason: 'Stable → Stable forbidden' };
        }
    }

    // === HOP-AWARE FILTERING ===

    // 3. Early hops (0-1): Block REJECTED tokens - need safe fuel
    if (currentState.hopsUsed < 2 && candidateToken.tier === 'REJECTED') {
        return { violated: true, reason: 'Unsafe token too early (hop < 2)' };
    }

    // 4. Per-hop RTL limit - RELAXED for alpha after hop 2
    const isAlphaEligible = candidateToken.isAlpha && currentState.hopsUsed >= 2;
    const effectiveMaxRTL = isAlphaEligible ? 12 : goal.maxPerHopRTL; // 12% for alpha, normal for others

    if (candidateToken.roundTripLoss > effectiveMaxRTL) {
        return { violated: true, reason: `Per-hop RTL ${candidateToken.roundTripLoss.toFixed(1)}% > ${effectiveMaxRTL}%` };
    }

    // 5. Liquidity check - RELAXED for alpha tokens
    const minLiquidity = isAlphaEligible ? 0.1 : SEARCH_CONFIG.MIN_LIQUIDITY_SCORE;
    if (candidateToken.liquidityScore < minLiquidity) {
        return { violated: true, reason: 'Liquidity too low' };
    }

    // 6. After hop 5, need some alpha (unless it's a stable router)
    if (currentState.hopsUsed >= 5) {
        if (!isStablecoin(candidateToken.symbol)) {
            if ((candidateToken.alphaScore ?? 0) < SEARCH_CONFIG.MIN_ALPHA_SCORE_AFTER_HOP_5) {
                return { violated: true, reason: 'No alpha momentum after hop 5' };
            }
        }
    }

    // 7. Cumulative RTL would exceed limit
    const projectedRTL = currentState.cumulativeRTL + candidateToken.roundTripLoss;
    if (projectedRTL > goal.maxTotalRTL) {
        return { violated: true, reason: `Cumulative RTL ${projectedRTL.toFixed(1)}% > ${goal.maxTotalRTL}%` };
    }

    return { violated: false };
}

/**
 * Expand a path state to generate next-hop candidates
 */
function expandPath(
    currentState: PathState,
    universe: SearchableToken[],
    goal: BrainGoal
): PathState[] {
    const newStates: PathState[] = [];

    for (const candidate of universe) {
        // Skip if same as current token
        if (candidate.mint === currentState.currentToken) continue;

        // Skip if no route
        if (!candidate.hasRoute) continue;

        // Check hard rules
        const { violated, reason } = violatesHardRules(currentState, candidate, goal);
        if (violated) continue;

        // Estimate new amount (simplified - real implementation would use Jupiter quotes)
        // For now: assume we lose RTL% on this hop
        const lossMultiplier = 1 - candidate.roundTripLoss / 100;
        const newAmountSOL = currentState.currentAmountSOL * lossMultiplier;

        // Build hop
        const hop: PathHop = {
            fromToken: currentState.currentToken,
            fromSymbol: currentState.currentSymbol,
            toToken: candidate.mint,
            toSymbol: candidate.symbol,
            estimatedInSOL: currentState.currentAmountSOL,
            estimatedOutSOL: newAmountSOL,
            slippage: candidate.roundTripLoss, // simplified
            hopRTL: candidate.roundTripLoss,
        };

        // === ESCAPE MECHANICS ===

        // 1. Loop Penalty - check if this pair was used before
        const pairCount = countPairOccurrences(currentState.path, currentState.currentToken, candidate.mint);
        if (pairCount > 1) {
            // HARD REJECT: pair used more than once
            continue;
        }

        // 2. Novelty Pressure - check if token was visited before
        const visitedSet = new Set(currentState.visitedTokens);
        const isRevisit = visitedSet.has(candidate.mint);
        visitedSet.add(candidate.mint);

        // Build new state
        const newState: PathState = {
            currentToken: candidate.mint,
            currentSymbol: candidate.symbol,
            currentAmountSOL: newAmountSOL,
            hopsUsed: currentState.hopsUsed + 1,
            cumulativeRTL: currentState.cumulativeRTL + candidate.roundTripLoss,
            path: [...currentState.path, hop],
            visitedTokens: Array.from(visitedSet),
            score: 0, // will be calculated below
        };

        // Calculate heuristic score
        let score = calculateHeuristicScore(newState, goal, candidate.alphaScore ?? 0);

        // Apply escape penalties
        if (pairCount === 1) {
            score *= 0.85; // Soft penalty: pair seen once before
        }
        if (isRevisit) {
            score *= 0.9; // Novelty penalty: token revisited
        }

        newState.score = score;
        newStates.push(newState);
    }

    return newStates;
}

/**
 * Determine confidence level based on path characteristics
 */
function calculateConfidence(state: PathState): 'low' | 'medium' | 'high' {
    if (state.hopsUsed <= 3 && state.cumulativeRTL <= 10) {
        return 'high';
    } else if (state.hopsUsed <= 7 && state.cumulativeRTL <= 15) {
        return 'medium';
    } else {
        return 'low';
    }
}

/**
 * Generate warnings based on path characteristics
 */
function generateWarnings(state: PathState): string[] {
    const warnings: string[] = [];

    if (state.hopsUsed > 10) {
        warnings.push('⚠ Long path - each hop requires manual signing');
    }

    if (state.cumulativeRTL > 15) {
        warnings.push('⚠ High cumulative RTL - path is fragile');
    }

    const stableHops = state.path.filter(h => isStablecoin(h.toSymbol));
    if (stableHops.length > 2) {
        warnings.push('⚠ Multiple stable hops - momentum may decay');
    }

    return warnings;
}

/**
 * MAIN BEAM SEARCH FUNCTION
 *
 * Returns:
 * - Found path if target is reachable
 * - "Not found" with best effort if target not reachable
 */
export function searchForPath(
    universe: SearchableToken[],
    goal: BrainGoal
): BrainSearchResult {
    console.log(`[Brain v2] Starting beam search: ${goal.startAmountSOL} SOL → ${goal.targetAmountSOL} SOL`);
    console.log(`[Brain v2] Max hops: ${goal.maxHops}, Max RTL: ${goal.maxTotalRTL}%`);

    let exploredPaths = 0;

    // Initialize with SOL starting state
    let activePaths: PathState[] = [
        {
            currentToken: SOL_MINT,
            currentSymbol: 'SOL',
            currentAmountSOL: goal.startAmountSOL,
            hopsUsed: 0,
            cumulativeRTL: 0,
            path: [],
            visitedTokens: [SOL_MINT], // Start with SOL visited
            score: 0,
        },
    ];

    let bestEffort: PathState | undefined = undefined;

    // Beam search loop
    for (let hop = 1; hop <= goal.maxHops; hop++) {
        const allNewPaths: PathState[] = [];

        // Expand all active paths
        for (const currentPath of activePaths) {
            const expansions = expandPath(currentPath, universe, goal);
            allNewPaths.push(...expansions);
            exploredPaths += expansions.length;
        }

        // No new paths? Dead end
        if (allNewPaths.length === 0) {
            console.log(`[Brain v2] Dead end at hop ${hop}`);
            return {
                found: false,
                reason: 'No viable paths found under current constraints',
                bestEffort,
                exploredPaths,
            };
        }

        // Check if any path reached target
        for (const path of allNewPaths) {
            // Must return to SOL to count as "reached"
            if (path.currentToken === SOL_MINT && path.currentAmountSOL >= goal.targetAmountSOL) {
                console.log(`[Brain v2] ✓ Target reached at hop ${hop}!`);
                console.log(`[Brain v2]   Final amount: ${path.currentAmountSOL.toFixed(6)} SOL`);
                console.log(`[Brain v2]   Cumulative RTL: ${path.cumulativeRTL.toFixed(1)}%`);

                return {
                    found: true,
                    path,
                    confidence: calculateConfidence(path),
                    warnings: generateWarnings(path),
                    reachableAtHop: hop,
                };
            }
        }

        // Sort by score and keep top K (beam width)
        allNewPaths.sort((a, b) => b.score - a.score);
        activePaths = allNewPaths.slice(0, SEARCH_CONFIG.BEAM_WIDTH);

        // Track best effort (closest to target)
        const closest = activePaths[0];
        if (!bestEffort || closest.currentAmountSOL > bestEffort.currentAmountSOL) {
            bestEffort = closest;
        }

        console.log(`[Brain v2] Hop ${hop}: ${allNewPaths.length} expansions, kept top ${activePaths.length}`);
        console.log(`[Brain v2]   Best: ${activePaths[0].currentSymbol} @ ${activePaths[0].currentAmountSOL.toFixed(6)} SOL (score: ${activePaths[0].score.toFixed(2)})`);
    }

    // Exhausted max hops without reaching target
    console.log(`[Brain v2] Target not reached after ${goal.maxHops} hops`);
    console.log(`[Brain v2] Best effort: ${bestEffort?.currentAmountSOL.toFixed(6)} SOL (${((bestEffort?.currentAmountSOL ?? 0) / goal.targetAmountSOL * 100).toFixed(1)}% of target)`);

    return {
        found: false,
        reason: `Target not reachable within ${goal.maxHops} hops under current market conditions`,
        bestEffort,
        exploredPaths,
    };
}
