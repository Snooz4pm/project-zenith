'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { LayoutGrid, Sparkles, TrendingUp, Activity } from 'lucide-react';

// Dynamic imports for client-only components
const CryptoTicker = dynamic(() => import('@/components/CryptoTicker'), { ssr: false });
const PredictiveSearch = dynamic(() => import('@/components/PredictiveSearch'), { ssr: false });
const MiniChart = dynamic(() => import('@/components/charts/MiniChart'), { ssr: false });
const AlgorithmPickCard = dynamic(() => import('@/components/home/AlgorithmPickCard'), { ssr: false });

// Types
import type { Asset, AssetSnapshot, AlgorithmPick, OHLCV } from '@/lib/types/market';

type MarketMode = 'all' | 'algorithm';

type AssetWithOHLCV = Asset & { ohlcv: OHLCV[] };

interface CryptoPageData {
    assets: AssetWithOHLCV[];
    algorithmPicks: AlgorithmPick[];
}

export default function CryptoPortal() {
    const [mode, setMode] = useState<MarketMode>('algorithm'); // Default to Algorithm Picks
    const [data, setData] = useState<CryptoPageData | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch data on mount (only once)
    useEffect(() => {
        async function loadData() {
            try {
                // Import adapter dynamically to avoid SSR issues
                const { getMarketPageData } = await import('@/lib/api/zenith-adapter');
                const pageData = await getMarketPageData('crypto');
                setData(pageData);
            } catch (error) {
                console.error('Failed to load crypto data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a12] text-white">
            {/* Top Bar Ticker */}
            <CryptoTicker />

            <main className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Crypto Markets</h1>
                    <p className="text-zinc-400">
                        {mode === 'all'
                            ? 'Visual scan of all tracked assets'
                            : 'Where the math is aligned'
                        }
                    </p>
                </div>

                {/* Search */}
                <div className="mb-8">
                    <PredictiveSearch mode="crypto" behavior="filter" className="w-full max-w-xl" />
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center gap-2 mb-8">
                    <button
                        onClick={() => setMode('all')}
                        className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm
              transition-all duration-200
              ${mode === 'all'
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
                            }
            `}
                    >
                        <LayoutGrid size={16} />
                        All Charts
                    </button>
                    <button
                        onClick={() => setMode('algorithm')}
                        className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm
              transition-all duration-200
              ${mode === 'algorithm'
                                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/20'
                                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
                            }
            `}
                    >
                        <Sparkles size={16} />
                        Algorithm Picks
                        {data?.algorithmPicks && (
                            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                                {data.algorithmPicks.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex items-center gap-3 text-zinc-400">
                            <Activity size={20} className="animate-pulse" />
                            <span>Loading market data...</span>
                        </div>
                    </div>
                )}

                {/* Content */}
                {!loading && data && (
                    <AnimatePresence mode="wait">
                        {/* ALL CHARTS MODE */}
                        {mode === 'all' && (
                            <motion.div
                                key="all-charts"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {data.assets.map((asset, index) => (
                                        <MiniChart
                                            key={asset.id}
                                            symbol={asset.symbol}
                                            name={asset.name}
                                            ohlcv={asset.ohlcv}
                                            regime={asset.regime}
                                            convictionScore={asset.convictionScore}
                                            price={asset.price}
                                            change24h={asset.change24h}
                                            onClick={() => window.location.href = `/crypto/${asset.symbol}`}
                                        />
                                    ))}
                                </div>

                                {data.assets.length === 0 && (
                                    <div className="text-center py-20 text-zinc-500">
                                        No assets found
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ALGORITHM PICKS MODE */}
                        {mode === 'algorithm' && (
                            <motion.div
                                key="algorithm-picks"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Section Header */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                        <TrendingUp size={18} />
                                        <span className="text-sm font-medium">High Conviction Setups</span>
                                    </div>
                                    <p className="text-sm text-zinc-500">
                                        Assets where quantitative factors align favorably. Click any card for deep analysis.
                                    </p>
                                </div>

                                {/* Algorithm Pick Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {data.algorithmPicks.map((pick, index) => (
                                        <AlgorithmPickCard
                                            key={pick.asset.id}
                                            asset={pick.asset}
                                            index={index}
                                        />
                                    ))}
                                </div>

                                {data.algorithmPicks.length === 0 && (
                                    <div className="text-center py-20">
                                        <Sparkles size={32} className="mx-auto text-zinc-600 mb-4" />
                                        <p className="text-zinc-500">
                                            No assets currently meet algorithm thresholds.
                                        </p>
                                        <p className="text-xs text-zinc-600 mt-2">
                                            Check back when market conditions align.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </main>

            {/* Footer */}
            <div className="py-8 text-center text-zinc-600 text-xs">
                Data refreshes automatically. Analysis is for informational purposes only.
            </div>
        </div>
    );
}
