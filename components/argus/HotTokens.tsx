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
    volume24h?: number;
    feasibility: 'POSSIBLE' | 'UNLIKELY' | 'UNREALISTIC';
}

function formatCompact(val: number) {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
    return `$${val.toFixed(2)}`;
}

export function HotTokens({ onSelect, selectedMint }: { onSelect: (token: HotToken) => void, selectedMint?: string }) {
    const [tokens, setTokens] = useState<HotToken[]>([]);
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

                    // Auto-select first token if none selected
                    if (list.length > 0 && !selectedMint) {
                        onSelect(list[0]);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch hot tokens', e);
            } finally {
                setLoading(false);
            }
        }
        fetchHot();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center py-20 opacity-20">
                <Loader2 className="animate-spin mb-4" size={32} />
                <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Initializing Discovery Feed...</span>
            </div>
        );
    }

    if (tokens.length === 0) return (
        <div className="p-8 text-center border border-dashed border-zinc-900 rounded-2xl">
            <Activity size={24} className="text-zinc-800 mx-auto mb-2" />
            <div className="text-[10px] text-zinc-700 uppercase font-mono">No active discovery packets found</div>
        </div>
    );

    return (
        <div className="space-y-2">
            <div className="px-4 py-2 border-b border-zinc-900 flex items-center justify-between sticky top-0 bg-black z-10">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-cyan-500" />
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Live Pulse Feed</span>
                </div>
                <div className="text-[9px] text-zinc-700 font-mono uppercase">50 Packets Active</div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
                {tokens.map((token, i) => (
                    <motion.button
                        key={token.mint}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => onSelect(token)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left mb-2 group ${selectedMint === token.mint
                                ? 'bg-white text-black border-white'
                                : 'bg-zinc-950 border-zinc-900 text-white hover:border-zinc-700'
                            }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded flex items-center justify-center font-black text-xs shrink-0 ${selectedMint === token.mint ? 'bg-black text-white' : 'bg-zinc-900 text-zinc-500'
                                }`}>
                                {token.symbol.slice(0, 2)}
                            </div>
                            <div className="truncate">
                                <div className={`text-sm font-black italic tracking-widest leading-none mb-1 uppercase ${selectedMint === token.mint ? 'text-black' : 'text-white'
                                    }`}>
                                    {token.symbol}
                                </div>
                                <div className={`text-[9px] font-mono tracking-tighter truncate ${selectedMint === token.mint ? 'text-zinc-600' : 'text-zinc-700'
                                    }`}>
                                    MC: {formatCompact(token.mcap)}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                            <div className={`text-[10px] font-black italic tracking-tighter ${selectedMint === token.mint
                                    ? 'text-zinc-800'
                                    : token.feasibility === 'POSSIBLE' ? 'text-emerald-400' :
                                        token.feasibility === 'UNLIKELY' ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                {token.feasibility}
                            </div>
                            <div className={`text-[8px] font-mono uppercase ${selectedMint === token.mint ? 'text-zinc-600' : 'text-zinc-800'
                                }`}>
                                Reality Status
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
