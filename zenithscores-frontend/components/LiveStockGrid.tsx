'use client';

import { useBatchStockData } from '@/lib/market-data-manager';
import { POPULAR_STOCKS } from '@/lib/finnhub';
import { getZenithSignal } from '@/lib/zenith';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export function LiveStockGrid() {
    const { data: quotes, loading, error, refetch } = useBatchStockData(POPULAR_STOCKS);

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                    onClick={refetch}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with refresh */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Live Stock Prices</h2>
                <button
                    onClick={refetch}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    <span className="text-sm">Refresh</span>
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {POPULAR_STOCKS.map((symbol, index) => {
                    const quote = quotes[symbol];

                    if (!quote && loading) {
                        return (
                            <div key={symbol} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
                                <div className="h-6 bg-gray-800 rounded w-16 mb-2" />
                                <div className="h-8 bg-gray-800 rounded w-24 mb-2" />
                                <div className="h-4 bg-gray-800 rounded w-20" />
                            </div>
                        );
                    }

                    if (!quote) return null;

                    const isPositive = (quote.dp || 0) >= 0;
                    const zenithScore = Math.min(100, Math.max(0, 50 + (quote.dp || 0) * 2)); // Mock score based on change
                    const signal = getZenithSignal(zenithScore);

                    return (
                        <Link key={symbol} href={`/stocks/${symbol.toLowerCase()}`}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-4 transition-all hover:shadow-lg cursor-pointer"
                            >
                                {/* Symbol & Score */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{symbol}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded ${signal.text} bg-current bg-opacity-10`}>
                                            {signal.label}
                                        </span>
                                    </div>
                                    <span className={`text-2xl font-bold ${signal.text}`}>
                                        {zenithScore.toFixed(0)}
                                    </span>
                                </div>

                                {/* Price */}
                                <div className="mb-2">
                                    <div className="text-2xl font-bold text-white font-mono">
                                        ${quote.c.toFixed(2)}
                                    </div>
                                </div>

                                {/* Change */}
                                <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                    {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                    <span>{quote.d?.toFixed(2)} ({quote.dp?.toFixed(2)}%)</span>
                                </div>

                                {/* Stats */}
                                <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <div className="text-gray-500">High</div>
                                        <div className="text-white font-mono">${quote.h.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500">Low</div>
                                        <div className="text-white font-mono">${quote.l.toFixed(2)}</div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>

            {/* Update indicator */}
            <div className="text-center text-xs text-gray-500">
                Updates every minute • Powered by Finnhub
            </div>
        </div>
    );
}

export default LiveStockGrid;
