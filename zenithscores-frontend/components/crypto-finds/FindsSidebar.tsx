'use client';

import { useState } from 'react';
import { Search, Filter, TrendingUp, Activity } from 'lucide-react';
import PairFeedItem from './PairFeedItem';
import type { CryptoFindsPair } from './types';

// ETH/ARB/BASE only - no other chains
const CHAINS = [
    { id: 'ethereum', label: 'ETH', color: 'bg-blue-500 text-white' },
    { id: 'arbitrum', label: 'ARB', color: 'bg-cyan-500 text-white' },
    { id: 'base', label: 'BASE', color: 'bg-purple-500 text-white' }
] as const;

type ChainId = typeof CHAINS[number]['id'];

interface FindsSidebarProps {
    pairs: CryptoFindsPair[];
    selectedPairAddress?: string;
    onSelect: (pair: CryptoFindsPair) => void;
    loading: boolean;
    filters: {
        chains: ('ethereum' | 'arbitrum' | 'base')[];
        minLiquidity: number;
        minVolume24h: number;
    };
    onFiltersChange: (filters: any) => void;
}

export default function FindsSidebar({
    pairs,
    selectedPairAddress,
    onSelect,
    loading,
    filters,
    onFiltersChange
}: FindsSidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Filter pairs by search and selected chains
    const filteredPairs = pairs.filter(p => {
        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!p.baseSymbol.toLowerCase().includes(q) &&
                !p.baseName.toLowerCase().includes(q)) {
                return false;
            }
        }
        // Chain filter
        if (!filters.chains.includes(p.chainId as ChainId)) {
            return false;
        }
        return true;
    });

    function toggleChain(chainId: ChainId) {
        const current = filters.chains;
        const updated = current.includes(chainId)
            ? current.filter(c => c !== chainId)
            : [...current, chainId];
        // Don't allow empty selection
        if (updated.length === 0) return;
        onFiltersChange({ ...filters, chains: updated });
    }

    return (
        <div className="h-full flex flex-col bg-[#0c0c10]">
            {/* Header */}
            <div className="p-3 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        Crypto Finds
                    </h2>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-[var(--accent-mint)]/10 text-[var(--accent-mint)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Filter size={14} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search pairs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--accent-mint)]/30"
                    />
                </div>

                {/* Chain Toggles (always visible) */}
                <div className="flex gap-1 mt-3">
                    {CHAINS.map(chain => {
                        const isActive = filters.chains.includes(chain.id);
                        return (
                            <button
                                key={chain.id}
                                onClick={() => toggleChain(chain.id)}
                                className={`px-2.5 py-1 text-xs font-bold rounded transition-all ${isActive
                                        ? chain.color
                                        : 'bg-white/5 text-zinc-500 hover:bg-white/10'
                                    }`}
                            >
                                {chain.label}
                            </button>
                        );
                    })}
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="mt-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.06] space-y-3">
                        {/* Min Liquidity */}
                        <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                Min Liquidity: ${filters.minLiquidity.toLocaleString()}
                            </label>
                            <input
                                type="range"
                                min={0}
                                max={500000}
                                step={25000}
                                value={filters.minLiquidity}
                                onChange={(e) => onFiltersChange({ ...filters, minLiquidity: parseInt(e.target.value) })}
                                className="w-full mt-1 accent-[var(--accent-mint)]"
                            />
                        </div>

                        {/* Min Volume */}
                        <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                Min 24H Volume: ${filters.minVolume24h.toLocaleString()}
                            </label>
                            <input
                                type="range"
                                min={0}
                                max={500000}
                                step={25000}
                                value={filters.minVolume24h}
                                onChange={(e) => onFiltersChange({ ...filters, minVolume24h: parseInt(e.target.value) })}
                                className="w-full mt-1 accent-[var(--accent-mint)]"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Bar */}
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-4 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1">
                    <Activity size={10} />
                    {filteredPairs.length} pairs
                </span>
                <span className="flex items-center gap-1">
                    <TrendingUp size={10} />
                    {filteredPairs.filter(p => p.priceChange24h > 0).length} bullish
                </span>
            </div>

            {/* Feed List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 space-y-2">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-16 bg-white/[0.02] rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : filteredPairs.length === 0 ? (
                    <div className="p-4 text-center text-zinc-600 text-sm">
                        No pairs found
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {filteredPairs.map(pair => (
                            <PairFeedItem
                                key={pair.pairAddress}
                                pair={pair}
                                isSelected={pair.pairAddress === selectedPairAddress}
                                onClick={() => onSelect(pair)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
