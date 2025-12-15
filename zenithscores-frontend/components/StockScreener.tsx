'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ArrowUp, ArrowDown, Star, Search, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface Stock {
    symbol: string;
    name: string;
    price_usd: number;
    price_change_24h: number;
    volume_24h: number;
    zenith_score: number;
    sector?: string;
    market_cap?: number;
}

const SECTORS = ['Technology', 'Finance', 'Healthcare', 'Consumer', 'Energy', 'Industrial'];
const MARKET_CAPS = [
    { label: 'Mega Cap (> $200B)', value: 'mega', min: 200_000_000_000 },
    { label: 'Large Cap ($10B - $200B)', value: 'large', min: 10_000_000_000, max: 200_000_000_000 },
    { label: 'Mid Cap ($2B - $10B)', value: 'mid', min: 2_000_000_000, max: 10_000_000_000 },
    { label: 'Small Cap (< $2B)', value: 'small', max: 2_000_000_000 },
];

export default function StockScreener() {
    // Data State
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

    // Filter State
    const [selectedSectors, setSelectedSectors] = useState<Set<string>>(new Set());
    const [selectedCap, setSelectedCap] = useState<string | null>(null);
    const [minScore, setMinScore] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    // UI State
    const [sortBy, setSortBy] = useState<'score' | 'change' | 'volume'>('score');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [view, setView] = useState<'market' | 'watchlist'>('market');

    // Load initial data
    useEffect(() => {
        const fetchStocks = async () => {
            try {
                // In a real app, we might pass filter params to the API
                // For now, we fetch all trending/available and filter client-side
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/v1/stocks/trending`);
                const data = await res.json();
                if (data.status === 'success') {
                    // Mock sectors/market caps if missing for demo purposes
                    const enrichedData = data.data.map((s: any) => ({
                        ...s,
                        sector: s.sector || SECTORS[Math.floor(Math.random() * SECTORS.length)],
                        market_cap: s.market_cap || Math.random() * 500_000_000_000 // Mock cap
                    }));
                    setStocks(enrichedData);
                }
            } catch (error) {
                console.error('Failed to fetch stocks:', error);
            } finally {
                setLoading(false);
            }
        };

        // Load watchlist from local storage
        const savedWatchlist = localStorage.getItem('zenith_stock_watchlist');
        if (savedWatchlist) {
            setWatchlist(new Set(JSON.parse(savedWatchlist)));
        }

        fetchStocks();
    }, []);

    // Save watchlist
    const toggleWatchlist = (symbol: string) => {
        const newWatchlist = new Set(watchlist);
        if (newWatchlist.has(symbol)) {
            newWatchlist.delete(symbol);
        } else {
            newWatchlist.add(symbol);
        }
        setWatchlist(newWatchlist);
        localStorage.setItem('zenith_stock_watchlist', JSON.stringify(Array.from(newWatchlist)));
    };

    // Filter Logic
    const filteredStocks = useMemo(() => {
        return stocks.filter(stock => {
            // Search
            if (searchQuery && !stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) && !stock.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            // Sectors
            if (selectedSectors.size > 0 && stock.sector && !selectedSectors.has(stock.sector)) {
                return false;
            }
            // Score
            if (stock.zenith_score < minScore) {
                return false;
            }
            // Watchlist View
            if (view === 'watchlist' && !watchlist.has(stock.symbol)) {
                return false;
            }
            // Market Cap
            if (selectedCap && stock.market_cap) {
                const capDef = MARKET_CAPS.find(c => c.value === selectedCap);
                if (capDef) {
                    if (capDef.min && stock.market_cap < capDef.min) return false;
                    if (capDef.max && stock.market_cap > capDef.max) return false;
                }
            }
            return true;
        }).sort((a, b) => {
            if (sortBy === 'score') return b.zenith_score - a.zenith_score;
            if (sortBy === 'change') return b.price_change_24h - a.price_change_24h;
            if (sortBy === 'volume') return b.volume_24h - a.volume_24h;
            return 0;
        });
    }, [stocks, searchQuery, selectedSectors, minScore, selectedCap, sortBy, view, watchlist]);

    if (loading) {
        return <div className="h-96 w-full bg-gray-900/50 animate-pulse rounded-xl border border-gray-800" />;
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* LEFT SIDEBAR - FILTERS */}
            <div className={`lg:w-72 flex-shrink-0 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 sticky top-24 space-y-8">

                    {/* VIEW TOGGLE - NEW */}
                    <div className="bg-gray-800 p-1 rounded-lg flex mb-6">
                        <button
                            onClick={() => setView('market')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${view === 'market' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            All Stocks
                        </button>
                        <button
                            onClick={() => setView('watchlist')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${view === 'watchlist' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Star size={14} fill={view === 'watchlist' ? "currentColor" : "none"} /> Watchlist
                        </button>
                    </div>

                    <div className="flex items-center justify-between lg:hidden mb-4">
                        <h3 className="font-bold text-white">Filters</h3>
                        <button onClick={() => setMobileFiltersOpen(false)} className="text-gray-400">Close</button>
                    </div>

                    {/* Sector Filter */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Sector</h4>
                        <div className="space-y-2">
                            {SECTORS.map(sector => (
                                <label key={sector} className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedSectors.has(sector) ? 'bg-blue-600 border-blue-600' : 'border-gray-600 group-hover:border-gray-500'}`}>
                                        {selectedSectors.has(sector) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedSectors.has(sector)}
                                        onChange={() => {
                                            const newSet = new Set(selectedSectors);
                                            if (newSet.has(sector)) newSet.delete(sector);
                                            else newSet.add(sector);
                                            setSelectedSectors(newSet);
                                        }}
                                    />
                                    <span className={`text-sm ${selectedSectors.has(sector) ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>{sector}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Market Cap Filter */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Market Cap</h4>
                        <div className="space-y-2">
                            {MARKET_CAPS.map(cap => (
                                <button
                                    key={cap.value}
                                    onClick={() => setSelectedCap(selectedCap === cap.value ? null : cap.value)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCap === cap.value ? 'bg-blue-900/30 text-blue-300 border border-blue-500/50' : 'text-gray-400 hover:bg-gray-800'}`}
                                >
                                    {cap.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Score Slider */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Min Zenith Score</h4>
                            <span className="text-sm font-bold text-blue-400">{minScore}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="90"
                            step="5"
                            value={minScore}
                            onChange={(e) => setMinScore(Number(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT Area */}
            <div className="flex-1 min-w-0">
                {/* Control Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                    <button
                        onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                        className="lg:hidden w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-white font-medium"
                    >
                        <SlidersHorizontal size={16} /> Filters
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-sm text-gray-400 whitespace-nowrap hidden sm:inline">Sort by:</span>
                        <div className="flex bg-gray-800 p-1 rounded-lg">
                            {(['score', 'change', 'volume'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSortBy(type)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${sortBy === type ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                        {/* View Toggle could go here */}
                        <div className="text-xs text-gray-500 font-mono self-center">
                            {filteredStocks.length} Results
                        </div>
                    </div>
                </div>

                {/* Results Grid/List */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {filteredStocks.map((stock, i) => (
                            <motion.div
                                key={stock.symbol}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2, delay: i * 0.05 }}
                                className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-blue-500/30 transition-all group"
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    {/* Left: Info */}
                                    <div className="flex items-center gap-4 flex-1">
                                        <button
                                            onClick={(e) => { e.preventDefault(); toggleWatchlist(stock.symbol); }}
                                            className={`p-2 rounded-lg transition-colors ${watchlist.has(stock.symbol) ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-600 hover:bg-gray-800 hover:text-gray-300'}`}
                                        >
                                            <Star size={18} fill={watchlist.has(stock.symbol) ? "currentColor" : "none"} />
                                        </button>

                                        <Link href={`/stocks/${stock.symbol}`} className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{stock.symbol}</h3>
                                                    <p className="text-xs text-gray-400">{stock.name}</p>
                                                </div>
                                                {stock.sector && (
                                                    <span className="hidden sm:inline-block px-2 py-0.5 bg-gray-800 text-gray-500 text-[10px] uppercase tracking-wider rounded">
                                                        {stock.sector}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    </div>

                                    {/* Right: Metrics */}
                                    <div className="flex items-center gap-6 sm:gap-12 w-full sm:w-auto justify-between sm:justify-end">
                                        <div className="text-right">
                                            <div className="text-sm font-mono text-white">${stock.price_usd.toFixed(2)}</div>
                                            <div className={`flex items-center justify-end text-xs font-bold ${stock.price_change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {stock.price_change_24h >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                {Math.abs(stock.price_change_24h).toFixed(2)}%
                                            </div>
                                        </div>

                                        <div className="w-32">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-500">Zenith Score</span>
                                                <span className="text-white font-bold">{stock.zenith_score.toFixed(0)}</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${stock.zenith_score >= 75 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : stock.zenith_score >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                                                    style={{ width: `${stock.zenith_score}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredStocks.length === 0 && (
                        <div className="text-center py-20 text-gray-500">
                            No stocks match your filters.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
