'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { OrderBookSnapshot, OrderBookLevel } from '@/lib/argus/orderBookEngine';

interface OrderBookVisualizerProps {
    orderBook?: OrderBookSnapshot;
    targetPrice?: number;
    symbol: string;
}

const formatUSD = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
};

export const OrderBookVisualizer: React.FC<OrderBookVisualizerProps> = ({
    orderBook,
    targetPrice,
    symbol
}) => {
    if (!orderBook) {
        return (
            <div className="h-64 flex items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                <div className="text-zinc-500 font-black text-[10px] uppercase tracking-widest animate-pulse">
                    Waiting for Depth Stream...
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
                    Live Liquidity Depth <span className="text-zinc-700 ml-2">/ {symbol}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[8px] text-zinc-400 font-bold uppercase">Bids</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[8px] text-zinc-400 font-bold uppercase">Asks</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-[1px] bg-zinc-900/50">
                {/* Bids Column */}
                <div className="bg-black p-2 space-y-[2px]">
                    <div className="flex justify-between text-[7px] text-zinc-600 font-bold uppercase mb-2 px-1">
                        <span>Price</span>
                        <span>Size</span>
                    </div>
                    {orderBook.bids.slice(0, 10).map((bid, i) => (
                        <div key={i} className="relative h-6 flex items-center justify-between px-2 group">
                            <div
                                className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 transition-all duration-500"
                                style={{ width: `${(bid.sizeUSD / maxSideSize) * 100}%` }}
                            />
                            <span className="text-[10px] text-emerald-400/80 font-mono z-10">
                                ${bid.price.toFixed(6)}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-black italic z-10 group-hover:text-white transition-colors">
                                {formatUSD(bid.sizeUSD)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Asks Column */}
                <div className="bg-black p-2 space-y-[2px]">
                    <div className="flex justify-between text-[7px] text-zinc-600 font-bold uppercase mb-2 px-1">
                        <span>Size</span>
                        <span>Price</span>
                    </div>
                    {orderBook.asks.slice(0, 10).map((ask, i) => {
                        const isTarget = targetPrice && ask.price >= targetPrice && (i === 0 || (orderBook.asks[i - 1].price < targetPrice));

                        return (
                            <div key={i} className={`relative h-6 flex items-center justify-between px-2 group ${isTarget ? 'ring-1 ring-cyan-500/50 bg-cyan-500/5' : ''}`}>
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-red-500/10 transition-all duration-500"
                                    style={{ width: `${(ask.sizeUSD / maxSideSize) * 100}%` }}
                                />
                                {isTarget && (
                                    <div className="absolute -left-1 top-0 bottom-0 w-1 bg-cyan-500 z-20" />
                                )}
                                <span className="text-[10px] text-zinc-400 font-black italic z-10 group-hover:text-white transition-colors">
                                    {formatUSD(ask.sizeUSD)}
                                </span>
                                <span className={`text-[10px] font-mono z-10 ${isTarget ? 'text-cyan-400 font-bold' : 'text-red-400/80'}`}>
                                    ${ask.price.toFixed(6)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-3 bg-zinc-950/40 border-t border-zinc-900 flex items-center justify-center gap-4">
                <div className="text-[9px] text-zinc-600 font-black uppercase tracking-tighter">
                    Spread: <span className="text-zinc-300 ml-1">{((orderBook.asks[0]?.price - orderBook.bids[0]?.price) / orderBook.asks[0]?.price * 100).toFixed(4)}%</span>
                </div>
                <div className="text-[9px] text-zinc-600 font-black uppercase tracking-tighter">
                    Last: <span className="text-white ml-1">${orderBook.lastPrice.toFixed(6)}</span>
                </div>
            </div>
        </div>
    );
};
