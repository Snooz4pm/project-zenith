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
    recentTxs: Array<{
        signature: string;
        time: number;
        side: 'BUY' | 'SELL';
        usdValue: number;
        wallet: string;
    }>;
};

/**
 * Step 4 — Recurrent Flow Dominance (RFD)
 * Measures persistent behavior vs fragmented flow.
 * LOCK-IN: Updated Feb 1 2026 as per user specification.
 */
export function calculateRecurrentDominance(
    allTxs: Array<{ wallet: string; side: 'BUY' | 'SELL'; usdValue: number, timestamp: number, signature?: string }>,
    minRepeats = 2
): RecurrentDominanceResult {
    // STEP 1 — HARD WINDOW (NON-NEGOTIABLE)
    const WINDOW_MS = 60 * 60 * 1000; // 1 hour
    const now = Date.now();
    const txs = allTxs.filter(tx => (now - tx.timestamp) <= WINDOW_MS);

    if (txs.length === 0) {
        return {
            recurrentBuyStrength: 0,
            recurrentSellStrength: 0,
            totalBuyUSD: 0,
            totalSellUSD: 0,
            recurrentBuyUSD: 0,
            recurrentSellUSD: 0,
            dominance: 0,
            status: "BALANCED_PARTICIPATION",
            recentTxs: []
        };
    }

    // STEP 2 — AGGREGATE BY WALLET + SIDE
    type Agg = {
        buyCount: number;
        sellCount: number;
        buyUSD: number;
        sellUSD: number;
    };

    const map = new Map<string, Agg>();

    for (const tx of txs) {
        if (!map.has(tx.wallet)) {
            map.set(tx.wallet, {
                buyCount: 0,
                sellCount: 0,
                buyUSD: 0,
                sellUSD: 0
            });
        }

        const a = map.get(tx.wallet)!;
        if (tx.side === "BUY") {
            a.buyCount++;
            a.buyUSD += tx.usdValue;
        } else {
            a.sellCount++;
            a.sellUSD += tx.usdValue;
        }
    }

    // STEP 4 — COMPUTE CAPITAL (NOT COUNTS)
    let totalBuyUSD = 0;
    let totalSellUSD = 0;
    let recurrentBuyUSD = 0;
    let recurrentSellUSD = 0;

    for (const a of map.values()) {
        totalBuyUSD += a.buyUSD;
        totalSellUSD += a.sellUSD;

        if (a.buyCount >= minRepeats) {
            recurrentBuyUSD += a.buyUSD;
        }

        if (a.sellCount >= minRepeats) {
            recurrentSellUSD += a.sellUSD;
        }
    }

    // STEP 5 — FINAL NRD (THIS IS WHAT FILLS THE BAR)
    const denom = totalBuyUSD + totalSellUSD;
    const nrd = denom > 0 ? (recurrentBuyUSD - recurrentSellUSD) / denom : 0;
    const nrdClamped = Math.max(-1, Math.min(1, nrd));

    // STEP 6 — VERIFY (DO THIS ONCE)
    console.log({
        totalBuyUSD,
        totalSellUSD,
        recurrentBuyUSD,
        recurrentSellUSD,
        NRD: nrdClamped
    });

    let status: RecurrentDominanceResult['status'] = "BALANCED_PARTICIPATION";
    if (nrdClamped > 0.25) status = "RECURRENT_BUYERS_DOMINANT";
    else if (nrdClamped < -0.25) status = "RECURRENT_SELLERS_DOMINANT";

    return {
        recurrentBuyStrength: totalBuyUSD ? recurrentBuyUSD / totalBuyUSD : 0,
        recurrentSellStrength: totalSellUSD ? recurrentSellUSD / totalSellUSD : 0,
        totalBuyUSD,
        totalSellUSD,
        recurrentBuyUSD,
        recurrentSellUSD,
        dominance: nrdClamped,
        status,
        recentTxs: txs.map(tx => ({
            signature: tx.signature || 'manual-' + Math.random(),
            time: tx.timestamp,
            side: tx.side,
            usdValue: tx.usdValue,
            wallet: tx.wallet
        }))
    };
}
