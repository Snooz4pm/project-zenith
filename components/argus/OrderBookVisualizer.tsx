'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { OrderBookSnapshot, OrderBookLevel, AMMVirtualDepth, TxDerivedMetrics } from '@/lib/argus/liquidityEngine';

interface LiquidityVisualizerProps {
    orderBook?: OrderBookSnapshot;
    ammDepth?: AMMVirtualDepth;
    reality?: TxDerivedMetrics;
    targetPrice?: number;
    symbol: string;
}

const formatUSD = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return '$0';
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
};

export const OrderBookVisualizer: React.FC<LiquidityVisualizerProps> = ({
    orderBook,
    ammDepth,
    reality,
    targetPrice,
    symbol
}) => {
    if (!orderBook || orderBook.orderBookAvailable === false) {
        return (
            <div className="flex flex-col border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20 overflow-hidden">
                <div className="p-4 border-b border-dashed border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">
                            {orderBook?.orderBookAvailable === false ? 'No Jupiter Limit Market — Using Live Feed' : 'Awaiting Depth Stream...'}
                        </div>
                    </div>
                </div>

                <div className="p-2 space-y-1 min-h-[200px]">
                    {reality?.recentTxs ? (
                        reality.recentTxs.map((tx, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={tx.signature}
                                className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/50 hover:bg-zinc-800/60 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`text-[8px] font-black px-1.5 py-0.5 rounded ${tx.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {tx.side}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-[10px] font-black text-zinc-300 italic">${tx.usdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                        <div className="text-[7px] text-zinc-600 font-mono uppercase">{tx.signature.slice(0, 8)}...</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] text-zinc-500 font-black italic">{tx.wallet}</div>
                                    <div className="text-[7px] text-zinc-700 font-mono uppercase">
                                        {new Date(tx.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="h-48 flex items-center justify-center">
                            <div className="text-zinc-700 text-[8px] uppercase tracking-widest font-black text-center animate-pulse">
                                Synthesizing Liquidity via Volume-Based Flow Analysis
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-3 bg-zinc-900/30 border-t border-dashed border-zinc-800 text-center">
                    <div className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em]">
                        Live Transaction Interceptor — Phase 9 Active
                    </div>
                </div>
            </div>
        );
    }

    const maxSideSize = useMemo(() => {
        const bidMax = Math.max(...orderBook.bids.map(b => b.sizeUSD), 1);
        const askMax = Math.max(...orderBook.asks.map(a => a.sizeUSD), 1);
        return Math.max(bidMax, askMax);
    }, [orderBook]);

    return (
        <div className="bg-black/60 rounded-2xl border border-zinc-900 overflow-hidden">
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                    Real-World Liquidity Depth <span className="text-zinc-700 ml-2">/ {symbol}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${ammDepth ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                        AMM MODEL: {ammDepth ? 'ACTIVE' : 'OFFLINE'}
                    </div>
                </div>
            </div>

            {/* AMM Tiers Visualization */}
            {ammDepth && (
                <div className="p-4 bg-zinc-950/40 border-b border-zinc-900">
                    <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-4">
                        AMM Price Impact Tiers (Slippage Modeling)
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {ammDepth.tiers.map((tier) => (
                            <div key={tier.impactPct} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <div className="text-2xl font-black italic">{tier.impactPct}%</div>
                                </div>
                                <div className="text-[8px] text-zinc-500 uppercase font-black mb-1">Impact @ {tier.impactPct}%</div>
                                <div className="text-lg font-black italic text-white mb-1">
                                    {formatUSD(tier.totalUSD)}
                                </div>
                                <div className="text-[9px] text-zinc-600 font-mono">
                                    Target: ${(tier.targetPrice || 0).toFixed(6)}
                                </div>
                                <div className="absolute bottom-0 left-0 h-1 bg-emerald-500/30 transition-all group-hover:bg-emerald-500" style={{ width: `${(tier.impactPct / 10) * 100}%` }} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Hybrid View: Bids/Asks mapping to tiers or simple book */}
            <div className="grid grid-cols-2 gap-[1px] bg-zinc-900/50">
                {/* Bids Column */}
                <div className="bg-black p-2 space-y-[2px]">
                    <div className="flex justify-between text-[7px] text-zinc-600 font-bold uppercase mb-2 px-1">
                        <span>Price</span>
                        <span>Size</span>
                    </div>
                    {orderBook && orderBook.orderBookAvailable !== false && orderBook.bids.length > 0 ? (
                        orderBook.bids.slice(0, 8).map((bid, i) => (
                            <div key={i} className="relative h-6 flex items-center justify-between px-2 group">
                                <div
                                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 transition-all duration-500"
                                    style={{ width: `${(bid.sizeUSD / maxSideSize) * 100}%` }}
                                />
                                <span className="text-[10px] text-emerald-400/80 font-mono z-10">
                                    ${(bid.price || 0).toFixed(6)}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-black italic z-10 group-hover:text-white transition-colors">
                                    {formatUSD(bid.sizeUSD)}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="h-48 flex flex-col items-center justify-center space-y-2 opacity-40">
                            <div className="text-[8px] text-zinc-600 font-black uppercase">No Limit Bids</div>
                            <div className="text-[10px] text-zinc-800 font-mono italic">Using Virtual Buy-Side</div>
                        </div>
                    )}
                </div>

                {/* Asks Column */}
                <div className="bg-black p-2 space-y-[2px]">
                    <div className="flex justify-between text-[7px] text-zinc-600 font-bold uppercase mb-2 px-1">
                        <span>Size</span>
                        <span>Price</span>
                    </div>
                    {orderBook && orderBook.orderBookAvailable !== false && orderBook.asks.length > 0 ? (
                        orderBook.asks.slice(0, 8).map((ask, i) => {
                            const isTarget = targetPrice && ask.price >= targetPrice && (i === 0 || (orderBook.asks[i - 1].price < targetPrice));

                            return (
                                <div key={i} className={`relative h-6 flex items-center justify-between px-2 group ${isTarget ? 'ring-1 ring-cyan-500/50 bg-cyan-500/5' : ''}`}>
                                    <div
                                        className="absolute left-0 top-0 bottom-0 bg-red-500/10 transition-all duration-500"
                                        style={{ width: `${(ask.sizeUSD / maxSideSize) * 100}%` }}
                                    />
                                    <span className="text-[10px] text-zinc-400 font-black italic z-10 group-hover:text-white transition-colors">
                                        {formatUSD(ask.sizeUSD)}
                                    </span>
                                    <span className={`text-[10px] font-mono z-10 ${isTarget ? 'text-cyan-400 font-bold' : 'text-red-400/80'}`}>
                                        ${(ask.price || 0).toFixed(6)}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-48 flex flex-col items-center justify-center space-y-2 opacity-40">
                            <div className="text-[8px] text-zinc-600 font-black uppercase">No Limit Asks</div>
                            <div className="text-[10px] text-zinc-800 font-mono italic">AMM Flow Active</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-3 bg-zinc-950/40 border-t border-zinc-900 flex items-center justify-center gap-6">
                <div className="text-[9px] text-zinc-600 font-black uppercase tracking-tighter">
                    AMM Spread: <span className="text-zinc-300 ml-1">{ammDepth ? 'Dynamic' : 'Unknown'}</span>
                </div>
                <div className="text-[9px] text-zinc-600 font-black uppercase tracking-tighter">
                    Market Price: <span className="text-white ml-1">${((orderBook?.lastPrice || ammDepth?.currentPrice || 0)).toFixed(6)}</span>
                </div>
                <div className="text-[9px] text-emerald-500/50 font-black uppercase tracking-widest animate-pulse">
                    Modeling Verified via Jupiter Quote API
                </div>
            </div>
        </div>
    );
};
