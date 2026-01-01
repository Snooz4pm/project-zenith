'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import FindsSidebar from './FindsSidebar';
import MarketTerminal from './MarketTerminal';
import MarketStatsPanel from './MarketStatsPanel';
import { getCryptoFindsFeed, getPairDetails } from '@/lib/actions/crypto-finds';
import { useFlowSystem } from '@/hooks/useFlowSystem';
import type { CryptoFindsPair } from './types';
import { ChevronDown, X, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CryptoFindsLayout() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [pairs, setPairs] = useState<CryptoFindsPair[]>([]);
    const [selectedPair, setSelectedPair] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showMobilePairSelector, setShowMobilePairSelector] = useState(false);

    // Default: All chains enabled with relaxed thresholds
    const [filters, setFilters] = useState({
        chains: ['ethereum', 'arbitrum', 'base', 'solana', 'bsc', 'polygon', 'avalanche', 'optimism'] as ('ethereum' | 'arbitrum' | 'base' | 'solana' | 'bsc' | 'polygon' | 'avalanche' | 'optimism')[],
        minLiquidity: 10_000,
        minVolume24h: 5_000
    });

    // Flow System - Orchestrated at layout level
    const { transactions, regime, flowEvents, isPolling } = useFlowSystem(selectedPair);

    // Load feed
    useEffect(() => {
        async function loadFeed() {
            setLoading(true);
            const result = await getCryptoFindsFeed(filters);
            if (result.success) {
                setPairs(result.pairs);
                // Auto-select first pair if none selected
                const pairParam = searchParams.get('pair');
                if (!selectedPair && result.pairs.length > 0) {
                    const defaultPair = pairParam
                        ? result.pairs.find(p => p.pairAddress === pairParam) || result.pairs[0]
                        : result.pairs[0];
                    loadPairDetails(defaultPair.pairAddress, defaultPair.chainId);
                }
            }
            setLoading(false);
        }
        loadFeed();
    }, [filters]);

    // Load pair from URL
    useEffect(() => {
        const pairParam = searchParams.get('pair');
        if (pairParam && (!selectedPair || selectedPair.pairAddress !== pairParam)) {
            loadPairDetails(pairParam);
        }
    }, [searchParams]);

    async function loadPairDetails(pairAddress: string, chainId?: string) {
        const result = await getPairDetails(pairAddress, chainId);
        if (result.success && result.pair) {
            setSelectedPair(result.pair);
            router.replace(`/markets/crypto-finds?pair=${pairAddress}`, { scroll: false });
        }
    }

    function handlePairSelect(pair: CryptoFindsPair) {
        loadPairDetails(pair.pairAddress, pair.chainId);
        setShowMobilePairSelector(false); // Close mobile selector
    }

    return (
        <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] flex bg-[#0a0a0d] overflow-hidden relative pb-20 md:pb-0">
            {/* Mobile Pair Selector Button - Fixed at top */}
            <div className="lg:hidden absolute top-0 left-0 right-0 z-30 p-3 bg-gradient-to-b from-[#0a0a0d] via-[#0a0a0d] to-transparent">
                <button
                    onClick={() => setShowMobilePairSelector(true)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl active:scale-[0.98] transition-transform"
                >
                    <div className="flex items-center gap-3">
                        <TrendingUp size={18} className="text-[var(--accent-mint)]" />
                        <div className="text-left">
                            {selectedPair ? (
                                <>
                                    <div className="text-sm font-bold text-white font-mono">
                                        {selectedPair.baseToken.symbol}/{selectedPair.quoteToken.symbol}
                                    </div>
                                    <div className="text-xs text-zinc-500 truncate max-w-[180px]">
                                        {selectedPair.baseToken.name}
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm font-medium text-zinc-400">Select a pair</div>
                            )}
                        </div>
                    </div>
                    <ChevronDown size={18} className="text-zinc-500" />
                </button>
            </div>

            {/* Mobile Pair Selector Modal */}
            <AnimatePresence>
                {showMobilePairSelector && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobilePairSelector(false)}
                            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0d] border-t border-white/10 rounded-t-3xl max-h-[75vh] overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                                <h3 className="text-lg font-bold text-white">Select Pair</h3>
                                <button
                                    onClick={() => setShowMobilePairSelector(false)}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-zinc-400" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <div className="p-6 space-y-3">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : pairs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="text-zinc-500 text-sm mb-2">No pairs found</div>
                                        <div className="text-zinc-600 text-xs">Try adjusting filters</div>
                                    </div>
                                ) : (
                                    <div className="p-4 space-y-2">
                                        {pairs.map((pair) => (
                                            <button
                                                key={pair.pairAddress}
                                                onClick={() => handlePairSelect(pair)}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.98] ${
                                                    selectedPair?.pairAddress === pair.pairAddress
                                                        ? 'bg-[var(--accent-mint)]/10 border-2 border-[var(--accent-mint)]/30'
                                                        : 'bg-white/[0.02] border border-white/5'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-mint)]/20 to-teal-500/20 flex items-center justify-center">
                                                        <span className="text-sm font-bold text-[var(--accent-mint)]">
                                                            {pair.baseSymbol.slice(0, 2).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-bold text-white font-mono">
                                                            {pair.baseSymbol}/{pair.quoteSymbol}
                                                        </div>
                                                        <div className="text-xs text-zinc-500 truncate max-w-[180px]">
                                                            {pair.baseName}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold font-mono text-white">
                                                        ${pair.priceUsd < 0.01 ? pair.priceUsd.toExponential(2) : pair.priceUsd.toFixed(4)}
                                                    </div>
                                                    {pair.priceChange24h !== undefined && (
                                                        <div className={`text-xs font-mono ${
                                                            pair.priceChange24h >= 0 ? 'text-[var(--accent-mint)]' : 'text-red-400'
                                                        }`}>
                                                            {pair.priceChange24h >= 0 ? '+' : ''}{pair.priceChange24h.toFixed(1)}%
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* LEFT SIDEBAR - Discovery Feed (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-[280px] flex-shrink-0 border-r border-white/[0.06] overflow-hidden flex-col">
                <FindsSidebar
                    pairs={pairs}
                    selectedPairAddress={selectedPair?.pairAddress}
                    onSelect={handlePairSelect}
                    loading={loading}
                    filters={filters}
                    onFiltersChange={setFilters}
                />
            </div>

            {/* MAIN PANEL - Terminal */}
            <div className="flex-1 min-w-0 overflow-hidden pt-16 lg:pt-0">
                <MarketTerminal
                    pair={selectedPair}
                    flowRegime={regime}
                    flowEvents={flowEvents}
                    isPolling={isPolling}
                />
            </div>

            {/* RIGHT PANEL - Stats + Live Flow */}
            <div className="hidden xl:block w-[300px] flex-shrink-0 border-l border-white/[0.06] overflow-hidden">
                <MarketStatsPanel
                    pair={selectedPair}
                    transactions={transactions}
                    isPolling={isPolling}
                />
            </div>
        </div>
    );
}
