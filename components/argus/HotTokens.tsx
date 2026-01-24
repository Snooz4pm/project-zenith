'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';

interface HotToken {
    mint: string;
    symbol: string;
    name: string;
    feasibility: string;
}

export function HotTokens({ onSelect }: { onSelect: (mint: string) => void }) {
    const [tokens, setTokens] = useState<HotToken[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHot() {
            try {
                const res = await fetch('/api/argus/hot-tokens');
                if (res.ok) {
                    const data = await res.json();
                    setTokens(data.tokens || []);
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
            <div className="col-span-full flex flex-col items-center py-10 opacity-20">
                <Loader2 className="animate-spin mb-2" size={24} />
                <span className="text-[10px] font-mono uppercase tracking-widest">Hydrating Discovery Stream...</span>
            </div>
        );
    }

    if (tokens.length === 0) return null;

    return (
        <>
            <div className="col-span-full mb-4 px-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Target size={14} className="text-amber-400" />
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Discovery Realities (10x Baseline)</span>
                </div>
                <div className="h-px flex-1 mx-4 bg-zinc-900" />
            </div>

            {tokens.map((token, i) => (
                <motion.button
                    key={token.mint}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => onSelect(token.mint)}
                    className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-700 hover:bg-zinc-900/50 transition-all text-left group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center font-black text-[10px] text-zinc-500 group-hover:text-white transition-colors">
                            {token.symbol.slice(0, 2)}
                        </div>
                        <div>
                            <div className="text-xs font-black text-white italic tracking-widest leading-none mb-1 uppercase">
                                {token.symbol}
                            </div>
                            <div className="text-[8px] text-zinc-600 font-mono tracking-tighter truncate max-w-[100px]">
                                {token.mint.slice(0, 12)}...
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className={`text-[10px] font-black italic tracking-tighter ${token.feasibility === 'POSSIBLE' ? 'text-emerald-400' :
                                token.feasibility === 'UNLIKELY' ? 'text-amber-400' : 'text-red-400'
                            }`}>
                            {token.feasibility}
                        </div>
                        <div className="text-[8px] text-zinc-700 font-mono uppercase">10x Reality Check</div>
                    </div>
                </motion.button>
            ))}
        </>
    );
}
