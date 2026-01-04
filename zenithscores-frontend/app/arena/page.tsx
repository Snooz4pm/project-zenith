'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap, Globe, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

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

  // Filters (User Input)
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [minLiquidity, setMinLiquidity] = useState(0);

  // Debounce expensive filter inputs
  const debouncedSearch = useDebounce(search, 300);
  const debouncedLiquidity = useDebounce(minLiquidity, 300);

  // Two-phase rendering state
  const [isFilterReady, setIsFilterReady] = useState(false);

  // React Query with aggressive caching
  const { data: tokens = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['arena', engine],
    queryFn: () => fetchTokens(engine),
    enabled: engine !== 'none',
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 2,
  });

  // Reset deferred state when engine changes or tokens update
  useEffect(() => {
    setIsFilterReady(false);
    if (tokens.length > 0) {
      // Small delay to allow initial paint of raw list
      const timer = setTimeout(() => setIsFilterReady(true), 50);
      return () => clearTimeout(timer);
    }
  }, [tokens, engine]);

  const selectEngine = (selected: ArenaEngine) => {
    setEngine(selected);
    setPage(1);
    setSearch("");
    setMinLiquidity(0);
    setIsFilterReady(false); // Reset immediate
  };

  // ═══════════════════════════════════════════════════════════
  // MEMOIZED FILTER PIPELINE (Two-Phase)
  // ═══════════════════════════════════════════════════════════
  const filteredTokens = useMemo(() => {
    if (!tokens) return [];

    // Phase 1: Instant First Paint (Bypass heavy filters)
    // Only return enough for the first page to ensure speed
    if (!isFilterReady) {
      return tokens;
    }

    // Phase 2: Full Filtering (Debounced)
    return tokens.filter(t => {
      // 1. Search Filter
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const match =
          t.symbol.toLowerCase().includes(query) ||
          t.name.toLowerCase().includes(query) ||
          t.address.toLowerCase().includes(query);
        if (!match) return false;
      }

      // 2. Liquidity Filter
      if (debouncedLiquidity > 0) {
        if ((t.liquidityUsd || 0) < debouncedLiquidity) return false;
      }

      return true;
    });
  }, [tokens, isFilterReady, debouncedSearch, debouncedLiquidity]);

  // ═══════════════════════════════════════════════════════════
  // PAGINATION
  // ═══════════════════════════════════════════════════════════
  const visibleTokens = useMemo(() => {
    // If not ready, safe slice. If ready, standard slice.
    return filteredTokens.slice(0, page * PAGE_SIZE);
  }, [filteredTokens, page]);

  const hasMore = visibleTokens.length < filteredTokens.length;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedLiquidity]);

  // ═══════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════

  if (engine === 'none') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Trading Arena</h1>
            <p className="text-zinc-500">Select your trading engine to begin</p>
          </div>

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

  // Loading Skeleton - OPTIMIZED: Reduced count for faster render
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
        <div className="max-w-7xl mx-auto mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Discovering {engine === 'solana' ? 'Solana' : 'EVM'} tokens...
          </h1>
          <p className="text-sm text-zinc-500">Loading ~14k tokens (cached after first load)</p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">Discovery failed</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => refetch()} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-lg">
              <RefreshCw className="w-4 h-4 inline mr-2" /> Retry
            </button>
            <button onClick={() => selectEngine('none')} className="px-4 py-2 bg-white/5 text-zinc-400 rounded-lg">Back</button>
          </div>
        </div>
      </div>
    );
  }

  const engineColor = engine === 'solana' ? 'text-purple-400' : 'text-blue-400';
  const engineName = engine === 'solana' ? 'Solana' : 'EVM';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      {/* Header & Filters */}
      <div className="max-w-7xl mx-auto mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              <span className={engineColor}>{engineName}</span> Arena
            </h1>
            <p className="text-sm text-zinc-500">
              Showing {visibleTokens.length.toLocaleString()} of {filteredTokens.length.toLocaleString()} tokens
              {filteredTokens.length !== tokens.length && ` (filtered from ${tokens.length.toLocaleString()})`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#111116] border border-white/10 rounded-lg px-4 py-2 text-sm w-48 focus:border-white/30 outline-none transition-colors"
            />
            <select
              value={minLiquidity}
              onChange={(e) => setMinLiquidity(Number(e.target.value))}
              className="bg-[#111116] border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-white/30"
            >
              <option value={0}>Min Liquidity: All</option>
              <option value={10000}>$10k</option>
              <option value={50000}>$50k</option>
              <option value={100000}>$100k</option>
              <option value={500000}>$500k</option>
              <option value={1000000}>$1M</option>
            </select>
            <button
              onClick={() => selectEngine('none')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-zinc-400"
            >
              Switch Engine
            </button>
          </div>
        </div>
      </div>

      {/* Empty State (Filtered) */}
      {filteredTokens.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg mb-2">No tokens match your filters</p>
          <p className="text-sm">Try lowering liquidity or searching for something else</p>
        </div>
      )}

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
            Load More ({(filteredTokens.length - visibleTokens.length).toLocaleString()} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
