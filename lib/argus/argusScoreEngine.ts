/**
 * Argus Reality & MCAS Engine v3.1
 * 
 * Single source of truth for empirical market modeling,
 * transaction-derived capital reqs, and confidence scoring.
 */

import { TxDerivedMetrics, MCASResult, SimulationResult } from './liquidityEngine';

export type SwapTx = {
    timestamp: number;
    side: "BUY" | "SELL";
    usdValue: number;
    price: number;
    wallet: string;
};

export type PoolState = {
    reserveToken: number;
    reserveUSD: number;
};

export type CurvePoint = {
    cumulativeUSD: number;
    price: number;
};

export type TrajectoryPoint = {
    cumulativeUSD: number;
    price: number;
    timestamp: number;
};

export type TrajectoryParams = {
    p0: number;
    a: number;
    b: number;
};

export type HolderMetrics = {
    holderPenalty: number; // 0–1
};

export type MarketMetrics = {
    liquidityUSD: number;
    volume24hUSD: number;
    effectiveDailyFlowUSD: number;
};

// --- CORE UTILS ---

function clamp(v: number, min = 0, max = 1) {
    return Math.max(min, Math.min(max, v));
}

// --- PART 1: TRANSACTION-DERIVED CAPITAL MODEL ---

export function netBuyPressureUSD(txs: SwapTx[]): number {
    return txs.reduce((acc, tx) => {
        return acc + (tx.side === "BUY" ? tx.usdValue : -tx.usdValue);
    }, 0);
}

export function capitalPerOnePercentMove(
    txs: SwapTx[],
    startPrice: number,
    endPrice: number
): number | null {
    const priceImpactPct = (endPrice - startPrice) / startPrice;
    if (priceImpactPct <= 0) return null;

    const netBuy = netBuyPressureUSD(txs);
    if (netBuy <= 0) return null;

    return netBuy / (priceImpactPct * 100);
}

export function projectCapitalRequired({
    capitalPer1Pct,
    currentPrice,
    targetMarketCap,
    totalSupply
}: {
    capitalPer1Pct: number;
    currentPrice: number;
    targetMarketCap: number;
    totalSupply: number;
}): number {
    const targetPrice = targetMarketCap / totalSupply;
    const priceIncreasePct = (targetPrice - currentPrice) / currentPrice;

    if (priceIncreasePct <= 0) return 0;
    return capitalPer1Pct * priceIncreasePct;
}

// --- PART 2: CONFIDENCE SCORING ---

export function volumeConfidence(volume24h: number): number {
    if (volume24h > 5000000) return 1;
    if (volume24h > 1000000) return 0.8;
    if (volume24h > 250000) return 0.5;
    return 0.2;
}

export function tradeCountConfidence(tradeCount: number): number {
    if (tradeCount > 2000) return 1;
    if (tradeCount > 500) return 0.8;
    if (tradeCount > 100) return 0.5;
    return 0.2;
}

export function directionalityConfidence(netBuy: number, totalVolume: number): number {
    if (totalVolume === 0) return 0.1;
    const ratio = Math.abs(netBuy) / totalVolume;
    if (ratio > 0.6) return 1;
    if (ratio > 0.35) return 0.7;
    if (ratio > 0.2) return 0.4;
    return 0.2;
}

export function ammExpectedPriceImpactPct(
    capitalUSD: number,
    liquidityUSD: number
): number {
    if (liquidityUSD <= 0) return 0;
    return capitalUSD / (2 * liquidityUSD);
}

export function ammTxConsistencyScore({
    txCapitalPer1Pct,
    liquidityUSD
}: {
    txCapitalPer1Pct: number;
    liquidityUSD: number;
}): number {
    const ammCapitalPer1Pct = liquidityUSD * 0.02; // inverse of impact approx
    if (ammCapitalPer1Pct === 0) return 0.2;

    const ratio = txCapitalPer1Pct / ammCapitalPer1Pct;

    if (ratio >= 0.5 && ratio <= 2) return 1.0;     // consistent
    if (ratio >= 0.25 && ratio <= 4) return 0.7;
    if (ratio >= 0.1 && ratio <= 10) return 0.4;
    return 0.2;                                     // suspicious
}

// --- PART 3: WASH TRADING PENALTY ---

export function walletConcentrationScore(volumeByWallet: { [wallet: string]: number }): number {
    const volumes = Object.values(volumeByWallet);
    const total = volumes.reduce((a, b) => a + b, 0);
    if (total === 0) return 1;

    const top3 = volumes
        .sort((a, b) => b - a)
        .slice(0, 3)
        .reduce((a, b) => a + b, 0);

    const ratio = top3 / total;

    if (ratio < 0.25) return 1;
    if (ratio < 0.4) return 0.7;
    if (ratio < 0.6) return 0.4;
    return 0.2;
}

export function washTradingPenalty({
    concentrationScore,
    temporalScore // simplified placeholder for now
}: {
    concentrationScore: number;
    temporalScore: number;
}): number {
    return 0.6 * concentrationScore + 0.4 * temporalScore;
}

// --- PART 4: MCAS v3.1 MERGE ---

export function computeMCASv31({
    market,
    tx,
    holders,
    currentPrice,
    targetMarketCap,
    totalSupply
}: {
    market: MarketMetrics;
    tx: TxDerivedMetrics;
    holders: HolderMetrics;
    currentPrice: number;
    targetMarketCap: number;
    totalSupply: number;
}): MCASResult {
    if (!tx.capitalPer1Pct || tx.capitalPer1Pct <= 0) {
        return {
            mcas: 0,
            capitalRequiredUSD: 0,
            confidence: 0,
            verdict: "Insufficient data to evaluate target"
        };
    }

    const capitalRequiredUSD = projectCapitalRequired({
        capitalPer1Pct: tx.capitalPer1Pct,
        currentPrice,
        targetMarketCap,
        totalSupply
    });

    const feasibility =
        (market.effectiveDailyFlowUSD * 30) /
        Math.max(capitalRequiredUSD, 1);

    const mcas =
        feasibility *
        holders.holderPenalty *
        tx.txConfidence *
        tx.ammConsistency *
        tx.washPenalty;

    const confidence =
        tx.txConfidence * tx.ammConsistency * tx.washPenalty;

    return {
        mcas,
        capitalRequiredUSD,
        confidence,
        verdict: mcasVerdict(mcas)
    };
}

function mcasVerdict(mcas: number): string {
    if (mcas < 0.15)
        return "Statistically unlikely without a major catalyst.";

    if (mcas < 0.4)
        return "Narrative-driven. Requires sustained inflows and favorable holder behavior.";

    if (mcas < 1.0)
        return "Speculative but possible under current conditions.";

    return "Structurally attainable if current momentum persists.";
}

// --- PART 5: "WHAT MUST CHANGE" SIMULATOR ---

export function simulateWhatMustChange({
    base,
    targetMCAS = 0.4
}: {
    base: {
        effectiveDailyFlowUSD: number;
        holderPenalty: number;
        txConfidence: number;
        ammConsistency: number;
        washPenalty: number;
        capitalRequiredUSD: number;
    };
    targetMCAS?: number;
}): SimulationResult {
    const baseFeasibility =
        (base.effectiveDailyFlowUSD * 30) /
        Math.max(base.capitalRequiredUSD, 1);

    const currentMCAS =
        baseFeasibility *
        base.holderPenalty *
        base.txConfidence *
        base.ammConsistency *
        base.washPenalty;

    const multiplierNeeded = targetMCAS / Math.max(currentMCAS, 0.0001);

    return {
        liquidityIncreaseRequired: multiplierNeeded,
        volumeIncreaseRequired: multiplierNeeded,
        holderImprovementRequired: clamp(
            base.holderPenalty * multiplierNeeded,
            0,
            1
        ),
        washTradingReductionRequired:
            multiplierNeeded > 1 ? "Significant" : "Minor"
    };
}

// --- PART 6: MOMENTUM & TREND DECAY (PHASE 10) ---

export type TrendState = "STRONG" | "WEAKENING" | "DECAYING";

/**
 * Live net inflow rate (from transactions)
 */
export function netInflowPerHour(
    txs: SwapTx[],
    windowHours: number
): number {
    const netBuy = txs.reduce(
        (s, tx) => s + (tx.side === "BUY" ? tx.usdValue : -tx.usdValue),
        0
    );
    return netBuy / Math.max(windowHours, 1);
}

/**
 * Calculates hourly flow rate based on actual transaction timestamps
 */
export function calculateLiveInflowRate(txs: SwapTx[]): number {
    if (txs.length < 2) return 0;
    const sorted = [...txs].sort((a, b) => a.timestamp - b.timestamp);
    const durationMs = sorted[sorted.length - 1].timestamp - sorted[0].timestamp;

    // Safety: ignore if data span is too short ( < 30s)
    if (durationMs < 30000) return 0;

    const netBuy = sorted.reduce((s, tx) => s + (tx.side === "BUY" ? tx.usdValue : -tx.usdValue), 0);
    const durationHours = durationMs / (3600 * 1000);
    return netBuy / durationHours;
}

/**
 * Time-to-Target (hours)
 */
export function timeToTargetHours(
    capitalRequiredUSD: number,
    netInflowPerHourUSD: number
): number | null {
    if (netInflowPerHourUSD <= 0) return null;
    return capitalRequiredUSD / netInflowPerHourUSD;
}

export function etaDateFromNow(hours: number): Date {
    return new Date(Date.now() + hours * 3600 * 1000);
}

/**
 * Gatekeeper (when we're allowed to show an ETA)
 */
export function canShowMomentumETA({
    netInflowPerHourUSD,
    mcas,
    txConfidence,
    ammConsistency,
    washPenalty
}: {
    netInflowPerHourUSD: number;
    mcas: number;
    txConfidence: number;
    ammConsistency: number;
    washPenalty: number;
}): boolean {
    return (
        netInflowPerHourUSD > 0 &&
        mcas >= 0.4 &&
        txConfidence >= 0.6 &&
        ammConsistency >= 0.6 &&
        washPenalty >= 0.6
    );
}

/**
 * Compute the specific momentum ETA
 */
export function computeMomentumETA({
    capitalRequiredUSD,
    txs,
    windowHours,
    gates
}: {
    capitalRequiredUSD: number;
    txs: SwapTx[];
    windowHours: number;
    gates: {
        mcas: number;
        txConfidence: number;
        ammConsistency: number;
        washPenalty: number;
    };
}): { eta: Date; hours: number } | null {
    const inflow = calculateLiveInflowRate(txs);

    if (
        !canShowMomentumETA({
            netInflowPerHourUSD: inflow,
            ...gates
        })
    ) {
        return null;
    }

    const hours = timeToTargetHours(capitalRequiredUSD, inflow);
    if (!hours || !isFinite(hours) || hours > 24 * 30) return null; // Cap at 30 days

    return { eta: etaDateFromNow(hours), hours };
}

// --- TREND DECAY SIGNALS ---

/**
 * Inflow slope (is net buying slowing?)
 */
export function inflowSlope(
    inflows: number[] // net inflow per bucket, ordered old→new
): number {
    if (inflows.length < 2) return 0;
    const deltas = inflows.slice(1).map((v, i) => v - inflows[i]);
    return deltas.reduce((a, b) => a + b, 0) / deltas.length;
}

/**
 * Buy/Sell balance erosion
 */
export function directionalityErosion(
    netBuyUSD: number,
    totalVolumeUSD: number
): number {
    if (totalVolumeUSD <= 0) return 1;
    const ratio = Math.abs(netBuyUSD) / totalVolumeUSD;
    return ratio;
}

/**
 * AMM slippage deterioration (buyers paying more for less)
 */
export function slippageDeterioration(
    recentImpactPct: number,
    baselineImpactPct: number
): number {
    if (baselineImpactPct <= 0) return 1;
    const ratio = recentImpactPct / baselineImpactPct;
    if (ratio <= 1) return 1;
    if (ratio <= 1.5) return 0.7;
    if (ratio <= 2.0) return 0.4;
    return 0.2;
}

/**
 * Composite Trend Health (0–1)
 */
export function trendHealthScore({
    slope,
    directionality,
    slippageScore
}: {
    slope: number;
    directionality: number;
    slippageScore: number;
}): number {
    const slopeScore =
        slope > 0 ? 1 : slope === 0 ? 0.6 : 0.3;

    const dirScore =
        directionality > 0.4 ? 1 :
            directionality > 0.25 ? 0.6 : 0.3;

    return 0.4 * slopeScore + 0.3 * dirScore + 0.3 * slippageScore;
}

export function trendStateFromHealth(h: number): TrendState {
    if (h >= 0.7) return "STRONG";
    if (h >= 0.45) return "WEAKENING";
    return "DECAYING";
}

// --- PART 7: BOND CURVE MECHANICS (PHASE 11) ---

/**
 * Calculates price after a USD buy injection
 */
export function priceAfterBuy(
    pool: PoolState,
    usdIn: number
): number {
    const k = pool.reserveToken * pool.reserveUSD;
    const newUSD = pool.reserveUSD + usdIn;
    const newToken = k / newUSD;
    return newUSD / newToken;
}

/**
 * Calculates price after tokens are sold back to pool
 */
export function priceAfterSell(
    pool: PoolState,
    tokenIn: number
): number {
    const k = pool.reserveToken * pool.reserveUSD;
    const newToken = pool.reserveToken + tokenIn;
    const newUSD = k / newToken;
    return newUSD / newToken;
}

/**
 * Replays real transactions on a constant-product AMM curve
 */
export function buildBondCurveFromTxs(
    pool: PoolState,
    txs: SwapTx[]
): CurvePoint[] {
    let state = { ...pool };
    let cumulativeUSD = 0;
    const curve: CurvePoint[] = [];

    // Add baseline
    curve.push({
        cumulativeUSD: 0,
        price: state.reserveUSD / state.reserveToken
    });

    for (const tx of txs) {
        if (tx.side === "BUY") {
            cumulativeUSD += tx.usdValue;
            state.reserveUSD += tx.usdValue;
            state.reserveToken =
                (pool.reserveToken * pool.reserveUSD) /
                state.reserveUSD;
        } else {
            // Estimate tokens from USD value at current state price
            const tokenOut = (tx.usdValue / (state.reserveUSD / state.reserveToken));
            cumulativeUSD -= tx.usdValue;
            state.reserveToken += tokenOut;
            state.reserveUSD =
                (pool.reserveToken * pool.reserveUSD) /
                state.reserveToken;
        }

        curve.push({
            cumulativeUSD,
            price: state.reserveUSD / state.reserveToken
        });
    }

    return curve.sort((a, b) => a.cumulativeUSD - b.cumulativeUSD);
}

/**
 * Capital required to reach target price on the curve
 */
export function getCapitalAtTarget(
    curve: CurvePoint[],
    targetPrice: number
): number | null {
    const match = curve.find(p => p.price >= targetPrice);
    return match ? match.cumulativeUSD : null;
}

// --- PART 8: EMPIRICAL CAPITAL TRAJECTORY (PHASE 12) ---

/**
 * Converts transactions into cumulative capital trajectory points
 */
export function buildCapitalTrajectory(txs: SwapTx[]): TrajectoryPoint[] {
    if (txs.length === 0) return [];

    // Sort by timestamp
    const sorted = [...txs].sort((a, b) => a.timestamp - b.timestamp);

    let cumulativeUSD = 0;
    const trajectory: TrajectoryPoint[] = [];

    for (const tx of sorted) {
        cumulativeUSD += tx.side === "BUY" ? tx.usdValue : -tx.usdValue;

        trajectory.push({
            cumulativeUSD,
            price: tx.price,
            timestamp: tx.timestamp
        });
    }

    return trajectory;
}

/**
 * Fits a logarithmic trajectory to empirical transaction data:
 * P(C) = P0 + a * ln(1 + b * C)
 */
export function fitLogTrajectory(points: TrajectoryPoint[]): TrajectoryParams {
    if (points.length === 0) return { p0: 0, a: 0, b: 0 };

    const p0 = points[0].price;

    // Simple heuristic fit for Phase 12
    // We look at the total growth and total net capital
    const maxC = Math.max(...points.map(p => Math.abs(p.cumulativeUSD)), 1);
    const maxP = Math.max(...points.map(p => p.price));

    // a = (deltaP) / ln(1 + b * maxC)
    // We assume b is related to current liquidity depth
    const b = 1 / maxC;
    const a = (maxP - p0) / Math.log(1 + b * maxC || 1.000001);

    return { p0, a, b };
}

/**
 * Predicts price for a given net capital injection using the logarithmic model
 */
export function trajectoryPrice(
    capitalUSD: number,
    params: TrajectoryParams
): number {
    const { p0, a, b } = params;
    // Log model only handles positive/growth capital for prediction
    return p0 + a * Math.log(1 + b * Math.max(capitalUSD, 0));
}

/**
 * Calculates capital required to reach a target price based on behavioral history
 */
export function capitalNeededForPrice(
    targetPrice: number,
    params: TrajectoryParams
): number | null {
    const { p0, a, b } = params;
    if (targetPrice <= p0 || a <= 0) return 0;

    // Solve P = p0 + a * ln(1 + b*C) for C
    // (P - p0)/a = ln(1 + b*C)
    // exp((P - p0)/a) - 1 = b*C
    // C = (exp((P - p0)/a) - 1) / b
    return (Math.exp((targetPrice - p0) / a) - 1) / b;
}
