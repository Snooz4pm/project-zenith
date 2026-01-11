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
    BrainRoadmap,
    RoadmapStep,
    ConfidenceLevel,
    ScenarioType,
    ProtectionClass,
    GoalAlignment,
    GoalAlignmentStatus,
} from '@/types/BrainV2';
import { estimateTokenTax } from './tax';
import { SmartToken } from '@/types/SmartToken';
import { pathExplainer } from './context/PathExplainer';
import { computeHoldCheckpoint, type HoldSignalInput } from './hold/holdSignals';
import {
    buildExitReachability,
    buildAdjacencyGraph,
    checkExitReachability,
    ExitReachability
} from './exitReachability';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const STABLECOINS = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'FRAX'];

/**
 * ADAPTIVE CONSTRAINTS - Loosen limits based on target ambition
 *
 * If user wants 10x return (0.1 → 1.0 SOL), the brain MUST take more risk.
 * Otherwise it will never find profitable paths.
 *
 * Returns effective constraints based on target/start ratio.
 */
function calculateAdaptiveConstraints(goal: BrainGoal) {
    const ambitionRatio = goal.targetAmountSOL / goal.startAmountSOL;

    // Logarithmic scaling factor
    // 1.2x target → 0.0 adjustment (conservative)
    // 2x target → ~0.3 adjustment
    // 5x target → ~0.7 adjustment
    // 10x target → ~1.0 adjustment (maximum loosening)
    const ambitionFactor = Math.min(1.0, Math.max(0, Math.log(ambitionRatio) / Math.log(10)));

    // Base constraints (from goal)
    const baseMaxHops = goal.maxHops || 20;
    const baseMaxTotalRTL = goal.maxTotalRTL || 20;
    const baseMaxPerHopRTL = goal.maxPerHopRTL || 5;

    // Adaptive increases (up to 50% more for ambitious targets)
    const effectiveMaxHops = Math.floor(baseMaxHops * (1 + ambitionFactor * 0.5));
    const effectiveMaxTotalRTL = baseMaxTotalRTL * (1 + ambitionFactor * 0.5);
    const effectiveMaxPerHopRTL = baseMaxPerHopRTL * (1 + ambitionFactor * 0.3);

    console.log(`[Adaptive Constraints]`);
    console.log(`  Ambition: ${ambitionRatio.toFixed(2)}x (factor: ${ambitionFactor.toFixed(2)})`);
    console.log(`  Max Hops: ${baseMaxHops} → ${effectiveMaxHops}`);
    console.log(`  Max Total RTL: ${baseMaxTotalRTL}% → ${effectiveMaxTotalRTL.toFixed(1)}%`);
    console.log(`  Max Per-Hop RTL: ${baseMaxPerHopRTL}% → ${effectiveMaxPerHopRTL.toFixed(1)}%`);

    return {
        maxHops: effectiveMaxHops,
        maxTotalRTL: effectiveMaxTotalRTL,
        maxPerHopRTL: effectiveMaxPerHopRTL,
        ambitionFactor, // Can be used for other adjustments
    };
}

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
 * CORRECTED: Estimate actual swap outcome with potential gains
 *
 * Key insight: RTL is what you lose if you swap back immediately
 * Actual swap can be profitable based on token momentum
 */
interface SwapEstimate {
    estimatedOutSOL: number;
    priceImpact: number; // % price impact for this swap
    hopRTL: number; // RTL if you immediately swapped back
    expectedReturn: number; // % gain/loss
}

function estimateSwapOutcome(
    currentState: PathState,
    candidate: SearchableToken
): SwapEstimate {
    // Get current amount in SOL
    const currentAmount = currentState.currentValueSOL;

    // Base price impact based on liquidity
    // High liquidity = low impact (0.5-2%)
    // Low liquidity = high impact (2-8%)
    const liquidityFactor = Math.max(0.1, 1 - candidate.liquidityScore);
    const baseImpact = 0.5 + (liquidityFactor * 7.5); // 0.5% to 8%

    // Alpha momentum can overcome price impact
    const alphaBoost = (candidate.alphaScore || 0) * 0.08; // Up to 8% boost

    // Calculate expected return
    // Can be positive (gain) or negative (loss)
    const expectedReturnPercent = alphaBoost - (baseImpact / 100);

    // Calculate new amount (can be higher or lower)
    const newAmountSOL = currentAmount * (1 + expectedReturnPercent);

    // RTL is informational - what you'd lose if swapping back immediately
    const hopRTL = candidate.roundTripLoss;

    return {
        estimatedOutSOL: newAmountSOL,
        priceImpact: baseImpact,
        hopRTL,
        expectedReturn: expectedReturnPercent * 100, // as percentage
    };
}

// ============================================================================
// GOAL ALIGNMENT (Mandatory Explanation)
// ============================================================================

const HOLDABLE_ROI_GAP_MAX = 6; // Max % gap that can be bridged with hold
const MIN_USEFUL_ROI_PROGRESS = 0.3; // 30% of target = minimum useful path

/**
 * Compute Goal Alignment - Mandatory explanation for every result
 * 
 * Determines:
 * - Does path end at exit token?
 * - Is ROI target reached?
 * - Is hold required to bridge gap?
 * - Why is goal unreachable (if so)?
 */
function computeGoalAlignment(
    path: PathState | undefined,
    goal: BrainGoal,
    universe: SearchableToken[]
): GoalAlignment {
    const targetRoiPct = goal.roiIntent?.targetPct ??
        ((goal.targetAmountSOL - goal.startAmountSOL) / goal.startAmountSOL) * 100;

    // No path found
    if (!path) {
        return {
            status: 'UNREACHABLE',
            explanation: 'No viable path found under current constraints.',
            currentRoiPct: 0,
            targetRoiPct,
            remainingGapPct: targetRoiPct,
            endsAtExitToken: false,
            exitToken: goal.targetToken,
            holdRequired: false,
        };
    }

    const currentRoiPct = ((path.currentValueSOL - goal.startAmountSOL) / goal.startAmountSOL) * 100;
    const remainingGapPct = targetRoiPct - currentRoiPct;
    const endsAtExitToken = path.currentToken === goal.targetToken;

    // Check exit token first (non-negotiable)
    if (!endsAtExitToken) {
        // Path doesn't end at exit token - this is PARTIAL at best
        const roiProgress = currentRoiPct / targetRoiPct;

        if (roiProgress < MIN_USEFUL_ROI_PROGRESS) {
            return {
                status: 'UNREACHABLE',
                explanation: `Path ends at ${path.currentSymbol} instead of target token. ROI progress insufficient (${currentRoiPct.toFixed(1)}% of ${targetRoiPct.toFixed(1)}% target).`,
                currentRoiPct,
                targetRoiPct,
                remainingGapPct,
                endsAtExitToken: false,
                exitToken: goal.targetToken,
                actualExitToken: path.currentToken,
                holdRequired: false,
            };
        }

        return {
            status: 'PARTIAL',
            explanation: `Path ends at ${path.currentSymbol} instead of ${goal.targetToken}. This is intermediate progress only.`,
            currentRoiPct,
            targetRoiPct,
            remainingGapPct,
            endsAtExitToken: false,
            exitToken: goal.targetToken,
            actualExitToken: path.currentToken,
            holdRequired: false,
        };
    }

    // Path ends at correct exit token - check ROI
    const tolerance = goal.roiIntent?.tolerancePct ?? 1;

    if (remainingGapPct <= tolerance) {
        // Target reached (within tolerance)
        return {
            status: 'REACHED',
            explanation: `Target ROI of ${targetRoiPct.toFixed(1)}% achieved (actual: ${currentRoiPct.toFixed(1)}%).`,
            currentRoiPct,
            targetRoiPct,
            remainingGapPct,
            endsAtExitToken: true,
            exitToken: goal.targetToken,
            holdRequired: false,
        };
    }

    if (remainingGapPct > 0 && remainingGapPct <= HOLDABLE_ROI_GAP_MAX) {
        // Gap exists but is within holdable range
        // Check if token has momentum signals
        const exitTokenData = universe.find(t => t.mint === goal.targetToken);
        const hasMomentum = exitTokenData &&
            ((exitTokenData.alphaScore ?? 0) > 0.3 || (exitTokenData.volatility ?? 0) > 0.1);

        if (hasMomentum) {
            return {
                status: 'REQUIRES_HOLD',
                explanation: `Path achieves ${currentRoiPct.toFixed(1)}% ROI, ${remainingGapPct.toFixed(1)}% short of target. Hold recommended to bridge gap.`,
                currentRoiPct,
                targetRoiPct,
                remainingGapPct,
                endsAtExitToken: true,
                exitToken: goal.targetToken,
                holdRequired: true,
                holdReason: `${path.currentSymbol} shows momentum signals. Hold may close remaining ${remainingGapPct.toFixed(1)}% gap.`,
            };
        }
    }

    // Gap too large or no momentum
    if (remainingGapPct > HOLDABLE_ROI_GAP_MAX) {
        return {
            status: 'UNREACHABLE',
            explanation: `Target ROI of ${targetRoiPct.toFixed(1)}% cannot be reached. Best achievable: ${currentRoiPct.toFixed(1)}% (gap: ${remainingGapPct.toFixed(1)}% exceeds holdable limit of ${HOLDABLE_ROI_GAP_MAX}%).`,
            currentRoiPct,
            targetRoiPct,
            remainingGapPct,
            endsAtExitToken: true,
            exitToken: goal.targetToken,
            holdRequired: false,
        };
    }

    // Partial success - on target token but ROI gap exists without momentum
    return {
        status: 'PARTIAL',
        explanation: `Path achieves ${currentRoiPct.toFixed(1)}% ROI at ${path.currentSymbol}, ${remainingGapPct.toFixed(1)}% short of target. No strong momentum signals to suggest hold.`,
        currentRoiPct,
        targetRoiPct,
        remainingGapPct,
        endsAtExitToken: true,
        exitToken: goal.targetToken,
        holdRequired: false,
    };
}
/**
 * Heuristic Score - THE NEURAL PART
 *
 * Decides which paths survive beam search.
 *
 * V2.6 CRITICAL FIX: ROI is now a TARGET, not a maximum.
 * Paths that overshoot the target ROI are PENALIZED, not rewarded.
 *
 * Score components:
 * 1. ROI Distance: How close to target? (±tolerance = perfect)
 * 2. Capital preservation: Don't lose money
 * 3. Risk penalties: RTL, hops
 * 4. Target token boost: Must end at user's destination
 */

/**
 * ROI Distance Score - Goal-seeking, not maximization
 * 
 * Returns 1.0 for perfect match (within tolerance)
 * Decays toward 0 for overshoot or undershoot
 */
function roiDistanceScore(achievedROI: number, targetROI: number, tolerance: number = 1, maxOvershoot: number = 5): number {
    const distance = Math.abs(achievedROI - targetROI);

    // Perfect match → max score
    if (distance <= tolerance) return 1.0;

    // Outside tolerance → decay based on distance
    // The further from target, the worse the score
    const excessDistance = distance - tolerance;
    const decay = 1 - (excessDistance / maxOvershoot);

    return Math.max(0, decay);
}

function calculateHeuristicScore(
    state: PathState,
    goal: BrainGoal,
    alphaScore: number = 0,
    targetToken?: string
): number {
    // Calculate current ROI
    const currentROI = ((state.currentValueSOL - goal.startAmountSOL) / goal.startAmountSOL) * 100;

    // Get ROI intent (default to legacy behavior if not set)
    const roiIntent = goal.roiIntent || {
        targetPct: ((goal.targetAmountSOL - goal.startAmountSOL) / goal.startAmountSOL) * 100,
        tolerancePct: 1,
        maxOvershootPct: 10
    };

    // === ROI DISTANCE SCORING (NEW: Goal-seeking) ===
    const roiScore = roiDistanceScore(
        currentROI,
        roiIntent.targetPct,
        roiIntent.tolerancePct,
        roiIntent.maxOvershootPct
    ) * 1.5; // Weight: 1.5 (primary driver)

    // === OVERSHOOT PENALTY (NEW) ===
    let overshootPenalty = 0;
    const overshoot = currentROI - roiIntent.targetPct;
    if (overshoot > roiIntent.tolerancePct) {
        // Penalize overshoot more aggressively
        overshootPenalty = (overshoot - roiIntent.tolerancePct) * 0.2;
    }

    // === Capital preservation (log scale) ===
    const growthRatio = state.currentValueSOL / goal.startAmountSOL;
    const preservationScore = Math.log(Math.max(0.01, growthRatio)) * 0.4;

    // === PENALTIES ===
    const rtlPenalty = state.cumulativeRTL * HEURISTIC_WEIGHTS.rtlPenalty;
    const hopPenalty = state.hopsUsed * HEURISTIC_WEIGHTS.hopPenalty;

    // === BONUSES ===

    // Alpha momentum boost
    const alphaMomentumBoost = alphaScore * HEURISTIC_WEIGHTS.alphaMomentumBoost * 0.5; // Reduced weight

    // Target token boost (must end at user's destination)
    let targetTokenBoost = 0;
    if (targetToken && targetToken !== SOL_MINT) {
        if (state.currentToken === targetToken) {
            targetTokenBoost = 2.0;
        } else if (state.path.some(hop => hop.toToken === targetToken)) {
            targetTokenBoost = 0.5;
        }
    }

    // ✅ FINAL SCORE: ROI distance is primary, overshoot is penalized
    const score = roiScore + preservationScore - rtlPenalty - hopPenalty - overshootPenalty +
        alphaMomentumBoost + targetTokenBoost;

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
 * 
 * CRITICAL: Uses exit reachability pruning to guarantee paths end at exit token.
 */
function expandPath(
    currentState: PathState,
    universe: SearchableToken[],
    goal: BrainGoal,
    reachability: ExitReachability  // NEW: Exit reachability graph
): PathState[] {
    const newStates: PathState[] = [];

    for (const candidate of universe) {
        // Skip if same as current token
        if (candidate.mint === currentState.currentToken) continue;

        // ============================================================
        // 🔴 HARD PRUNE #1: EXIT REACHABILITY (NON-NEGOTIABLE)
        // This candidate MUST be able to reach the exit token
        // within the remaining hop budget.
        // ============================================================
        const exitCheck = checkExitReachability(
            candidate.mint,
            currentState.hopsUsed,
            goal.maxHops,
            reachability
        );
        if (exitCheck !== null) {
            // Cannot reach exit from this candidate - skip entirely
            continue;
        }

        // Check hard rules (RTL, liquidity, etc.)
        const { violated, reason } = violatesHardRules(currentState, candidate, goal);
        if (violated) continue;

        // ✅ Use proper swap estimation
        const swap = estimateSwapOutcome(currentState, candidate);

        // Check if this swap would be profitable enough
        const minAcceptableReturn = -2; // Allow up to 2% loss per hop
        if (swap.expectedReturn < minAcceptableReturn) {
            continue; // Skip hops with too much loss
        }

        // === HOLD SUGGESTION LOGIC ===
        // Compute hold suggestion based on token characteristics
        let holdSuggestion: PathHop['hold'] = undefined;

        // Conditions for hold suggestion:
        // 1. Alpha token with momentum
        // 2. Volatility > 5% (high movement expected)
        // 3. Mid-path hops (not first or last)
        const isAlphaWithMomentum = candidate.isAlpha && (candidate.alphaScore ?? 0) > 0.4;
        const isVolatile = (candidate.volatility ?? 0) > 0.1;
        const isMidPath = currentState.hopsUsed >= 1;

        if ((isAlphaWithMomentum || isVolatile) && isMidPath) {
            const confidence = Math.min(0.95, 0.5 + (candidate.alphaScore ?? 0) * 0.3 + (candidate.volatility ?? 0) * 0.2);
            const suggestedMinutes = Math.min(5, 2 + Math.floor((candidate.volatility ?? 0) * 10));

            holdSuggestion = {
                suggestedMinutes,
                confidence,
                reason: isAlphaWithMomentum
                    ? `Strong alpha signal (${((candidate.alphaScore ?? 0) * 100).toFixed(0)}%) on ${candidate.symbol}`
                    : `High volatility expected on ${candidate.symbol}`,
                source: isAlphaWithMomentum ? 'momentum' : 'volatility',
                nextHopToken: candidate.symbol, // Continue to this token after hold
                exitToken: 'SOL', // Safe exit v1
            };
        }

        // Build hop WITH expected return and hold annotation
        const hop: PathHop = {
            fromToken: currentState.currentToken,
            fromSymbol: currentState.currentSymbol,
            toToken: candidate.mint,
            toSymbol: candidate.symbol,
            estimatedInSOL: currentState.currentValueSOL,
            estimatedOutSOL: swap.estimatedOutSOL, // ✅ Can be HIGHER than input!
            slippage: swap.priceImpact,
            hopRTL: swap.hopRTL,
            hold: holdSuggestion, // ✅ NEW: Hop-level hold annotation
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

        // ✅ FIX: Track cumulative price impact, not RTL
        const cumulativeImpact = currentState.cumulativeRTL + swap.priceImpact;

        // Build new state
        const newState: PathState = {
            currentToken: candidate.mint,
            currentSymbol: candidate.symbol,
            // NOTE: currentTokenAmount is simplified - in production, use real Jupiter quote amounts
            // Estimate output units based on SOL value ratio (approximation)
            currentTokenAmount: currentState.currentTokenAmount * (swap.estimatedOutSOL / currentState.currentValueSOL),
            currentValueSOL: swap.estimatedOutSOL, // SOL valuation only
            hopsUsed: currentState.hopsUsed + 1,
            cumulativeRTL: cumulativeImpact, // Actually cumulative price impact
            path: [...currentState.path, hop],
            visitedTokens: Array.from(visitedSet),
            score: 0, // will be calculated below
        };

        // Calculate heuristic score (with target token bias)
        let score = calculateHeuristicScore(newState, goal, candidate.alphaScore ?? 0, goal.targetToken);

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
 * V1 HOLD OVERLAY (Read-only, optional)
 *
 * Computes hold suggestion for first non-SOL token in path.
 * Returns null if:
 * - No hops in path
 * - Insufficient data
 * - Signals don't meet confidence threshold
 *
 * Does NOT affect pathfinding - pure observer.
 */
function attachHoldCheckpoint(state: PathState, universe: SearchableToken[]): PathState {
    // No hops? Nothing to hold
    if (state.path.length === 0) {
        return state;
    }

    // Get first hop (SOL → Token)
    const firstHop = state.path[0];
    if (!firstHop || firstHop.toToken === SOL_MINT) {
        return state; // No token to hold
    }

    // Find token in universe
    const token = universe.find(t => t.mint === firstHop.toToken);
    if (!token) {
        return state; // Token not found
    }

    // Build hold signal input using data we already have
    const holdInput: HoldSignalInput = {
        token: token.mint,
        currentPriceSOL: firstHop.estimatedOutSOL,
        rtlPercent: token.roundTripLoss,
        priceImpactPct: firstHop.slippage,
        poolLiquidityUSD: 100_000, // TODO: Extract from Jupiter route when available
        // AlphaScan data (optional)
        alphaVolume24h: undefined,
        alphaVolumeChange24h: undefined,
    };

    // Compute checkpoint (pure function, may return null)
    const checkpoint = computeHoldCheckpoint(holdInput);

    // Attach to state (immutable)
    return {
        ...state,
        holdCheckpoint: checkpoint,
    };
}

/**
 * MAIN BEAM SEARCH FUNCTION
 *
 * Returns:
 * - Found path if target is reachable
 * - "Not found" with best effort if target not reachable
 * 
 * CRITICAL: Uses exit reachability pruning to guarantee paths end at exit token.
 */
export function searchForPath(
    universe: SearchableToken[],
    goal: BrainGoal
): BrainSearchResult {
    console.log(`[Brain v2] Starting beam search: ${goal.startAmountSOL} SOL → ${goal.targetAmountSOL} SOL`);
    console.log(`[Brain v2] Exit token: ${goal.targetToken}`);

    // ============================================================
    // 🔴 CRITICAL: Build exit reachability graph BEFORE search
    // This guarantees ALL paths can reach the user's exit token.
    // ============================================================
    const adjacency = buildAdjacencyGraph(universe);
    const reachability = buildExitReachability(universe, goal.targetToken, adjacency);

    // Check if start token can even reach exit
    if (!reachability.canReachExit.has(goal.startToken)) {
        console.log(`[Brain v2] ❌ Start token ${goal.startToken} cannot reach exit ${goal.targetToken}`);
        const goalAlignment = computeGoalAlignment(undefined, goal, universe);
        return {
            found: false,
            reason: `No route exists from start token to ${goal.targetToken}`,
            exploredPaths: 0,
            explanation: pathExplainer.explainFailure(undefined, goal, universe),
            goalAlignment,
        };
    }

    // CRITICAL: Calculate adaptive constraints based on target ambition
    const adaptiveConstraints = calculateAdaptiveConstraints(goal);

    // Create effective goal with adaptive constraints
    const effectiveGoal: BrainGoal = {
        ...goal,
        maxHops: adaptiveConstraints.maxHops,
        maxTotalRTL: adaptiveConstraints.maxTotalRTL,
        maxPerHopRTL: adaptiveConstraints.maxPerHopRTL,
    };

    let exploredPaths = 0;

    // Initialize with user's starting token
    const startTokenObj = universe.find(t => t.mint === goal.startToken);
    const startSymbol = startTokenObj ? startTokenObj.symbol : 'UNKNOWN';

    let activePaths: PathState[] = [
        {
            currentToken: goal.startToken,
            currentSymbol: startSymbol,
            currentTokenAmount: goal.startAmount ?? 1,
            currentValueSOL: goal.startAmountSOL,
            hopsUsed: 0,
            cumulativeRTL: 0,
            path: [],
            visitedTokens: [goal.startToken],
            score: 0,
        },
    ];

    let bestEffort: PathState | undefined = undefined;

    // Beam search loop
    for (let hop = 1; hop <= goal.maxHops; hop++) {
        const allNewPaths: PathState[] = [];

        // Expand all active paths (with exit reachability pruning)
        for (const currentPath of activePaths) {
            const expansions = expandPath(currentPath, universe, goal, reachability);
            allNewPaths.push(...expansions);
            exploredPaths += expansions.length;
        }

        // No new paths? Dead end
        if (allNewPaths.length === 0) {
            console.log(`[Brain v2] Dead end at hop ${hop}`);
            const explanation = pathExplainer.explainFailure(bestEffort, goal, universe);
            const goalAlignment = computeGoalAlignment(bestEffort, goal, universe);
            return {
                found: false,
                reason: 'No viable paths found under current constraints',
                bestEffort,
                exploredPaths,
                explanation,
                goalAlignment,
            };
        }

        // Check if any path reached target
        for (const path of allNewPaths) {
            // ✅ SUCCESS CONDITIONS (STRICT):
            // 1. Must match target token (User Intent)
            // 2. Must meet target value (Valuation Constraint)
            // 3. Must be profitable (Efficiency)
            const isTargetToken = path.currentToken === goal.targetToken;
            const isProfitable = path.currentValueSOL > goal.startAmountSOL;
            const hasTargetValue = path.currentValueSOL >= goal.targetAmountSOL;

            // ✅ REQUIRE exact target token match
            if (isTargetToken && hasTargetValue && isProfitable) {
                const totalProfit = path.currentValueSOL - goal.startAmountSOL;
                const profitPercentage = (totalProfit / goal.startAmountSOL) * 100;

                console.log(`[Brain v2] ✓ TARGET REACHED at hop ${hop}!`);
                console.log(`[Brain v2]   Start: ${goal.startAmountSOL.toFixed(6)} SOL`);
                console.log(`[Brain v2]   Current: ${path.currentValueSOL.toFixed(6)} SOL`);
                console.log(`[Brain v2]   Profit: +${profitPercentage.toFixed(1)}% (+${totalProfit.toFixed(6)} SOL)`);
                console.log(`[Brain v2]   Token: ${path.currentSymbol}`);
                console.log(`[Brain v2]   Cumulative Impact: ${path.cumulativeRTL.toFixed(1)}%`);

                const isOnSOL = path.currentToken === SOL_MINT;
                if (!isOnSOL) {
                    console.log(`[Brain v2]   ⚠ Final step: ${path.currentSymbol} → SOL (via USDC/USDT if needed)`);
                }

                // V1 HOLD OVERLAY: Attach hold checkpoint (read-only)
                const pathWithHold = attachHoldCheckpoint(path, universe);

                // Generate explanation
                const explanation = pathExplainer.explainPath(pathWithHold, goal, universe, allNewPaths);
                const goalAlignment = computeGoalAlignment(pathWithHold, goal, universe);

                return {
                    found: true,
                    path: pathWithHold,
                    confidence: calculateConfidence(path),
                    warnings: generateWarnings(path),
                    reachableAtHop: hop,
                    explanation,
                    goalAlignment,
                };
            }
        }

        // Sort by score and keep top K (beam width)
        allNewPaths.sort((a, b) => b.score - a.score);
        activePaths = allNewPaths.slice(0, SEARCH_CONFIG.BEAM_WIDTH);

        // Track best effort (closest to target)
        const closest = activePaths[0];
        if (!bestEffort || closest.currentValueSOL > bestEffort.currentValueSOL) {
            bestEffort = closest;
        }

        console.log(`[Brain v2] Hop ${hop}: ${allNewPaths.length} expansions, kept top ${activePaths.length}`);
        console.log(`[Brain v2]   Best: ${activePaths[0].currentSymbol} @ ${activePaths[0].currentValueSOL.toFixed(6)} SOL (score: ${activePaths[0].score.toFixed(2)})`);
    }

    // Exhausted max hops without reaching target
    console.log(`[Brain v2] Target not reached after ${goal.maxHops} hops`);
    console.log(`[Brain v2] Best effort: ${bestEffort?.currentValueSOL.toFixed(6)} SOL (${((bestEffort?.currentValueSOL ?? 0) / goal.targetAmountSOL * 100).toFixed(1)}% of target)`);

    // V1 HOLD OVERLAY: Attach hold checkpoint to best effort (if exists)
    const bestEffortWithHold = bestEffort ? attachHoldCheckpoint(bestEffort, universe) : undefined;

    const explanation = pathExplainer.explainFailure(bestEffortWithHold, goal, universe);
    const goalAlignment = computeGoalAlignment(bestEffortWithHold, goal, universe);

    return {
        found: false,
        reason: `Target not reachable within ${goal.maxHops} hops under current market conditions`,
        bestEffort: bestEffortWithHold,
        exploredPaths,
        explanation,
        goalAlignment,
    };
}

// ============================================================================
// ROADMAP CONVERTER (INTENT-BASED OUTPUT)
// Transforms PathState into BrainRoadmap for execution layer
// ============================================================================

const AVG_SWAP_TIME_SECONDS = 15;
const AVG_NETWORK_FEE_SOL = 0.0006;

/**
 * Convert a PathState into an intent-based BrainRoadmap
 * 
 * Brain outputs PLANNING, not quotes.
 * Amounts are estimated targets, not guarantees.
 */
export function convertPathToRoadmap(
    pathState: PathState,
    goal: BrainGoal,
    scenario: ScenarioType = 'BEST_EFFORT'
): BrainRoadmap {
    const steps: RoadmapStep[] = [];
    const warnings: string[] = []; // Initialize logic warnings
    let stepIndex = 0;
    let cumulativeRiskPct = 0; // Track cumulative risk for exit envelope

    for (const hop of pathState.path) {
        // Tax Detection (Phase 3)
        const tax = estimateTokenTax(hop.hopRTL, 2.0);
        if (tax.hasTax) {
            warnings.push(`⚠️ ${hop.toSymbol}: Estimated ${tax.totalTaxBps / 100}% Transfer Tax`);
        }

        // Calculate protection class based on hop characteristics
        const protection = getProtectionClass(hop.hopRTL, scenario);

        // Calculate cumulative worst-case (conservative estimate)
        cumulativeRiskPct += hop.hopRTL;
        const worstCaseExitPct = Math.max(90, 100 - cumulativeRiskPct);

        // SWAP step - NO amounts, just intent
        const swapStep: RoadmapStep = {
            index: stepIndex++,
            action: 'SWAP',
            fromToken: hop.fromToken,
            fromSymbol: hop.fromSymbol,
            toToken: hop.toToken,
            toSymbol: hop.toSymbol,
            maxSlippagePct: Math.max(hop.hopRTL, 2), // At least 2% slippage tolerance
            confidence: getConfidenceFromRTL(hop.hopRTL),
            mandatory: stepIndex <= 2, // First 2 hops are mandatory
            protection,
            exitEnvelope: {
                token: hop.toToken,
                symbol: hop.toSymbol,
                worstCaseExitPct, // e.g., 98.1 means preserve 98.1% of start
            },
        };
        steps.push(swapStep);

        // HOLD step (if hold annotation exists)
        if (hop.hold) {
            const holdStep: RoadmapStep = {
                index: stepIndex++,
                action: 'HOLD',
                holdMinutes: hop.hold.suggestedMinutes,
                holdReason: hop.hold.reason,
                confidence: getConfidenceFromScore(hop.hold.confidence),
                mandatory: false, // Holds are always optional
                protection: 'SAFE', // Holds are always safe (no execution)
                exitEnvelope: {
                    token: hop.toToken,
                    symbol: hop.toSymbol,
                    worstCaseExitPct, // Same as previous hop
                },
            };
            steps.push(holdStep);
        }
    }

    // Calculate estimates - duration as RANGE
    const swapSteps = steps.filter(s => s.action === 'SWAP').length;
    const holdSteps = steps.filter(s => s.action === 'HOLD');
    const totalHoldMinutes = holdSteps.reduce((sum, s) => sum + (s.holdMinutes || 0), 0);

    const baseDuration = (swapSteps * AVG_SWAP_TIME_SECONDS / 60) + totalHoldMinutes;
    const durationMinutesRange: [number, number] = [
        Math.max(1, baseDuration * 0.7), // Min: 30% faster
        baseDuration * 1.5 // Max: 50% slower
    ];

    // Fees impact - classify instead of showing exact number
    const feesImpact = getFeesImpact(swapSteps);

    // Generate warnings - NO numeric predictions
    // warnings array already initialized
    if (pathState.cumulativeRTL > 10) {
        warnings.push('High cumulative slippage risk');
    }
    if (steps.length > 8) {
        warnings.push('Long path increases execution risk');
    }
    if (holdSteps.length > 2) {
        warnings.push('Multiple holds increase timing uncertainty');
    }

    // Explanation - why this path, what risks
    const explanation = generateExplanation(scenario, steps, pathState);

    // SAFETY CHECK: Preservation Mode
    let blocked = false;
    let blockedReason: string | undefined;

    if (goal.preservation?.enabled) {
        // Find worst case exit across all steps
        const lowestExitPct = Math.min(...steps.map(s => s.exitEnvelope.worstCaseExitPct));
        const requiredRetention = 100 - goal.preservation.maxAllowedDrawdownPct; // e.g., 99.3%

        if (lowestExitPct < requiredRetention) {
            blocked = true;
            blockedReason = `Preservation Mode: Worst-case exit (${lowestExitPct.toFixed(1)}%) violates limit (${requiredRetention}%)`;
            warnings.push(`Blocked by Preservation Limit (${requiredRetention}% required)`);
        }
    }

    return {
        scenario,
        summary: {
            hops: swapSteps,
            holds: holdSteps.length,
            confidence: blocked ? 'LOW' : getOverallConfidence(steps),
            // NO ROI - never show numeric expectations
        },
        steps,
        estimates: {
            durationMinutesRange,
            feesImpact,
        },
        explanation,
        warnings,
        blocked,
        blockedReason,
        _sourcePathState: pathState, // Internal only, never shown to user
    };
}

function getFeesImpact(hops: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    if (hops <= 2) return 'LOW';
    if (hops <= 4) return 'MEDIUM';
    if (hops <= 6) return 'HIGH';
    return 'VERY_HIGH';
}

function generateExplanation(
    scenario: ScenarioType,
    steps: RoadmapStep[],
    path: PathState
): { whyChosen: string[]; mainRisks: string[] } {
    const whyChosen: string[] = [];
    const mainRisks: string[] = [];

    // Why chosen
    const highConfSteps = steps.filter(s => s.confidence === 'HIGH').length;
    if (highConfSteps > steps.length / 2) {
        whyChosen.push('Majority high-confidence steps');
    }

    switch (scenario) {
        case 'CONSERVATIVE':
            whyChosen.push('Prioritizes liquid, stable routing');
            break;
        case 'BALANCED':
            whyChosen.push('Balances opportunity with safety');
            break;
        case 'AGGRESSIVE':
            whyChosen.push('Explores higher-volatility paths');
            break;
        case 'VOLATILITY':
            whyChosen.push('Optimized for volatile market conditions');
            break;
        case 'BEST_EFFORT':
            whyChosen.push('Best available path given constraints');
            break;
    }

    // Main risks
    if (path.cumulativeRTL > 5) {
        mainRisks.push('Potential slippage in thin pools');
    }
    if (steps.some(s => s.action === 'HOLD')) {
        mainRisks.push('Holds expose to short-term reversals');
    }
    if (steps.length > 5) {
        mainRisks.push('More hops = more execution points');
    }
    mainRisks.push('Markets can change instantly');

    return { whyChosen, mainRisks };
}

function getConfidenceFromRTL(rtl: number): ConfidenceLevel {
    if (rtl <= 2) return 'HIGH';
    if (rtl <= 5) return 'MEDIUM';
    return 'LOW';
}

function getConfidenceFromScore(score: number): ConfidenceLevel {
    if (score >= 0.7) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
}

function getOverallConfidence(steps: RoadmapStep[]): ConfidenceLevel {
    const confidenceScores = steps.map(s =>
        s.confidence === 'HIGH' ? 3 : s.confidence === 'MEDIUM' ? 2 : 1
    );
    const avg = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
    if (avg >= 2.5) return 'HIGH';
    if (avg >= 1.5) return 'MEDIUM';
    return 'LOW';
}

/**
 * Determine protection class based on hop risk and scenario
 * Execution layer uses this to decide MEV protection level
 */
function getProtectionClass(hopRTL: number, scenario: ScenarioType): ProtectionClass {
    // Conservative always gets SAFE
    if (scenario === 'CONSERVATIVE') return 'SAFE';

    // Low risk hops are SAFE
    if (hopRTL <= 2) return 'SAFE';

    // Medium risk
    if (hopRTL <= 5) return 'MEDIUM';

    // High risk hops need Jito bundles
    if (hopRTL <= 10) return 'JITO_ONLY';

    // Extreme risk
    return 'HIGH_RISK';
}

