'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Zap, Target, BrainCircuit,
    ShieldAlert, ArrowRight, Loader2, Sparkles
} from 'lucide-react';
import { ArgusRealityPanel } from '@/components/argus/ArgusRealityPanel';
import { HotTokens } from '@/components/argus/HotTokens';

interface TokenSpecs {
    mint: string;
    symbol: string;
    name: string;
    supply: number;
    price: number;
    logoURI: string;
}

export default function ArgusPage() {
    const [searchMint, setSearchMint] = useState('');
    const [loading, setLoading] = useState(false);
    const [tokenSpecs, setTokenSpecs] = useState<TokenSpecs | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initial load: Default to ZENITH or a popular token if available
    useEffect(() => {
        handleSearch('So11111111111111111111111111111111111111112'); // SOL as default
    }, []);

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
            setTokenSpecs(data);
        } catch (err: any) {
            setError(err.message);
            setTokenSpecs(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="mb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full mb-6"
                    >
                        <BrainCircuit size={16} className="text-cyan-400" />
                        <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-[0.3em]">
                            Argus Reality Engine v1.0
                        </span>
                    </motion.div>

                    <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter mb-4 uppercase">
                        Reality <span className="text-zinc-600">Hub</span>
                    </h1>

                    <p className="text-zinc-500 font-mono text-sm max-w-xl mx-auto leading-relaxed uppercase italic">
                        The ultimate antidote to market delusionalism.
                        Verify the scalability of any Solana asset.
                    </p>
                </div>

                {/* Search Interaction */}
                <div className="relative mb-12">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-zinc-600" />
                    </div>
                    <input
                        type="text"
                        placeholder="Paste Token Mint Address (e.g., SOL, JUP, WIF...)"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-6 pl-14 pr-32 text-white font-mono placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/50 transition-all shadow-2xl"
                        value={searchMint}
                        onChange={(e) => setSearchMint(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchMint)}
                    />
                    <button
                        onClick={() => handleSearch(searchMint)}
                        disabled={loading || searchMint.length < 32}
                        className="absolute right-3 top-2 bottom-2 px-6 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-tighter hover:bg-zinc-200 transition-all disabled:opacity-20 flex items-center gap-2"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                        Analyze
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-20"
                            >
                                <Loader2 size={48} className="text-cyan-400 animate-spin mb-4" />
                                <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.4em] animate-pulse">
                                    Syncing On-Chain Truth...
                                </div>
                            </motion.div>
                        ) : error ? (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center"
                            >
                                <ShieldAlert size={32} className="text-red-400 mx-auto mb-4" />
                                <div className="text-red-400 font-bold uppercase tracking-widest mb-2">Analysis Failed</div>
                                <div className="text-zinc-500 text-sm font-mono">{error}</div>
                            </motion.div>
                        ) : tokenSpecs ? (
                            <motion.div
                                key="panel"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="flex items-center gap-4 mb-6 px-4">
                                    <img src={tokenSpecs.logoURI} alt="" className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800" />
                                    <div>
                                        <div className="text-xl font-black text-white italic leading-none">{tokenSpecs.symbol}</div>
                                        <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">{tokenSpecs.name}</div>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                                        <Sparkles size={12} className="text-cyan-400" />
                                        <span className="text-[10px] text-zinc-400 font-mono uppercase">Live Integration Active</span>
                                    </div>
                                </div>
                                <ArgusRealityPanel
                                    currentPrice={tokenSpecs.price}
                                    circulatingSupply={tokenSpecs.supply}
                                    symbol={tokenSpecs.symbol}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="text-center py-10 opacity-30 mb-8 font-mono text-[10px] uppercase tracking-[0.4em]">
                                    — Initialize Analysis Hook Above —
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <HotTokens onSelect={handleSearch} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Relational Benchmarks Footer */}
                <div className="mt-20 pt-12 border-t border-zinc-900">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <div className="text-[9px] text-zinc-700 font-black uppercase tracking-widest mb-3">Benchmark: SOL</div>
                            <div className="text-sm font-black text-zinc-500 italic">$60.2B MCAP</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-zinc-700 font-black uppercase tracking-widest mb-3">Benchmark: Top Meme</div>
                            <div className="text-sm font-black text-zinc-500 italic">$1.0B - $5.0B MCAP</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-zinc-700 font-black uppercase tracking-widest mb-3">Benchmark: Large Cap</div>
                            <div className="text-sm font-black text-zinc-500 italic">$1.0B MCAP</div>
                        </div>
                        <div className="md:text-right">
                            <div className="text-[10px] text-zinc-600 font-mono uppercase mb-1 underline hover:text-cyan-400 cursor-pointer transition-colors">Documentation</div>
                            <div className="text-[10px] text-zinc-600 font-mono uppercase">V.1.0_LOCKED</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
