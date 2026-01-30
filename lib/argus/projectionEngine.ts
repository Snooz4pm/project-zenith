/**
 * Market Cap Feasibility & Holder-Aware Projection Engine
 * 
 * This engine calculates the attainability of a target market cap based on:
 * 1. Holder Concentration (Retail vs Whale risk)
 * 2. Liquidity Stress (Price impact potential)
 * 3. Directional Flow (Volume momentum)
 */

// STEP 1 — Define Core Data Models (TypeScript)

export type MarketSnapshot = {
    marketCap: number;
    liquidityUSD: number;
    volume24hUSD: number;
    velocityChangePct: number;
    marketPulse: "STAGNANT" | "ACCELERATING" | "OVERHEATED";
};

export type Holder = {
    address: string;
    supplyPct: number;
};

export type HolderSnapshot = {
    topHolders: Holder[]; // sorted descending
};

// STEP 2 — Holder Risk Metrics

/**
 * Holder Concentration Index (HCI)
 * Sum of supply % held by top holders.
 * interpretation: < 20% distributed, 20-35% moderate, > 35% high concentration
 */
export function calculateHCI(holders: Holder[]): number {
    return holders.reduce((acc, h) => acc + h.supplyPct, 0);
}

/**
 * Dominance Skew (DS)
 * Measures how dominant the top holder is relative to others.
 * Formula: DS = top1% / average(top2-topN%)
 * Interpretation: > 4 dominant whale, > 6 hard sell-side ceiling risk
 */
export function calculateDominanceSkew(holders: Holder[]): number {
    if (holders.length < 2) return 0;

    const top1 = holders[0].supplyPct;
    const others = holders.slice(1);
    const avgOthers =
        others.reduce((acc, h) => acc + h.supplyPct, 0) / others.length;

    if (avgOthers === 0) return top1 > 0 ? 100 : 0;
    return top1 / avgOthers;
}

// STEP 3 — Capital Reality Calculations

/**
 * Required Net Capital: Simple delta between current and target market cap.
 */
export function requiredCapital(currentMC: number, targetMC: number): number {
    return Math.max(0, targetMC - currentMC);
}

/**
 * Effective Daily Flow
 * Assume only 30% of daily volume is directional (net buy/sell pressure).
 */
export function effectiveDailyFlow(volume24hUSD: number): number {
    return volume24hUSD * 0.3;
}

/**
 * Estimated Time to Target (days)
 * requiredCapital / dailyFlow
 */
export function estimateDaysToTarget(
    requiredCapital: number,
    dailyFlow: number
): number {
    if (dailyFlow <= 0) return Infinity;
    return requiredCapital / dailyFlow;
}

// STEP 4 — Liquidity Stress

/**
 * Liquidity Stress Multiplier (LSM)
 * measures how many times the required capital exceeds available liquidity.
 * interpretation: < 10x healthy, 10-25x stress, > 25x extreme
 */
export function liquidityStress(
    requiredCapital: number,
    liquidityUSD: number
): number {
    if (liquidityUSD <= 0) return 100; // Extreme stress if no liquidity
    return requiredCapital / liquidityUSD;
}

// STEP 5 — Market Cap Attainability Score (MCAS)

/**
 * Base MCAS
 * Formula: MCAS = (dailyFlow * 30) / requiredCapital
 * Represents if 30 days of current flow can cover the target gap.
 */
export function baseMCAS(
    dailyFlow: number,
    requiredCapital: number
): number {
    if (requiredCapital <= 0) return 1.0; // Already at or above target
    if (dailyFlow <= 0) return 0.0;
    return Math.min(1.0, (dailyFlow * 30) / requiredCapital);
}

/**
 * Holder Penalty Factor (HPF)
 * Formula: penalty = hci * ds * 0.5; HPF = clamp(1 - penalty, 0, 1)
 */
export function holderPenalty(hci: number, ds: number): number {
    // hci is sum of supplyPct (e.g. 0.4 for 40%)
    // ds is dominance skew (e.g. 4.0)
    const penalty = hci * ds * 0.5;
    return Math.max(0, Math.min(1, 1 - penalty));
}

/**
 * Calculate Final MCAS
 */
export function calculateFinalMCAS(
    market: MarketSnapshot,
    holders: Holder[],
    targetMC: number
): number {
    const reqCap = requiredCapital(market.marketCap, targetMC);
    const flow = effectiveDailyFlow(market.volume24hUSD);

    const base = baseMCAS(flow, reqCap);

    const hci = calculateHCI(holders);
    const ds = calculateDominanceSkew(holders);
    const penalty = holderPenalty(hci, ds);

    return base * penalty;
}

// STEP 6 — Argus Verdict Generator

/**
 * Argus Verdict Generator
 * Converts MCAS + Market Pulse into human-readable insight.
 */
export function argusVerdict(
    mcas: number,
    marketPulse: MarketSnapshot["marketPulse"]
): string {
    if (mcas >= 0.8) {
        if (marketPulse === "ACCELERATING" || marketPulse === "OVERHEATED") {
            return "Highly feasible. Momentum and capital flow align with target trajectory.";
        }
        return "Feasible if momentum persists. Current capital flow is sufficient but requires activation.";
    }

    if (mcas >= 0.3) {
        if (marketPulse === "OVERHEATED") {
            return "Speculative. Target reachable but requires a cooling period followed by sustained growth.";
        }
        if (marketPulse === "ACCELERATING") {
            return "Speculative. Positive momentum detected, but requires sustained inflows and liquidity growth.";
        }
        return "Narrative-driven only. Target requires significant catalyst to bridge current capital gap.";
    }

    if (marketPulse === "ACCELERATING") {
        return "Extremely difficult. Even with acceleration, the market cap gap is too large for current liquidity.";
    }

    return "Catalyst required. Target unlikely under current conditions. High holder risk or extreme liquidity stress.";
}

/**
 * PHASE 2 — Supply-Aware Capital Injection Model
 */

export type CapitalInjectionResult = {
    targetPrice: number;
    availableSupply: number;
    capitalRequired: {
        low: number;
        base: number;
        high: number;
    };
    assumptions: string[];
};

// STEP 1 — Define Supply Buckets

/**
 * Estimates Active Float Percentage
 * Active Float % = 1 - Top10Holder% - LockedSupply%
 */
export function estimateActiveFloatPct(
    top10SupplyPct: number,
    lockedSupplyPct: number = 0.10 // Default to 10% if unknown
): { pct: number; uncertain: boolean } {
    const uncertain = lockedSupplyPct === 0.10;
    // Clamp between 0 and 1
    const pct = Math.max(0, Math.min(1, 1 - top10SupplyPct - lockedSupplyPct));
    return { pct, uncertain };
}

// STEP 2 — Calculate Available Supply

/**
 * Available Supply: The tokens that price must reprice against.
 * AvailableSupply = TotalSupply * ActiveFloatPct
 */
export function calculateAvailableSupply(
    totalSupply: number,
    activeFloatPct: number
): number {
    return totalSupply * activeFloatPct;
}

// STEP 3 — Convert Target Market Cap to Target Price

/**
 * Target Price = TargetMarketCap / TotalSupply
 */
export function calculateTargetPrice(
    targetMC: number,
    totalSupply: number
): number {
    if (totalSupply <= 0) return 0;
    return targetMC / totalSupply;
}

// STEP 4 — Capital Injection Model

/**
 * Capital Required = AvailableSupply * TargetPrice * AbsorptionPct
 * absorptionPct: 0.10 (Low), 0.20 (Base), 0.30 (High)
 */
export function calculateRequiredCapitalInjection(
    availableSupply: number,
    targetPrice: number,
    absorptionPct: number
): number {
    return availableSupply * targetPrice * absorptionPct;
}

// STEP 5 — Output a Capital Range

/**
 * Generates the full Capital Injection Model response.
 */
export function getSupplyAwareModel(
    totalSupply: number,
    targetMC: number,
    top10SupplyPct: number,
    lockedSupplyPct?: number
): CapitalInjectionResult {
    const floatInfo = estimateActiveFloatPct(top10SupplyPct, lockedSupplyPct);
    const availableSupply = calculateAvailableSupply(totalSupply, floatInfo.pct);
    const targetPrice = calculateTargetPrice(targetMC, totalSupply);

    const capitalRequired = {
        low: calculateRequiredCapitalInjection(availableSupply, targetPrice, 0.10),
        base: calculateRequiredCapitalInjection(availableSupply, targetPrice, 0.20),
        high: calculateRequiredCapitalInjection(availableSupply, targetPrice, 0.30),
    };

    const assumptions = [
        `Active float estimated at ${(floatInfo.pct * 100).toFixed(2)}% of total supply.`,
        "Absorption tiers (10%, 20%, 30%) represent the fraction of active float that must be purchased to achieve target price.",
        "Risk: Significant sell-side expansion possible if top holders or locked supply enter the market."
    ];

    if (floatInfo.uncertain) {
        assumptions.push("Warning: Locked supply percentage unknown; defaulted to 10% estimation.");
    }

    return {
        targetPrice,
        availableSupply,
        capitalRequired,
        assumptions,
    };
}
