'use client';

import { RefreshCw, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChartPriceDisplayProps {
    symbol: string;
    price: number;
    changePercent: number;
    isLoading: boolean;
    onRefresh: () => void;
    provider?: string | null;
    fetchedAt?: number | null;
}

export default function ChartPriceDisplay({
    symbol,
    price,
    changePercent,
    isLoading,
    onRefresh,
    provider,
    fetchedAt
}: ChartPriceDisplayProps) {

    const isPositive = changePercent >= 0;

    return (
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-4">
                {/* Price */}
                <div className="text-right">
                    <AnimatePresence mode="wait">
                        {price > 0 ? (
                            <motion.div
                                key={price}
                                initial={{ opacity: 0.8, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-3xl font-bold font-mono text-white tracking-tight"
                            >
                                ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </motion.div>
                        ) : (
                            <div className="h-9 w-32 bg-white/10 animate-pulse rounded" />
                        )}
                    </AnimatePresence>
                </div>

                {/* Refresh Button - Bound to Chart Refresh */}
                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        border border-white/10
                        ${isLoading
                            ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                            : 'bg-white/10 text-white hover:bg-white/20 active:scale-95'
                        }
                    `}
                >
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    {isLoading ? 'Syncing...' : 'Refresh'}
                </button>
            </div>

            {/* Disclaimer & Source */}
            <div className="mt-2 flex flex-col items-end gap-0.5">
                <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5">
                    <span className={`flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                    </span>
                    <span className="opacity-50 mx-1">|</span>
                    {provider && (
                        <span className="uppercase tracking-wider opacity-70">
                            via {provider}
                        </span>
                    )}
                    <span className="text-blue-400/80 flex items-center gap-1">
                        • <Activity size={10} /> Chart Synced
                    </span>
                </div>
                {fetchedAt && (
                    <div className="text-[10px] text-gray-600 italic">
                        Updated {new Date(fetchedAt).toLocaleTimeString()}
                    </div>
                )}
            </div>
        </div>
    );
}
