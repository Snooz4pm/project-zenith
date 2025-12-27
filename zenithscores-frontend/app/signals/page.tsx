'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    TrendingUp, TrendingDown, Zap, Filter, RefreshCw,
    ArrowRight, Activity, Target, Clock, Eye, Sparkles, Lock, User, Info
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getZenithSignal, getScoreColor } from '@/lib/zenith';
import { getMarketStatus } from '@/lib/market-hours';
import EmptyState from '@/components/EmptyState';

interface Signal {
    symbol: string;
    name: string;
    asset_type: string;
    current_price: number;
    price_change_24h: number;
    zenith_score: number;
    signal: string;
    volume_24h?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';

export default function SignalsPage() {
    const { data: session, status } = useSession();
    const isLoggedIn = !!session?.user;

    const [signals, setSignals] = useState<Signal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'crypto' | 'stock' | 'forex'>('all');
    const [minScore, setMinScore] = useState(50);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        fetchSignals();
        const interval = setInterval(fetchSignals, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const fetchSignals = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/trading/assets`);
            const data = await res.json();

            if (data.status === 'success') {
                const scored = data.data.map((asset: any) => ({
                    ...asset,
                    zenith_score: calculateQuickScore(asset.price_change_24h, asset.volume_24h),
                    signal: getZenithSignal(calculateQuickScore(asset.price_change_24h, asset.volume_24h)).label
                }));

                setSignals(scored);
                setLastUpdated(new Date());
            }
        } catch (e) {
            console.error('Failed to fetch signals:', e);
        } finally {
            setLoading(false);
        }
    };

    // Enhanced score calculation with multiple factors
    const calculateQuickScore = (priceChange: number, volume?: number): number => {
        // Higher base score to show more opportunities
        const base = 55;
        // Momentum component (dampened for less extreme swings)
        const momentum = priceChange * 3;
        // Volume bonus for high-volume assets
        const volumeBonus = volume ? (volume > 1000000 ? 10 : volume > 100000 ? 5 : 0) : 0;
        // Volatility bonus for assets showing movement
        const volatilityBonus = Math.abs(priceChange) > 3 ? 8 : Math.abs(priceChange) > 1 ? 4 : 0;
        return Math.min(100, Math.max(0, Math.round(base + momentum + volumeBonus + volatilityBonus)));
    };

    const filteredSignals = signals
        .filter(s => s.zenith_score >= minScore)
        .filter(s => filter === 'all' || s.asset_type === filter)
        .sort((a, b) => b.zenith_score - a.zenith_score);

    const formatCurrency = (value: number) => {
        if (value >= 1000) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (value >= 1) return `$${value.toFixed(2)}`;
        return `$${value.toFixed(4)}`;
    };

    const formatPercent = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };


    // ... inside component
    const getStructureLabel = (signal: Signal) => {
        // Infer structure from price action if API lacks explicit regime
        const change = signal.price_change_24h;
        if (change > 5) return { label: 'Breakout', color: 'text-blue-400', bg: 'bg-blue-400/10' };
        if (change > 1) return { label: 'Trending', color: 'text-emerald-400', bg: 'bg-emerald-400/10' };
        if (change < -5) return { label: 'Breakdown', color: 'text-red-400', bg: 'bg-red-400/10' };
        if (change < -1) return { label: 'Correction', color: 'text-orange-400', bg: 'bg-orange-400/10' };
        return { label: 'Range', color: 'text-gray-400', bg: 'bg-gray-400/10' };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-20 md:pt-24">
            <div className="container mx-auto px-4 py-6">

                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Algorithm Picks</h1>
                    <p className="text-gray-400">
                        AI-curated structural setups. Not signals.
                    </p>

                    {/* Disclaimer Banner (UX Guardrail) */}
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                        <Info size={16} className="text-blue-400 mt-0.5" />
                        <span className="text-sm text-blue-300">
                            <strong>Note:</strong> Algorithm Picks highlight structural interest for your analysis — these are <u>not</u> trade recommendations. Always confirm with your own thesis.
                        </span>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                            <Filter size={14} className="text-gray-500" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as any)}
                                className="bg-transparent text-sm text-white outline-none"
                            >
                                <option value="all" className="bg-gray-900">All Assets</option>
                                <option value="crypto" className="bg-gray-900">Crypto</option>
                                <option value="stock" className="bg-gray-900">Stocks</option>
                                <option value="forex" className="bg-gray-900">Forex</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {lastUpdated && (
                            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                                <Clock size={12} />
                                Evaluated {Math.floor((Date.now() - lastUpdated.getTime()) / 60000)} min ago
                            </div>
                        )}
                        <button
                            onClick={fetchSignals}
                            className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <EmptyState type="loading" />
                ) : filteredSignals.length === 0 ? (
                    <EmptyState type="no-signals" />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSignals.map((signal, index) => {
                            const structure = getStructureLabel(signal);
                            const marketStatus = getMarketStatus(signal.asset_type);
                            // Determine correct path
                            const basePath = signal.asset_type === 'stock' ? '/stocks' : signal.asset_type === 'crypto' ? '/crypto' : '/forex';
                            const detailLink = `${basePath}/${signal.symbol}`;

                            return (
                                <Link href={detailLink} key={signal.symbol}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="glass-panel rounded-xl p-5 border border-white/5 hover:border-white/20 transition-all group cursor-pointer hover:bg-white/[0.02]"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-lg">{signal.symbol}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${marketStatus.isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                        {signal.asset_type.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">{signal.name}</div>
                                            </div>
                                            {/* Timeframe Badge (Mocked as 4H/1D for now) */}
                                            <div className="px-2 py-1 rounded bg-gray-800 border border-gray-700">
                                                <span className="text-xs font-mono text-gray-400">1D</span>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="text-2xl font-bold font-mono">{formatCurrency(signal.current_price)}</div>
                                            <div className={`flex items-center gap-1 text-sm ${signal.price_change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {signal.price_change_24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                {formatPercent(signal.price_change_24h)}
                                            </div>
                                        </div>

                                        {/* Structure Badge (replaces Signal/Score) */}
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className={`px-2 py-1 rounded text-xs font-medium ${structure.bg} ${structure.color} flex items-center gap-1`}>
                                                <Activity size={12} />
                                                {structure.label} Structure
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-cyan-400 transition-colors">
                                                Analyze <ArrowRight size={12} />
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
