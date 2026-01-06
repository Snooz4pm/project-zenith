'use client';

import { useEffect, useState } from 'react';
import { useTradeSelection, Token } from '@/lib/store/useTradeSelection';

export default function TokenExplorer() {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(true);

    const setSelectedToken = useTradeSelection(s => s.setSelectedToken);

    useEffect(() => {
        const API_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'http://localhost:3001';

        fetch(`${API_URL}/tokens`)
            .then(res => res.json())
            .then(data => {
                // Map backend response to our simplified Token type
                const backendTokens = data.tokens || [];
                // Safety slice top 24
                setTokens(backendTokens.slice(0, 24));
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load tokens', err);
                setLoading(false);
            });
    }, []);

    return (
        <section>
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                        Trending on Solana
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Top Volume Assets
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
                        <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/5" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {tokens.map(token => (
                        <button
                            key={token.address}
                            onClick={() => setSelectedToken(token)}
                            className="group flex flex-col items-start gap-4 rounded-xl border border-white/5 bg-[#0B0E15] p-4 hover:border-emerald-500/40 hover:bg-white/5 transition-all active:scale-[0.98] text-left relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between w-full">
                                <div className="flex items-center gap-3">
                                    {token.logoURI ? (
                                        <img
                                            src={token.logoURI}
                                            className="w-10 h-10 rounded-full bg-zinc-800 object-cover shadow-lg group-hover:ring-2 ring-emerald-500/20 transition-all"
                                            alt=""
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-zinc-800" />
                                    )}
                                    <div>
                                        <div className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                                            {token.symbol}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                                            Solana
                                        </div>
                                    </div>
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
