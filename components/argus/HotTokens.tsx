'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Loader2, TrendingUp, AlertTriangle, Activity, BarChart3 } from 'lucide-react';

export interface HotToken {
    mint: string;
    symbol: string;
    name: string;
    price: number;
    supply: number;
    mcap: number;
    volume5m?: number;
    riskScore: number;
    feasibility: 'POSSIBLE' | 'UNLIKELY' | 'UNREALISTIC';
    flow: string;
}

const TIER_STYLING = {
    "POSSIBLE": "border-emerald-500/30 group-hover:border-emerald-500/60 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]",
    "UNLIKELY": "border-amber-500/20 group-hover:border-amber-500/50 shadow-[0_0_15px_-5px_rgba(245,158,11,0.2)]",
    "UNREALISTIC": "border-red-500/10 opacity-60"
};

function formatCompact(val: number) {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
    return `$${val.toFixed(2)}`;
}

export function HotTokens({ onSelect, selectedMint }: { onSelect: (token: HotToken) => void, selectedMint?: string }) {
    const [tokens, setTokens] = useState<HotToken[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'SAFE' | 'HOT'>('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHot() {
            try {
                const res = await fetch('/api/argus/hot-tokens');
                if (res.ok) {
                    const data = await res.json();
                    const list = (data.tokens || []).map((t: any) => ({
                        ...t,
                        mcap: t.price * t.supply
                    }));
                    setTokens(list);
                    if (list.length > 0 && !selectedMint) onSelect(list[0]);
                }
            } catch (e) {
                console.error('Failed to fetch hot tokens', e);
            } finally {
                setLoading(false);
            }
        }
        fetchHot();
    }, []);

    const filteredTokens = tokens.filter(t => {
        if (filter === 'SAFE') return t.feasibility === 'POSSIBLE';
        if (filter === 'HOT') return (t.volume5m || 0) > 20000;
        return true;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center py-20 opacity-20">
                <Loader2 className="animate-spin mb-4" size={32} />
                <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Intercepting Market Packets...</span>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Radar Controls */}
            <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between sticky top-0 bg-black z-10">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                    {['ALL', 'SAFE', 'HOT'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter transition-all ${filter === f ? 'bg-white text-black' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="text-[9px] text-zinc-700 font-mono uppercase shrink-0 ml-4">Radar: Active</div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide py-3">
                {filteredTokens.map((token, i) => (
                    <motion.button
                        key={token.mint}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => onSelect(token)}
                        className={`w-full group relative mb-2 p-4 rounded-xl border transition-all duration-300 text-left overflow-hidden ${selectedMint === token.mint
                                ? 'bg-zinc-800 border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                : `bg-zinc-950 ${TIER_STYLING[token.feasibility]}`
                            }`}
                    >
                        {/* Status Pulse Dot */}
                        <div className={`absolute top-4 right-4 w-1.5 h-1.5 rounded-full ${token.feasibility === 'POSSIBLE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' :
                                token.feasibility === 'UNLIKELY' ? 'bg-amber-500 animate-pulse' : 'bg-red-500 opacity-20'
                            }`} />

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`text-sm font-black italic tracking-widest leading-none uppercase ${selectedMint === token.mint ? 'text-white' : 'text-zinc-200'
                                        }`}>
                                        {token.symbol}
                                    </div>
                                    <div className="px-1.5 py-0.5 bg-zinc-900/50 rounded text-[7px] text-zinc-500 font-bold">
                                        v{token.riskScore}
                                    </div>
                                </div>
                                <div className={`text-[10px] font-black italic tracking-tighter ${selectedMint === token.mint ? 'text-white' : 'text-zinc-400'
                                    }`}>
                                    ${token.price.toLocaleString(undefined, { maximumSignificantDigits: 4 })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className={`text-[8px] font-mono uppercase tracking-widest mb-0.5 ${selectedMint === token.mint ? 'text-zinc-400' : 'text-zinc-600'
                                        }`}>Market Cap</div>
                                    <div className={`text-xs font-black italic ${selectedMint === token.mint ? 'text-white' : 'text-zinc-400'
                                        }`}>{formatCompact(token.mcap)}</div>
                                </div>
                                <div>
                                    <div className={`text-[8px] font-mono uppercase tracking-widest mb-0.5 ${selectedMint === token.mint ? 'text-zinc-400' : 'text-zinc-600'
                                        }`}>5m Volume</div>
                                    <div className={`text-xs font-black italic ${selectedMint === token.mint ? 'text-white' : 'text-zinc-400'
                                        }`}>{formatCompact(token.volume5m || 0)}</div>
                                </div>
                            </div>

                            <div className={`flex items-center justify-between pt-2 border-t ${selectedMint === token.mint ? 'border-zinc-700' : 'border-zinc-900'
                                }`}>
                                <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${selectedMint === token.mint ? 'text-emerald-300' :
                                        token.flow.includes('Smart') ? 'text-emerald-400' : 'text-zinc-600'
                                    }`}>
                                    {token.flow}
                                </span>
                                <span className={`text-[8px] font-mono ${selectedMint === token.mint ? 'text-zinc-500' : 'text-zinc-800'
                                    }`}>{token.mint.slice(0, 4)}...{token.mint.slice(-4)}</span>
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
