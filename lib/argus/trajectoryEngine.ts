/**
 * Trajectory Engine - ONE Coherent Math Module
 * (C) 2026 ZENITHSCORES - BRUTAL REALITY MODE
 */

export type MarketSnapshot = {
    currentPrice: number;        // P0
    targetPrice: number;         // PT
    liquidityUSD: number;        // L
    inflowPerHourUSD: number;    // F (can be negative)
};

export type TxStats = {
    maxBuyCapitalUSD: number;    // max cumulative buy pressure observed
    maxSellCapitalUSD: number;   // max cumulative sell pressure observed
    maxUpPriceMove: number;      // max observed upside move
    maxDownPriceMove: number;    // max observed downside move
};

/**
 * Step 1 — Unconditional AMM Baseline (never zero)
 */
export function ammPriceSensitivity(
    price: number,
    liquidityUSD: number
): number {
    if (liquidityUSD <= 0) return 0;
    return Math.max(price / (2 * liquidityUSD), 1e-12);
}

/**
 * Step 2 — Capital Required for Target
 */
export function capitalRequiredForTarget(
    currentPrice: number,
    targetPrice: number,
    sensitivity: number
): number {
    const delta = targetPrice - currentPrice;
    if (delta <= 0) return 0;
    if (sensitivity <= 0) return Infinity;
    return delta / sensitivity;
}

/**
 * Step 3 — Momentum Projection (ETA)
 */
export function momentumETA(
    capitalRequired: number,
    inflowPerHourUSD: number
): number | null {
    if (inflowPerHourUSD <= 0) return null;
    return capitalRequired / inflowPerHourUSD;
}

/**
 * Fits trajectory coefficients (safe & bounded)
 * From Max Observed Move & Max Observed Capital
 */
export function fitTrajectoryCoefficients(
    maxCapital: number,
    maxPriceMove: number
) {
    if (maxCapital <= 0 || maxPriceMove <= 0) {
        return { alpha: 0, beta: 0 };
    }

    // alpha = deltaP / ln(1 + C_max)
    const alpha = maxPriceMove / Math.log(1 + maxCapital);
    const beta = 1 / maxCapital;

    return { alpha, beta };
}

/**
 * Bull trajectory (buy-driven)
 */
export function bullPrice(
    basePrice: number,
    capitalUSD: number,
    alpha: number,
    beta: number
) {
    return basePrice + alpha * Math.log(1 + beta * capitalUSD);
}

/**
 * Bear trajectory (sell-driven)
 */
export function bearPrice(
    basePrice: number,
    capitalUSD: number,
    alpha: number,
    beta: number
) {
    return basePrice - alpha * Math.log(1 + beta * capitalUSD);
}

/**
 * Capital needed to reach a price (invert curve)
 */
export function capitalForPrice(
    priceDelta: number,
    alpha: number,
    beta: number
): number {
    if (alpha <= 0 || beta <= 0) return Infinity;
    return (Math.exp(Math.abs(priceDelta) / alpha) - 1) / beta;
}

export type RecurrentDominanceResult = {
    recurrentBuyStrength: number;
    recurrentSellStrength: number;
    totalBuyUSD: number;
    totalSellUSD: number;
    recurrentBuyUSD: number;
    recurrentSellUSD: number;
    dominance: number; // NRD
    status: "RECURRENT_BUYERS_DOMINANT" | "RECURRENT_SELLERS_DOMINANT" | "BALANCED_PARTICIPATION";
};

/**
 * Step 4 — Recurrent Flow Dominance (RFD)
 * Measures persistent behavior vs fragmented flow.
 */
export function calculateRecurrentDominance(
    txs: Array<{ wallet: string; side: 'BUY' | 'SELL'; usdValue: number }>,
    minRepeats = 2
): RecurrentDominanceResult {
    const buyMap = new Map<string, { total: number; count: number }>();
    const sellMap = new Map<string, { total: number; count: number }>();

    for (const tx of txs) {
        const map = tx.side === "BUY" ? buyMap : sellMap;
        const current = map.get(tx.wallet) || { total: 0, count: 0 };
        map.set(tx.wallet, {
            total: current.total + tx.usdValue,
            count: current.count + 1
        });
    }

    const B = [...buyMap.values()].reduce((a, b) => a + b.total, 0);
    const S = [...sellMap.values()].reduce((a, b) => a + b.total, 0);

    const Br = [...buyMap.values()]
        .filter(v => v.count >= minRepeats)
        .reduce((a, b) => a + b.total, 0);

    const Sr = [...sellMap.values()]
        .filter(v => v.count >= minRepeats)
        .reduce((a, b) => a + b.total, 0);

    const totalVolume = Math.max(B + S, 1);
    const nrd = (Br - Sr) / totalVolume;

    let status: RecurrentDominanceResult['status'] = "BALANCED_PARTICIPATION";
    if (nrd > 0.25) status = "RECURRENT_BUYERS_DOMINANT";
    else if (nrd < -0.25) status = "RECURRENT_SELLERS_DOMINANT";

    return {
        recurrentBuyStrength: B ? Br / B : 0,
        recurrentSellStrength: S ? Sr / S : 0,
        totalBuyUSD: B,
        totalSellUSD: S,
        recurrentBuyUSD: Br,
        recurrentSellUSD: Sr,
        dominance: nrd,
        status
    };
}
