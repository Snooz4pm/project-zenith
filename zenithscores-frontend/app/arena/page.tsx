'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap, Globe, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

type ArenaEngine = 'none' | 'solana' | 'evm';

interface Token {
  chain: string;
  chainType: string;
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  liquidityUsd?: number;
  volume24hUsd?: number;
  source?: string;
}

const PAGE_SIZE = 50;
const STALE_TIME = 6 * 60 * 60 * 1000; // 6 hours
const CACHE_TIME = 12 * 60 * 60 * 1000; // 12 hours

async function fetchTokens(engine: ArenaEngine): Promise<Token[]> {
  if (engine === 'none') return [];

  const res = await fetch(`/api/arena/${engine}/discovery`);
  if (!res.ok) throw new Error('Discovery failed');

  const data = await res.json();
  return data.tokens || [];
}

export default function ArenaPage() {
  const [engine, setEngine] = useState<ArenaEngine>('none');
  const [page, setPage] = useState(1);

  // React Query with aggressive caching - DISABLED until engine selected
  const { data: tokens = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['arena', engine],
    queryFn: () => fetchTokens(engine),
    enabled: engine !== 'none', // NO FETCH until engine selected
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 2,
  });

  const selectEngine = (selected: ArenaEngine) => {
    setEngine(selected);
    setPage(1);
  };

  const visibleTokens = tokens.slice(0, page * PAGE_SIZE);
  const hasMore = visibleTokens.length < tokens.length;

  // ═══════════════════════════════════════════════════════════
  // STATE: NO ENGINE SELECTED → Show Engine Selector
  // ═══════════════════════════════════════════════════════════
  if (engine === 'none') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Trading Arena</h1>
            <p className="text-zinc-500">Select your trading engine to begin</p>
          </div>

          {/* Solana Engine Card */}
          <button
            onClick={() => selectEngine('solana')}
            className="w-full p-6 bg-gradient-to-br from-purple-500/10 to-green-500/10 border border-purple-500/30 rounded-2xl hover:border-purple-500/60 hover:scale-[1.02] transition-all group"
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

          {/* EVM Engine Card */}
          <button
            onClick={() => selectEngine('evm')}
            className="w-full p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl hover:border-blue-500/60 hover:scale-[1.02] transition-all group"
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

  // ═══════════════════════════════════════════════════════════
  // STATE: LOADING → Show Loading State
  // ═══════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 mb-2">
            Discovering {engine === 'solana' ? 'Solana' : 'EVM'} tokens...
          </p>
          <p className="text-xs text-zinc-600">
            Loading ~{engine === 'solana' ? '14k' : '15k'} tokens (cached after first load)
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // STATE: ERROR → Show Error State
  // ═══════════════════════════════════════════════════════════
  if (isError) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">Discovery failed</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-lg hover:bg-emerald-500/20"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Retry
            </button>
            <button
              onClick={() => setEngine('none')}
              className="px-4 py-2 bg-white/5 text-zinc-400 rounded-lg hover:bg-white/10"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // STATE: LOADED BUT EMPTY → Show Empty State
  // ═══════════════════════════════════════════════════════════
  if (tokens.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 mb-4">No tokens found</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-lg"
            >
              Retry
            </button>
            <button
              onClick={() => setEngine('none')}
              className="px-4 py-2 bg-white/5 text-zinc-400 rounded-lg hover:bg-white/10"
            >
              Switch Engine
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // STATE: LOADED WITH TOKENS → Show Token Grid
  // ═══════════════════════════════════════════════════════════
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
              Showing {visibleTokens.length.toLocaleString()} of {tokens.length.toLocaleString()} tokens
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

      {/* Token Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {visibleTokens.map((token, i) => (
          <div
            key={`${token.address}-${i}`}
            className="p-3 bg-[#111116] border border-white/5 rounded-xl hover:border-white/20 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              {token.logoURI ? (
                <img
                  src={token.logoURI}
                  alt=""
                  className="w-8 h-8 rounded-full"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs font-bold">
                  {token.symbol?.[0] || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{token.symbol || 'UNKNOWN'}</div>
                <div className="text-[10px] text-zinc-600 truncate">{token.name || 'Unknown'}</div>
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>{token.liquidityUsd ? `$${(token.liquidityUsd / 1000).toFixed(0)}K` : '-'}</span>
              <span className="text-zinc-600">{token.source || token.chain}</span>
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
            Load More ({(tokens.length - visibleTokens.length).toLocaleString()} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
