'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap, Globe, AlertCircle, RefreshCw } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { ArenaTokenCard } from '@/components/ArenaTokenCard';
import { SwapDrawer } from '@/components/SwapDrawer';
import { useWallet } from '@/lib/wallet/WalletContext';
import { DiscoveredToken } from '@/lib/discovery/types';
import { ConnectWalletModal } from '@/components/ConnectWalletModal';
import { ZenithPagination } from '@/components/ZenithPagination';

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
  pairCreatedAt?: number;
  source?: string;
}

const PAGE_SIZE = 50;
const STALE_TIME = 24 * 60 * 60 * 1000; // 24 hours (User Requirement: Cache HARD)
const CACHE_TIME = 24 * 60 * 60 * 1000; // 24 hours

async function fetchTokens(engine: ArenaEngine): Promise<Token[]> {
  if (engine === 'none') return [];

  const res = await fetch(`/api/arena/${engine}/discovery`);

  if (!res.ok) {
    throw new Error('Discovery failed');
  }

  const data = await res.json();
  return data.tokens || [];
}

export default function ArenaPage() {
  const { session } = useWallet();
  const [engine, setEngine] = useState<ArenaEngine>('none');
  const gridRef = useRef<HTMLDivElement>(null);

  // Filters (User Input)
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Swap Drawer State
  const [selectedToken, setSelectedToken] = useState<DiscoveredToken | null>(null);
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState(false);

  // Connect Modal State (Zenith UX)
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [pendingToken, setPendingToken] = useState<DiscoveredToken | null>(null);
  const [connectChain, setConnectChain] = useState<'EVM' | 'SOLANA' | null>(null);

  // Debounce expensive filter inputs
  const debouncedSearch = useDebounce(search, 300);

  // Two-phase rendering state
  const [isFilterReady, setIsFilterReady] = useState(false);

  // React Query with aggressive caching (24h)
  const { data: tokens = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['arena', engine],
    queryFn: () => fetchTokens(engine),
    enabled: engine !== 'none',
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 2,
    refetchOnWindowFocus: false, // User Rule: No refetch on focus
    refetchOnMount: false, // User Rule: Cold fetch once per day
  });

  // Reset deferred state when engine changes or tokens update
  useEffect(() => {
    setIsFilterReady(false);
    if (tokens.length > 0) {
      // Small delay to allow initial paint of raw list
      const timer = setTimeout(() => {
        // Use requestIdleCallback if available, fallback to timeout
        if (typeof window.requestIdleCallback !== 'undefined') {
          window.requestIdleCallback(() => setIsFilterReady(true));
        } else {
          setIsFilterReady(true);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [tokens, engine]);

  // ═══════════════════════════════════════════════════════════
  // AUTO-RESUME (Nice UX)
  // ═══════════════════════════════════════════════════════════
  // When wallet connects while a token is pending, auto-open swap
  useEffect(() => {
    if (!pendingToken) return;

    const isSolana = pendingToken.chainType === 'SOLANA';
    const isConnected = isSolana
      ? !!session.solana?.connected
      : !!session.evm?.connected;

    if (isConnected) {
      setSelectedToken(pendingToken);
      setIsSwapDrawerOpen(true);
      setPendingToken(null); // Clear pending
      setShowConnectModal(false);
    }
  }, [session, pendingToken]);

  const selectEngine = (selected: ArenaEngine) => {
    setEngine(selected);
    setPage(1);
    setSearch("");
    setMinLiquidity(0);
    setIsFilterReady(false);
  };

  // ═══════════════════════════════════════════════════════════
  // ZENITH FILTER LOGIC (Philosophy: Presets = Situations)
  // ═══════════════════════════════════════════════════════════

  type Preset = 'TRENDING' | 'RISING' | 'NEW' | 'HIGH_LIQ' | 'LOW_CAP' | 'ESTABLISHED' | null;

  const [activePreset, setActivePreset] = useState<Preset>(null);
  const [minLiquidity, setMinLiquidity] = useState(0); // 0 = All

  const debouncedLiquidity = useDebounce(minLiquidity, 300);

  // Preset Logic Definitions
  const PRESET_LOGIC: Record<string, (t: Token) => boolean> = {
    TRENDING: (t) => {
      // Intent: High attention, high participation
      const liq = t.liquidityUsd || 0;
      const vol = t.volume24hUsd || 0;
      if (liq < 100_000) return false;
      if (vol < 300_000) return false;
      if (vol / liq < 0.6) return false;
      return true;
    },
    RISING: (t) => {
      // Intent: Momentum before saturation
      const liq = t.liquidityUsd || 0;
      const vol = t.volume24hUsd || 0;
      if (liq < 25_000) return false;
      if (vol < 75_000) return false;
      // Fallback logic: Vol/Liq between 0.2 and 0.6 (Healthy growth)
      const ratio = vol / liq;
      return ratio >= 0.2 && ratio <= 0.6;
    },
    NEW: (t) => {
      // Intent: Early discovery (Launch window)
      // Requires pairCreatedAt. If missing, we can't show it.
      const createdAt = t.pairCreatedAt;
      if (!createdAt) return false;
      const ageHours = (Date.now() - createdAt) / (1000 * 60 * 60);
      return ageHours <= 24 && (t.liquidityUsd || 0) >= 5_000;
    },
    HIGH_LIQ: (t) => (t.liquidityUsd || 0) >= 1_000_000,
    LOW_CAP: (t) => {
      // Intent: Asymmetry, speculation
      const liq = t.liquidityUsd || 0;
      const vol = t.volume24hUsd || 0;
      return liq >= 5_000 && liq <= 50_000 && vol >= 10_000;
    },
    ESTABLISHED: (t) => {
      const liq = t.liquidityUsd || 0;
      const vol = t.volume24hUsd || 0;
      return liq >= 2_000_000 && vol >= 500_000;
    }
  };

  const PRESET_CONFIG: Record<string, { label: string, desc: string }> = {
    TRENDING: { label: 'Trending', desc: 'Sustained volume relative to liquidity' },
    RISING: { label: 'Rising', desc: 'Increasing activity with healthy growth' },
    NEW: { label: 'New Pairs', desc: 'Launched < 24h' },
    HIGH_LIQ: { label: 'High Liquidity', desc: 'Deep liquidity > $1M' },
    LOW_CAP: { label: 'Low Cap', desc: 'Small pools with early activity' },
    ESTABLISHED: { label: 'Established', desc: 'Blue-chip consistency' },
  };

  const handlePresetClick = (preset: Preset) => {
    if (activePreset === preset) {
      setActivePreset(null); // Toggle off
    } else {
      setActivePreset(preset);
      setMinLiquidity(0); // Presets override manual liquidity
    }
  };

  const filteredTokens = useMemo(() => {
    if (!tokens) return [];

    // Phase 1: Instant First Paint
    if (!isFilterReady) return tokens;

    // Phase 2: Full Filtering (Pure & Deterministic)
    // 1. Search (Debounced)
    // 2. Preset Logic OR Manual Liquidity

    // If no filters active, return generic clean list (e.g. sorted by liquidity)
    if (!debouncedSearch && !activePreset && minLiquidity === 0) {
      return tokens;
    }

    const query = debouncedSearch.toLowerCase();

    return tokens.filter(t => {
      // 1. Search
      if (debouncedSearch) {
        const match =
          t.symbol.toLowerCase().includes(query) ||
          t.name.toLowerCase().includes(query) ||
          t.address.toLowerCase().includes(query);
        if (!match) return false;
      }

      // 2. Situations (Presets)
      if (activePreset) {
        return PRESET_LOGIC[activePreset](t);
      }

      // 3. Manual Liquidity (only if no preset)
      if (minLiquidity > 0) {
        if ((t.liquidityUsd || 0) < minLiquidity) return false;
      }

      return true;
    });
  }, [tokens, isFilterReady, debouncedSearch, activePreset, minLiquidity]);


  // ═══════════════════════════════════════════════════════════
  // PAGINATION (Discrete Slicing)
  // ═══════════════════════════════════════════════════════════
  const totalPages = Math.ceil(filteredTokens.length / PAGE_SIZE);

  const pageTokens = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredTokens.slice(start, end);
  }, [filteredTokens, page]);

  // Reset page when filters change (Zenith Rule: Don't trap user on page 20)
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activePreset, minLiquidity]);

  // Scroll to top on page change (Zenith Polish)
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [page]);

  // Stats Logic
  const showingFrom = (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, filteredTokens.length);

  // View Helpers
  const renderLiquidityStep = (val: number, label: string) => (
    <button
      onClick={() => { setMinLiquidity(val); setActivePreset(null); }}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${minLiquidity === val && !activePreset
        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
        : 'bg-[#111116] text-zinc-500 border border-white/5 hover:border-white/20'
        }`}
    >
      {label}
    </button>
  );

  const getTokenBadges = (t: Token): string[] => {
    const badges: string[] = [];
    // Priority order
    if (PRESET_LOGIC.NEW(t)) badges.push('NEW');
    if (PRESET_LOGIC.TRENDING(t)) badges.push('TRENDING');
    else if (PRESET_LOGIC.RISING(t)) badges.push('RISING');

    return badges.slice(0, 2);
  };

  // ═══════════════════════════════════════════════════════════
  // TOKEN CLICK HANDLER (NO ALERTS)
  // ═══════════════════════════════════════════════════════════
  const handleTokenClick = (token: Token) => {
    const discoveredToken: DiscoveredToken = {
      chainType: token.chainType as 'SOLANA' | 'EVM',
      chainId: token.chain,
      chain: token.chain,
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      logoURI: token.logoURI,
      liquidityUsd: token.liquidityUsd || 0,
      volume24hUsd: token.volume24hUsd || 0,
      source: (token.source || 'DEXSCREENER') as 'RAYDIUM' | 'JUPITER' | 'DEXSCREENER',
    };

    const isConnected = token.chainType === 'SOLANA'
      ? !!session.solana
      : !!session.evm;

    if (!isConnected) {
      // Open Zenith Connect Modal (No browser alert)
      setPendingToken(discoveredToken);
      setConnectChain(discoveredToken.chainType);
      setShowConnectModal(true);
      return;
    }

    setSelectedToken(discoveredToken);
    setIsSwapDrawerOpen(true);
  };

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
                <div className="text-2xl font-bold text-blue-400">30k+</div>
                <div className="text-xs text-zinc-600">tokens</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
        <div className="max-w-7xl mx-auto mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Loading {engine === 'solana' ? 'Solana' : 'EVM'} Registry...
          </h1>
          <p className="text-sm text-zinc-500">Fetching Authoritative Token Lists (24h cache)</p>
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
          <p className="text-red-400 mb-4">Registry unavailable</p>
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
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6" ref={gridRef}>
      {/* Header & Filters */}
      <div className="max-w-7xl mx-auto mb-6 space-y-4">
        <div className="flex flex-col gap-4 w-full">
          {/* Top Bar: Title + Stats + Switch */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                <span className={engineColor}>{engineName}</span> Arena
              </h1>
              <p className="text-sm text-zinc-500">
                Showing <span className="text-zinc-300 font-medium">{filteredTokens.length > 0 ? `${showingFrom}–${showingTo}` : '0'}</span> of {filteredTokens.length.toLocaleString()} tokens
                {filteredTokens.length !== tokens.length && ` (filtered from ${tokens.length.toLocaleString()})`}
              </p>
            </div>
            <button
              onClick={() => selectEngine('none')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-zinc-400 self-start md:self-auto"
            >
              Switch Engine
            </button>
          </div>

          {/* Search Bar */}
          <div className="w-full">
            <input
              type="text"
              placeholder="Search symbol, name, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#111116] border border-white/10 rounded-lg px-4 py-2 text-sm w-full focus:border-white/30 outline-none transition-colors"
            />
          </div>

          {/* Middle Bar: Situations (Presets) */}
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
            {(Object.keys(PRESET_CONFIG) as Preset[]).map((preset) => {
              const isActive = activePreset === preset;
              const config = PRESET_CONFIG[preset!];
              return (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  className={`relative group px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${isActive
                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'bg-[#111116] border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                    }`}
                >
                  {config.label}
                  {/* Tooltip (Zenith Context) */}
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-800 text-zinc-200 text-[10px] rounded-lg whitespace-nowrap pointer-events-none z-10 border border-white/10 shadow-xl capitalize">
                    {config.desc}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 rotate-45 border-b border-r border-white/10"></div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Bar: Liquidity Steps (Primary Control) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-t border-white/5 pt-4">
            <span className="text-[10px] uppercase font-bold text-zinc-600 mr-2">Liquidity</span>
            {renderLiquidityStep(0, 'All')}
            {renderLiquidityStep(10_000, '≥ $10k')}
            {renderLiquidityStep(50_000, '≥ $50k')}
            {renderLiquidityStep(250_000, '≥ $250k')}
            {renderLiquidityStep(1_000_000, '≥ $1M')}

            <div className="ml-auto pl-4 border-l border-white/5">
              <button
                onClick={() => {
                  setActivePreset(null);
                  setMinLiquidity(0);
                  setSearch("");
                }}
                className="text-[10px] uppercase font-bold text-zinc-600 hover:text-white transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State (Filtered) */}
      {filteredTokens.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg mb-2">No tokens match your filters.</p>
          <p className="text-sm">Adjust liquidity or activity thresholds.</p>
        </div>
      )}

      {/* PAGINATED GRID (ZENITH STYLE) */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pb-8">
        {pageTokens.map((token) => (
          <ArenaTokenCard
            key={`${token.chain}:${token.address}`}
            token={token}
            badges={getTokenBadges(token)}
            onClick={handleTokenClick}
          />
        ))}
      </div>

      {/* ZENITH PAGINATION UI */}
      <ZenithPagination
        page={page}
        totalPages={totalPages}
        onChange={setPage}
      />
      <div className="h-20" /> {/* Bottom spacer */}

      {/* Swap Drawer */}
      <SwapDrawer
        isOpen={isSwapDrawerOpen}
        onClose={() => setIsSwapDrawerOpen(false)}
        token={selectedToken}
        availableTokens={filteredTokens}
      />

      {/* Zenith Connect Modal */}
      <ConnectWalletModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        chainType={connectChain}
      />
    </div>
  );
}
