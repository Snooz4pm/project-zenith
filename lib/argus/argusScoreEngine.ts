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
