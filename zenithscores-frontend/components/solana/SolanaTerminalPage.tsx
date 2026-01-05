'use client';

/**
 * Solana Terminal Page (Trending Grid)
 * 
 * Shows trending Solana tokens from Raydium/Orca.
 * NO DexScreener, NO wagmi - Solana only.
 */

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { SolanaDisplayToken } from '@/lib/solana/display-types';
import { SolanaSwapDrawer } from '@/components/SolanaSwapDrawer';

interface TrendingResponse {
  tokens: SolanaDisplayToken[];
  lastUpdated: string;
  source: string;
}

function TrendingCard({ token, rank, onSwap }: { 
  token: SolanaDisplayToken; 
  rank: number;
  onSwap: () => void;
}) {
  const riskColor = {
    SAFE: 'border-green-500/30 hover:border-green-500/60',
    LOW: 'border-green-400/30 hover:border-green-400/60',
    MEDIUM: 'border-yellow-500/30 hover:border-yellow-500/60',
    HIGH: 'border-orange-500/30 hover:border-orange-500/60',
    EXTREME: 'border-red-500/30 hover:border-red-500/60',
  }[token.riskLevel ?? 'MEDIUM'];

  const riskBadge = {
    SAFE: 'bg-green-500/20 text-green-400',
    LOW: 'bg-green-400/20 text-green-300',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400',
    HIGH: 'bg-orange-500/20 text-orange-400',
    EXTREME: 'bg-red-500/20 text-red-400',
  }[token.riskLevel ?? 'MEDIUM'];

  return (
    <div className={`bg-zinc-900/80 border ${riskColor} rounded-xl p-4 transition-all cursor-pointer`}
         onClick={onSwap}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center font-bold">
              {token.symbol.slice(0, 2)}
            </div>
            <div className="absolute -top-1 -left-1 w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-purple-400">
              {rank}
            </div>
          </div>
          <div>
            <div className="font-bold text-white text-lg">{token.symbol}</div>
            <div className="text-xs text-zinc-500">{token.name.slice(0, 20)}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {token.isMeme && (
            <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs rounded">🐸 MEME</span>
          )}
          {token.isHot && (
            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">🔥 HOT</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-zinc-800/50 rounded-lg p-2">
          <div className="text-xs text-zinc-500">Liquidity</div>
          <div className="text-white font-medium">${token.liquidityUsd.toLocaleString()}</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-2">
          <div className="text-xs text-zinc-500">Safety Score</div>
          <div className="text-white font-medium">{token.safetyScore ?? '?'}/100</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded text-xs font-medium ${riskBadge}`}>
          {token.riskLevel ?? 'UNKNOWN'}
        </span>
        <span className="text-xs text-zinc-500">{token.sources?.[0] ?? 'Unknown'}</span>
      </div>
    </div>
  );
}

export default function SolanaTerminalPage() {
  const { connected } = useWallet();
  const [data, setData] = useState<TrendingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<SolanaDisplayToken | null>(null);
  const [showSwap, setShowSwap] = useState(false);
  const [filter, setFilter] = useState<'all' | 'meme' | 'safe'>('all');

  const fetchTrending = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/solana/trending');
      if (!res.ok) throw new Error('Failed to fetch trending');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
    const interval = setInterval(fetchTrending, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const handleTokenSelect = (token: SolanaDisplayToken) => {
    setSelectedToken(token);
    setShowSwap(true);
  };

  const filteredTokens = data?.tokens.filter(t => {
    if (filter === 'meme') return t.isMeme;
    if (filter === 'safe') return (t.safetyScore ?? 0) >= 60;
    return true;
  }) ?? [];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Solana Terminal
            </h1>
            <p className="text-zinc-500 mt-1">Trending tokens from Raydium + Orca</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchTrending}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
            >
              ↻ Refresh
            </button>
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-500" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {(['all', 'meme', 'safe'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {f === 'all' ? 'All Tokens' : f === 'meme' ? '🐸 Memes' : '✓ Safe Only'}
            </button>
          ))}
          <span className="ml-auto text-xs text-zinc-500">
            {filteredTokens.length} tokens
            {data && ` • Updated ${new Date(data.lastUpdated).toLocaleTimeString()}`}
          </span>
        </div>

        {/* Content */}
        {loading && !data ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTokens.map((token, idx) => (
              <TrendingCard
                key={token.mint}
                token={token}
                rank={idx + 1}
                onSwap={() => handleTokenSelect(token)}
              />
            ))}
          </div>
        )}

        {filteredTokens.length === 0 && !loading && (
          <div className="text-center text-zinc-500 py-12">
            No tokens match your filter. Try a different filter.
          </div>
        )}
      </div>

      {/* Swap Drawer */}
      {showSwap && selectedToken && (
        <SolanaSwapDrawer
          isOpen={showSwap}
          onClose={() => setShowSwap(false)}
          token={{
            chainType: 'SOLANA',
            chainId: 'solana',
            chain: 'solana',
            address: selectedToken.mint,
            symbol: selectedToken.symbol,
            name: selectedToken.name,
            decimals: selectedToken.decimals,
            liquidityUsd: selectedToken.liquidityUsd,
            volume24hUsd: selectedToken.volume24hUsd ?? 0,
            source: 'RAYDIUM' as const,
          }}
        />
      )}
    </div>
  );
}
