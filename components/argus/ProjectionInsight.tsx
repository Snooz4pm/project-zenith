'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    Coins,
    ShieldAlert,
    Info,
    Target,
    Zap,
    TrendingUp,
    FlaskConical,
    Timer
} from 'lucide-react';
import {
    calculateFinalMCAS,
    argusVerdict,
    getSupplyAwareModel,
    MarketSnapshot,
    Holder
} from '@/lib/argus/projectionEngine';
import {
    liquidityWall,
    buyPressure,
    orderBookAbsorptionRatio,
    targetProximityStatus,
    AMMVirtualDepth,
    estimateAMMCapital,
    TxDerivedMetrics,
    OrderBookSnapshot,
    MCASResult,
    SimulationResult,
    TrendState
} from '@/lib/argus/liquidityEngine';
import {
    computeMCASv31,
    simulateWhatMustChange,
    computeMomentumETA,
    calculateLiveInflowRate,
    netInflowPerHour,
    trendHealthScore,
    trendStateFromHealth,
    buildCapitalTrajectory,
    fitLogTrajectory,
    capitalNeededForPrice,
    instantPriceSensitivity,
    instantCapitalRequired,
    ammBaselineTrajectory,
    empiricalTrajectory,
    blendTrajectory
} from '@/lib/argus/argusScoreEngine';

interface ProjectionInsightProps {
    currentPrice: number;
    circulatingSupply: number;
    targetPrice: number;
    symbol: string;
    liquidity: number;
    volume24h: number;
    holders: {
        address: string;
        amount: number;
        pct: number;
    }[];
    marketPulse: "STAGNANT" | "ACCELERATING" | "OVERHEATED";
    orderBook?: OrderBookSnapshot;
    ammDepth?: AMMVirtualDepth;
    reality?: TxDerivedMetrics;
}

const formatUSD = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return '$0.00';
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
};

export const ProjectionInsight: React.FC<ProjectionInsightProps> = ({
    currentPrice,
    circulatingSupply,
    targetPrice,
    symbol,
    liquidity,
    volume24h,
    holders,
    marketPulse,
    orderBook,
    ammDepth,
    reality
}) => {
    const marketSnapshot: MarketSnapshot = {
        marketCap: currentPrice * circulatingSupply,
        liquidityUSD: liquidity,
        volume24hUSD: volume24h,
        velocityChangePct: 0, // Placeholder if not available
        marketPulse
    };

    const projectionHolders: Holder[] = holders.map(h => ({
        address: h.address,
        supplyPct: h.pct / 100
    }));

    const targetMC = targetPrice * circulatingSupply;

    const mcas = useMemo(() => {
        return calculateFinalMCAS(marketSnapshot, projectionHolders, targetMC);
    }, [marketSnapshot, projectionHolders, targetMC]);

    const verdict = useMemo(() => {
        return argusVerdict(mcas, marketPulse);
    }, [mcas, marketPulse]);

    const supplyModel = useMemo(() => {
        const top10Pct = projectionHolders.slice(0, 10).reduce((acc, h) => acc + h.supplyPct, 0);
        return getSupplyAwareModel(circulatingSupply, targetMC, top10Pct);
    }, [circulatingSupply, targetMC, projectionHolders]);

    // PART 1: Enhanced MCAS v3.1 Logic
    const mcasModel = useMemo(() => {
        if (!reality || !reality.capitalPer1Pct) return null;

        const holderPenalty = 0.8; // Hook up to distributionScorer in future

        return computeMCASv31({
            market: {
                liquidityUSD: reality.metrics.liquidityUSD,
                volume24hUSD: reality.metrics.volume24hUSD,
                effectiveDailyFlowUSD: reality.metrics.volume24hUSD * 0.15 // 15% flow heuristic
            },
            tx: reality,
            holders: { holderPenalty },
            currentPrice,
            targetMarketCap: targetPrice * circulatingSupply,
            totalSupply: circulatingSupply
        });
    }, [reality, currentPrice, targetPrice, circulatingSupply]);

    // PART 2: Simulator (What Must Change)
    const simulation = useMemo(() => {
        if (!mcasModel || !reality) return null;

        return simulateWhatMustChange({
            base: {
                effectiveDailyFlowUSD: reality.metrics.volume24hUSD * 0.15,
                holderPenalty: 0.8,
                txConfidence: reality.txConfidence,
                ammConsistency: reality.ammConsistency,
                washPenalty: reality.washPenalty,
                capitalRequiredUSD: mcasModel.capitalRequiredUSD
            },
            targetMCAS: 0.4 // Goal threshold
        });
    }, [mcasModel, reality]);

    // Order Book Logic
    const obModel = useMemo(() => {
        if (!orderBook || orderBook.orderBookAvailable === false) return null;

        const priceIncreasePct = (targetPrice / currentPrice) - 1;
        const wallUSD = liquidityWall(orderBook.asks, currentPrice, priceIncreasePct);
        const buyUSD = buyPressure(orderBook.bids, currentPrice, 0.01); // 1% band

        return targetProximityStatus(buyUSD, wallUSD, supplyModel.capitalRequired.base);
    }, [orderBook, currentPrice, targetPrice, supplyModel.capitalRequired.base]);

    // PART 3: Momentum & Trend Decay (Phase 10)
    const trendState = useMemo(() => {
        if (!reality || !reality.recentTxs) return { state: "DECAYING", score: 0 };

        // 1. Directionality Erosion (Live snapshot)
        const txs = reality.recentTxs.map(tx => ({
            timestamp: tx.time, side: tx.side as "BUY" | "SELL", usdValue: tx.usdValue, price: currentPrice, wallet: tx.wallet
        }));

        const liveInflow = calculateLiveInflowRate(txs);
        const liveVol = txs.reduce((s, tx) => s + tx.usdValue, 0);
        const directionality = liveVol > 0 ? Math.abs(liveInflow) / (liveVol * 2) : 0; // Simplified ratio

        // 2. Slope (Is current live flow accelerating vs 24h average?)
        const avg24hInflow = reality.metrics.netBuyUSD / 24;
        const slope = liveInflow > avg24hInflow ? 1 : 0;

        // 3. Slippage Deterioration (AMM Consistency is a good proxy)
        const slippageScore = reality.ammConsistency;

        const score = trendHealthScore({ slope, directionality, slippageScore });
        return {
            state: trendStateFromHealth(score),
            score
        };
    }, [reality, currentPrice]);

    const momentumETA = useMemo(() => {
        if (!reality || !mcasModel || !reality.recentTxs || trendState.state === "DECAYING") return null;

        // Convert recentTxs to SwapTx format for computeMomentumETA
        const txs = reality.recentTxs.map(tx => ({
            timestamp: tx.time,
            side: tx.side as "BUY" | "SELL",
            usdValue: tx.usdValue,
            price: currentPrice, // Approximate
            wallet: tx.wallet
        }));

        return computeMomentumETA({
            capitalRequiredUSD: mcasModel.capitalRequiredUSD,
            txs,
            windowHours: 1, // Parameter now ignored by internal call to calculateLiveInflowRate
            gates: {
                mcas: mcasModel.mcas,
                txConfidence: reality.txConfidence,
                ammConsistency: reality.ammConsistency,
                washPenalty: reality.washPenalty
            }
        });
    }, [reality, mcasModel, trendState, currentPrice]);

    // PART 4: Blended Trajectory Logic (GPS-Style)
    // DESIGN PRINCIPLE: Empirical data refines trajectories. It must never be required to create them.
    const trajectory = useMemo(() => {
        const txsForInflow = reality?.recentTxs?.map(tx => ({
            timestamp: tx.time, side: tx.side as "BUY" | "SELL", usdValue: tx.usdValue, price: tx.price || currentPrice, wallet: tx.wallet
        })) || [];

        const inflow = calculateLiveInflowRate(txsForInflow);

        // 1. Sync AMM Baseline (GPS Phase 1)
        const amm = ammBaselineTrajectory({
            currentPrice,
            targetPrice,
            liquidityUSD: liquidity,
            inflowPerHour: inflow
        });

        // 2. Async Empirical Refinement (GPS Phase 2)
        const empirical = empiricalTrajectory({
            capitalPer1Pct: reality?.capitalPer1Pct ?? null,
            currentPrice,
            targetPrice,
            inflowPerHour: inflow,
            txConfidence: reality?.txConfidence ?? 0,
            recentTxs: txsForInflow
        });

        // 3. Blended Truth
        return blendTrajectory(amm, empirical);
    }, [reality, targetPrice, currentPrice, liquidity]);

    const getScoreColor = (score: number) => {
        if (score >= 0.8) return 'text-emerald-400';
        if (score >= 0.3) return 'text-amber-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 0.8) return 'bg-emerald-500/10 border-emerald-500/20';
        if (score >= 0.3) return 'bg-amber-500/10 border-amber-500/20';
        return 'bg-red-500/10 border-red-500/20';
    };

    return (
        <div className="space-y-6">
            {/* Market Cap Attainability Score (Truth-Based v3.1) */}
            <div className={`p-6 rounded-2xl border transition-all duration-500 ${mcasModel ? getScoreBg(mcasModel.mcas) : getScoreBg(mcas)}`}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Target className={`w-6 h-6 ${mcasModel ? getScoreColor(mcasModel.mcas) : getScoreColor(mcas)}`} />
                        <div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">
                                MCAS v3.1 {mcasModel ? '(Transaction Verified)' : '(Liquidity Estimated)'}
                            </div>
                            <div className={`text-3xl font-black italic tracking-tighter ${mcasModel ? getScoreColor(mcasModel.mcas) : getScoreColor(mcas)}`}>
                                {mcasModel ? ((mcasModel.mcas || 0) * 100).toFixed(0) : ((mcas || 0) * 100).toFixed(0)}%
                            </div>
                        </div>
                    </div>
                    {mcasModel && (
                        <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${mcasModel.confidence > 0.6 ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                            Confidence: {mcasModel.confidence > 0.6 ? 'High' : 'Medium'}
                        </div>
                    )}
                </div>

                <div className="bg-zinc-950/40 rounded-xl p-4 border border-zinc-900/50">
                    <div className="flex items-start gap-4">
                        <Info className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-zinc-300 italic leading-relaxed">
                            {mcasModel ? mcasModel.verdict : verdict}
                        </p>
                    </div>
                </div>
            </div>

            {/* Supply-Aware Capital Injection Model */}
            <div className="bg-zinc-950/20 rounded-2xl border border-zinc-900 overflow-hidden">
                <div className="p-6 border-b border-zinc-900">
                    <div className="flex items-center gap-3">
                        <Coins className="w-5 h-5 text-cyan-400" />
                        <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">
                            Empirical Capital & AMM Depth
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Stats */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[8px] text-zinc-600 font-bold uppercase mb-1">Target Price</div>
                                    <div className="text-xl font-black italic text-white">${targetPrice.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-[8px] text-zinc-600 font-bold uppercase mb-1">Capital Required</div>
                                    <div className="text-xl font-black italic text-emerald-400">
                                        {mcasModel ? formatUSD(mcasModel.capitalRequiredUSD) : formatUSD(supplyModel.capitalRequired.base)}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-900">
                                <div className="text-[8px] text-zinc-600 font-bold uppercase mb-3 text-emerald-400">
                                    AMM Verified Capital Required (Impact-Aware)
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {ammDepth ? (
                                        <>
                                            <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800">
                                                <div className="text-[7px] text-zinc-500 uppercase font-black">To 1% Impact</div>
                                                <div className="text-xs font-black italic text-zinc-300">{formatUSD(ammDepth.tiers[0]?.totalUSD || 0)}</div>
                                            </div>
                                            <div className="bg-zinc-900/50 p-2 rounded border border-emerald-500/20">
                                                <div className="text-[7px] text-cyan-400 uppercase font-black">To 5% Impact</div>
                                                <div className="text-xs font-black italic text-white">{formatUSD(ammDepth.tiers[1]?.totalUSD || 0)}</div>
                                            </div>
                                            <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800">
                                                <div className="text-[7px] text-zinc-500 uppercase font-black">Discovery Injection</div>
                                                <div className="text-xs font-black italic text-emerald-400">
                                                    {formatUSD(estimateAMMCapital(ammDepth.tiers, targetPrice, currentPrice))}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="col-span-3 text-[10px] text-zinc-700 italic">Probing AMM depth...</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Assumptions */}
                        <div className="bg-black/40 p-4 rounded-xl border border-zinc-900">
                            <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-3">System Disclaimers</div>
                            <ul className="space-y-2">
                                {supplyModel.assumptions.map((assumption, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[10px] text-zinc-500 leading-relaxed italic">
                                        <span className="text-zinc-700 mt-1">•</span>
                                        <span>{assumption}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* MOMENTUM PROJECTION (PHASE 10) */}
            <div className="bg-zinc-950/20 rounded-2xl border border-zinc-900 overflow-hidden relative">
                <div className={`p-6 border-b border-zinc-900 ${trendState.state === 'STRONG' ? 'bg-emerald-500/5' :
                    trendState.state === 'WEAKENING' ? 'bg-amber-500/5' : 'bg-red-500/5'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Timer className="w-5 h-5 text-amber-400" />
                            <div className="text-xs font-black uppercase italic tracking-widest text-white">
                                Momentum Projection
                            </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-[10px] font-black italic tracking-tighter ${trendState.state === 'STRONG' ? 'bg-emerald-500 text-black' :
                            trendState.state === 'WEAKENING' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'
                            }`}>
                            {trendState.state === 'STRONG' ? 'Momentum Strong' :
                                trendState.state === 'WEAKENING' ? 'Momentum Weakening' : 'Momentum Decayed'}
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {trendState.state === 'DECAYING' ? (
                        <div className="flex flex-col items-center justify-center py-4 space-y-3">
                            <ShieldAlert className="w-8 h-8 text-zinc-800" />
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed italic text-center max-w-[280px]">
                                Momentum projection unavailable. Recent trading activity is no longer strong or consistent enough to estimate a reliable timeline.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-col space-y-2">
                                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed italic">
                                    Estimates when the target price could be reached <span className="text-zinc-400 font-black underline decoration-amber-500/30">if current net buying continues</span>.
                                </p>

                                {momentumETA ? (
                                    <div className="text-2xl font-black italic tracking-tighter text-white flex items-center gap-3">
                                        <span className="text-emerald-400">📅</span>
                                        {momentumETA.eta.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        <span className="text-zinc-600 text-xs font-mono not-italic tracking-normal ml-2">
                                            ({Math.ceil(momentumETA.hours)}h left)
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-sm font-black italic text-rose-400">Net selling pressure dominates. A time estimate is not available under current conditions.</div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-900">
                                <div>
                                    <div className="text-[8px] text-zinc-600 font-bold uppercase mb-1">Net Inflow Rate</div>
                                    <div className={`text-xs font-black italic ${trendState.inflowRate > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {trendState.inflowRate > 0 ? '+' : ''}{formatUSD(trendState.inflowRate)}/hr
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[8px] text-zinc-600 font-bold uppercase mb-1">Mathematical Confidence</div>
                                    <div className="text-xs font-black italic text-zinc-300">
                                        {Math.round(trendState.score * 100)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Market Control & Dominance (RFD) - Phase 19 */}
            <div className="bg-zinc-950/20 rounded-2xl border border-zinc-900 overflow-hidden relative">
                <div className="p-6 border-b border-zinc-900 bg-indigo-500/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-400" />
                            <div className="text-xs font-black uppercase italic tracking-widest text-white">
                                Market Control & Dominance
                            </div>
                        </div>
                        {reality?.nrd !== undefined && (
                            <div className={`px-2 py-1 rounded text-[10px] font-black italic tracking-tighter ${reality.nrd > 0.25 ? 'bg-emerald-500 text-black' :
                                reality.nrd < -0.25 ? 'bg-rose-500 text-black' :
                                    'bg-zinc-800 text-zinc-400'
                                }`}>
                                {reality.dominanceStatus || 'Balanced Participation'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Dominance Gauge */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Net Recurrent Dominance (NRD)</div>
                                <div className={`text-sm font-black italic ${(reality?.nrd || 0) > 0.1 ? 'text-emerald-400' :
                                    (reality?.nrd || 0) < -0.1 ? 'text-rose-400' :
                                        'text-zinc-500'
                                    }`}>
                                    {((reality?.nrd || 0) * 100).toFixed(1)}%
                                </div>
                            </div>

                            <div className="h-4 w-full bg-zinc-900 rounded-full overflow-hidden relative">
                                <div className="absolute inset-0 flex">
                                    <div className="w-1/2 h-full border-r border-zinc-800/50" />
                                </div>
                                <motion.div
                                    initial={{ width: "0%", left: "50%" }}
                                    animate={{
                                        width: `${Math.abs((reality?.nrd || 0) * 50)}%`,
                                        left: (reality?.nrd || 0) >= 0 ? "50%" : `${50 - Math.abs((reality?.nrd || 0) * 50)}%`
                                    }}
                                    className={`absolute h-full ${(reality?.nrd || 0) >= 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}
                                />
                            </div>

                            <div className="flex justify-between text-[8px] text-zinc-600 font-bold uppercase tracking-widest px-1">
                                <span>Seller Dominant</span>
                                <span>Neutral</span>
                                <span>Buyer Dominant</span>
                            </div>
                        </div>

                        {/* conviction stats */}
                        <div className="bg-black/40 p-4 rounded-xl border border-zinc-900 flex items-center justify-center">
                            <p className="text-[10px] text-zinc-500 leading-relaxed italic text-center">
                                RFD measures persistent structural behavior. A score > 25% suggests strong recurrent accumulation, providing a high-confidence floor for mcap expansion.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* REALITY SIMULATOR BLOCK */}
            <div className="bg-zinc-950/20 rounded-2xl border border-zinc-900 overflow-hidden">
                <div className="p-6 border-b border-zinc-900 bg-cyan-500/5">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-cyan-400" />
                        <div className="text-[11px] text-white font-black uppercase tracking-widest italic">Reality Simulator: Required for MCAS 0.4</div>
                    </div>
                </div>
                <div className="p-6">
                    {simulation ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
                                <div className="text-[8px] text-zinc-600 uppercase font-black mb-1">Volume Growth</div>
                                <div className="text-lg font-black italic text-white">+{((simulation.volumeIncreaseRequired || 1) - 1 * 100).toFixed(0)}%</div>
                            </div>
                            <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
                                <div className="text-[8px] text-zinc-600 uppercase font-black mb-1">Liquidity Boost</div>
                                <div className="text-lg font-black italic text-white">{(simulation.liquidityIncreaseRequired || 0).toFixed(1)}x</div>
                            </div>
                            <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50 border-emerald-500/10">
                                <div className="text-[8px] text-zinc-600 uppercase font-black mb-1">Holder Stability</div>
                                <div className="text-lg font-black italic text-emerald-400">+{((simulation.holderImprovementRequired || 0) * 100).toFixed(0)}%</div>
                            </div>
                            <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
                                <div className="text-[8px] text-zinc-600 uppercase font-black mb-1">Wash Reduction</div>
                                <div className="text-lg font-black italic text-cyan-400">{simulation.washTradingReductionRequired || 'N/A'}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-[10px] text-zinc-700 italic p-4">Insuffient empirical data to run reality simulation.</div>
                    )}
                </div>
            </div>

            {/* Live Market Convergence (Order Book) */}
            {orderBook && orderBook.orderBookAvailable === true && obModel && (
                <div className="bg-zinc-950/20 rounded-2xl border border-zinc-900 overflow-hidden">
                    <div className="p-6 border-b border-zinc-900 bg-emerald-500/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BarChart3 className={`w-5 h-5 ${obModel.status === 'CLOSE' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                <div className="text-xs font-black uppercase italic tracking-widest text-white">Live Market Convergence</div>
                            </div>
                            <div className={`px-2 py-1 rounded text-[10px] font-black italic tracking-tighter ${obModel.status === 'CLOSE' ? 'bg-emerald-500 text-black' :
                                obModel.status === 'APPROACHING' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                {obModel.status}
                            </div>
                        </div>
                        <p className="mt-3 text-[11px] text-zinc-500 font-medium leading-relaxed italic pr-12">
                            {obModel.insight}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-zinc-900">
                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                                <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Buy Pressure (1%)</div>
                                <div className="text-lg font-black italic text-emerald-400">
                                    {formatUSD(buyPressure(orderBook?.bids || [], currentPrice, 0.01))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                                    <span className="text-zinc-600">Absorption</span>
                                    <span className="text-white">{Math.round(obModel.progressPct * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${obModel.progressPct * 100}%` }}
                                        className="h-full bg-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
