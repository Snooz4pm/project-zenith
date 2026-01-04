'use client';

import { useState } from 'react';
import { Zap, Globe, Loader2 } from 'lucide-react';

type ArenaEngine = 'none' | 'solana' | 'evm';

interface Token {
  chain: string;
  chainType: string;
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  liquidityUsd?: number;
}

const PAGE_SIZE = 50;

export default function ArenaPage() {
  const [engine, setEngine] = useState<ArenaEngine>('none');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const selectEngine = async (selected: ArenaEngine) => {
    if (selected === 'none') return;

    setEngine(selected);
    setLoading(true);
    setTokens([]);
    setPage(1);

    try {
      const res = await fetch(`/api/arena/${selected}/discovery`);
      const data = await res.json();
      setTokens(data.tokens || []);
    } catch (err) {
      console.error('Discovery failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const visibleTokens = tokens.slice(0, page * PAGE_SIZE);
  const hasMore = visibleTokens.length < tokens.length;

  // ENGINE SELECTOR
  if (engine === 'none') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Trading Arena</h1>
            <p className="text-zinc-500">Select your trading engine</p>
          </div>

          <button
            onClick={() => selectEngine('solana')}
            className="w-full p-6 bg-gradient-to-br from-purple-500/10 to-green-500/10 border border-purple-500/30 rounded-2xl hover:border-purple-500/60 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-green-500 flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div className="text-left flex-1">
                <h2 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                  Solana Arena
                </h2>
                <p className="text-sm text-zinc-500">Raydium · Orca · Fast · Low fees</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">14k+</div>
                <div className="text-xs text-zinc-600">tokens</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => selectEngine('evm')}
            className="w-full p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl hover:border-blue-500/60 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <div className="text-left flex-1">
                <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  EVM Arena
                </h2>
                <p className="text-sm text-zinc-500">Ethereum · Base · Arbitrum · Polygon · BSC</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">15k+</div>
                <div className="text-xs text-zinc-600">tokens</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Discovering {engine === 'solana' ? 'Solana' : 'EVM'} tokens...</p>
          <p className="text-xs text-zinc-600 mt-2">Loading ~14k tokens (cached after first load)</p>
        </div>
      </div>
    );
  }

  // TOKEN GRID
  const engineColor = engine === 'solana' ? 'text-purple-400' : 'text-blue-400';
  const engineName = engine === 'solana' ? 'Solana' : 'EVM';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              <span className={engineColor}>{engineName}</span> Arena
            </h1>
            <p className="text-sm text-zinc-500">
              Showing {visibleTokens.length} of {tokens.length.toLocaleString()} tokens
            </p>
          </div>
          <button
            onClick={() => setEngine('none')}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-zinc-400"
          >
            Switch Engine
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {visibleTokens.map((token, i) => (
          <div
            key={`${token.address}-${i}`}
            className="p-3 bg-[#111116] border border-white/5 rounded-xl hover:border-white/20 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              {token.logoURI ? (
                <img src={token.logoURI} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs font-bold">
                  {token.symbol?.[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{token.symbol}</div>
                <div className="text-[10px] text-zinc-600 truncate">{token.name}</div>
              </div>
            </div>
            <div className="text-[10px] text-zinc-500">
              {token.liquidityUsd ? `$${(token.liquidityUsd / 1000).toFixed(0)}K liq` : token.chain}
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="max-w-7xl mx-auto mt-6 text-center">
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors"
          >
            Load More ({tokens.length - visibleTokens.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
