'use client';

/**
 * /arena → /swap redirect
 * Kept for SEO / backward compatibility
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ArenaRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/swap');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-500">Redirecting to Swap...</p>
    </div>
  );
}
      return ratio >= 0.2 && ratio <= 0.6;
    },
    NEW: (t) => {
      const createdAt = t.pairCreatedAt;
      if (!createdAt) return false;
      const ageHours = (Date.now() - createdAt) / (1000 * 60 * 60);
      return ageHours <= 24 && (t.liquidityUsd || 0) >= 5_000;
    },
    HIGH_LIQ: (t) => (t.liquidityUsd || 0) >= 1_000_000,
    LOW_CAP: (t) => {
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
      setActivePreset(null);
    } else {
      setActivePreset(preset);
      setMinLiquidity(0);
    }
  };

  const filteredTokens = useMemo(() => {
    if (!tokens) return [];
    if (!isFilterReady) return tokens;

    if (!debouncedSearch && !activePreset && minLiquidity === 0) {
      return tokens;
    }

    const query = debouncedSearch.toLowerCase();

    return tokens.filter(t => {
      if (debouncedSearch) {
        const match =
          t.symbol.toLowerCase().includes(query) ||
          t.name.toLowerCase().includes(query) ||
          t.address.toLowerCase().includes(query);
        if (!match) return false;
      }

      if (activePreset) {
        return PRESET_LOGIC[activePreset](t);
      }

      if (minLiquidity > 0) {
        if ((t.liquidityUsd || 0) < minLiquidity) return false;
      }

      return true;
    });
  }, [tokens, isFilterReady, debouncedSearch, activePreset, minLiquidity]);

  // ═══════════════════════════════════════════════════════════
  // PAGINATION
  // ═══════════════════════════════════════════════════════════
  const totalPages = Math.ceil(filteredTokens.length / PAGE_SIZE);

  const pageTokens = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredTokens.slice(start, end);
  }, [filteredTokens, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activePreset, minLiquidity]);

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [page]);

  const showingFrom = (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, filteredTokens.length);

  const renderLiquidityStep = (val: number, label: string) => (
    <button
      onClick={() => { setMinLiquidity(val); setActivePreset(null); }}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${minLiquidity === val && !activePreset
        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
        : 'bg-[#111116] text-zinc-500 border border-white/5 hover:border-white/20'
        }`}
    >
      {label}
    </button>
  );

  const getTokenBadges = (t: DiscoveredToken): string[] => {
    const badges: string[] = [];
    if (PRESET_LOGIC.NEW(t)) badges.push('NEW');
    if (PRESET_LOGIC.TRENDING(t)) badges.push('TRENDING');
    else if (PRESET_LOGIC.RISING(t)) badges.push('RISING');
    return badges.slice(0, 2);
  };

  // ═══════════════════════════════════════════════════════════
  // TOKEN CLICK - SOLANA ONLY
  // ═══════════════════════════════════════════════════════════
  const handleTokenClick = (token: DiscoveredToken) => {
    if (!connected) {
      // Open Solana wallet modal
      setVisible(true);
      return;
    }

    setSelectedToken(token);
    setIsSwapDrawerOpen(true);
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
        <div className="max-w-7xl mx-auto mb-6">
          <h1 className="text-2xl font-bold mb-2">Loading Solana Arena...</h1>
          <p className="text-sm text-zinc-500">Fetching tokens from Jupiter (24h cache)</p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">Solana registry unavailable</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-500 rounded-lg">
            <RefreshCw className="w-4 h-4 inline mr-2" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6" ref={gridRef}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 space-y-4">
        <div className="flex flex-col gap-4 w-full">
          {/* Title + Stats + Wallet */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-green-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    <span className="text-purple-400">Solana</span> Arena
                  </h1>
                  <p className="text-sm text-zinc-500">
                    Swap on Solana via Jupiter
                  </p>
                </div>
              </div>
            </div>
            
            {/* Wallet Status */}
            <div className="flex items-center gap-3">
              {connected ? (
                <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-sm">
                  <span className="text-purple-400">●</span>
                  <span className="text-zinc-300 ml-2">
                    {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setVisible(true)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  Connect Solana Wallet
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <p className="text-sm text-zinc-500">
            Showing <span className="text-zinc-300 font-medium">{filteredTokens.length > 0 ? `${showingFrom}–${showingTo}` : '0'}</span> of {filteredTokens.length.toLocaleString()} tokens
            {filteredTokens.length !== tokens.length && ` (filtered from ${tokens.length.toLocaleString()})`}
          </p>

          {/* Search */}
          <div className="w-full">
            <input
              type="text"
              placeholder="Search symbol, name, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#111116] border border-white/10 rounded-lg px-4 py-2 text-sm w-full focus:border-purple-500/50 outline-none transition-colors"
            />
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
            {(Object.keys(PRESET_CONFIG) as Preset[]).map((preset) => {
              const isActive = activePreset === preset;
              const config = PRESET_CONFIG[preset!];
              return (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  className={`relative group px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${isActive
                    ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'bg-[#111116] border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                    }`}
                >
                  {config.label}
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-800 text-zinc-200 text-[10px] rounded-lg whitespace-nowrap pointer-events-none z-10 border border-white/10 shadow-xl capitalize">
                    {config.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Liquidity Steps */}
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

      {/* Empty State */}
      {filteredTokens.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg mb-2">No tokens match your filters.</p>
          <p className="text-sm">Adjust liquidity or activity thresholds.</p>
        </div>
      )}

      {/* Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pb-8">
        {pageTokens.map((token) => (
          <ArenaTokenCard
            key={`solana:${token.address}`}
            token={token}
            badges={getTokenBadges(token)}
            onClick={handleTokenClick}
          />
        ))}
      </div>

      {/* Pagination */}
      <ZenithPagination
        page={page}
        totalPages={totalPages}
        onChange={setPage}
      />
      <div className="h-20" />

      {/* Solana Swap Drawer */}
      <SolanaSwapDrawer
        isOpen={isSwapDrawerOpen}
        onClose={() => setIsSwapDrawerOpen(false)}
        token={selectedToken}
        availableTokens={filteredTokens}
      />
    </div>
  );
}
