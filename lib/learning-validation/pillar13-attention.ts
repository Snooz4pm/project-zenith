/**
 * Pillar 13: Voluntary Attention & Accountability
 *
 * Core Principle:
 * "You may choose where to look — but you don't get to escape reality."
 *
 * The Brain is NOT required to predict every token.
 * But it IS fully accountable for:
 * - What it chooses to predict (existing Pillars 2-3)
 * - What it chooses to ignore (NEW accountability)
 */

import { TokenPriceHistory } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface AttentionDecision {
    cycle: number;
    totalAvailable: number;
    attentionSet: string[]; // Tokens the Brain chose to look at
    ignoredTokens: string[]; // Tokens the Brain chose to ignore
    selectionReason: string;
    focusRatio: number; // attentionSet.length / totalAvailable
}

export interface IgnoredTokenOutcome {
    token: string;
    mint: string;
    ignoredAtPrice: number;
    actualPriceChange: number; // After wait period
    meaningfulMove: boolean; // Did it move > threshold?
    moveDirection: 'UP' | 'DOWN' | 'FLAT';
    regretGenerated: number; // How much regret this creates
    teachingEvent: string;
}

export interface RegretScore {
    totalRegret: number;
    missedOpportunities: number; // Count of meaningful moves ignored
    recentPatternPressure: number; // Anti-permanent avoidance pressure
}

export interface AttentionPattern {
    cycle: number;
    tokensShrinkRate: number; // How fast attention set is shrinking
    repeatedAvoidance: string[]; // Tokens ignored multiple cycles in a row
    avoidancePressure: number; // Builds up if same tokens ignored repeatedly
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const PILLAR_13_CONFIG = {
    // What counts as a "meaningful move" for ignored tokens
    MEANINGFUL_MOVE_THRESHOLD: 0.03, // 3% price change

    // Regret scoring (NOT penalties, just emotional feedback)
    BASE_REGRET_PER_MISSED_MOVE: 0.25,
    REGRET_MULTIPLIER_LARGE_MOVE: 1.5, // If move > 5%

    // Anti-permanent avoidance
    REPEATED_IGNORE_THRESHOLD: 3, // Ignore same token 3+ cycles → pressure
    AVOIDANCE_PRESSURE_INCREMENT: 0.1,
    MAX_AVOIDANCE_PRESSURE: 2.0,

    // Focus boundaries (soft, not enforced)
    HEALTHY_FOCUS_RATIO_MIN: 0.1, // Looking at < 10% → warning
    HEALTHY_FOCUS_RATIO_MAX: 0.8, // Looking at > 80% → probably spam
};

// ============================================================================
// ATTENTION SET SELECTION
// ============================================================================

/**
 * The Brain chooses which tokens to focus on.
 * This is voluntary - no minimum required.
 * But consequences apply for the choice.
 */
export function selectAttentionSet(
    availableTokens: TokenPriceHistory[],
    cycle: number,
    _previousPattern?: AttentionPattern // Reserved for future learning
): AttentionDecision {
    // For now, simple heuristic: focus on top movers + random sample
    // In Brain v2, this would be learned behavior
    // TODO: Use previousPattern to learn from past attention decisions

    const totalAvailable = availableTokens.length;

    // Calculate recent volatility for each token
    const withVolatility = availableTokens.map(t => {
        // Use last 5 price points (or all if less than 5)
        const recentPrices = t.prices.slice(-5);
        const recentChanges = recentPrices.map((h, i, arr) =>
            i > 0 ? Math.abs((h.price - arr[i-1].price) / arr[i-1].price) : 0
        );
        const avgVolatility = recentChanges.reduce((a, b) => a + b, 0) / Math.max(1, recentChanges.length);
        return { token: t, volatility: avgVolatility };
    });

    // Sort by volatility
    withVolatility.sort((a, b) => b.volatility - a.volatility);

    // Select:
    // - Top 30% by volatility (interesting movers)
    // - Random 10% from remainder (exploratory)
    const topCount = Math.ceil(totalAvailable * 0.3);
    const randomCount = Math.ceil(totalAvailable * 0.1);

    const topMovers = withVolatility.slice(0, topCount).map(w => w.token.symbol);
    const remainder = withVolatility.slice(topCount);
    const randomSample = remainder
        .sort(() => Math.random() - 0.5)
        .slice(0, randomCount)
        .map(w => w.token.symbol);

    const attentionSet = [...topMovers, ...randomSample];
    const ignoredTokens = availableTokens
        .map(t => t.symbol)
        .filter(s => !attentionSet.includes(s));

    const focusRatio = attentionSet.length / totalAvailable;

    // Build selection reason
    let reason = `Focusing on ${topCount} volatile tokens + ${randomCount} exploratory`;
    if (focusRatio < PILLAR_13_CONFIG.HEALTHY_FOCUS_RATIO_MIN) {
        reason += ' (⚠️ Very narrow focus)';
    } else if (focusRatio > PILLAR_13_CONFIG.HEALTHY_FOCUS_RATIO_MAX) {
        reason += ' (⚠️ Broad attention - potential spam)';
    }

    return {
        cycle,
        totalAvailable,
        attentionSet,
        ignoredTokens,
        selectionReason: reason,
        focusRatio,
    };
}

// ============================================================================
// IGNORED TOKEN ACCOUNTABILITY
// ============================================================================

/**
 * After wait period, check what happened to ignored tokens.
 * No penalty - just regret awareness.
 */
export function evaluateIgnoredTokens(
    ignoredTokens: string[],
    pricesAtIgnore: Map<string, number>,
    pricesAfter: Map<string, number>
): IgnoredTokenOutcome[] {
    const outcomes: IgnoredTokenOutcome[] = [];

    for (const token of ignoredTokens) {
        const beforePrice = pricesAtIgnore.get(token);
        const afterPrice = pricesAfter.get(token);

        if (!beforePrice || !afterPrice) continue;

        const priceChange = (afterPrice - beforePrice) / beforePrice;
        const absPriceChange = Math.abs(priceChange);

        // Did this ignored token move meaningfully?
        const meaningfulMove = absPriceChange >= PILLAR_13_CONFIG.MEANINGFUL_MOVE_THRESHOLD;

        let moveDirection: 'UP' | 'DOWN' | 'FLAT' = 'FLAT';
        if (priceChange > PILLAR_13_CONFIG.MEANINGFUL_MOVE_THRESHOLD) {
            moveDirection = 'UP';
        } else if (priceChange < -PILLAR_13_CONFIG.MEANINGFUL_MOVE_THRESHOLD) {
            moveDirection = 'DOWN';
        }

        // Calculate regret (only if meaningful move)
        let regret = 0;
        let teachingEvent = '';

        if (meaningfulMove) {
            regret = PILLAR_13_CONFIG.BASE_REGRET_PER_MISSED_MOVE;

            // Larger moves → more regret
            if (absPriceChange > 0.05) {
                regret *= PILLAR_13_CONFIG.REGRET_MULTIPLIER_LARGE_MOVE;
            }

            teachingEvent = `You chose not to look at ${token}. ` +
                `Reality moved ${moveDirection} by ${(priceChange * 100).toFixed(1)}%. ` +
                `This is regret, not failure.`;
        }

        outcomes.push({
            token,
            mint: '', // Would need to track this
            ignoredAtPrice: beforePrice,
            actualPriceChange: priceChange,
            meaningfulMove,
            moveDirection,
            regretGenerated: regret,
            teachingEvent,
        });
    }

    return outcomes;
}

// ============================================================================
// ANTI-PERMANENT AVOIDANCE
// ============================================================================

/**
 * Track if Brain is repeatedly ignoring same tokens.
 * Build pressure (not penalty) to force confrontation.
 */
export function trackAvoidancePattern(
    currentDecision: AttentionDecision,
    previousPatterns: AttentionPattern[]
): AttentionPattern {
    const { cycle, ignoredTokens, attentionSet } = currentDecision;

    // Find tokens ignored in multiple consecutive cycles
    const repeatedAvoidance: string[] = [];

    if (previousPatterns.length > 0) {
        // TODO: Implement proper token-level tracking across cycles
        // For now, use simplified pressure based on pattern count
        for (const token of ignoredTokens) {
            // Count how many recent cycles this token was ignored
            let consecutiveIgnores = 1; // Current cycle

            for (let i = previousPatterns.length - 1; i >= 0; i--) {
                // Simplified: assume tokens ignored repeatedly
                // Full implementation would track per-token ignore history
                consecutiveIgnores++;
            }

            if (consecutiveIgnores >= PILLAR_13_CONFIG.REPEATED_IGNORE_THRESHOLD) {
                repeatedAvoidance.push(token);
            }
        }
    }

    // Calculate avoidance pressure
    let avoidancePressure = 0;
    if (repeatedAvoidance.length > 0) {
        avoidancePressure = Math.min(
            repeatedAvoidance.length * PILLAR_13_CONFIG.AVOIDANCE_PRESSURE_INCREMENT,
            PILLAR_13_CONFIG.MAX_AVOIDANCE_PRESSURE
        );
    }

    // Calculate shrink rate
    const tokensShrinkRate = previousPatterns.length > 0
        ? (previousPatterns[previousPatterns.length - 1].tokensShrinkRate +
           (attentionSet.length / currentDecision.totalAvailable)) / 2
        : attentionSet.length / currentDecision.totalAvailable;

    return {
        cycle,
        tokensShrinkRate,
        repeatedAvoidance,
        avoidancePressure,
    };
}

// ============================================================================
// REGRET ACCUMULATION
// ============================================================================

/**
 * Aggregate regret across a cycle.
 * This is emotional feedback, not a gate.
 */
export function calculateRegretScore(
    ignoredOutcomes: IgnoredTokenOutcome[],
    avoidancePattern: AttentionPattern
): RegretScore {
    const totalRegret = ignoredOutcomes.reduce((sum, o) => sum + o.regretGenerated, 0);
    const missedOpportunities = ignoredOutcomes.filter(o => o.meaningfulMove).length;

    // Add avoidance pressure as regret amplifier
    const recentPatternPressure = avoidancePattern.avoidancePressure;

    return {
        totalRegret: totalRegret + recentPatternPressure,
        missedOpportunities,
        recentPatternPressure,
    };
}

// ============================================================================
// TEACHING EVENTS
// ============================================================================

/**
 * Format teaching events for logging.
 * These are not failures - they're awareness.
 */
export function formatTeachingEvents(
    ignoredOutcomes: IgnoredTokenOutcome[]
): string[] {
    return ignoredOutcomes
        .filter(o => o.meaningfulMove)
        .map(o => o.teachingEvent);
}
