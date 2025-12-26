'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { LayoutGrid, Sparkles, TrendingUp, Activity, Building2 } from 'lucide-react';

// Dynamic imports
const PredictiveSearch = dynamic(() => import('@/components/PredictiveSearch'), { ssr: false });
const MiniChart = dynamic(() => import('@/components/charts/MiniChart'), { ssr: false });
const AlgorithmPickCard = dynamic(() => import('@/components/home/AlgorithmPickCard'), { ssr: false });
const SectorMatrix = dynamic(() => import('@/components/SectorMatrix'), { ssr: false });

// Types
import type { Asset, AlgorithmPick, OHLCV } from '@/lib/types/market';

type MarketMode = 'all' | 'algorithm';
type AssetWithOHLCV = Asset & { ohlcv: OHLCV[] };

interface StocksPageData {
    assets: AssetWithOHLCV[];
    algorithmPicks: AlgorithmPick[];
}

export default function StocksPortal() {
    const [mode, setMode] = useState<MarketMode>('algorithm');
    const [data, setData] = useState<StocksPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSector, setSelectedSector] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const { getMarketPageData } = await import('@/lib/api/zenith-adapter');
                const pageData = await getMarketPageData('stock');
                setData(pageData);
            } catch (error) {
                console.error('Failed to load stocks data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleSectorSelect = (sector: string) => {
        setSelectedSector(prev => prev === sector ? null : sector);
    };

    return (
        <div className="theme-stock min-h-screen bg-[#0a0a12] text-white pt-20 md:pt-24">
            <main className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Building2 className="text-blue-400" />
                        Stock Markets
                    </h1>
                    <p className="text-zinc-400">
                        {mode === 'all'
                            ? 'Visual scan of all tracked equities'
                            : 'Stocks where the math is aligned'
                        }
                    </p>
                </div>

                {/* Search */}
                <div className="mb-8">
                    <PredictiveSearch mode="stock" behavior="filter" className="w-full max-w-xl" />
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
                                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg shadow-emerald-500/20'
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

                {/* Sector Matrix - Only in All Charts mode */}
                {mode === 'all' && (
                    <div className="mb-8">
                        <SectorMatrix onSelectSector={handleSectorSelect} />
                        {selectedSector && (
                            <div className="mt-4 flex items-center gap-2">
                                <span className="text-sm text-zinc-400">Filtering:</span>
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium flex items-center gap-2">
                                    {selectedSector}
                                    <button onClick={() => setSelectedSector(null)} className="hover:text-white">×</button>
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex items-center gap-3 text-zinc-400">
                            <Activity size={20} className="animate-pulse" />
                            <span>Loading stock data...</span>
                        </div>
                    </div>
                )}

                {/* Content */}
                {!loading && data && (
                    <AnimatePresence mode="wait">
                        {mode === 'all' && (
                            <motion.div
                                key="all-charts"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {data.assets.map((asset) => (
                                        <MiniChart
                                            key={asset.id}
                                            symbol={asset.symbol}
                                            name={asset.name}
                                            ohlcv={asset.ohlcv}
                                            regime={asset.regime}
                                            convictionScore={asset.convictionScore}
                                            price={asset.price}
                                            change24h={asset.change24h}
                                            onClick={() => window.location.href = `/stocks/${asset.symbol}`}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {mode === 'algorithm' && (
                            <motion.div
                                key="algorithm-picks"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                        <TrendingUp size={18} />
                                        <span className="text-sm font-medium">High Conviction Stock Setups</span>
                                    </div>
                                    <p className="text-sm text-zinc-500">
                                        Equities where quantitative factors align favorably. Click any card for deep analysis.
                                    </p>
                                </div>

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
                                        <p className="text-zinc-500">No stocks currently meet algorithm thresholds.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </main>

            <div className="py-8 text-center text-zinc-600 text-xs">
                Quotes delayed by 15 minutes. Market data provided by Financial Modeling Prep.
            </div>
        </div>
    );
}
/ /   v 2   d e p l o y m e n t   t i m e s t a m p :   1 7 6 6 7 2 0 7 2 6  
 