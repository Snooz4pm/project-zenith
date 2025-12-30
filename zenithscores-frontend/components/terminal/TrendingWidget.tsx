'use client';

import { useState, useEffect } from 'react';
import { NormalizedToken } from '@/lib/dexscreener';
import { MoveUpRight, Activity, Layers, Flame, Loader2, RefreshCw } from 'lucide-react';
import SwapDrawer from '@/components/terminal/SwapDrawer';

type ChainId = 'base' | 'arbitrum' | 'ethereum';

interface TrendingWidgetProps {
    defaultChain?: ChainId;
    className?: string;
}

export default function TrendingWidget({ defaultChain = 'base', className = '' }: TrendingWidgetProps) {
    const [selectedChain, setSelectedChain] = useState<ChainId>(defaultChain);
    const [tokens, setTokens] = useState<NormalizedToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTokenForSwap, setSelectedTokenForSwap] = useState<NormalizedToken | null>(null);

    // Fetch data
    const fetchTrending = async (chain: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/trending?chain=${chain}`);
            if (res.ok) {
                const data = await res.json();
                setTokens(data.tokens || []);
            }
        } catch (error) {
            console.error('Failed to fetch trending', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrending(selectedChain);
        const interval = setInterval(() => fetchTrending(selectedChain), 60000); // Poll every 60s
        return () => clearInterval(interval);
    }, [selectedChain]);

    const chains = [
        { id: 'base', label: 'Base', icon: '🔵', desc: 'Retail & Speed' },
        { id: 'arbitrum', label: 'Arbitrum', icon: '🔷', desc: 'Active Traders' },
        { id: 'ethereum', label: 'Ethereum', icon: '💎', desc: 'High Value' },
    ];

    return (
        <div className={`flex flex-col h-full bg-[#0a0c10] border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-[#080a0e]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Flame className="text-orange-500" size={20} />
                        <div>
                            <h2 className="text-lg font-bold text-white leading-none">Market Movers</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">High Execution Velocity</p>
                        </div>
                    </div>
                    {loading && <Loader2 className="animate-spin text-zinc-600" size={16} />}
                </div>

                {/* Chain Tabs */}
                <div className="flex p-1 bg-zinc-900/50 rounded-lg">
                    {chains.map((chain) => (
                        <button
                            key={chain.id}
                            onClick={() => setSelectedChain(chain.id as ChainId)}
                            className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${selectedChain === chain.id
                                    ? 'bg-zinc-800 text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            <span>{chain.icon}</span>
                            {chain.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {loading && tokens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                        <Loader2 className="animate-spin text-emerald-500" size={24} />
                        <span className="text-xs text-zinc-500">Scanning {selectedChain}...</span>
                    </div>
                ) : tokens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
                        <Activity size={24} className="mb-2 opacity-50" />
                        <span className="text-xs">No execution-grade tokens found</span>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800/50">
                        {tokens.map((token, idx) => (
                            <div
                                key={token.id}
                                className="group flex items-center justify-between p-3 hover:bg-zinc-900/40 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-zinc-600 text-xs w-4 font-mono">{idx + 1}</div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white text-sm">{token.symbol}</span>
                                            <span className="text-[10px] text-zinc-500">{token.name.slice(0, 15)}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs font-mono text-zinc-400">
                                                ${token.priceUsd < 0.01 ? token.priceUsd.toExponential(2) : token.priceUsd.toFixed(2)}
                                            </span>
                                            <span className={`text-[10px] font-bold ${token.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                                                }`}>
                                                {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-[10px] text-zinc-500 uppercase">Vol 24h</div>
                                        <div className="text-xs font-mono text-zinc-300">
                                            ${(token.volume24hUsd / 1000).toFixed(0)}k
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedTokenForSwap(token)}
                                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black border border-emerald-500/50 hover:border-emerald-500 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                                    >
                                        TRADE <MoveUpRight size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Swap Drawer Integration */}
            {selectedTokenForSwap && (
                <SwapDrawer
                    token={selectedTokenForSwap}
                    onClose={() => setSelectedTokenForSwap(null)}
                />
            )}
        </div>
    );
}
