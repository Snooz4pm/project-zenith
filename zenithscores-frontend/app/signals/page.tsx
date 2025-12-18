'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    TrendingUp, TrendingDown, Zap, Filter, RefreshCw,
    ArrowRight, Activity, Target, Clock
} from 'lucide-react';
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-20 md:pt-24">
            {/* Content */}
            <div className="container mx-auto px-4 py-6">
                {/* Inline Filters */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        {/* Score Filter */}
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                            <Target size={14} className="text-gray-500" />
                            <select
                                value={minScore}
                                onChange={(e) => setMinScore(Number(e.target.value))}
                                className="bg-transparent text-sm text-white outline-none"
                            >
                                <option value={50} className="bg-gray-900">Score ≥ 50</option>
                                <option value={60} className="bg-gray-900">Score ≥ 60</option>
                                <option value={70} className="bg-gray-900">Score ≥ 70</option>
                                <option value={80} className="bg-gray-900">Score ≥ 80</option>
                            </select>
                        </div>

                        {/* Asset Type Filter */}
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
                        {/* Last Updated */}
                        {lastUpdated && (
                            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                                <Clock size={12} />
                                Updated {lastUpdated.toLocaleTimeString()}
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
                    <EmptyState
                        type="no-signals"
                        description={`No assets currently scoring above ${minScore}. Try lowering the threshold.`}
                        action={{ label: 'Lower Threshold', onClick: () => setMinScore(60) }}
                    />
                ) : (
                    <>
                        {/* Stats Bar */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="glass-panel rounded-xl p-4">
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Active Signals</div>
                                <div className="text-2xl font-bold text-emerald-400">{filteredSignals.length}</div>
                            </div>
                            <div className="glass-panel rounded-xl p-4">
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Avg Score</div>
                                <div className="text-2xl font-bold">
                                    {Math.round(filteredSignals.reduce((a, b) => a + b.zenith_score, 0) / filteredSignals.length)}
                                </div>
                            </div>
                            <div className="glass-panel rounded-xl p-4">
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Strong Bulls</div>
                                <div className="text-2xl font-bold text-green-400">
                                    {filteredSignals.filter(s => s.zenith_score >= 80).length}
                                </div>
                            </div>
                            <div className="glass-panel rounded-xl p-4">
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Top Gainer</div>
                                <div className="text-2xl font-bold text-cyan-400">
                                    {filteredSignals[0]?.symbol || '-'}
                                </div>
                            </div>
                        </div>

                        {/* Signals Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSignals.map((signal, index) => {
                                const scoreColors = getScoreColor(signal.zenith_score);
                                const marketStatus = getMarketStatus(signal.asset_type);

                                return (
                                    <motion.div
                                        key={signal.symbol}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`glass-panel rounded-xl p-5 border ${scoreColors.border} hover:border-white/20 transition-all group`}
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-lg">{signal.symbol}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${marketStatus.isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                        {marketStatus.label}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">{signal.name}</div>
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-lg ${scoreColors.bg}`}>
                                                <span className={`text-xl font-bold font-mono ${scoreColors.text}`}>
                                                    {signal.zenith_score}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="mb-4">
                                            <div className="text-2xl font-bold font-mono">{formatCurrency(signal.current_price)}</div>
                                            <div className={`flex items-center gap-1 text-sm ${signal.price_change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {signal.price_change_24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                {formatPercent(signal.price_change_24h)}
                                            </div>
                                        </div>

                                        {/* Signal Badge */}
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${scoreColors.text}`}>
                                                {signal.signal}
                                            </span>
                                            <Link
                                                href="/trading"
                                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors group-hover:text-cyan-400"
                                            >
                                                Trade Now <ArrowRight size={12} />
                                            </Link>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
