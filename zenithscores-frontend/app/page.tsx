'use client';

/**
 * Root page "/" → Swap
 * Entry point is the Swap terminal
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap, AlertCircle, RefreshCw, Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { SwapTokenCard } from '@/components/SwapTokenCard';
import { SolanaSwapDrawer } from '@/components/SolanaSwapDrawer';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { DiscoveredToken } from '@/lib/discovery/types';
import { ZenithPagination } from '@/components/ZenithPagination';

const PAGE_SIZE = 50;
const STALE_TIME = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_TIME = 24 * 60 * 60 * 1000; // 24 hours

async function fetchSolanaTokens(): Promise<DiscoveredToken[]> {
  const res = await fetch('/api/arena/solana/discovery');
  if (!res.ok) throw new Error('Discovery failed');
  const data = await res.json();
  return data.tokens || [];
}

export default function SwapPage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const gridRef = useRef<HTMLDivElement>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Swap Drawer State
  const [selectedToken, setSelectedToken] = useState<DiscoveredToken | null>(null);
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState(false);

  // Debounce
  const debouncedSearch = useDebounce(search, 300);

  // Two-phase rendering
  const [isFilterReady, setIsFilterReady] = useState(false);

  // React Query - Solana tokens only
  const { data: tokens = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['swap', 'solana'],
    queryFn: fetchSolanaTokens,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Reset deferred state when tokens update
  useEffect(() => {
    setIsFilterReady(false);
    if (tokens.length > 0) {
      const timer = setTimeout(() => {
        if (typeof window.requestIdleCallback !== 'undefined') {
          window.requestIdleCallback(() => setIsFilterReady(true));
        } else {
          setIsFilterReady(true);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [tokens]);

  // ═══════════════════════════════════════════════════════════
  // FILTER LOGIC
  // ═══════════════════════════════════════════════════════════

  type Preset = 'TRENDING' | 'RISING' | 'NEW' | 'HIGH_LIQ' | null;

  const [activePreset, setActivePreset] = useState<Preset>(null);
  const [minLiquidity, setMinLiquidity] = useState(0);

  const PRESET_LOGIC: Record<string, (t: DiscoveredToken) => boolean> = {
    TRENDING: (t) => {
      const liq = t.liquidityUsd || 0;
      const vol = t.volume24hUsd || 0;
      if (liq < 100_000) return false;
      if (vol < 300_000) return false;
      if (vol / liq < 0.6) return false;
      return true;
    },
    RISING: (t) => {
      const liq = t.liquidityUsd || 0;
      const vol = t.volume24hUsd || 0;
      if (liq < 25_000) return false;
      if (vol < 75_000) return false;
      const ratio = vol / liq;
      return ratio >= 0.8 && ratio <= 3;
    },
    NEW: (t) => {
      if (!t.pairCreatedAt) return false;
      const age = Date.now() - t.pairCreatedAt;
      return age < 7 * 24 * 60 * 60 * 1000; // 7 days
    },
    HIGH_LIQ: (t) => (t.liquidityUsd || 0) >= 500_000,
  };

  const filteredTokens = useMemo(() => {
    if (!isFilterReady) return [];
    
    let result = [...tokens];

    // Search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.symbol?.toLowerCase().includes(searchLower) ||
          t.name?.toLowerCase().includes(searchLower) ||
          t.address?.toLowerCase().includes(searchLower)
      );
    }

    // Preset filter
    if (activePreset && PRESET_LOGIC[activePreset]) {
      result = result.filter(PRESET_LOGIC[activePreset]);
    }

    // Liquidity filter
    if (minLiquidity > 0) {
      result = result.filter((t) => (t.liquidityUsd || 0) >= minLiquidity);
    }

    return result;
  }, [tokens, debouncedSearch, activePreset, minLiquidity, isFilterReady]);

  // Pagination
  const totalPages = Math.ceil(filteredTokens.length / PAGE_SIZE);
  const paginatedTokens = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTokens.slice(start, start + PAGE_SIZE);
  }, [filteredTokens, page]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activePreset, minLiquidity]);

  // Scroll to top on page change
  useEffect(() => {
    if (gridRef.current && page > 1) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [page]);

  // Handle token click
  const handleTokenClick = (token: DiscoveredToken) => {
    if (!connected) {
      setVisible(true);
      return;
    }
    setSelectedToken(token);
    setIsSwapDrawerOpen(true);
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Loading Solana Tokens...</h1>
          <p className="text-zinc-500">Fetching latest market data</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Connection Error</h1>
          <p className="text-zinc-500 mb-6">Failed to load token data</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-emerald-500 text-black rounded-xl font-semibold hover:bg-emerald-400 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const presets: { key: Preset; label: string; color: string }[] = [
    { key: 'TRENDING', label: 'Trending', color: 'emerald' },
    { key: 'RISING', label: 'Rising', color: 'purple' },
    { key: 'NEW', label: 'New', color: 'blue' },
    { key: 'HIGH_LIQ', label: 'High Liquidity', color: 'cyan' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <span className="text-emerald-400">Solana</span> Swap
              </h1>
              <p className="text-zinc-500 mt-1">
                {tokens.length.toLocaleString()} tokens • Jupiter powered
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Search & Filters */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, symbol, or address..."
                className="w-full pl-12 pr-12 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <X className="w-5 h-5 text-zinc-500 hover:text-white" />
                </button>
              )}
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {presets.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setActivePreset(activePreset === key ? null : key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activePreset === key
                      ? `bg-${color}-500/20 text-${color}-400 border border-${color}-500/30`
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {label}
                </button>
              ))}
              {activePreset && (
                <button
                  onClick={() => setActivePreset(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8" ref={gridRef}>
        {!isFilterReady ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-500">Preparing tokens...</p>
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-lg">No tokens match your filters</p>
            <button
              onClick={() => {
                setSearch('');
                setActivePreset(null);
                setMinLiquidity(0);
              }}
              className="mt-4 text-emerald-400 hover:text-emerald-300"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-zinc-500">
              Showing {paginatedTokens.length} of {filteredTokens.length} tokens
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedTokens.map((token) => (
                <SwapTokenCard
                  key={token.address}
                  token={token}
                  onClick={() => handleTokenClick(token)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8">
                <ZenithPagination
                  page={page}
                  totalPages={totalPages}
                  onChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Swap Drawer */}
      <SolanaSwapDrawer
        isOpen={isSwapDrawerOpen}
        onClose={() => {
          setIsSwapDrawerOpen(false);
          setSelectedToken(null);
        }}
        token={selectedToken}
      />
    </div>
  );
}
