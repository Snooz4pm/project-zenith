/**
 * Smart Swap V2 - Roadmap Engine
 *
 * Advanced multi-step token chains with:
 * - Compound ROI calculations
 * - Hold period optimization
 * - Risk-adjusted scoring
 * - 3-5 roadmap generation
 *
 * Flow: Tokens → Filter → Generate Roadmaps → Score → Rank
 */

import { ZenithToken } from '@/lib/zenith';

// ============================================================================
// TYPES
// ============================================================================

export interface EnrichedToken {
    mint: string;
    symbol: string;
    name: string;
    logoURI?: string;

    // Metrics
    currentPrice: number;
    change24h: number;     // % change
    change7d: number;      // % change
    volume24h: number;     // USD
    liquidity: number;     // USD
    volatility: number;    // % (estimated)

    // Computed
    estimatedDailyRoi: number;  // decimal (0.01 = 1%)
    riskLevel: 'low' | 'medium' | 'high';
    riskScore: number;          // 0-10 scale
}

export interface RoadmapStep {
    token: EnrichedToken;
    holdDays: number;
    projectedRoi: number;   // raw before fees
    effectiveRoi: number;   // after 0.4% swap fee
}

export interface Roadmap {
    id: number;
    name: string;
    chain: RoadmapStep[];
    totalDays: number;
    totalRoi: number;       // product of steps
    adjustedRoi: number;    // after risk penalty
    riskScore: number;      // 0-10 avg
    riskLevel: 'low' | 'medium' | 'high';
    score: number;          // final ranking score
}

export interface RoadmapInput {
    investAmount: number;    // in SOL
    targetAmount: number;    // in SOL
    maxDays?: number;        // optional time constraint
}

export interface RoadmapResult {
    roadmaps: Roadmap[];
    requiredRoi: number;
    message: string;
}

// Constants
const SWAP_FEE = 0.004;  // 0.4% per swap
const MIN_DAILY_ROI = 0.005;  // 0.5% fallback
const MAX_HOLD_DAYS = 30;
const MAX_CHAIN_LENGTH = 4;

// ============================================================================
// STEP 1: ENRICH TOKENS
// ============================================================================

function enrichToken(t: ZenithToken): EnrichedToken {
    const change7d = t.priceChange24h * 2.5;  // Estimate from 24h

    // Volatility estimate: absolute weekly change / 7
    const volatility = Math.abs(change7d) / 7;

    // Estimated daily ROI: best of 7d, 24h, or minimum
    const dailyRoi = Math.max(
        change7d / 700,           // 7-day as decimal
        t.priceChange24h / 2400,  // 24h adjusted
        MIN_DAILY_ROI
    );

    // Risk classification
    let riskLevel: 'low' | 'medium' | 'high';
    let riskScore: number;

    if (volatility < 5) {
        riskLevel = 'low';
        riskScore = 2;
    } else if (volatility < 15) {
        riskLevel = 'medium';
        riskScore = 5;
    } else {
        riskLevel = 'high';
        riskScore = 8;
    }

    // Adjust risk for liquidity
    if (t.liquidityUsd < 50000) riskScore += 2;
    else if (t.liquidityUsd < 100000) riskScore += 1;

    riskScore = Math.min(10, riskScore);

    return {
        mint: t.mint,
        symbol: t.symbol,
        name: t.name,
        logoURI: t.logoURI,
        currentPrice: t.priceUsd,
        change24h: t.priceChange24h,
        change7d,
        volume24h: t.volume24hUsd,
        liquidity: t.liquidityUsd,
        volatility,
        estimatedDailyRoi: dailyRoi,
        riskLevel,
        riskScore,
    };
}

// ============================================================================
// STEP 2: FILTER CANDIDATES
// ============================================================================

function filterCandidates(
    tokens: EnrichedToken[],
    requiredRoi: number
): EnrichedToken[] {
    return tokens.filter(t => {
        // Basic viability
        if (t.liquidity < 50000) return false;  // $50k min liquidity
        if (t.volume24h < 100000) return false; // $100k min volume

        // Momentum check
        const hasPositiveMomentum = t.change24h > 0 || t.change7d > 5;
        if (!hasPositiveMomentum) return false;

        // Risk cap for low ROI targets
        if (requiredRoi < 0.1 && t.riskLevel === 'high') return false;

        return true;
    })
        .sort((a, b) => b.estimatedDailyRoi - a.estimatedDailyRoi)
        .slice(0, 100);  // Top 100 candidates
}

// ============================================================================
// STEP 3: CALCULATE HOLD DAYS (Compound Formula)
// ============================================================================

function calculateHoldDays(
    targetRoi: number,
    dailyRoi: number,
    maxDays?: number,
    remainingDays?: number,
    stepsLeft?: number
): number {
    // hold_days = log(1 + target_roi) / log(1 + daily_roi)
    const rawDays = Math.log(1 + targetRoi) / Math.log(1 + dailyRoi);
    let holdDays = Math.round(Math.max(1, Math.min(MAX_HOLD_DAYS, rawDays)));

    // Apply time constraint if provided
    if (maxDays && remainingDays !== undefined && stepsLeft !== undefined) {
        holdDays = Math.min(holdDays, remainingDays / stepsLeft);
    }

    return Math.max(1, Math.round(holdDays));
}

// ============================================================================
// STEP 4: GENERATE ROADMAPS
// ============================================================================

function generateRoadmaps(
    candidates: EnrichedToken[],
    requiredRoi: number,
    maxDays?: number
): Roadmap[] {
    const roadmaps: Roadmap[] = [];
    const names = [
        'High Momentum',
        'Balanced Growth',
        'Aggressive',
        'Conservative',
        'Diversified'
    ];

    // Generate 5 roadmaps with different token selections
    for (let i = 0; i < 5; i++) {
        const chain: RoadmapStep[] = [];
        let remainingRoi = requiredRoi;
        let totalDays = 0;

        // Build chain of 1-3 steps
        const maxSteps = Math.min(3, Math.ceil(requiredRoi / 0.1));  // More steps for higher ROI

        for (let step = 0; step < maxSteps && remainingRoi > 0.01; step++) {
            // Pick token (offset by roadmap index for variety)
            const tokenIndex = i * 3 + step;
            if (tokenIndex >= candidates.length) break;

            const token = candidates[tokenIndex];

            // Calculate target for this step
            const stepsLeft = maxSteps - step;
            const stepTargetRoi = remainingRoi / stepsLeft;

            // Calculate hold days
            const holdDays = calculateHoldDays(
                stepTargetRoi,
                token.estimatedDailyRoi,
                maxDays,
                maxDays ? maxDays - totalDays : undefined,
                stepsLeft
            );

            // Calculate projected ROI: (1 + daily)^days - 1
            const projectedRoi = Math.pow(1 + token.estimatedDailyRoi, holdDays) - 1;
            const effectiveRoi = projectedRoi * (1 - SWAP_FEE);

            chain.push({
                token,
                holdDays,
                projectedRoi,
                effectiveRoi,
            });

            remainingRoi -= effectiveRoi;
            totalDays += holdDays;
        }

        // Only include if we got close to target (within 5%)
        if (chain.length > 0 && remainingRoi < requiredRoi * 0.5) {
            // Calculate totals
            const totalRoi = chain.reduce((acc, s) => acc * (1 + s.effectiveRoi), 1) - 1;
            const avgRiskScore = chain.reduce((sum, s) => sum + s.token.riskScore, 0) / chain.length;

            // Risk adjustment: deduct 2% per risk point
            const adjustedRoi = totalRoi - (avgRiskScore * 0.02);

            // Final score formula
            const score = (adjustedRoi - requiredRoi) * 100 +
                (1 / Math.max(1, totalDays)) * 10 -
                avgRiskScore;

            // Risk level from average
            let riskLevel: 'low' | 'medium' | 'high';
            if (avgRiskScore < 3) riskLevel = 'low';
            else if (avgRiskScore < 6) riskLevel = 'medium';
            else riskLevel = 'high';

            roadmaps.push({
                id: i + 1,
                name: names[i] || `Roadmap ${i + 1}`,
                chain,
                totalDays,
                totalRoi,
                adjustedRoi,
                riskScore: Math.round(avgRiskScore * 10) / 10,
                riskLevel,
                score: Math.round(score * 10) / 10,
            });
        }
    }

    // Sort by score and return top 3
    roadmaps.sort((a, b) => b.score - a.score);
    return roadmaps.slice(0, 3);
}

// ============================================================================
// MAIN: FIND ROADMAPS
// ============================================================================

export function findRoadmaps(
    zenithTokens: ZenithToken[],
    input: RoadmapInput
): RoadmapResult {
    const requiredRoi = (input.targetAmount - input.investAmount) / input.investAmount;

    console.log(`[Roadmap V2] Input: ${input.investAmount} SOL → ${input.targetAmount} SOL`);
    console.log(`[Roadmap V2] Required ROI: ${(requiredRoi * 100).toFixed(1)}%`);

    // Step 1: Enrich tokens
    const enriched = zenithTokens
        .filter(t => t.priceUsd > 0 && t.liquidityUsd > 0)
        .map(enrichToken);

    console.log(`[Roadmap V2] Enriched ${enriched.length} tokens`);

    // Step 2: Filter candidates
    const candidates = filterCandidates(enriched, requiredRoi);
    console.log(`[Roadmap V2] Filtered to ${candidates.length} candidates`);

    // Step 3: Generate roadmaps
    const roadmaps = generateRoadmaps(candidates, requiredRoi, input.maxDays);
    console.log(`[Roadmap V2] Generated ${roadmaps.length} roadmaps`);

    // Message based on results
    let message: string;
    if (roadmaps.length === 0) {
        message = "No viable roadmaps found. Try lowering your target or extending timeline.";
    } else if (requiredRoi > 0.5) {
        message = "High-growth roadmaps—expect significant volatility and risk.";
    } else if (requiredRoi > 0.2) {
        message = "Moderate-growth paths with balanced risk/reward.";
    } else {
        message = "Conservative roadmaps prioritizing stability over speed.";
    }

    return {
        roadmaps,
        requiredRoi,
        message,
    };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export function formatRoadmapTable(roadmaps: Roadmap[]): string {
    if (roadmaps.length === 0) return "No roadmaps generated.";

    let table = "| # | Name | Chain | Days | ROI | Risk | Score |\n";
    table += "|---|------|-------|------|-----|------|-------|\n";

    for (const r of roadmaps) {
        const chainStr = r.chain
            .map(s => `${s.token.symbol} (${s.holdDays}d, +${(s.effectiveRoi * 100).toFixed(0)}%)`)
            .join(' → ');

        table += `| ${r.id} | ${r.name} | ${chainStr} | ${r.totalDays} | +${(r.adjustedRoi * 100).toFixed(0)}% | ${r.riskLevel} (${r.riskScore}) | ${r.score} |\n`;
    }

    return table;
}
