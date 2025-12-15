'use client';

import { useState, useEffect } from 'react';
import { LayoutGrid, List, SlidersHorizontal, Star, Activity } from 'lucide-react';
import AssetGrid from '@/components/AssetGrid';
import CryptoHeatmap from '@/components/CryptoHeatmap';
import AlertsFeed from '@/components/AlertsFeed';
import MarketPulse from '@/components/MarketPulse';

// Categories for filters
const CHAINS = ['Ethereum', 'Solana', 'BSC', 'Polygon', 'Arbitrum'];
const SECTORS = ['DeFi', 'Gaming', 'L1', 'L2', 'Meme', 'AI'];

export default function CryptoDashboard() {
    // Data State
    const [tokens, setTokens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'leaderboard' | 'heatmap' | 'watchlist'>('leaderboard');
    const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

    // Filter State
    const [selectedChain, setSelectedChain] = useState<string | null>(null);
    const [selectedSector, setSelectedSector] = useState<string | null>(null);

    useEffect(() => {
        // Fetch Logic (Reusing existing API pattern)
        const fetchTokens = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/v1/tokens/scored?limit=50`);
                const data = await res.json();
                if (data.status === 'success') {
                    // Enrich with mock sectors/chains if missing
                    const enriched = data.data.map((t: any) => ({
                        ...t,
                        chain: t.chain || CHAINS[Math.floor(Math.random() * CHAINS.length)],
                        sector: SECTORS[Math.floor(Math.random() * SECTORS.length)]
                    }));
                    setTokens(enriched);
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

    // Derived Data
    const filteredTokens = tokens.filter(t => {
        if (selectedChain && t.chain !== selectedChain) return false;
        if (selectedSector && t.sector !== selectedSector) return false;
        if (view === 'watchlist' && !watchlist.has(t.symbol)) return false;
        return true;
    });

    // Mock Indices Scores
    const defiScore = 72;
    const nftScore = 45;

    if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white/50 animate-pulse">Initializing Crypto Intelligence...</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-8">

            {/* LEFT COLUMN: Control Center (1/3) */}
            <div className="w-full lg:w-1/3 flex-shrink-0 space-y-6">

                {/* 0. Market Pulse Widget */}
                <MarketPulse />

                {/* 1. Global Metrics / Indices */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">DeFi Index</div>
                        <div className="text-2xl font-bold text-white mb-2">{defiScore}</div>
                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${defiScore}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Gaming/NFT</div>
                        <div className="text-2xl font-bold text-white mb-2">{nftScore}</div>
                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${nftScore}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* 2. Screener Filters */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4 text-white font-bold">
                        <SlidersHorizontal size={18} />
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
                                        className={`px-3 py-1 text-xs rounded-full border transition-all ${selectedChain === chain ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
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
                                        className={`px-3 py-1 text-xs rounded-full border transition-all ${selectedSector === sec ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
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

                {/* 4. Watchlist Module (Persistent) */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Star size={16} fill="white" className="text-yellow-400" />
                            My Watchlist
                        </h3>
                        <span className="text-xs text-gray-500">{watchlist.size} tracked</span>
                    </div>
                    {watchlist.size > 0 ? (
                        <div className="space-y-2">
                            {Array.from(watchlist).slice(0, 3).map(sym => (
                                <div key={sym} className="flex justify-between items-center bg-black/20 p-2 rounded text-sm">
                                    <span className="font-bold text-white">{sym}</span>
                                    <span className="text-xs text-green-400">+2.4%</span> {/* Mock change for list view */}
                                </div>
                            ))}
                            <button onClick={() => setView('watchlist')} className="w-full text-center text-xs text-blue-400 mt-2 hover:underline">View All Analysis &rarr;</button>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 italic">No assets tracked yet.</p>
                    )}
                </div>

            </div>

            {/* RIGHT COLUMN: Data Canvas (2/3) */}
            <div className="w-full lg:w-2/3 min-w-0">

                {/* Visual Tab Navigation */}
                <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg mb-6 max-w-fit">
                    <button
                        onClick={() => setView('leaderboard')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${view === 'leaderboard' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        <List size={16} /> Leaderboard
                    </button>
                    <button
                        onClick={() => setView('heatmap')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${view === 'heatmap' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        <LayoutGrid size={16} /> Heatmap
                    </button>
                    <button
                        onClick={() => setView('watchlist')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${view === 'watchlist' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Activity size={16} /> Watchlist Analysis
                    </button>
                </div>

                {/* Content Area */}
                <div className="min-h-[500px]">
                    {view === 'heatmap' ? (
                        <CryptoHeatmap tokens={filteredTokens} />
                    ) : (
                        <AssetGrid tokens={filteredTokens} />
                    )}

                    {filteredTokens.length === 0 && (
                        <div className="text-center py-20 bg-gray-900/50 rounded-xl border border-gray-800 border-dashed">
                            <p className="text-gray-400 mb-2">No assets found matching filters.</p>
                            <button onClick={() => { setSelectedChain(null); setSelectedSector(null); }} className="text-blue-400 text-sm hover:underline">Clear Filters</button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
