'use client';

import { useState, useEffect } from 'react';
import { LayoutGrid, List, SlidersHorizontal, Star, Activity, Zap, TrendingUp, TrendingDown, Target, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// 🔧 Dynamic imports to prevent CSR hydration blocking
const AssetGrid = dynamic(() => import('@/components/AssetGrid'), { ssr: false });
const CryptoHeatmap = dynamic(() => import('@/components/CryptoHeatmap'), { ssr: false });
const AlertsFeed = dynamic(() => import('@/components/AlertsFeed'), { ssr: false });
const MarketPulse = dynamic(() => import('@/components/MarketPulse'), { ssr: false });
const QuickTradePrompt = dynamic(() => import('@/components/QuickTradePrompt'), { ssr: false });
const UniversalLoader = dynamic(() => import('@/components/UniversalLoader'), { ssr: false });

// Categories for filters
const CHAINS = ['Ethereum', 'Solana', 'BSC', 'Polygon', 'Arbitrum', 'Avalanche', 'Base'];
const SECTORS = ['DeFi', 'Gaming', 'L1', 'L2', 'Meme', 'AI', 'RWA', 'Infrastructure'];

// Sector Index definitions with color themes
const SECTOR_INDEXES = [
    { id: 'defi', name: 'DeFi', icon: '🏦', color: 'from-blue-500 to-cyan-500' },
    { id: 'gaming', name: 'Gaming', icon: '🎮', color: 'from-purple-500 to-pink-500' },
    { id: 'infra', name: 'Infrastructure', icon: '⛓️', color: 'from-blue-500 to-indigo-500' },
    { id: 'l2', name: 'Layer 2', icon: '📈', color: 'from-emerald-500 to-green-500' },
    { id: 'meme', name: 'Meme', icon: '🐕', color: 'from-yellow-500 to-orange-500' },
    { id: 'ai', name: 'AI/ML', icon: '🤖', color: 'from-violet-500 to-purple-500' },
];

export default function CryptoDashboard() {
    // Data State
    const [tokens, setTokens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'leaderboard' | 'heatmap' | 'watchlist'>('leaderboard');
    const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

    // Filter State
    const [selectedChain, setSelectedChain] = useState<string | null>(null);
    const [selectedSector, setSelectedSector] = useState<string | null>(null);

    // Quick Trade State
    const [selectedToken, setSelectedToken] = useState<any>(null);
    const [showQuickTrade, setShowQuickTrade] = useState(false);
    const router = useRouter();

    // Sector Scores (calculated from tokens)
    const [sectorScores, setSectorScores] = useState<Record<string, { score: number; change: number }>>({});

    useEffect(() => {
        const fetchTokens = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';
                const res = await fetch(`${apiUrl}/api/v1/tokens/scored?limit=100`);
                const data = await res.json();
                if (data.status === 'success') {
                    // Enrich with sectors/chains
                    const enriched = data.data.map((t: any, i: number) => ({
                        ...t,
                        chain: t.chain || CHAINS[i % CHAINS.length],
                        sector: SECTORS[i % SECTORS.length]
                    }));
                    setTokens(enriched);

                    // Calculate sector index scores
                    const scores: Record<string, { scores: number[]; changes: number[] }> = {};
                    enriched.forEach((t: any) => {
                        const sector = t.sector?.toLowerCase().replace('/', '');
                        if (!scores[sector]) scores[sector] = { scores: [], changes: [] };
                        scores[sector].scores.push(t.zenith_score || 50);
                        scores[sector].changes.push(t.price_change_24h || 0);
                    });

                    const calculated: Record<string, { score: number; change: number }> = {};
                    Object.keys(scores).forEach(sector => {
                        const avg = scores[sector].scores.reduce((a, b) => a + b, 0) / scores[sector].scores.length;
                        const avgChange = scores[sector].changes.reduce((a, b) => a + b, 0) / scores[sector].changes.length;
                        calculated[sector] = { score: Math.round(avg), change: avgChange };
                    });
                    setSectorScores(calculated);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        const savedWatchlist = localStorage.getItem('zenith_crypto_watchlist');
        if (savedWatchlist) {
            setWatchlist(new Set(JSON.parse(savedWatchlist)));
        }

        fetchTokens();
    }, []);

    const toggleWatchlist = (symbol: string) => {
        const newWatchlist = new Set(watchlist);
        if (newWatchlist.has(symbol)) {
            newWatchlist.delete(symbol);
        } else {
            newWatchlist.add(symbol);
        }
        setWatchlist(newWatchlist);
        localStorage.setItem('zenith_crypto_watchlist', JSON.stringify(Array.from(newWatchlist)));
    };

    // Handle token click for quick trade
    const handleTokenClick = (token: any) => {
        setSelectedToken(token);
        setShowQuickTrade(true);
    };

    const handleTrade = () => {
        setShowQuickTrade(false);
        router.push('/trading');
    };

    // Derived Data
    const filteredTokens = tokens.filter(t => {
        if (selectedChain && t.chain !== selectedChain) return false;
        if (selectedSector && t.sector !== selectedSector) return false;
        if (view === 'watchlist' && !watchlist.has(t.symbol)) return false;
        return true;
    });


    if (loading) return (
        <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
            <UniversalLoader size="lg" message="Initializing Crypto Intelligence..." />
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8">

            {/* LEFT COLUMN: Control Center (1/3) */}
            <div className="w-full lg:w-1/3 flex-shrink-0 space-y-6">

                {/* 0. Market Pulse Widget */}
                <MarketPulse />

                {/* 1. Sector Indexes Grid - EXPANDED */}
                <div className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-5">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="text-cyan-400" size={18} />
                        Sector Indexes
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {SECTOR_INDEXES.map(sector => {
                            const sectorKey = sector.id;
                            const data = sectorScores[sectorKey] || { score: 50 + Math.floor(Math.random() * 30), change: Math.random() * 6 - 3 };
                            const isPositive = data.change >= 0;

                            return (
                                <motion.button
                                    key={sector.id}
                                    onClick={() => setSelectedSector(selectedSector === sector.name ? null : sector.name)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`relative overflow-hidden p-3 rounded-xl border transition-all ${selectedSector === sector.name
                                        ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                                        : 'border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${sector.color} opacity-10`} />
                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-lg">{sector.icon}</span>
                                            <span className={`text-xs font-medium flex items-center gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                {isPositive ? '+' : ''}{data.change.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400 font-medium">{sector.name}</div>
                                        <div className="text-xl font-bold text-white font-mono">{data.score}</div>
                                        <div className="h-1 bg-black/30 rounded-full mt-2 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${data.score}%` }}
                                                transition={{ duration: 1, delay: 0.2 }}
                                                className={`h-full rounded-full bg-gradient-to-r ${sector.color}`}
                                            />
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Screener Filters */}
                <div className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4 text-white font-bold">
                        <SlidersHorizontal size={18} className="text-cyan-400" />
                        <h3>Market Filters</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Chain</label>
                            <div className="flex flex-wrap gap-2">
                                {CHAINS.map(chain => (
                                    <button
                                        key={chain}
                                        onClick={() => setSelectedChain(selectedChain === chain ? null : chain)}
                                        className={`px-3 py-1 text-xs rounded-full border transition-all ${selectedChain === chain ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'}`}
                                    >
                                        {chain}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Sector</label>
                            <div className="flex flex-wrap gap-2">
                                {SECTORS.map(sec => (
                                    <button
                                        key={sec}
                                        onClick={() => setSelectedSector(selectedSector === sec ? null : sec)}
                                        className={`px-3 py-1 text-xs rounded-full border transition-all ${selectedSector === sec ? 'bg-purple-600 border-purple-600 text-white' : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'}`}
                                    >
                                        {sec}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Alerts Feed */}
                <AlertsFeed />

                {/* 4. Watchlist Module */}
                <div className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Star size={16} fill="gold" className="text-yellow-400" />
                            My Watchlist
                        </h3>
                        <span className="text-xs text-gray-500">{watchlist.size} tracked</span>
                    </div>
                    {watchlist.size > 0 ? (
                        <div className="space-y-2">
                            {Array.from(watchlist).slice(0, 3).map(sym => {
                                const token = tokens.find(t => t.symbol === sym);
                                const change = token?.price_change_24h || 0;
                                return (
                                    <button
                                        key={sym}
                                        onClick={() => token && handleTokenClick(token)}
                                        className="w-full flex justify-between items-center bg-black/30 p-2 rounded-lg text-sm hover:bg-black/50 transition-colors"
                                    >
                                        <span className="font-bold text-white">{sym}</span>
                                        <span className={`text-xs font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                        </span>
                                    </button>
                                );
                            })}
                            <button onClick={() => setView('watchlist')} className="w-full text-center text-xs text-cyan-400 mt-2 hover:underline">View All Analysis →</button>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 italic">No assets tracked yet. Click ⭐ on any token to add.</p>
                    )}
                </div>

            </div>

            {/* RIGHT COLUMN: Data Canvas (2/3) */}
            <div className="w-full lg:w-2/3 min-w-0">

                {/* Visual Tab Navigation */}
                <div className="flex space-x-1 bg-black/40 p-1 rounded-xl mb-6 max-w-fit border border-white/10">
                    <button
                        onClick={() => setView('leaderboard')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'leaderboard' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <List size={16} /> Leaderboard
                    </button>
                    <button
                        onClick={() => setView('heatmap')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'heatmap' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <LayoutGrid size={16} /> Heatmap
                    </button>
                    <button
                        onClick={() => setView('watchlist')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'watchlist' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Activity size={16} /> Watchlist
                    </button>
                </div>

                {/* Content Area */}
                <div className="min-h-[500px]">
                    {view === 'heatmap' ? (
                        <CryptoHeatmap tokens={filteredTokens} />
                    ) : (
                        <AssetGrid
                            tokens={filteredTokens}
                            onTokenClick={handleTokenClick}
                            watchlist={watchlist}
                            onToggleWatchlist={toggleWatchlist}
                        />
                    )}

                    {filteredTokens.length === 0 && (
                        <div className="text-center py-20 bg-gray-900/50 rounded-xl border border-white/10 border-dashed">
                            <p className="text-gray-400 mb-2">No assets found matching filters.</p>
                            <button onClick={() => { setSelectedChain(null); setSelectedSector(null); }} className="text-cyan-400 text-sm hover:underline">Clear Filters</button>
                        </div>
                    )}
                </div>

            </div>

            {/* Quick Trade Prompt */}
            <QuickTradePrompt
                asset={selectedToken ? {
                    symbol: selectedToken.symbol,
                    name: selectedToken.name || selectedToken.symbol,
                    current_price: selectedToken.price_usd || 0,
                    price_change_24h: selectedToken.price_change_24h || 0,
                    asset_type: 'crypto',
                    max_leverage: 5,
                    image: selectedToken.image
                } : null}
                isOpen={showQuickTrade}
                onClose={() => setShowQuickTrade(false)}
                onTrade={handleTrade}
            />
        </div>
    );
}
