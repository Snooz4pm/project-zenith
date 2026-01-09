'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, RefreshCw, Search, Filter, TrendingUp, TrendingDown, Minus, Shield, AlertTriangle, Sparkles } from 'lucide-react';

interface Token {
    address: string;
    name: string;
    symbol: string;
    logoURI?: string;
    ageMinutes: number;
    priceUsd: number;
    priceChange5m: number;
    priceChange1h: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    marketCap: number;
    dexUrl?: string;
    trustScore?: number;
    trustBadge?: 'VERIFIED' | 'TRUSTED' | 'NEW' | 'CAUTION' | 'RISKY';
    badges: string[];
    projection?: {
        trend: 'bullish' | 'bearish' | 'neutral';
        confidence: number;
        reason: string;
    };
}

interface Props {
    isPremium: boolean;
    onSelectToken?: (address: string) => void;
}

const formatNumber = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
};

const formatAge = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
};

const getBadgeColor = (badge: string) => {
    if (badge === 'VERIFIED') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (badge === 'TRUSTED') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (badge === 'NEW') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (badge === 'CAUTION') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (badge === 'RISKY') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-zinc-700 text-zinc-400';
};

const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    if (score >= 30) return 'text-orange-400';
    return 'text-red-400';
};

export default function TokenDiscovery({ isPremium, onSelectToken }: Props) {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [minLiquidity, setMinLiquidity] = useState(10000);
    const [sortBy, setSortBy] = useState<'trust' | 'volume' | 'change' | 'age'>('trust');
    const [refreshing, setRefreshing] = useState(false);

    const fetchTokens = useCallback(async () => {
        try {
            setRefreshing(true);
            const res = await fetch(`/api/signals/discovery?premium=${isPremium}&minLiq=${minLiquidity}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setTokens(data.tokens || []);
            setError(null);
        } catch (err) {
            setError('Failed to load tokens');
            console.error('[Discovery]', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isPremium, minLiquidity]);

    useEffect(() => {
        fetchTokens();
        const interval = setInterval(fetchTokens, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [fetchTokens]);

    // Filter and sort tokens
    const displayTokens = tokens
        .filter(t =>
            searchQuery === '' ||
            t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'trust') return (b.trustScore || 0) - (a.trustScore || 0);
            if (sortBy === 'volume') return b.volume24h - a.volume24h;
            if (sortBy === 'change') return b.priceChange24h - a.priceChange24h;
            if (sortBy === 'age') return a.ageMinutes - b.ageMinutes;
            return 0;
        });

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                        Live Token Discovery
                        {isPremium && (
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">PREMIUM</span>
                        )}
                    </h3>
                    <p className="text-zinc-500 text-sm">Real-time tokens from DEXScreener with trust scoring</p>
                </div>
                <button
                    onClick={fetchTokens}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by name or address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                </div>

                {/* Min Liquidity */}
                <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-sm">Min Liq:</span>
                    <select
                        value={minLiquidity}
                        onChange={(e) => setMinLiquidity(parseInt(e.target.value))}
                        className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm"
                    >
                        <option value={1000}>$1K</option>
                        <option value={5000}>$5K</option>
                        <option value={10000}>$10K</option>
                        <option value={25000}>$25K</option>
                        <option value={50000}>$50K</option>
                        <option value={100000}>$100K</option>
                    </select>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-zinc-500" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm"
                    >
                        <option value="trust">Trust Score</option>
                        <option value="volume">Volume</option>
                        <option value="change">Price Change</option>
                        <option value="age">Newest</option>
                    </select>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-center">
                    {error}
                </div>
            )}

            {/* Token List */}
            <div className="space-y-3">
                {displayTokens.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                        No tokens found matching your criteria
                    </div>
                ) : (
                    displayTokens.slice(0, 50).map((token) => (
                        <div
                            key={token.address}
                            className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 hover:border-emerald-500/30 transition-all cursor-pointer"
                            onClick={() => onSelectToken?.(token.address)}
                        >
                            <div className="flex items-start justify-between gap-4">
                                {/* Left: Token Info */}
                                <div className="flex items-center gap-3 flex-1">
                                    {/* Logo */}
                                    <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-xl font-bold overflow-hidden flex-shrink-0">
                                        {token.logoURI ? (
                                            <img src={token.logoURI} alt={token.symbol} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white">{token.symbol?.charAt(0) || '?'}</span>
                                        )}
                                    </div>

                                    {/* Name & Info */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-white font-bold text-lg">{token.symbol}</span>
                                            {/* Trust Badge */}
                                            {token.trustBadge && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${getBadgeColor(token.trustBadge)}`}>
                                                    {token.trustBadge === 'VERIFIED' && <Shield className="w-3 h-3 inline mr-1" />}
                                                    {token.trustBadge === 'RISKY' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                                                    {token.trustBadge}
                                                </span>
                                            )}
                                            {/* Age */}
                                            <span className="text-xs text-zinc-500">{formatAge(token.ageMinutes)} old</span>
                                        </div>
                                        <div className="text-zinc-500 text-sm truncate">{token.name}</div>

                                        {/* Badges */}
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {token.badges?.map((badge, i) => (
                                                <span key={i} className="text-xs bg-zinc-700/50 text-zinc-400 px-2 py-0.5 rounded">
                                                    {badge}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Price & Score */}
                                <div className="text-right flex-shrink-0">
                                    {/* Trust Score - Premium Only */}
                                    {isPremium && token.trustScore !== undefined && (
                                        <div className="flex items-center justify-end gap-2 mb-2">
                                            <span className="text-zinc-500 text-xs">TRUST</span>
                                            <span className={`text-2xl font-bold font-mono ${getScoreColor(token.trustScore)}`}>
                                                {token.trustScore}
                                            </span>
                                        </div>
                                    )}

                                    {/* Price */}
                                    <div className="text-white font-mono">
                                        ${token.priceUsd < 0.001 ? token.priceUsd.toExponential(2) : token.priceUsd.toFixed(4)}
                                    </div>

                                    {/* Price Changes */}
                                    <div className="flex items-center justify-end gap-3 text-xs font-mono mt-1">
                                        <span className={token.priceChange5m >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                            5m: {token.priceChange5m >= 0 ? '+' : ''}{token.priceChange5m?.toFixed(1)}%
                                        </span>
                                        <span className={token.priceChange1h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                            1h: {token.priceChange1h >= 0 ? '+' : ''}{token.priceChange1h?.toFixed(1)}%
                                        </span>
                                    </div>

                                    {/* Volume & Liq */}
                                    <div className="flex items-center justify-end gap-3 text-xs text-zinc-500 mt-1">
                                        <span>Vol: {formatNumber(token.volume24h)}</span>
                                        <span>Liq: {formatNumber(token.liquidity)}</span>
                                    </div>

                                    {/* Projection - Premium Only */}
                                    {isPremium && token.projection && (
                                        <div className={`mt-2 flex items-center justify-end gap-1 text-xs ${token.projection.trend === 'bullish' ? 'text-emerald-400' :
                                                token.projection.trend === 'bearish' ? 'text-red-400' :
                                                    'text-zinc-400'
                                            }`}>
                                            {token.projection.trend === 'bullish' && <TrendingUp className="w-3 h-3" />}
                                            {token.projection.trend === 'bearish' && <TrendingDown className="w-3 h-3" />}
                                            {token.projection.trend === 'neutral' && <Minus className="w-3 h-3" />}
                                            <span>{token.projection.reason}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* DEX Link */}
                            {token.dexUrl && (
                                <div className="mt-3 pt-3 border-t border-zinc-700/50 flex items-center justify-between">
                                    <span className="text-xs text-zinc-600 font-mono truncate">{token.address}</span>
                                    <a
                                        href={token.dexUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-400 transition-colors"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        View on DEXScreener
                                    </a>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Premium Upsell */}
            {!isPremium && tokens.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border border-emerald-500/30 rounded-xl p-4 text-center">
                    <p className="text-zinc-300 text-sm mb-2">
                        🔒 <strong className="text-white">Upgrade to Premium</strong> to unlock Trust Scores, Projections, and all badges
                    </p>
                    <p className="text-zinc-500 text-xs">Only 0.05 SOL for 30 days</p>
                </div>
            )}
        </div>
    );
}
