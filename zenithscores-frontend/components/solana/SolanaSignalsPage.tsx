'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { ArrowUpRight, TrendingUp, Info, ArrowRight, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchSignals, SignalToken } from "@/lib/zenith/signals";
import { useSwap } from "@/components/swap/SwapContext";
import { useRouter } from 'next/navigation';

export default function SignalsPage() {
  const [signals, setSignals] = useState<SignalToken[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { setToZenith } = useSwap(); // If we wrap this page in SwapProvider, or we just nav.

  // Note: To use useSwap, we need SwapProvider. 
  // app/layout.tsx might not have it global. app/swap/page.tsx has it.
  // If not global, we rely on URL params to the swap page: /swap?to=MINT

  useEffect(() => {
    const load = async () => {
      const data = await fetchSignals();
      setSignals(data);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 60000); // 1 min refresh
    return () => clearInterval(interval);
  }, []);

  const handleBuy = (token: SignalToken) => {
    // "Buy" button -> auto-fills swap panel.
    // Navigate to /swap with param
    router.push(`/swap?to=${token.mint}`);
  };

  return (
    <div className="min-h-screen bg-black text-[#EDEDED] p-4 lg:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-white mb-2 flex items-center gap-2">
              <Activity className="w-8 h-8 text-emerald-500" />
              Market Signals
            </h1>
            <p className="text-zinc-400 max-w-xl text-sm leading-relaxed">
              A curated feed of assets demonstrating significant 24h momentum, verified liquidity, and organic volume.
              Strictly filtered engine.
            </p>
          </div>
        </div>

        {/* Transparency Section (Collapsible or just visible as user requested a section) */}
        <Card className="bg-zinc-900/30 border-white/10 p-6">
          <div className="flex items-start gap-4">
            <Info className="w-5 h-5 text-zinc-500 mt-0.5 shrink-0" />
            <div className="space-y-4">
              <h3 className="font-medium text-white text-sm">How Signals Work</h3>
              <div className="grid md:grid-cols-2 gap-6 text-xs text-zinc-400">
                <div>
                  <strong className="text-zinc-300 block mb-1">Strict Mathematical Filters</strong>
                  <ul className="space-y-1 list-disc list-inside marker:text-emerald-500/50">
                    <li>Price Momentum: &ge; +30% (24h)</li>
                    <li>Liquidity Depth: &ge; $100,000</li>
                    <li>Volume Verification: &ge; $500,000</li>
                    <li>Activity Proxy: &ge; 500 Active Tx</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-zinc-300 block mb-1">Transparent Scoring (0-100)</strong>
                  <p className="leading-relaxed">
                    Score = (Momentum &times; 40%) + (Volume &times; 30%) + (Liquidity &times; 20%) + (Activity &times; 10%).
                    <br />
                    Data sourced directly from Jupiter, DexScreener, and Raydium/Orca.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {signals.map((token, idx) => (
              <Card
                key={token.mint}
                className="group relative bg-black border border-white/10 hover:border-emerald-500/50 transition-colors overflow-hidden flex flex-col"
              >
                <div className="p-5 flex-1 space-y-4">
                  {/* Top Row */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {token.logoURI ? (
                        <img src={token.logoURI} alt={token.symbol} className="w-10 h-10 rounded-full bg-zinc-900" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                          {token.symbol[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                          {token.symbol}
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Rank #{idx + 1}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-emerald-400 flex items-center justify-end gap-1 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        <ArrowUpRight className="w-3 h-3" />
                        {token.metrics.momentum.toFixed(0)}%
                      </div>
                      <div className="text-[10px] text-zinc-600 mt-1 font-mono">Score: {token.signalScore.toFixed(0)}</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-2 border-t border-white/5">
                    <div>
                      <div className="text-[10px] text-zinc-500">Price</div>
                      <div className="text-sm font-mono text-white">${token.priceUsd < 0.01 ? token.priceUsd.toPrecision(4) : token.priceUsd.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500">Liquidity</div>
                      <div className="text-sm font-mono text-zinc-300">${(token.metrics.liquidity / 1000).toFixed(0)}k</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500">Volume (24h)</div>
                      <div className="text-sm font-mono text-zinc-300">${(token.metrics.volume / 1000).toFixed(0)}k</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500">Activity</div>
                      <div className="text-sm font-mono text-zinc-300">{token.metrics.holders.toFixed(0)}+ Tx</div>
                    </div>
                  </div>
                </div>

                {/* Action (Bottom) */}
                <button
                  onClick={() => handleBuy(token)}
                  className="w-full py-3 bg-zinc-900 border-t border-white/5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 group-hover/btn"
                >
                  Trade {token.symbol}
                  <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

