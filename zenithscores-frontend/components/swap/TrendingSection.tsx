import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, TrendingUp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildZenithTokens, ZenithToken } from "@/lib/tokenTrustEngine";

export function TrendingSection() {
    const [tokens, setTokens] = useState<ZenithToken[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTokens = async () => {
            const trusted = await buildZenithTokens();
            setTokens(trusted.slice(0, 12)); // Top 12 trending
            setLoading(false);
        };
        loadTokens();
    }, []);

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
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent-mint" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">
                        Trending on Solana
                    </span>
                </h2>
                <button className="text-sm text-accent-mint hover:text-white transition-colors font-medium">
                    View All Assets
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tokens.map((token) => (
                    <Card
                        key={token.mint}
                        className={cn(
                            "group relative overflow-hidden transition-all duration-300",
                            "bg-surface-2/50 backdrop-blur-xl border-white/5",
                            "hover:scale-[1.05] hover:border-accent-mint/30 hover:shadow-[0_0_20px_rgba(0,255,196,0.1)]", // Teal glow + scale
                            "cursor-pointer"
                        )}
                    >
                        {/* Hover Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-mint/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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
                                        <div className="text-sm font-bold text-white group-hover:text-accent-mint transition-colors flex items-center gap-1">
                                            {token.symbol}
                                            {token.isZenithVerified && (
                                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                            )}
                                        </div>
                                        <div className="text-[10px] text-text-secondary truncate max-w-[80px]">
                                            {token.name}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Divider Line (Silver) */}
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-accent-mint/20 transition-colors" />

                            {/* Price Area */}
                            <div>
                                <div className="text-lg font-mono text-white font-medium tracking-tight">
                                    ${token.priceUsd < 0.01 ? token.priceUsd.toPrecision(4) : token.priceUsd.toFixed(2)}
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-xs font-medium mt-1",
                                    token.change24h >= 0 ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {token.change24h >= 0 ? (
                                        <ArrowUpRight className="w-3 h-3" />
                                    ) : (
                                        <ArrowDownRight className="w-3 h-3" />
                                    )}
                                    {Math.abs(token.change24h).toFixed(2)}%
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
                        <h3 className="text-white font-medium text-sm mb-1 group-hover:text-accent-mint transition-colors">{feature.title}</h3>
                        <div className="h-[1px] w-8 bg-text-secondary/30 mx-auto mb-2 group-hover:w-16 group-hover:bg-accent-mint transition-all" />
                        <p className="text-xs text-text-secondary">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
