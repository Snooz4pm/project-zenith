'use client';

import { motion } from 'framer-motion';
import { getZenithSignal } from '@/lib/zenith';
import { formatNumber } from '@/lib/utils';
import { ArrowUp, ArrowDown, ExternalLink, Star } from 'lucide-react';

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
}

export default function AssetGrid({ tokens, onTokenClick, watchlist, onToggleWatchlist }: AssetGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tokens.map((token, index) => {
                const signal = getZenithSignal(token.zenith_score || 0);
                const isPositive = (token.price_change_24h || 0) >= 0;

                return (
                    <motion.div
                        key={token.symbol + index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onTokenClick?.(token)}
                        className={`group relative bg-[#1E1E24] border border-[#2A2A35] rounded-2xl p-6 hover:border-gray-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 block ${onTokenClick ? 'cursor-pointer' : ''}`}
                    >
                        {/* Watchlist Toggle */}
                        {onToggleWatchlist && (
                            <button
                                onClick={(e) => {
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
                                <span className="text-[#F0F0F0] font-mono font-medium text-lg">
                                    ${token.price_usd < 1 ? token.price_usd.toFixed(4) : token.price_usd.toFixed(2)}
                                </span>
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
                        <a
                            href={`/crypto/${token.symbol}`}
                            className="absolute inset-0 z-10"
                            aria-label={`View details for ${token.symbol}`}
                        />
                    </motion.div>
                );
            })}
        </div>
    );
}
