'use client';

import { motion } from 'framer-motion';
import { getZenithSignal } from '@/lib/zenith';
import { formatNumber } from '@/lib/utils';
import { ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';

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
}

export default function AssetGrid({ tokens }: AssetGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tokens.map((token, index) => {
                const signal = getZenithSignal(token.zenith_score || 0);
                const isPositive = (token.price_change_24h || 0) >= 0;

                return (
                    <motion.div
                        key={token.symbol + index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
                    >
                        {/* Top Row */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                {/* Fallback Icon */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-xs font-bold border border-gray-700">
                                    {token.symbol.substring(0, 2)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white leading-tight">{token.symbol}</h4>
                                    <p className="text-xs text-gray-500 truncate max-w-[100px]">{token.name}</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="font-mono font-medium text-white">${token.price_usd < 1 ? token.price_usd.toFixed(6) : token.price_usd.toFixed(2)}</div>
                                <div className={`text-xs font-bold flex items-center justify-end ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                    {isPositive ? '+' : ''}{token.price_change_24h?.toFixed(2)}%
                                </div>
                            </div>
                        </div>

                        {/* Middle Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-800">
                            <div>
                                <div className="text-[10px] text-gray-500 uppercase font-semibold">Volume</div>
                                <div className="text-sm font-mono text-gray-300">${formatNumber(token.volume_24h)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-gray-500 uppercase font-semibold">Liquidity</div>
                                <div className="text-sm font-mono text-gray-300">${formatNumber(token.liquidity_usd)}</div>
                            </div>
                        </div>

                        {/* Bottom Row / Score */}
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold px-2 py-1 rounded bg-opacity-10 ${signal.bg} ${signal.text}`}>
                                {signal.label}
                            </span>

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 font-bold">SCORE: {token.zenith_score?.toFixed(0)}</span>
                                {/* Mini Bar */}
                                <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${signal.bg}`}
                                        style={{ width: `${token.zenith_score}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Hover Action */}
                        <a
                            href={`/asset/${token.symbol}`}
                            className="absolute inset-0 z-10"
                        />
                    </motion.div>
                );
            })}
        </div>
    );
}
