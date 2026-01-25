'use client';

import { useEffect, useState } from 'react';
import { useSwapStore } from '@/lib/store/useSwapStore';

// Defining a robust local type matching the store's needs
type Token = {
    address: string;
    symbol: string;
    name?: string;
    logoURI?: string;
    decimals: number; // Required for store
    priceUsd?: number;
};

export default function TrendingSection() {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Zustand Store Integration
    const { setIntent } = useSwapStore();

    useEffect(() => {
        // Robust URL resolution: Try env var, fallback to localhost:3001
        const API_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'http://localhost:3001';

        console.log('[Trending] Fetching tokens from:', API_URL);

        fetch(`${API_URL}/api/tokens/featured`)
            .then(res => {
                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                return res.json();
            })
            .then(data => {
                // Backend returns { source, count, tokens: [...] }
                const list = Array.isArray(data.tokens) ? data.tokens : [];
                console.log(`[Trending] Loaded ${list.length} tokens`);
                // Basic slice to show only top 24 for safety/speed
                setTokens(list.slice(0, 24));
                setLoading(false);
            })
            .catch(err => {
                console.error('[Trending] Load failed:', err);
                setError("Failed to load market data");
                setLoading(false);
            });
    }, []);

    const handleTokenClick = (token: Token) => {
        // Populate the swap card with this token as the destination
        setIntent({
            toToken: {
                symbol: token.symbol,
                address: token.address,
                decimals: token.decimals || 6, // Fallback if missing
                logoURI: token.logoURI
            },
            source: 'card'
        });

        // Smooth scroll to top to show the swap card
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <section className="space-y-4">
            <header className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                    <h2 className="text-xl font-semibold text-white tracking-tight">
                        Trending on Solana
                    </h2>
                    <p className="text-sm text-zinc-500">
                        Real-time verified assets
                    </p>
                </div>
                {/* Simple refresh indicator */}
                <div className="text-xs text-zinc-600 font-mono">
                    {loading ? 'SYNCING...' : 'LIVE'}
                </div>
            </header>

            {loading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-20 bg-white/5 rounded-xl" />
                    ))}
                </div>
            )}

            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {!loading && !error && (!tokens || tokens.length === 0) && (
                <div className="p-8 text-center text-zinc-500 text-sm opacity-50">
                    No trending tokens available.
                </div>
            )}

            {!loading && !error && tokens && tokens.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {tokens.map(token => (
                        <div
                            key={token.address}
                            onClick={() => handleTokenClick(token)}
                            className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-[#0B0E15] hover:bg-white/5 hover:border-emerald-500/30 transition-all group cursor-pointer active:scale-95"
                        >
                            {token.logoURI ? (
                                <img src={token.logoURI} alt={token.symbol} className="w-8 h-8 rounded-full bg-zinc-900 object-cover group-hover:ring-2 ring-emerald-500/20 transition-all" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-zinc-800" />
                            )}
                            <div className="min-w-0">
                                <div className="text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                                    {token.symbol}
                                </div>
                                <div className="text-xs text-zinc-500 truncate flex items-center gap-1">
                                    {token.name}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
