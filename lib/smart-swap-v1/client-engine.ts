/**
 * Smart Swap V1 - CLIENT-SIDE Scoring Engine
 *
 * Core Rule: Smart Swap is a RANKING ENGINE, not a validator
 * - NO hard rejection
 * - NO "no tokens found"
 * - EVERY token gets a score
 * - Always show TOP 5
 *
 * Flow: Jupiter tokens → normalize → score → rank → display
 */

import { ZenithToken } from '@/lib/zenith';

// ============================================================================
// TYPES
// ============================================================================

export interface NormalizedToken {
    address: string;
    symbol: string;
    name: string;
    logoURI?: string;

    // Normalized fields
    marketCap: number;
    liquidity: number;
    volume24h: number;
    priceChange24h: number;
    priceChange7d: number;
    ageDays: number | null;
}

export interface ScoredToken extends NormalizedToken {
    // Feature scores (0-1)
    capScore: number;
    liquidityScore: number;
    momentumScore: number;
    volumeScore: number;
    ageScore: number;

    // Final score
    smartScore: number;
    matchPercentage: number;

    // Display helpers
    difficulty: number;
    contextLabel: string;
    liquidityWarning: string;
    whyReasons: string[];
}

export interface SmartSwapInput {
    investmentAmount: number;  // in SOL
    targetReturn: number;      // in SOL
}

export interface SmartSwapResult {
    matches: ScoredToken[];
    message: string;
    difficulty: number;
}

// ============================================================================
// STEP 1: NORMALIZATION (MANDATORY)
// ============================================================================

function normalizeToken(t: ZenithToken): NormalizedToken {
    // Estimate market cap from liquidity (if not available)
    const marketCap = t.liquidityUsd > 0
        ? t.liquidityUsd * 20  // Assume ~5% of MC is in liquidity
        : t.priceUsd > 100 ? 10_000_000 : t.priceUsd > 1 ? 1_000_000 : 100_000;

    // Estimate 7d change from 24h
    const priceChange7d = t.priceChange24h * 2.5;

    // Estimate age from address hash (deterministic)
    const hash = t.mint.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const ageDays = (hash % 90) + 7; // 7-97 days

    return {
        address: t.mint,
        symbol: t.symbol,
        name: t.name,
        logoURI: t.logoURI,

        marketCap,
        liquidity: t.liquidityUsd ?? 0,
        volume24h: t.volume24hUsd ?? 0,
        priceChange24h: t.priceChange24h ?? 0,
        priceChange7d,
        ageDays,
    };
}

// ============================================================================
// STEP 2: DIFFICULTY FROM USER INTENT
// ============================================================================

function calculateDifficulty(investment: number, target: number): number {
    const targetMultiplier = target / investment;
    // difficulty = (multiplier - 1) / 10, clamped to 0-1
    // 1→1.2 = 0.02, 1→2 = 0.1, 1→15 = 1.0
    return Math.min(Math.max((targetMultiplier - 1) / 10, 0), 1);
}

// ============================================================================
// STEP 3: FEATURE SCORES (0-1 range)
// ============================================================================

// Market cap score (lower = more upside)
function capScore(mc: number): number {
    if (!mc || mc <= 0) return 0.2;
    return 1 - Math.min(Math.log10(mc) / 9, 1);
}

// Liquidity score (log scaled)
function liquidityScore(liq: number): number {
    if (!liq || liq <= 0) return 0;
    return Math.min(Math.log10(liq) / 6, 1);
}

// Momentum score (direction > magnitude)
function momentumScore(p24: number, p7: number): number {
    const m = (p24 ?? 0) + (p7 ?? 0);
    return Math.min(Math.max(m / 100, 0), 1);
}

// Volume score (confirms interest)
function volumeScore(v: number): number {
    if (!v || v <= 0) return 0;
    return Math.min(Math.log10(v) / 7, 1);
}

// Age score (sweet spot bias: 3-30 days ideal)
function ageScore(days: number | null): number {
    if (days === null) return 0.5;
    if (days < 3) return 0.4;
    if (days < 30) return 1.0;
    if (days < 90) return 0.7;
    return 0.4;
}

// ============================================================================
// STEP 4: THE SMART SWAP FORMULA
// ============================================================================

function calculateSmartScore(token: NormalizedToken, difficulty: number): number {
    const cap = capScore(token.marketCap);
    const liq = liquidityScore(token.liquidity);
    const mom = momentumScore(token.priceChange24h, token.priceChange7d);
    const vol = volumeScore(token.volume24h);
    const age = ageScore(token.ageDays);

    // THE FORMULA:
    // High target (difficulty ~1) → favors low cap + momentum
    // Low target (difficulty ~0) → favors liquidity + stability
    const smartScore =
        cap * (0.4 + 0.4 * difficulty) +      // 0.4-0.8 weight
        mom * 0.25 +                           // 0.25 fixed
        vol * 0.15 +                           // 0.15 fixed
        liq * (0.2 - 0.15 * difficulty) +     // 0.05-0.2 weight
        age * 0.1;                             // 0.1 fixed

    return smartScore;
}

// ============================================================================
// STEP 5: CONTEXT & DISPLAY HELPERS
// ============================================================================

function getContextLabel(difficulty: number): string {
    if (difficulty > 0.7) return "High-growth candidate (high risk)";
    if (difficulty > 0.3) return "Growth-oriented opportunity";
    return "Balanced opportunity";
}

function getLiquidityWarning(liquidity: number, investmentUsd: number): string {
    if (liquidity < investmentUsd * 3) return "High slippage risk";
    if (liquidity < investmentUsd * 6) return "Moderate slippage";
    return "Healthy liquidity";
}

function generateReasons(token: NormalizedToken, difficulty: number): string[] {
    const reasons: string[] = [];

    // Market cap reason
    if (token.marketCap < 200_000) {
        reasons.push(`Micro-cap ($${(token.marketCap / 1000).toFixed(0)}K) - highest upside`);
    } else if (token.marketCap < 1_000_000) {
        reasons.push(`Low cap ($${(token.marketCap / 1000).toFixed(0)}K) - strong potential`);
    } else if (token.marketCap < 5_000_000) {
        reasons.push(`Mid-cap ($${(token.marketCap / 1e6).toFixed(1)}M) - balanced`);
    } else {
        reasons.push(`Established ($${(token.marketCap / 1e6).toFixed(1)}M)`);
    }

    // Momentum
    if (token.priceChange24h > 10) {
        reasons.push(`Strong momentum (+${token.priceChange24h.toFixed(1)}% 24h)`);
    } else if (token.priceChange24h > 0) {
        reasons.push(`Positive trend (+${token.priceChange24h.toFixed(1)}%)`);
    }

    // Liquidity
    if (token.liquidity > 100_000) {
        reasons.push(`Deep liquidity ($${(token.liquidity / 1000).toFixed(0)}K)`);
    } else if (token.liquidity > 30_000) {
        reasons.push(`Good liquidity ($${(token.liquidity / 1000).toFixed(0)}K)`);
    }

    // Volume
    if (token.volume24h > 50_000) {
        reasons.push(`High trading activity`);
    }

    return reasons.slice(0, 3);
}

function getMessage(difficulty: number): string {
    if (difficulty > 0.5) {
        return "Showing high-growth candidates based on market structure and momentum";
    }
    return "Showing stable opportunities aligned with your goal";
}

// ============================================================================
// MAIN: FIND SMART MATCHES (NEVER RETURNS EMPTY)
// ============================================================================

export function findSmartMatches(
    zenithTokens: ZenithToken[],
    input: SmartSwapInput
): SmartSwapResult {
    const difficulty = calculateDifficulty(input.investmentAmount, input.targetReturn);
    const investmentUsd = input.investmentAmount * 180; // Assume SOL = $180

    console.log(`[Smart Swap V1] Investment: ${input.investmentAmount} SOL, Target: ${input.targetReturn} SOL`);
    console.log(`[Smart Swap V1] Difficulty: ${(difficulty * 100).toFixed(1)}%`);

    // Step 1: Normalize all tokens
    const normalized = zenithTokens
        .filter(t => t.priceUsd > 0 && t.liquidityUsd > 0)
        .map(normalizeToken);

    console.log(`[Smart Swap V1] Normalized ${normalized.length} tokens`);

    // Step 2: Score all tokens
    const scored: ScoredToken[] = normalized.map(token => {
        const smart = calculateSmartScore(token, difficulty);

        return {
            ...token,
            capScore: capScore(token.marketCap),
            liquidityScore: liquidityScore(token.liquidity),
            momentumScore: momentumScore(token.priceChange24h, token.priceChange7d),
            volumeScore: volumeScore(token.volume24h),
            ageScore: ageScore(token.ageDays),
            smartScore: smart,
            matchPercentage: Math.round(smart * 100),
            difficulty,
            contextLabel: getContextLabel(difficulty),
            liquidityWarning: getLiquidityWarning(token.liquidity, investmentUsd),
            whyReasons: generateReasons(token, difficulty),
        };
    });

    // Step 3: Rank and take top 5
    scored.sort((a, b) => b.smartScore - a.smartScore);
    const top5 = scored.slice(0, 5);

    console.log(`[Smart Swap V1] Top 5: ${top5.map(t => `${t.symbol}(${t.matchPercentage}%)`).join(', ')}`);

    return {
        matches: top5,
        message: getMessage(difficulty),
        difficulty,
    };
}

// Legacy export for backward compatibility
export { findSmartMatches as findSmartMatchesFromZenith };
