'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Zap, Target, BrainCircuit,
    ShieldAlert, ArrowRight, Loader2, Sparkles,
    Activity, ShieldCheck, Terminal, Filter
} from 'lucide-react';
import { ArgusRealityPanel } from '@/components/argus/ArgusRealityPanel';
import { HotTokens, HotToken } from '@/components/argus/HotTokens';

export default function ArgusPage() {
    const [searchMint, setSearchMint] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedToken, setSelectedToken] = useState<HotToken | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (mint: string) => {
        if (!mint || mint.length < 32) return;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/argus/token-specs?mint=${mint}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to resolve token specs');
            }
            const data = await res.json();

            // Calculate baseline feasibility for the dashboard
            const baselineRes = await fetch(`/api/argus/reality?currentPrice=${data.price}&circulatingSupply=${data.supply}&targetPrice=${data.price * 10}`);
            const baselineData = await baselineRes.json();

            setSelectedToken({
                mint: data.mint,
                symbol: data.symbol,
                name: data.name,
                price: data.price,
                supply: data.supply,
                mcap: data.price * data.supply,
                feasibility: baselineData.metrics.feasibility
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black pt-20 px-4 pb-8 overflow-hidden flex flex-col">
            {/* Header: Global Telemetry */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <Terminal size={20} className="text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Argus <span className="text-zinc-600">Reality Cockpit</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">Live Market Intelligence Stream</span>
                        </div>
                    </div>
                </div>

                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-zinc-600" />
                    </div>
                    <input
                        type="text"
                        placeholder="Intercept Contract Address..."
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white font-mono placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/50 transition-all"
                        value={searchMint}
                        onChange={(e) => setSearchMint(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchMint)}
                    />
                    <div className="absolute right-3 inset-y-0 flex items-center">
                        <span className="text-[8px] text-zinc-800 font-mono">CMD+K</span>
                    </div>
                </div>
            </div>

            {/* Main Terminal Area */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
                {/* Zone 1: Discovery Feed (Left) */}
                <div className="w-full md:w-[380px] flex flex-col overflow-hidden border-r border-zinc-900/50 pr-2">
                    <HotTokens
                        selectedMint={selectedToken?.mint}
                        onSelect={(token) => {
                            setSelectedToken(token);
                            setError(null);
                        }}
                    />
                </div>

                {/* Zone 2: Intelligence Panel (Right / Sticky) */}
                <div className="flex-1 flex flex-col overflow-y-auto pr-2 scrollbar-hide">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-full py-20"
                            >
                                <Loader2 size={48} className="text-cyan-400 animate-spin mb-4" />
                                <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.4em] animate-pulse">
                                    Decrypting Token DNA...
                                </div>
                            </motion.div>
                        ) : error ? (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-500/10 border border-red-500/20 rounded-2xl p-12 text-center my-auto"
                            >
                                <ShieldAlert size={48} className="text-red-400 mx-auto mb-4" />
                                <div className="text-red-400 font-black uppercase tracking-widest mb-2">Interference Detected</div>
                                <div className="text-zinc-600 text-[10px] font-mono leading-relaxed">{error}</div>
                                <button
                                    onClick={() => setError(null)}
                                    className="mt-6 px-4 py-2 bg-zinc-900 text-zinc-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-zinc-800 transition-colors"
                                >
                                    Dismiss Alert
                                </button>
                            </motion.div>
                        ) : selectedToken ? (
                            <motion.div
                                key={selectedToken.mint}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ type: 'spring', damping: 20 }}
                                className="space-y-6"
                            >
                                {/* Selected Header */}
                                <div className="flex items-center justify-between px-4 py-6 bg-zinc-900/30 rounded-2xl border border-zinc-900">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-zinc-800 flex items-center justify-center font-black text-xl text-white italic shadow-2xl">
                                            {selectedToken.symbol.slice(0, 1)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-3xl font-black text-white italic leading-none tracking-tighter uppercase">
                                                    {selectedToken.symbol}
                                                </h2>
                                                <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-1.5">
                                                    <ShieldCheck size={10} className="text-emerald-400" />
                                                    <span className="text-[8px] text-emerald-400 font-black uppercase">Verified Intelligence</span>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-zinc-600 font-mono tracking-[0.2em] flex items-center gap-2">
                                                <span className="opacity-50">{selectedToken.name}</span>
                                                <span className="opacity-20">•</span>
                                                <span className="text-zinc-500 font-bold">{selectedToken.mint.slice(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hidden lg:flex items-center gap-12 text-right">
                                        <div>
                                            <div className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest mb-1">Spot Price</div>
                                            <div className="text-lg font-black text-white italic">${selectedToken.price.toLocaleString()}</div>
                                        </div>
                                        <div className="pr-6">
                                            <div className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest mb-1">Circ. Supply</div>
                                            <div className="text-lg font-black text-white italic">{(selectedToken.supply / 1e6).toFixed(1)}M</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reality Engine Panel */}
                                <ArgusRealityPanel
                                    currentPrice={selectedToken.price}
                                    circulatingSupply={selectedToken.supply}
                                    symbol={selectedToken.symbol}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl opacity-40 grayscale pointer-events-none">
                                        <div className="flex items-center gap-2 mb-4">
                                            <ShieldAlert size={14} className="text-zinc-700" />
                                            <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest">Integrity Metrics (Locked)</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="h-2 w-full bg-zinc-900 rounded" />
                                            <div className="h-2 w-2/3 bg-zinc-900 rounded" />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl opacity-40 grayscale pointer-events-none">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Filter size={14} className="text-zinc-700" />
                                            <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest">Whale Concentration (Locked)</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="h-2 w-full bg-zinc-900 rounded" />
                                            <div className="h-2 w-2/3 bg-zinc-900 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-zinc-900 rounded-3xl m-8">
                                <div className="text-center">
                                    <BrainCircuit size={48} className="text-zinc-800 mx-auto mb-4" />
                                    <p className="text-zinc-700 font-mono text-xs uppercase tracking-[0.2em]">Select a packet from the telemetry feed to begin analysis</p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Terminal Footer Navigation */}
            <div className="h-8 border-t border-zinc-900 mt-4 flex items-center justify-between px-2 text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
                <div className="flex items-center gap-8">
                    <span>Terminal Ready: OK</span>
                    <span className="text-zinc-800">Uptime: 14h 22m</span>
                    <span className="text-zinc-800">Node: US-EAST-1</span>
                </div>
                <div className="flex items-center gap-6">
                    <span className="hover:text-cyan-400 cursor-pointer transition-colors">Documentation</span>
                    <span className="p-1 bg-zinc-900 rounded border border-zinc-800">V.1.0.4_BETA</span>
                </div>
            </div>
        </div>
    );
}
