'use client';

import { useState, useEffect } from 'react';
import { NormalizedToken } from '@/lib/dexscreener';
import FlowTokenCard from '@/components/terminal/FlowTokenCard';
import SwapDrawer from '@/components/terminal/SwapDrawer';
import { Flame, Rocket, Target, RefreshCw, Zap } from 'lucide-react';

interface FlowData {
    hotNow: NormalizedToken[];
    memeFlow: NormalizedToken[];
    tradeSetups: NormalizedToken[];
}

export default function FlowPage() {
    const [flowData, setFlowData] = useState<FlowData>({
        hotNow: [],
        memeFlow: [],
        tradeSetups: [],
    });
    const [selectedToken, setSelectedToken] = useState<NormalizedToken | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchFlowData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/flow', { cache: 'no-store' });
            const data = await response.json();
            setFlowData(data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Failed to fetch flow data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchFlowData();
    }, []);

    // Auto-refresh every 45 seconds
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchFlowData();
        }, 45000);

        return () => clearInterval(interval);
    }, [autoRefresh]);

    const handleRefresh = () => {
        fetchFlowData();
    };

    // Calculate if a token should show the "Live" badge
    const isHighActivity = (token: NormalizedToken) => {
        return token.volume24hUsd > 100000 || Math.abs(token.priceChange24h) > 10;
    };

    return (
        <div className="min-h-screen bg-[#050709] text-white">
            {/* Header */}
            {/* Main Content */}
            <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-12 max-w-[1800px] mx-auto">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <Zap className="w-6 h-6 text-black fill-current" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                Flow
                            </h1>
                            <p className="text-sm text-zinc-500">
                                What people are trading right now
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${autoRefresh
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400'
                                }`}
                        >
                            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
                        </button>

                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="p-2 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>

                        <div className="text-xs text-zinc-500">
                            Updated {lastUpdate.toLocaleTimeString()}
                        </div>
                    </div>
                </div>
                {/* Section A: Hot Now */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <Flame className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">🔥 Hot Now</h2>
                            <p className="text-sm text-zinc-500">High velocity, sudden spikes, fresh momentum</p>
                        </div>
                    </div>

                    {loading && flowData.hotNow.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-48 bg-zinc-900/50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {flowData.hotNow.map((token) => (
                                <FlowTokenCard
                                    key={token.id}
                                    token={token}
                                    onClick={() => setSelectedToken(token)}
                                    showLiveBadge={isHighActivity(token)}
                                />
                            ))}
                        </div>
                    )}

                    {!loading && flowData.hotNow.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">
                            <p>Scanning for hot tokens...</p>
                        </div>
                    )}
                </section>

                {/* Section B: Meme Flow */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                            <Rocket className="w-5 h-5 text-pink-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">🚀 Meme Flow</h2>
                            <p className="text-sm text-zinc-500">Fast, chaotic, alive. All chains, all memes.</p>
                        </div>
                    </div>

                    {loading && flowData.memeFlow.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-48 bg-zinc-900/50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {flowData.memeFlow.map((token) => (
                                <FlowTokenCard
                                    key={token.id}
                                    token={token}
                                    onClick={() => setSelectedToken(token)}
                                    showLiveBadge={isHighActivity(token)}
                                />
                            ))}
                        </div>
                    )}

                    {!loading && flowData.memeFlow.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">
                            <p>Hunting for memes...</p>
                        </div>
                    )}
                </section>

                {/* Section C: Trade Setups */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">🎯 Trade Setups</h2>
                            <p className="text-sm text-zinc-500">Rising liquidity, strong momentum, real activity</p>
                        </div>
                    </div>

                    {loading && flowData.tradeSetups.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-48 bg-zinc-900/50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {flowData.tradeSetups.map((token) => (
                                <FlowTokenCard
                                    key={token.id}
                                    token={token}
                                    onClick={() => setSelectedToken(token)}
                                    showLiveBadge={isHighActivity(token)}
                                />
                            ))}
                        </div>
                    )}

                    {!loading && flowData.tradeSetups.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">
                            <p>Finding trade setups...</p>
                        </div>
                    )}
                </section>

                {/* Info Footer */}
                <div className="mt-16 p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                    <div className="grid md:grid-cols-3 gap-6 text-sm">
                        <div>
                            <h3 className="font-bold text-white mb-2">Supported Chains (Swaps)</h3>
                            <ul className="text-zinc-400 space-y-1">
                                <li>• Ethereum</li>
                                <li>• Base</li>
                                <li>• Arbitrum</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-2">Discovery Only</h3>
                            <ul className="text-zinc-400 space-y-1">
                                <li>• Solana (View)</li>
                                <li>• BSC (View)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-2">Safety</h3>
                            <p className="text-zinc-400">
                                Only obvious scams are filtered. Always DYOR before trading.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Swap Drawer */}
            {selectedToken && (
                <SwapDrawer
                    token={selectedToken}
                    onClose={() => setSelectedToken(null)}
                />
            )}
        </div>
    );
}
