'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import HeroCard from '@/components/HeroCard';
import AssetGrid from '@/components/AssetGrid';

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

    // Split tokens for layout
    const topPicks = tokens.slice(0, 5);
    const restOfMarket = tokens.slice(5);

    return (
        <div className="space-y-12">

            {/* SECTION 1: Top Picks (Hero) */}
            {!query && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            🔥 Top Picks <span className="text-gray-500 text-sm font-normal">(Highest Zenith Score)</span>
                        </h2>
                    </div>

                    {/* Horizontal Scroll Container */}
                    <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
                        {topPicks.map((token) => (
                            <HeroCard key={token.address} token={token} />
                        ))}
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
                        {/* Filters Placeholder */}
                        <select className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1 text-sm text-gray-300 focus:outline-none">
                            <option>Sort: Zenith Score</option>
                            <option>Sort: Volume</option>
                            <option>Sort: Price Change</option>
                        </select>
                    </div>
                </div>

                <AssetGrid tokens={query ? tokens : restOfMarket} />
            </section>

        </div>
    );
}
