'use client';

import { motion } from 'framer-motion';
import { getZenithSignal } from '@/lib/zenith';
import { formatNumber } from '@/lib/utils';
import { ArrowUp, ArrowDown, ExternalLink, Star, Clock } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import MarketStatusBadge from './MarketStatusBadge';
import { dataRefreshManager } from '@/lib/data-refresh';
import { getMarketStatus } from '@/lib/market-hours';

interface Token {
    symbol: string;
    name: string;
    price_usd: number;
    price_change_24h: number;
    zenith_score: number;
    volume_24h: number;
    url: string;
    liquidity_usd: number;
}

interface AssetGridProps {
    tokens: Token[];
    onTokenClick?: (token: Token) => void;
    watchlist?: Set<string>;
    onToggleWatchlist?: (symbol: string) => void;
    assetType?: 'crypto' | 'forex' | 'stock';
}

export default function AssetGrid({
    tokens,
    onTokenClick,
    watchlist,
    onToggleWatchlist,
    assetType = 'crypto'
}: AssetGridProps) {
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [priceAnimations, setPriceAnimations] = useState<Record<string, 'up' | 'down' | null>>({});

    // Simulate real-time price updates
    useEffect(() => {
        const updateInterval = setInterval(() => {
            setLastUpdate(new Date());

            // Mark random tokens as updated
            const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
            if (randomToken) {
                const direction = Math.random() > 0.5 ? 'up' : 'down';
                setPriceAnimations(prev => ({ ...prev, [randomToken.symbol]: direction }));

                setTimeout(() => {
                    setPriceAnimations(prev => ({ ...prev, [randomToken.symbol]: null }));
                }, 1000);
            }
        }, 3000);

        return () => clearInterval(updateInterval);
    }, [tokens]);

    const marketStatus = getMarketStatus(assetType);
    const timeSince = () => {
        const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        return `${Math.floor(seconds / 60)}m ago`;
    };

    return (
        <div className="space-y-4">
            {/* Market Status Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                    <MarketStatusBadge assetType={assetType} />
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>Updated {timeSince()}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tokens.map((token, index) => {
                    const signal = getZenithSignal(token.zenith_score || 0);
                    const isPositive = (token.price_change_24h || 0) >= 0;
                    const animation = priceAnimations[token.symbol];

                    return (
                        <Link
                            key={token.symbol + index}
                            href={`/crypto/${token.symbol.toLowerCase()}`}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    backgroundColor: animation
                                        ? animation === 'up' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                                        : 'rgba(30, 30, 36, 1)'
                                }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                className="group relative bg-[#1E1E24] border border-[#2A2A35] rounded-2xl p-6 hover:border-gray-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                            >
                                {/* Watchlist Toggle */}
                                {onToggleWatchlist && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onToggleWatchlist(token.symbol);
                                        }}
                                        className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-black/20 hover:bg-black/40 transition-colors"
                                    >
                                        <Star
                                            size={16}
                                            className={watchlist?.has(token.symbol) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}
                                        />
                                    </button>
                                )}

                                {/* 1. Header: Score & Decision Dominance */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex flex-col">
                                        <span className={`text-4xl font-extrabold tracking-tighter ${signal.text} drop-shadow-sm`}>
                                            {token.zenith_score?.toFixed(0)}
                                        </span>
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${signal.text} bg-current bg-opacity-10 w-fit`}>
                                            {signal.label}
                                        </span>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-[#F0F0F0] font-bold text-lg leading-none mb-1">{token.symbol}</div>
                                        <div className="text-gray-500 text-xs font-medium truncate max-w-[80px]">{token.name}</div>
                                    </div>
                                </div>

                                {/* 2. Primary Metric: Price */}
                                <div className="flex justify-between items-end mb-6 pb-4 border-b border-[#2A2A35]">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Price</span>
                                        <motion.span
                                            animate={{
                                                scale: animation ? [1, 1.05, 1] : 1,
                                                color: animation === 'up' ? '#10B981' : animation === 'down' ? '#EF4444' : '#F0F0F0'
                                            }}
                                            transition={{ duration: 0.5 }}
                                            className="text-[#F0F0F0] font-mono font-medium text-lg"
                                        >
                                            ${token.price_usd < 1 ? token.price_usd.toFixed(4) : token.price_usd.toFixed(2)}
                                        </motion.span>
                                    </div>
                                    <div className={`text-sm font-bold font-mono px-2 py-1 rounded-md flex items-center gap-1 ${isPositive ? 'bg-green-500/10 text-price-up' : 'bg-red-500/10 text-price-down'}`}>
                                        {isPositive ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />}
                                        {Math.abs(token.price_change_24h || 0).toFixed(2)}%
                                    </div>
                                </div>

                                {/* 3. Secondary Metrics: Visual Density */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Volume (24h)</div>
                                        <div className="text-gray-300 font-mono text-sm font-medium">${formatNumber(token.volume_24h)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Liquidity</div>
                                        <div className="text-gray-300 font-mono text-sm font-medium">${formatNumber(token.liquidity_usd)}</div>
                                    </div>
                                </div>

                                {/* Hover Action / Link */}

                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
