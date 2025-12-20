'use client';

import { useState } from 'react';
import { Search, Star, TrendingUp } from 'lucide-react';

interface Asset {
    symbol: string;
    name: string;
    current_price: number;
    price_change_24h: number;
    asset_type: string;
    max_leverage: number;
}

interface AssetPickerProps {
    assets?: Asset[];
    onSelect?: (asset: Asset) => void;
}

interface DisplayAsset {
    symbol: string;
    name: string;
    price: number;
    change: number;
    icon: string;
    color: string;
    original?: Asset;
}

export default function AssetPicker({ assets: externalAssets, onSelect }: AssetPickerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'trending'>('all');

    const defaultAssets: DisplayAsset[] = [];

    const displayAssets: DisplayAsset[] = externalAssets
        ? externalAssets.map(a => ({
            symbol: a.symbol,
            name: a.name,
            price: a.current_price,
            change: a.price_change_24h,
            icon: a.symbol && a.symbol.length > 0 ? a.symbol[0] : '?',
            color: a.price_change_24h >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400',
            original: a
        }))
        : defaultAssets;

    const filteredAssets = displayAssets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.symbol.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (activeFilter === 'favorites') return ['BTC', 'ETH'].includes(asset.symbol);
        if (activeFilter === 'trending') return Math.abs(asset.change) > 2;

        return true;
    });

    return (
        <div className="bg-[#0a0e27] p-6 rounded-xl border border-[#1a1f3a] h-full">
            <h3 className="text-lg font-bold text-white mb-4">Market Watch</h3>

            {/* Search */}
            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#141829] border border-[#1a1f3a] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'favorites', label: 'Favorites' },
                    { id: 'trending', label: 'Trending' }
                ].map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id as any)}
                        className={`
                            flex-1 py-2 rounded-lg text-xs font-semibold transition-all
                            ${activeFilter === filter.id
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'bg-[#141829] text-gray-400 border border-[#1a1f3a] hover:bg-[#1a1f3a]'
                            }
                        `}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Asset List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredAssets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <TrendingUp className="mx-auto mb-2 opacity-50" size={24} />
                        <p className="text-sm">No assets available.</p>
                        {activeFilter !== 'all' && (
                            <button
                                onClick={() => setActiveFilter('all')}
                                className="text-xs text-cyan-400 hover:underline mt-1"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    filteredAssets.map((asset) => (
                        <div
                            key={asset.symbol}
                            onClick={() => onSelect && asset.original && onSelect(asset.original)}
                            className="group flex items-center justify-between p-3 rounded-lg bg-[#141829] border border-[#1a1f3a] hover:border-[#2a3150] hover:translate-x-1 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${asset.color}`}>
                                    {asset.icon}
                                </div>
                                <div>
                                    <div className="font-semibold text-white text-sm">{asset.name}</div>
                                    <div className="text-xs text-gray-500">{asset.symbol}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-mono text-white text-sm">${asset.price.toLocaleString()}</div>
                                <div className={`text-xs font-semibold ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {asset.change > 0 ? '+' : ''}{asset.change}%
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
