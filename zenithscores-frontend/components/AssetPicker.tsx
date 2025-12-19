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

    const defaultAssets: DisplayAsset[] = [
        { symbol: 'BTC', name: 'Bitcoin', price: 43250.00, change: 2.4, icon: '₿', color: 'bg-[#f7931a]/20 text-[#f7931a]', original: { symbol: 'BTC', name: 'Bitcoin', current_price: 43250.00, price_change_24h: 2.4, asset_type: 'crypto', max_leverage: 10 } },
        { symbol: 'ETH', name: 'Ethereum', price: 2285.50, change: 3.1, icon: 'Ξ', color: 'bg-[#627eea]/20 text-[#627eea]', original: { symbol: 'ETH', name: 'Ethereum', current_price: 2285.50, price_change_24h: 3.1, asset_type: 'crypto', max_leverage: 10 } },
        { symbol: 'SOL', name: 'Solana', price: 98.45, change: -1.2, icon: '◎', color: 'bg-[#14f195]/20 text-[#14f195]', original: { symbol: 'SOL', name: 'Solana', current_price: 98.45, price_change_24h: -1.2, asset_type: 'crypto', max_leverage: 5 } },
        { symbol: 'BNB', name: 'Binance Coin', price: 312.80, change: 0.8, icon: 'B', color: 'bg-[#f3ba2f]/20 text-[#f3ba2f]', original: { symbol: 'BNB', name: 'Binance Coin', current_price: 312.80, price_change_24h: 0.8, asset_type: 'crypto', max_leverage: 5 } },
        { symbol: 'XRP', name: 'Ripple', price: 0.6245, change: 5.3, icon: 'X', color: 'bg-[#23a8db]/20 text-[#23a8db]', original: { symbol: 'XRP', name: 'Ripple', current_price: 0.6245, price_change_24h: 5.3, asset_type: 'crypto', max_leverage: 5 } },
        { symbol: 'ADA', name: 'Cardano', price: 0.5832, change: -0.5, icon: '₳', color: 'bg-[#0033ad]/20 text-[#0033ad]', original: { symbol: 'ADA', name: 'Cardano', current_price: 0.5832, price_change_24h: -0.5, asset_type: 'crypto', max_leverage: 5 } },
    ];

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
                {filteredAssets.map((asset) => (
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
                ))}
            </div>
        </div>
    );
}
