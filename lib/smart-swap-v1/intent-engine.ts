/**
 * Smart Swap V1 - Intent-Based Matching Engine
 *
 * CRITICAL: This is DISPLAY ONLY
 * - NO swap execution
 * - NO wallet interaction
 * - NO transaction building
 * - Pure filtering + scoring + display
 */

export interface EnrichedToken {
    address: string;
    symbol: string;
    name: string;
    price: number;
    marketCap: number;
    liquidity: number;
    volume24h: number;
    priceChange24h: number;
    priceChange7d: number;
    ageInDays: number;
    rugRisk: 'low' | 'medium' | 'high';
    logoURI?: string;
}

export interface IntentInput {
    investmentAmount: number; // in SOL
    targetReturn: number; // in SOL or multiplier
}

export interface SmartMatchResult {
    token: EnrichedToken;
    smartScore: number; // 0-100
    matchPercentage: number; // 0-100
    expectedRange: { min: number; max: number }; // multiplier range
    whyReasons: string[];
    volumeTrend: 'Rising' | 'Stable' | 'Declining';
    rank: number;
}

// ============================================================================
// HEURISTIC SCORING ALGORITHM
// ============================================================================

/**
 * Growth Headroom Score (0-30)
 * Lower market cap = more room to grow
 */
function calculateGrowthHeadroom(marketCap: number): number {
    if (marketCap < 200_000) return 30;
    if (marketCap < 1_000_000) return 20;
    if (marketCap < 5_000_000) return 10;
    return 5;
}

/**
 * Momentum Score (0-25)
 * Recent price action indicates interest
 */
function calculateMomentum(token: EnrichedToken): number {
    let score = 0;

    // 24h momentum
    if (token.priceChange24h > 5) score += 15;
    else if (token.priceChange24h > 2) score += 8;
    else if (token.priceChange24h > 0) score += 3;

    // 7d momentum
    if (token.priceChange7d > 20) score += 10;
    else if (token.priceChange7d > 10) score += 5;

    return Math.min(25, score);
}

/**
 * Liquidity Safety Score (0-20)
 * Higher liquidity = easier to exit
 */
function calculateLiquiditySafety(liquidity: number): number {
    if (liquidity > 50_000) return 20;
    if (liquidity > 20_000) return 10;
    return 3;
}

/**
 * Rug Risk Penalty
 * High risk = exclude, Medium = penalty
 */
function calculateRugRiskPenalty(rugRisk: 'low' | 'medium' | 'high'): number {
    if (rugRisk === 'high') return -999; // Will be filtered out
    if (rugRisk === 'medium') return -20;
    return 0;
}

/**
 * Age Bonus (0-10)
 * Sweet spot: 3-30 days (established but not old)
 */
function calculateAgeBonus(ageInDays: number): number {
    if (ageInDays >= 3 && ageInDays <= 30) return 10;
    if (ageInDays < 3) return 3;
    if (ageInDays > 90) return 2;
    return 5;
}

/**
 * Calculate Total Smart Score (0-100+)
 */
export function calculateSmartScore(token: EnrichedToken): number {
    const growthScore = calculateGrowthHeadroom(token.marketCap);
    const momentumScore = calculateMomentum(token);
    const liquidityScore = calculateLiquiditySafety(token.liquidity);
    const rugPenalty = calculateRugRiskPenalty(token.rugRisk);
    const ageBonus = calculateAgeBonus(token.ageInDays);

    const rawScore = growthScore + momentumScore + liquidityScore + rugPenalty + ageBonus;

    // Normalize to 0-100
    return Math.max(0, Math.min(100, rawScore));
}

// ============================================================================
// GOAL MATCH FILTER
// ============================================================================

/**
 * Check if token historically matches the user's target multiplier
 * Using 7d price change as proxy for potential
 */
export function matchesGoal(token: EnrichedToken, intent: IntentInput): boolean {
    const targetMultiplier = intent.targetReturn / intent.investmentAmount;

    // Exclude tokens already pumped >40% today
    if (token.priceChange24h > 40) return false;

    // Calculate historical multiplier from 7d change
    // If token went from $1 to $1.50 in 7d, that's 1.5x
    const historicalMultiplier = 1 + (token.priceChange7d / 100);

    // Accept tokens that showed moves in range:
    // (target - 0.2) to (target + 0.5)
    const minAcceptable = targetMultiplier - 0.2;
    const maxAcceptable = targetMultiplier + 0.5;

    return historicalMultiplier >= minAcceptable && historicalMultiplier <= maxAcceptable;
}

// ============================================================================
// MAIN INTENT MATCHING
// ============================================================================

/**
 * Find top 5 tokens matching user intent
 */
export function findSmartMatches(
    tokens: EnrichedToken[],
    intent: IntentInput
): SmartMatchResult[] {
    const targetMultiplier = intent.targetReturn / intent.investmentAmount;

    // Step 1: Filter rugs
    let filtered = tokens.filter(t => t.rugRisk !== 'high');

    // Step 2: Filter liquidity floor (minimum $10k)
    filtered = filtered.filter(t => t.liquidity > 10_000);

    // Step 3: Filter goal match
    filtered = filtered.filter(t => matchesGoal(t, intent));

    // Step 4: Calculate scores
    const scored = filtered.map(token => {
        const smartScore = calculateSmartScore(token);
        const historicalMultiplier = 1 + (token.priceChange7d / 100);

        // Match percentage based on how close historical moves are to target
        const matchPercentage = Math.max(0, 100 - Math.abs(targetMultiplier - historicalMultiplier) * 50);

        // Expected range based on historical volatility
        const volatility = Math.abs(token.priceChange7d) / 100;
        const expectedMin = Math.max(1.0, targetMultiplier - volatility);
        const expectedMax = targetMultiplier + volatility;

        // Volume trend (simplified)
        const volumeTrend: 'Rising' | 'Stable' | 'Declining' =
            token.priceChange24h > 5 ? 'Rising' :
            token.priceChange24h < -5 ? 'Declining' : 'Stable';

        // Generate reasons
        const whyReasons = generateReasons(token, smartScore, targetMultiplier);

        return {
            token,
            smartScore,
            matchPercentage,
            expectedRange: { min: expectedMin, max: expectedMax },
            whyReasons,
            volumeTrend,
            rank: 0, // Will be set after sorting
        };
    });

    // Step 5: Sort by smart score
    scored.sort((a, b) => b.smartScore - a.smartScore);

    // Step 6: Take top 5 and assign ranks
    const top5 = scored.slice(0, 5).map((result, index) => ({
        ...result,
        rank: index + 1,
    }));

    return top5;
}

/**
 * Generate human-readable reasons for why this token matches
 */
function generateReasons(
    token: EnrichedToken,
    smartScore: number,
    targetMultiplier: number
): string[] {
    const reasons: string[] = [];

    // Market cap reason
    if (token.marketCap < 1_000_000) {
        reasons.push(`Low market cap ($${(token.marketCap / 1000).toFixed(0)}K) with high growth potential`);
    }

    // Momentum reason
    if (token.priceChange7d > 20) {
        reasons.push(`Strong 7-day momentum (+${token.priceChange7d.toFixed(1)}%)`);
    } else if (token.priceChange7d > 10) {
        reasons.push(`Positive trend (+${token.priceChange7d.toFixed(1)}% this week)`);
    }

    // Liquidity reason
    if (token.liquidity > 100_000) {
        reasons.push(`Deep liquidity ($${(token.liquidity / 1000).toFixed(0)}K) for safe entry/exit`);
    } else if (token.liquidity > 50_000) {
        reasons.push(`Adequate liquidity ($${(token.liquidity / 1000).toFixed(0)}K)`);
    }

    // Age reason
    if (token.ageInDays >= 7 && token.ageInDays <= 30) {
        reasons.push(`Established token (${token.ageInDays} days old) with proven track record`);
    }

    // Risk reason
    if (token.rugRisk === 'low') {
        reasons.push('Low risk profile with verified contract');
    }

    // Default if not enough reasons
    if (reasons.length < 2) {
        reasons.push(`Historical moves align with your ${targetMultiplier.toFixed(1)}x target`);
    }

    return reasons.slice(0, 3); // Max 3 reasons
}

/**
 * Get psychology label for ranking
 */
export function getRankLabel(rank: number): string {
    switch (rank) {
        case 1:
            return '🔥 Best Match for Your Goal';
        case 2:
            return '💎 Strong Alternative';
        case 3:
            return '⚖️ Balanced Option';
        case 4:
            return '🎯 Conservative Pick';
        case 5:
            return '🌟 Dark Horse Candidate';
        default:
            return 'Potential Match';
    }
}
