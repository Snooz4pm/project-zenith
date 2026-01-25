'use client';

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { TrendingUp, Activity, DollarSign, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface Mover {
    wallet: string;
    solBalance: number;
    volume24hUsd: number;
    netFlow24hUsd: number;
    status: "ACCUMULATING" | "DISTRIBUTING" | "ACTIVE" | "DORMANT";
    lastActive: number;
}

export default function MarketMoversPage() {
    const [movers, setMovers] = useState<Mover[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

    useEffect(() => {
        const fetchMovers = async () => {
            try {
                const proxy = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL;
                if (!proxy) return;
                
                const res = await fetch(`${proxy}/market-movers`);
                const data = await res.json();
                
                if (data.movers) {
                    const mapped: Mover[] = data.movers.map((m: any) => ({
                        ...m,
                        status: m.netFlow24hUsd > 1000 ? "ACCUMULATING" :
                                m.netFlow24hUsd < -1000 ? "DISTRIBUTING" : "ACTIVE"
                    }));
                    setMovers(mapped);
                    if (mapped.length > 0 && !selectedWallet) setSelectedWallet(mapped[0].wallet);
                }
            } catch (e) {
                console.error("Failed to load movers", e);
            } finally {
                setLoading(false);
            }
        };

        fetchMovers();
        const interval = setInterval(fetchMovers, 30000);
        return () => clearInterval(interval);
    }, []);

    const selectedMover = movers.find(m => m.wallet === selectedWallet);

    return (
        <div className="min-h-screen bg-[#000000] text-zinc-100 p-4 md:p-8 pt-24 font-sans">
             <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
                 
                 {/* LEFT COLUMN: MOVER LIST */}
                 <div className="space-y-6">
                     <div className="flex flex-col gap-2 mb-8">
                         <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                             <Activity className="text-emerald-500 w-6 h-6" />
                             Market Movers
                         </h1>
                         <p className="text-zinc-500 text-sm max-w-lg">
                             Real-time analysis of high-impact capital flows on Solana. 
                             Derived from direct on-chain activity.
                         </p>
                     </div>

                     <div className="bg-[#0B0E15] border border-white/5 rounded-2xl overflow-hidden">
                         {/* Table Header */}
                         <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 p-4 border-b border-white/5 text-xs font-mono text-zinc-500 uppercase tracking-wider">
                             <div>Wallet</div>
                             <div className="text-right">Balance</div>
                             <div className="text-right">24h Vol</div>
                             <div className="text-right">Net Flow</div>
                             <div className="text-right">Status</div>
                         </div>

                         {/* List */}
                         {loading ? (
                             <div className="p-12 text-center text-zinc-500 animate-pulse">Scanning RPC nodes...</div>
                         ) : movers.length === 0 ? (
                             <div className="p-12 text-center text-zinc-500">No significant movers detected in current window.</div>
                         ) : (
                             <div className="divide-y divide-white/5">
                                 {movers.map((mover) => (
                                     <div 
                                        key={mover.wallet}
                                        onClick={() => setSelectedWallet(mover.wallet)}
                                        className={cn(
                                            "grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 p-4 hover:bg-white/5 cursor-pointer transition-colors items-center text-sm font-mono",
                                            selectedWallet === mover.wallet ? "bg-white/[0.03]" : ""
                                        )}
                                     >
                                         <div className="flex items-center gap-3 overflow-hidden">
                                             <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">
                                                 <Wallet className="w-4 h-4" />
                                             </div>
                                             <span className="text-zinc-300 truncate font-semibold">
                                                 {mover.wallet.slice(0, 4)}...{mover.wallet.slice(-4)}
                                             </span>
                                         </div>
                                         
                                         <div className="text-right text-zinc-300">
                                             {mover.solBalance.toFixed(0)} SOL
                                         </div>
                                         
                                         <div className="text-right text-zinc-400">
                                             ${(mover.volume24hUsd / 1000).toFixed(1)}k
                                         </div>
                                         
                                         <div className={cn("text-right font-medium", mover.netFlow24hUsd >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                             {mover.netFlow24hUsd >= 0 ? '+' : '-'}${Math.abs(mover.netFlow24hUsd / 1000).toFixed(1)}k
                                         </div>
                                         
                                         <div className="flex justify-end">
                                             <span className={cn(
                                                 "text-[10px] px-2 py-0.5 rounded font-bold uppercase",
                                                 mover.status === 'ACCUMULATING' ? "bg-emerald-500/10 text-emerald-500" :
                                                 mover.status === 'DISTRIBUTING' ? "bg-rose-500/10 text-rose-500" :
                                                 "bg-zinc-500/10 text-zinc-500"
                                             )}>
                                                 {mover.status}
                                             </span>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                 </div>

                 {/* RIGHT COLUMN: DEEP DIVE */}
                 <div className="space-y-6">
                     {selectedMover ? (
                         <div className="sticky top-24 space-y-4">
                             <div className="bg-[#0B0E15] border border-white/5 rounded-2xl p-6 space-y-6">
                                 <div>
                                     <h3 className="text-zinc-500 text-xs uppercase tracking-widest font-mono mb-2">Selected Wallet</h3>
                                     <div className="text-xl font-mono text-white break-all">
                                         {selectedMover.wallet}
                                     </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                                         <div className="text-zinc-500 text-xs mb-1">Exposure</div>
                                         <div className="text-lg font-bold text-white">
                                             {selectedMover.solBalance.toFixed(1)} SOL
                                         </div>
                                     </div>
                                     <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                                         <div className="text-zinc-500 text-xs mb-1">Activity Score</div>
                                         <div className="text-lg font-bold text-emerald-400">
                                             High
                                         </div>
                                     </div>
                                 </div>

                                 <div className="space-y-3">
                                     <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                         <TrendingUp className="w-4 h-4 text-zinc-500" />
                                         Flow Analysis
                                     </h4>
                                     <div className="h-[1px] w-full bg-white/5" />
                                     
                                     <div className="space-y-4 pt-2">
                                         <div className="flex justify-between items-center text-sm">
                                             <span className="text-zinc-400">Net Flow (24h)</span>
                                             <span className={selectedMover.netFlow24hUsd >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                                 {selectedMover.netFlow24hUsd >= 0 ? '+' : '-'}${Math.abs(selectedMover.netFlow24hUsd).toFixed(2)}
                                             </span>
                                         </div>
                                         <div className="flex justify-between items-center text-sm">
                                             <span className="text-zinc-400">Volume Traded</span>
                                             <span className="text-white">${selectedMover.volume24hUsd.toFixed(2)}</span>
                                         </div>
                                          <div className="flex justify-between items-center text-sm">
                                             <span className="text-zinc-400">Last Active</span>
                                             <span className="text-zinc-500">Just now</span>
                                         </div>
                                     </div>
                                 </div>
                                 
                                 {selectedMover.status === 'ACCUMULATING' && (
                                     <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-xs leading-relaxed">
                                         <strong>Signal: Accumulation detected.</strong><br/>
                                         This wallet is exhibiting consistent inflow behavior exceeding outflows by significant margin.
                                     </div>
                                 )}
                             </div>
                         </div>
                     ) : (
                         <div className="h-40 flex items-center justify-center text-zinc-500 text-sm italic">
                             Select a mover to analyze
                         </div>
                     )}
                 </div>
             </div>
        </div>
    );
}
