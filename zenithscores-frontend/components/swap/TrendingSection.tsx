'use client';

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, TrendingUp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildZenithTokenList, ZenithToken } from "@/lib/zenith/index"; // Explicit index import
import { useSwap } from "./SwapContext";

export function TrendingSection() {
    const [tokens, setTokens] = useState<ZenithToken[]>([]);
    const [loading, setLoading] = useState(true);
    const { setToZenith, setFromZenith } = useSwap();

    useEffect(() => {
        const loadTokens = async () => {
            const trusted = await buildZenithTokenList();
            setTokens(trusted); // Already sliced to 40 in engine, UI can show all or slice again
            setLoading(false);
        };
        loadTokens();
    }, []);

    const handleTokenClick = (token: ZenithToken) => {
        // "Psychological" Auto-Fill: Click -> Buy
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-medium text-[#EDEDED] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    Trending on Solana
                </h2>
                <button className="text-sm text-zinc-400 hover:text-white transition-colors font-medium">
                    View All Assets
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tokens.map((token) => (
                    <Card
                        key={token.mint}
                        onClick={() => handleTokenClick(token)}
                        className={cn(
                            "group relative overflow-hidden transition-all duration-200",
                            "bg-black border border-white/10",
                            "hover:border-emerald-500/50 hover:bg-zinc-900/50",
                            "cursor-pointer"
                        )}
                    >
                        {/* Hover Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="p-4 space-y-4 relative z-10">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {token.logoURI ? (
                                        <img src={token.logoURI} alt={token.symbol} className="w-10 h-10 rounded-full ring-2 ring-black/50" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center text-[10px] font-bold text-text-secondary ring-2 ring-black/50">
                                            {token.symbol[0]}
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                                            {token.symbol}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 truncate max-w-[80px]">
                                            {token.name}
                                        </div>
                                    </div>
                                </div>
                                {/* Score Badge (Optional, but proves engine work) */}
                                <div className="text-[10px] font-mono text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded">
                                    {token.zenithScore.toFixed(0)}
                                </div>
                            </div>

                            {/* Divider Line (Silver) */}
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-emerald-500/20 transition-colors" />

                            {/* Price Area */}
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

            {/* Feature Highlights Footer Integration */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/5 mt-12">
                {[
                    { title: "Jupiter Aggregation", desc: "Best Price Routes" },
                    { title: "Non-Custodial", desc: "Your Keys, Your Coins" },
                    { title: "Pro Analytics", desc: "Real-time Metrics" }
                ].map((feature, i) => (
                    <div key={i} className="text-center group cursor-default">
                        <h3 className="text-white font-medium text-sm mb-1 group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
                        <div className="h-[1px] w-8 bg-zinc-800 mx-auto mb-2 group-hover:w-16 group-hover:bg-emerald-500 transition-all" />
                        <p className="text-xs text-zinc-500">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
