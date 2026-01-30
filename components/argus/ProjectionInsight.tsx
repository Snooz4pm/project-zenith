'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    Coins,
    ShieldAlert,
    Info,
    Target,
    Zap
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
    calculateOrderBookProgress,
    targetProximityStatus,
    OrderBookSnapshot
} from '@/lib/argus/orderBookEngine';

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
}

const formatUSD = (val: number) => {
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
    orderBook
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

    // Order Book Logic
    const obModel = useMemo(() => {
        if (!orderBook) return null;

        const priceIncreasePct = (targetPrice / currentPrice) - 1;
        const wallUSD = liquidityWall(orderBook.asks, currentPrice, priceIncreasePct);
        const buyUSD = buyPressure(orderBook.bids, currentPrice, 0.01); // 1% band

        return targetProximityStatus(buyUSD, wallUSD, supplyModel.capitalRequired.base);
    }, [orderBook, currentPrice, targetPrice, supplyModel.capitalRequired.base]);

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
            {/* Market Cap Attainability Score */}
            <div className={`p-6 rounded-2xl border transition-all duration-500 ${getScoreBg(mcas)}`}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Target className={`w-6 h-6 ${getScoreColor(mcas)}`} />
                        <div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">
                                MCAS (Market Cap Attainability Score)
                            </div>
                            <div className={`text-3xl font-black italic tracking-tighter ${getScoreColor(mcas)}`}>
                                {(mcas * 100).toFixed(0)}%
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-950/40 rounded-xl p-4 border border-zinc-900/50">
                    <div className="flex items-start gap-4">
                        <Info className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-zinc-300 italic leading-relaxed">
                            {verdict}
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
                            Supply-Aware Capital Injection Model
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
                                    <div className="text-xl font-black italic text-white">
                                        ${targetPrice.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[8px] text-zinc-600 font-bold uppercase mb-1">Active Float</div>
                                    <div className="text-xl font-black italic text-cyan-400">
                                        {(supplyModel.availableSupply / 1e6).toFixed(1)}M <span className="text-[10px] text-zinc-500">TOKENS</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-900">
                                <div className="text-[8px] text-zinc-600 font-bold uppercase mb-3">Capital Required for Discovery</div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800">
                                        <div className="text-[7px] text-zinc-500 uppercase font-black">Low (10%)</div>
                                        <div className="text-xs font-black italic text-zinc-300">{formatUSD(supplyModel.capitalRequired.low)}</div>
                                    </div>
                                    <div className="bg-zinc-900/50 p-2 rounded border border-cyan-500/20">
                                        <div className="text-[7px] text-cyan-400 uppercase font-black">Base (20%)</div>
                                        <div className="text-xs font-black italic text-white">{formatUSD(supplyModel.capitalRequired.base)}</div>
                                    </div>
                                    <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800">
                                        <div className="text-[7px] text-zinc-500 uppercase font-black">High (30%)</div>
                                        <div className="text-xs font-black italic text-zinc-300">{formatUSD(supplyModel.capitalRequired.high)}</div>
                                    </div>
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
        </div>
    );
};
