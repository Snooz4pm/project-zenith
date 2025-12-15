'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import HeroCard from '@/components/HeroCard';
import AssetGrid from '@/components/AssetGrid';
import ZenithInsight from '@/components/ZenithInsight';
import ZenithAccuracy from '@/components/ZenithAccuracy';
import { getZenithSignal } from '@/lib/zenith';

interface Token {
    symbol: string;
    name: string;
    address: string;
    chain: string;
    price_usd: number;
    liquidity_usd: number;
    volume_24h: number;
    price_change_24h: number; // API actually returns this, previous interface was optional?
    zenith_score: number;
    dex_id: string;
    url: string;
    fdv?: number;
    market_cap?: number;
}

export default function ZenithLeaders() {
    const searchParams = useSearchParams();
    const query = searchParams.get('query');

    const [sortBy, setSortBy] = useState<'score' | 'volume'>('score');

    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTokens();
    }, [query]);

    const fetchTokens = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            let endpoint = `${apiUrl}/api/v1/tokens/scored?limit=100`;
            if (query) {
                endpoint = `${apiUrl}/api/v1/search?query=${encodeURIComponent(query)}`;
            }

            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'success') {
                // Ensure numeric fields are safe
                const safeTokens = data.data.map((t: any) => ({
                    ...t,
                    zenith_score: t.zenith_score || 0,
                    price_change_24h: t.price_change_24h || 0,
                    volume_24h: t.volume_24h || 0,
                    liquidity_usd: t.liquidity_usd || 0,
                    price_usd: t.price_usd || 0
                }));
                setTokens(safeTokens);
                setError(null);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
            console.error('Error fetching tokens:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-8">
                {/* Loading Skeleton Hero */}
                <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="min-w-[300px] h-64 bg-gray-900/50 rounded-2xl animate-pulse border border-gray-800" />
                    ))}
                </div>
                {/* Loading Skeleton Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-48 bg-gray-900/50 rounded-xl animate-pulse border border-gray-800" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/20 border border-red-500/50 p-8 rounded-xl text-center">
                <h3 className="text-xl font-bold text-red-500 mb-2">Unavailable</h3>
                <p className="text-gray-400 mb-4">{error}</p>
                <button onClick={fetchTokens} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold">Retry Connection</button>
            </div>
        );
    }

    if (tokens.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500 text-xl">No assets found matching your criteria.</p>
            </div>
        );
    }

    // Derived State for UI
    const topPicks = [...tokens].sort((a, b) => b.zenith_score - a.zenith_score).slice(0, 5);

    // Grid tokens: either search results OR the rest of the market (excluding top picks)
    const baseGridTokens = query ? tokens : tokens.filter(t => !topPicks.includes(t));

    const gridTokens = [...baseGridTokens].sort((a, b) => {
        if (sortBy === 'volume') {
            return (b.volume_24h || 0) - (a.volume_24h || 0);
        }
        return (b.zenith_score || 0) - (a.zenith_score || 0);
    });

    const focusTokens = tokens.filter(t => t.zenith_score >= 70).slice(0, 5);

    return (
        <div className="-mx-6 -mt-8"> {/* Negative margin to break container padding for full-width strip */}

            {/* INSIGHT STRIP (Full Width) */}
            {!query && <ZenithInsight tokens={topPicks} />}

            <div className="px-6 pb-12">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* MAIN CONTENT COLUMN */}
                    <div className="flex-1 min-w-0">
                        {/* SECTION 1: Top Picks (Hero) */}
                        {!query && (
                            <section className="mb-12">
                                <div className="flex items-center gap-3 mb-6">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        🔥 Top Picks <span className="text-gray-500 text-sm font-normal">(Highest Zenith Score)</span>
                                    </h2>
                                </div>

                                {/* Horizontal Infinite Scroll Container */}
                                <div className="w-full overflow-hidden relative">
                                    <div className="flex animate-marquee hover:[animation-play-state:paused] gap-6 w-max">
                                        {/* Original Set */}
                                        {topPicks.map((token) => (
                                            <div key={`orig-${token.address}`} className="w-[300px] flex-shrink-0">
                                                <HeroCard token={token} />
                                            </div>
                                        ))}
                                        {/* Duplicate Set for Loop */}
                                        {topPicks.map((token) => (
                                            <div key={`dup-${token.address}`} className="w-[300px] flex-shrink-0">
                                                <HeroCard token={token} />
                                            </div>
                                        ))}
                                    </div>
                                    {/* Gradient Masks for Fade Effect */}
                                    <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-black to-transparent pointer-events-none" />
                                    <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-black to-transparent pointer-events-none" />
                                </div>
                            </section>
                        )}

                        {/* SECTION 2: Crypto Portal */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">
                                    {query ? `Search Results: ${query}` : '🚀 Crypto Portal'}
                                </h2>
                                <div className="flex gap-2">
                                    {/* Sort Filter */}
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as 'score' | 'volume')}
                                        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1 text-sm text-gray-300 focus:outline-none cursor-pointer hover:border-blue-500 transition-colors"
                                    >
                                        <option value="score">Sort: Zenith Score</option>
                                        <option value="volume">Sort: Volume</option>
                                    </select>
                                </div>
                            </div>

                            <AssetGrid tokens={gridTokens} />
                        </section>
                    </div>

                    {/* SIDEBAR COLUMN (Desktop Only mostly) */}
                    {!query && (
                        <div className="w-full lg:w-80 flex-shrink-0 space-y-8">
                            {/* Accuracy Card */}
                            <ZenithAccuracy />

                            {/* Today's Focus Widget */}
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4">🎯 Today's Focus</h3>
                                <div className="space-y-4">
                                    {focusTokens.map(token => {
                                        const signal = getZenithSignal(token.zenith_score);
                                        return (
                                            <div key={token.symbol} className="flex justify-between items-center border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                                                <div>
                                                    <div className="font-bold text-white">{token.symbol}</div>
                                                    <div className={`text-xs ${signal.text}`}>{signal.label}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-gray-300">{token.zenith_score.toFixed(0)}</div>
                                                    <div className="text-xs text-gray-500">Score</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {focusTokens.length === 0 && (
                                        <p className="text-gray-500 text-sm">No strong signals right now.</p>
                                    )}
                                </div>
                            </div>

                            {/* CTA / Trust Box */}
                            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6">
                                <h3 className="text-sm font-bold text-blue-300 mb-2">⚡ Pro Tip</h3>
                                <p className="text-xs text-blue-100/70 leading-relaxed">
                                    Zenith updates predictions continuously based on live on-chain volume. Check back daily for new entry signals.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
