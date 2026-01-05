'use client';

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildZenithTokenList, ZenithToken } from "@/lib/zenith/index";
import { useSwap } from "./SwapContext";

export function TrendingSection() {
    const [tokens, setTokens] = useState<ZenithToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { setToZenith, setFromZenith } = useSwap();

    useEffect(() => {
        const loadTokens = async () => {
            try {
                const trusted = await buildZenithTokenList();
                if (trusted.length === 0) {
                    setError("No tokens available. API may be rate-limited.");
                } else {
                    setTokens(trusted);
                    setError(null);
                }
            } catch (err) {
                console.error("Token load failed:", err);
                setError(`Failed to load tokens: ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        };
        loadTokens();
    }, []);

    const handleTokenClick = (token: ZenithToken) => {
        if (token.symbol === 'SOL') {
            setFromZenith(token);
        } else {
            setToZenith(token);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-6 w-48 bg-white/5 rounded"></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-32 bg-white/5 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-xl">
                <div className="flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <div>
                        <p className="font-medium">Token Feed Unavailable</p>
                        <p className="text-sm text-red-400/70 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (tokens.length === 0) {
        return (
            <div className="p-8 border border-zinc-700 bg-zinc-900/50 rounded-xl text-center">
                <p className="text-zinc-400">No tokens available at this time.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-medium text-[#EDEDED] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-white" />
                    Trending on Solana
                </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tokens.map((token) => (
                    <Card
                        key={token.mint}
                        onClick={() => handleTokenClick(token)}
                        className={cn(
                            "group relative overflow-hidden transition-all duration-200",
                            "bg-black border border-white/10",
                            "hover:border-white/20 hover:bg-zinc-900/50",
                            "cursor-pointer"
                        )}
                    >
                        <div className="p-4 space-y-4 relative z-10">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {token.logoURI ? (
                                        <img src={token.logoURI} alt={token.symbol} className="w-10 h-10 rounded-full ring-2 ring-black/50" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-400 ring-2 ring-black/50">
                                            {token.symbol[0]}
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm font-bold text-white transition-colors flex items-center gap-1">
                                            {token.symbol}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 truncate max-w-[80px]">
                                            {token.name}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-mono text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded">
                                    {token.zenithScore.toFixed(0)}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-[1px] w-full bg-white/10" />

                            {/* Price */}
                            <div>
                                <div className="text-lg font-mono text-white font-medium tracking-tight">
                                    ${token.priceUsd < 0.01 ? token.priceUsd.toPrecision(4) : token.priceUsd.toFixed(2)}
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-xs font-medium mt-1",
                                    token.priceChange24h >= 0 ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {token.priceChange24h >= 0 ? (
                                        <ArrowUpRight className="w-3 h-3" />
                                    ) : (
                                        <ArrowDownRight className="w-3 h-3" />
                                    )}
                                    {Math.abs(token.priceChange24h).toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
