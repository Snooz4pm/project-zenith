// STEP 1 — Define Liquidity & AMM Models

export type OrderBookLevel = {
    price: number;
    sizeUSD: number;
};

export type OrderBookSnapshot = {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
    lastPrice: number;
    orderBookAvailable?: boolean;
};

export type AMMLiquidityTier = {
    impactPct: number; // 1, 5, 10
    totalUSD: number;  // Cumulative USD needed to reach this impact
    targetPrice: number;
};

export type AMMVirtualDepth = {
    currentPrice: number;
    tiers: AMMLiquidityTier[];
    buySideUSD: number; // 1% depth
};

// STEP 2 — Immediate Liquidity Wall (ILW)

/**
 * Immediate Liquidity Wall (ILW)
 * Calculates the total capital (USD) required to move the price up 
 * to a specific target based on the ask-side depth.
 */
export function liquidityWall(
    asks: OrderBookLevel[],
    lastPrice: number,
    priceIncreasePct: number
): number {
    const targetPrice = lastPrice * (1 + priceIncreasePct);

    // Sum sizeUSD for all asks with price <= targetPrice
    return asks
        .filter(ask => ask.price <= targetPrice)
        .reduce((sum, ask) => sum + ask.sizeUSD, 0);
}

// STEP 3 — Buy Pressure Estimation

/**
 * Buy Pressure Estimation
 * Estimates demand based on bid-side depth within a small price band (e.g. -1%).
 * bandPct is expressed as a decimal (e.g., 0.01 for 1%).
 */
export function buyPressure(
    bids: OrderBookLevel[],
    lastPrice: number,
    bandPct: number
): number {
    const minPrice = lastPrice * (1 - bandPct);

    // Sum sizeUSD for all bids with price >= minPrice
    return bids
        .filter(bid => bid.price >= minPrice)
        .reduce((sum, bid) => sum + bid.sizeUSD, 0);
}

// STEP 4 — Order Book Absorption Ratio (OBAR)

/**
 * Order Book Absorption Ratio (OBAR)
 * Measures the ratio of buy pressure to sell liquidity.
 * < 0.5 -> Seller-dominant
 * 0.5-1.0 -> Balanced
 * > 1.0 -> Buyer-dominant
 */
export function orderBookAbsorptionRatio(
    buyPressureUSD: number,
    sellLiquidityUSD: number
): number {
    if (sellLiquidityUSD <= 0) return buyPressureUSD > 0 ? 100 : 1; // Safeguard
    return buyPressureUSD / sellLiquidityUSD;
}

// STEP 5 — Capital Progress Toward Target

/**
 * Capital Progress Toward Target
 * Computes how much of the required capital has been "absorbed" 
 * (as represented by buy pressure vs required injection).
 */
export function calculateOrderBookProgress(
    buyPressureUSD: number,
    capitalRequiredToTarget: number
): number {
    if (capitalRequiredToTarget <= 0) return 1.0;
    const progress = buyPressureUSD / capitalRequiredToTarget;
    return Math.max(0, Math.min(1, progress));
}

// STEP 6 — Real-Time Target Proximity Status

export type ProximityStatus = {
    progressPct: number;
    obar: number;
    status: "FAR" | "APPROACHING" | "CLOSE";
    insight: string;
};

/**
 * Target Proximity Status
 * Consolidates OBAR and progress into a human-readable status.
 */
export function targetProximityStatus(
    buyPressureUSD: number,
    sellLiquidityUSD: number,
    capitalRequiredToTarget: number
): ProximityStatus {
    const obar = orderBookAbsorptionRatio(buyPressureUSD, sellLiquidityUSD);
    const progressPct = calculateOrderBookProgress(buyPressureUSD, capitalRequiredToTarget);

    let status: "FAR" | "APPROACHING" | "CLOSE" = "FAR";
    let insight = "Sell-side liquidity dominates. Target unlikely without increased demand.";

    if (progressPct > 0.1 || obar > 1.2) {
        status = "APPROACHING";
        insight = "Buy pressure absorbing resistance. Target approaching.";
    }

    if (progressPct > 0.4 && obar > 1.5) {
        status = "CLOSE";
        insight = "Order book thinning rapidly. Target within reach.";
    }

    // Secondary checks for low OBAR even with progress
    if (obar < 0.5) {
        insight = "Significant sell-side wall detected. Progress stalled.";
    }

    return {
        progressPct,
        obar,
        status,
        insight
    };
}

// STEP 7 — AMM Virtual Depth Modeling

/**
 * Estimates capital required to push price to target using AMM tiers.
 * Uses linear interpolation between tiers if target is in between.
 */
export function estimateAMMCapital(
    tiers: AMMLiquidityTier[],
    targetPrice: number,
    currentPrice: number
): number {
    if (tiers.length === 0) return 0;

    // Sort tiers by impact
    const sortedTiers = [...tiers].sort((a, b) => a.impactPct - b.impactPct);

    // Find flanking tiers
    let lowerTier = { impactPct: 0, totalUSD: 0, targetPrice: currentPrice };
    let upperTier = sortedTiers[sortedTiers.length - 1];

    for (const tier of sortedTiers) {
        if (tier.targetPrice >= targetPrice) {
            upperTier = tier;
            break;
        }
        lowerTier = tier;
    }

    if (targetPrice <= lowerTier.targetPrice) return lowerTier.totalUSD;
    if (targetPrice >= upperTier.targetPrice) return upperTier.totalUSD;

    // Linear interpolation
    const priceRange = upperTier.targetPrice - lowerTier.targetPrice;
    const priceOffset = targetPrice - lowerTier.targetPrice;
    const progress = priceOffset / priceRange;

    const usdRange = upperTier.totalUSD - lowerTier.totalUSD;
    return lowerTier.totalUSD + (usdRange * progress);
}
