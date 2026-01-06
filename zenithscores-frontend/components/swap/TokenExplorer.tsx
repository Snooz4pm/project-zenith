'use client';

import { useEffect, useState } from 'react';
import { useTradeSelection } from '@/lib/store/useTradeSelection';
import { buildZenithTokenList, ZenithToken } from '@/lib/zenith';

// Helper for formatting large numbers (e.g. 1.2M, 400K)
function formatMetric(value: number): string {
    if (!value) return '0';
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
}

export default function TokenExplorer() {
    const [tokens, setTokens] = useState<ZenithToken[]>([]);
    const [loading, setLoading] = useState(true);

    const setSelectedToken = useTradeSelection(s => s.setSelectedToken);

    useEffect(() => {
        // Use the enriched Zenith Engine (Jupiter + DexScreener)
        buildZenithTokenList()
            .then(data => {
                setTokens(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load Zenith tokens', err);
                setLoading(false);
            });
    }, []);

    // STRICT FILTER: Only show real branded tokens
    const displayTokens = tokens.filter(t =>
        t.logoURI &&
        typeof t.logoURI === 'string' &&
        t.logoURI.startsWith('http') &&
        !t.logoURI.includes('unknown') &&
        !t.logoURI.includes('placeholder')
    );

    return (
        <section>
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                        Trending on Solana
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Top Volume Assets · Verified
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-mono text-emerald-400">LIVE FEED</span>
                </div>
            </header>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-pulse">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="h-[120px] bg-white/5 rounded-xl border border-white/5" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {displayTokens.map(token => (
                        <button
                            key={token.mint}
                            onClick={() => setSelectedToken({
                                address: token.mint,
                                symbol: token.symbol,
                                name: token.name,
                                logoURI: token.logoURI,
                                decimals: token.decimals
                            })}
                            className="group flex flex-col items-start gap-3 rounded-xl border border-white/5 bg-[#0B0E15] p-4 hover:border-emerald-500/40 hover:bg-white/5 transition-all active:scale-[0.98] text-left relative overflow-hidden h-full"
                        >
                            {/* Header: Logo + Symbol */}
                            <div className="flex items-center gap-3 w-full">
                                <img
                                    src={token.logoURI}
                                    className="w-8 h-8 rounded-full bg-zinc-800 object-cover shadow-lg group-hover:ring-2 ring-emerald-500/20 transition-all"
                                    alt=""
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                                            {token.symbol}
                                        </span>
                                        {/* Price (if meaningful) */}
                                        {token.priceUsd > 0 && (
                                            <span className="text-[10px] font-mono text-zinc-400">
                                                ${token.priceUsd < 0.01 ? token.priceUsd.toExponential(2) : token.priceUsd.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-zinc-600 truncate">
                                        {token.name}
                                    </div>
                                </div>
                            </div>

                            {/* Metrics Badges */}
                            <div className="flex flex-wrap gap-2 w-full pt-1">
                                <div className="px-1.5 py-0.5 rounded border border-white/5 bg-white/5 text-[10px] text-zinc-400 font-mono">
                                    Vol: <span className="text-zinc-300">{formatMetric(token.volume24hUsd)}</span>
                                </div>
                                <div className="px-1.5 py-0.5 rounded border border-white/5 bg-white/5 text-[10px] text-zinc-400 font-mono">
                                    Liq: <span className="text-zinc-300">{formatMetric(token.liquidityUsd)}</span>
                                </div>
                            </div>

                            {/* Decorative bottom gradient */}
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
