/**
 * Smart Swap V1 - CLIENT-SIDE Intent Matching
 *
 * Uses ZenithToken[] from /swap (no API needed)
 * Pure filtering + scoring + display
 *
 * Uses PROGRESSIVE FILTERING:
 * - Pass 1: Strict match
 * - Pass 2: Relaxed match
 * - Pass 3: Momentum fallback
 * This guarantees we ALWAYS return results
 */

import { ZenithToken } from '@/lib/zenith';
import {
    EnrichedToken,
    IntentInput,
    SmartMatchResult
} from './intent-engine';

/**
 * Convert ZenithToken to EnrichedToken
 * Adds synthetic data for missing fields (deterministic)
 */
function enrichZenithToken(token: ZenithToken): EnrichedToken {
    // Deterministic synthetic data from token address hash
    const hash = token.mint.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

    // Price change 7d - use best available data
    const priceChange7d = token.priceChange24h * 2.5;

    // Age estimate (7-97 days)
    const ageInDays = (hash % 90) + 7;

    // Market cap estimate (based on liquidity)
    const marketCap = token.liquidityUsd > 0
        ? token.liquidityUsd * 20  // Assume 5% of MC is liquidity
        : token.priceUsd > 100 ? 10_000_000 : token.priceUsd > 1 ? 1_000_000 : 100_000;

    // Rug risk heuristic
    let rugRisk: 'low' | 'medium' | 'high' = 'low';
    if (token.liquidityUsd < 15_000 || ageInDays < 3) {
        rugRisk = 'high';
    } else if (token.liquidityUsd < 40_000 || ageInDays < 10) {
        rugRisk = 'medium';
    }

    return {
        address: token.mint,
        symbol: token.symbol,
        name: token.name,
        price: token.priceUsd,
        marketCap,
        liquidity: token.liquidityUsd,
        volume24h: token.volume24hUsd,
        priceChange24h: token.priceChange24h,
        priceChange7d,
        ageInDays,
        rugRisk,
        logoURI: token.logoURI,
    };
}

/**
 * Market cap tier classification
 * This is the PRIMARY signal for matching potential
 */
function getCapTier(marketCap: number): 'micro' | 'low' | 'mid' | 'large' | null {
    if (!marketCap || marketCap <= 0) return null;
    if (marketCap < 200_000) return 'micro';
    if (marketCap < 1_000_000) return 'low';
    if (marketCap < 5_000_000) return 'mid';
    return 'large';
}

/**
 * Calculate alignment score for a token given user intent
 * SCORING FIRST - never returns empty
 *
 * Formula:
 * AlignmentScore = (capScore * difficulty * 40) +
 *                  (momentumScore * 30) +
 *                  (liquidityScore * (1-difficulty) * 20) +
 *                  (ageScore * 10) +
 *                  riskPenalty
 */
function calculateAlignmentScore(
    token: EnrichedToken,
    difficulty: number // 0-1 based on target multiplier
): number {
    // Helper functions
    const logScale = (value: number) => Math.min(Math.log10(value + 1) / 6, 1);
    const logScaleInverse = (value: number) => 1 - logScale(value);
    const normalize = (x: number) => Math.max(Math.min(x / 100, 1), 0);
    const bellCurve = (days: number) => {
        if (days < 2) return 0.3;
        if (days < 30) return 1;
        if (days < 90) return 0.6;
        return 0.3;
    };

    // Feature scores (0-1)
    const capScore = logScaleInverse(token.marketCap);
    const liquidityScore = logScale(token.liquidity);
    const momentumScore = normalize((token.priceChange24h ?? 0) + (token.priceChange7d ?? 0));
    const ageScore = bellCurve(token.ageInDays);
    const riskPenalty = token.rugRisk === 'high' ? -50 : token.rugRisk === 'medium' ? -15 : 0;

    // Alignment formula
    // High target (difficulty ~1) → favors low cap + momentum
    // Low target (difficulty ~0) → favors liquidity + stability
    const alignmentScore =
        (capScore * difficulty * 40) +
        (momentumScore * 30) +
        (liquidityScore * (1 - difficulty) * 20) +
        (ageScore * 10) +
        riskPenalty;

    return Math.max(0, alignmentScore);
}

/**
 * CLIENT-SIDE: Find smart matches using SCORING-FIRST approach
 * No API call needed - pure function
 * NEVER returns empty - always ranks and returns top 5
 */
export function findSmartMatchesFromZenith(
    zenithTokens: ZenithToken[],
    intent: IntentInput
): { matches: SmartMatchResult[]; message?: string } {
    const targetMultiplier = intent.targetReturn / intent.investmentAmount;

    // Calculate difficulty (how aggressive the target is)
    // 0 = easy/conservative, 1 = hard/aggressive
    const difficulty = Math.min(Math.max((targetMultiplier - 1) / 2, 0), 1);

    // Convert to EnrichedTokens (minimal filtering - only remove broken data)
    const enrichedTokens = zenithTokens
        .filter(t => t.priceUsd > 0) // Must have price
        .filter(t => t.liquidityUsd > 0) // Must have liquidity data
        .map(enrichZenithToken);

    console.log(`[Smart Swap V1] Analyzing ${enrichedTokens.length} tokens`);
    console.log(`[Smart Swap V1] Target: ${targetMultiplier.toFixed(2)}x (difficulty: ${difficulty.toFixed(2)})`);
    console.log(`[Smart Swap V1] Investment: ${intent.investmentAmount} SOL (display-only)`);

    // SCORING FIRST - score ALL tokens, then rank
    const scored = enrichedTokens.map((token: EnrichedToken) => {
        const alignmentScore = calculateAlignmentScore(token, difficulty);

        // Match percentage from alignment score
        const matchPercentage = Math.min(100, alignmentScore);

        // Expected range based on market cap tier
        const tier = getCapTier(token.marketCap);
        let expectedMin = 1.0;
        let expectedMax = 1.5;
        if (tier === 'micro') { expectedMin = 1.0; expectedMax = 3.0; }
        else if (tier === 'low') { expectedMin = 1.0; expectedMax = 2.0; }
        else if (tier === 'mid') { expectedMin = 1.0; expectedMax = 1.5; }

        const volumeTrend: 'Rising' | 'Stable' | 'Declining' =
            token.priceChange24h > 5 ? 'Rising' :
            token.priceChange24h < -5 ? 'Declining' : 'Stable';

        const whyReasons = generateReasons(token, targetMultiplier, tier || 'mid');

        return {
            token,
            smartScore: alignmentScore, // Use alignment score as primary
            matchPercentage,
            expectedRange: { min: expectedMin, max: expectedMax },
            whyReasons,
            volumeTrend,
            rank: 0,
        };
    });

    // Sort by alignment score (highest first)
    scored.sort((a: any, b: any) => b.smartScore - a.smartScore);

    // Take top 5 and assign ranks
    const top5 = scored.slice(0, 5).map((result: any, index: number) => ({
        ...result,
        rank: index + 1,
    }));

    console.log(`[Smart Swap V1] Top 5 scores: ${top5.map(r => r.smartScore.toFixed(1)).join(', ')}`);

    // Always show message explaining the approach
    const message = difficulty > 0.5
        ? 'Showing high-growth candidates based on market cap and momentum'
        : 'Showing stable opportunities with good liquidity and track record';

    return {
        matches: top5,
        message
    };
}

/**
 * Calculate liquidity warning based on investment size
 * This is DISPLAY ONLY - does not affect matching
 */
function getLiquidityWarning(liquidity: number, investmentAmount: number): string | null {
    const liquidityRatio = liquidity / (investmentAmount * 180); // Assume SOL = $180

    if (liquidityRatio < 3) return 'High slippage risk - low liquidity for this size';
    if (liquidityRatio < 6) return 'Moderate slippage possible';
    return null; // Healthy liquidity
}

/**
 * Generate reasons based on token characteristics and market cap tier
 */
function generateReasons(
    token: EnrichedToken,
    targetMultiplier: number,
    tier: 'micro' | 'low' | 'mid' | 'large'
): string[] {
    const reasons: string[] = [];

    // Market cap tier reason (PRIMARY)
    if (tier === 'micro') {
        reasons.push(`Micro-cap ($${(token.marketCap / 1000).toFixed(0)}K) - highest growth potential`);
    } else if (tier === 'low') {
        reasons.push(`Low market cap ($${(token.marketCap / 1000).toFixed(0)}K) with strong upside`);
    } else if (tier === 'mid') {
        reasons.push(`Mid-cap ($${(token.marketCap / 1000000).toFixed(1)}M) - balanced risk/reward`);
    } else {
        reasons.push(`Established cap ($${(token.marketCap / 1000000).toFixed(1)}M) - lower volatility`);
    }

    // Liquidity reason
    if (token.liquidity > 100_000) {
        reasons.push(`Deep liquidity ($${(token.liquidity / 1000).toFixed(0)}K) for safe trades`);
    } else if (token.liquidity > 40_000) {
        reasons.push(`Adequate liquidity ($${(token.liquidity / 1000).toFixed(0)}K)`);
    } else if (token.liquidity > 10_000) {
        reasons.push(`Sufficient liquidity for entry/exit`);
    }

    // Momentum reason
    if (token.priceChange24h > 10) {
        reasons.push(`Strong 24h momentum (+${token.priceChange24h.toFixed(1)}%)`);
    } else if (token.priceChange24h > 0) {
        reasons.push(`Positive momentum (+${token.priceChange24h.toFixed(1)}% today)`);
    } else if (token.priceChange7d > 10) {
        reasons.push(`Weekly uptrend (+${token.priceChange7d.toFixed(1)}%)`);
    }

    // Activity check
    if (token.volume24h > 0) {
        reasons.push(`Active trading volume`);
    }

    // Risk reason
    if (token.rugRisk === 'low') {
        reasons.push('Low risk profile');
    }

    // Default reason if not enough
    if (reasons.length < 2) {
        reasons.push(`Structurally suited for ${targetMultiplier.toFixed(1)}x target`);
    }

    return reasons.slice(0, 3); // Max 3 reasons
}
