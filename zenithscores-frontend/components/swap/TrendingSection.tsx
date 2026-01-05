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
        return <div className="text-zinc-500 animate-pulse">Loading market data...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Trending on Solana
                </h2>
                <button className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                    View All
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {tokens.map((token) => (
                    <Card
                        key={token.mint}
                        className="bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/5 transition-all duration-200 cursor-pointer group"
                    >
                        <div className="p-3 space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    {token.logoURI ? (
                                        <img src={token.logoURI} alt={token.symbol} className="w-8 h-8 rounded-full" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                            {token.symbol[0]}
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1">
                                            {token.symbol}
                                            {token.isZenithVerified && (
                                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                            )}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 truncate max-w-[80px]">
                                            {token.name}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Price Area */}
                            <div>
                                <div className="text-lg font-mono text-white font-medium">
                                    ${token.priceUsd < 0.01 ? token.priceUsd.toPrecision(4) : token.priceUsd.toFixed(2)}
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-xs font-medium",
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
        </div>
    );
}
