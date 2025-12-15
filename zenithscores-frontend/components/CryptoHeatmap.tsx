'use client';

import { getZenithSignal } from '@/lib/zenith';
import { motion } from 'framer-motion';

interface CryptoHeatmapProps {
    tokens: any[];
}

export default function CryptoHeatmap({ tokens }: CryptoHeatmapProps) {
    // treemap-style-ish grid
    // Filter out very small tokens to keep the view clean
    const displayTokens = tokens.slice(0, 20);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 h-[500px]">
            {displayTokens.map((token, i) => {
                const sizeClass = i < 2 ? 'col-span-2 row-span-2' : i < 6 ? 'col-span-1 row-span-1' : 'col-span-1 row-span-1';
                const signal = getZenithSignal(token.zenith_score);

                // Color intensity logic based on Price Change
                const change = token.price_change_24h || 0;
                let bgClass = 'bg-gray-800';
                if (change > 5) bgClass = 'bg-green-600';
                else if (change > 2) bgClass = 'bg-green-700';
                else if (change > 0) bgClass = 'bg-green-800';
                else if (change > -2) bgClass = 'bg-red-800';
                else if (change > -5) bgClass = 'bg-red-700';
                else bgClass = 'bg-red-600';

                return (
                    <motion.div
                        key={token.symbol}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`${sizeClass} ${bgClass} rounded-xl p-4 flex flex-col justify-between hover:brightness-110 cursor-pointer transition-all border border-black/20`}
                    >
                        <div className="flex justify-between items-start">
                            <span className="font-bold text-white text-lg tracking-tight">{token.symbol}</span>
                            <span className="text-xs font-mono opacity-80">{change > 0 ? '+' : ''}{change.toFixed(2)}%</span>
                        </div>

                        <div className="mt-auto">
                            <div className="text-xs opacity-70 mb-1">{token.name}</div>
                            <div className="flex justify-between items-end">
                                <div className="text-xl font-bold text-white/90">${token.price_usd < 1 ? token.price_usd.toFixed(4) : token.price_usd.toFixed(2)}</div>
                                <div className="text-xs font-bold px-1.5 py-0.5 rounded bg-black/20 text-white/80">
                                    Score: {token.zenith_score.toFixed(0)}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
