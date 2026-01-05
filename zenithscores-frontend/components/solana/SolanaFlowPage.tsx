'use client';

/**
 * Solana Flow Page
 * 
 * Shows hot tokens, meme flow, and new pairs from Raydium/Orca.
 * NO DexScreener, NO wagmi - Solana only.
 */

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { SolanaDisplayToken, SolanaFlowData } from '@/lib/solana/display-types';
import { SolanaSwapDrawer } from '@/components/SolanaSwapDrawer';

function TokenCard({ token, onSwap }: { token: SolanaDisplayToken; onSwap: () => void }) {
  const riskColor = {
    SAFE: 'text-green-400',
    LOW: 'text-green-300',
    MEDIUM: 'text-yellow-400',
    HIGH: 'text-orange-400',
    EXTREME: 'text-red-500',
  }[token.riskLevel ?? 'MEDIUM'];

  return (
    <div className="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4 hover:border-purple-500/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">
            {token.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-white">{token.symbol}</div>
            <div className="text-xs text-zinc-400">{token.name.slice(0, 20)}</div>
          </div>
        </div>
        {token.isMeme && (
          <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs rounded">MEME</span>
        )}
        {token.isHot && (
          <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">🔥 HOT</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <div className="text-zinc-500 text-xs">Liquidity</div>
          <div className="text-white">${token.liquidityUsd.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-zinc-500 text-xs">Safety</div>
          <div className={riskColor}>{token.safetyScore ?? '?'}/100</div>
        </div>
        <div>
          <div className="text-zinc-500 text-xs">Source</div>
          <div className="text-zinc-300 text-xs">{token.sources?.[0] ?? 'Unknown'}</div>
        </div>
        <div>
          <div className="text-zinc-500 text-xs">Risk</div>
          <div className={riskColor}>{token.riskLevel ?? '?'}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSwap}
          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-sm py-2 rounded transition"
        >
          Swap
        </button>
        <a
          href={token.dexUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded transition"
        >
          ↗
        </a>
      </div>
    </div>
  );
}

function TokenSection({ title, tokens, onTokenSelect, emptyText }: {
  title: string;
  tokens: SolanaDisplayToken[];
  onTokenSelect: (t: SolanaDisplayToken) => void;
  emptyText: string;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        {title}
        <span className="text-sm text-zinc-500 font-normal">({tokens.length})</span>
      </h2>
      {tokens.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tokens.map(token => (
            <TokenCard key={token.mint} token={token} onSwap={() => onTokenSelect(token)} />
          ))}
        </div>
      ) : (
        <div className="text-zinc-500 py-8 text-center">{emptyText}</div>
      )}
    </div>
  );
}

export default function SolanaFlowPage() {
  const { connected } = useWallet();
  const [flowData, setFlowData] = useState<SolanaFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<SolanaDisplayToken | null>(null);
  const [showSwap, setShowSwap] = useState(false);

  const fetchFlow = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/solana/flow');
      if (!res.ok) throw new Error('Failed to fetch flow');
      const data = await res.json();
      setFlowData(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlow();
    const interval = setInterval(fetchFlow, 45000); // Refresh every 45s
    return () => clearInterval(interval);
  }, []);

  const handleTokenSelect = (token: SolanaDisplayToken) => {
    setSelectedToken(token);
    setShowSwap(true);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Solana Flow
            </h1>
            <p className="text-zinc-500 mt-1">Powered by Raydium + Orca • Solana only</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchFlow}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
            >
              ↻ Refresh
            </button>
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-500" />
          </div>
        </div>

        {/* Content */}
        {loading && !flowData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
            {error}
          </div>
        ) : flowData ? (
          <>
            <TokenSection
              title="🔥 Hot Now"
              tokens={flowData.hotNow}
              onTokenSelect={handleTokenSelect}
              emptyText="No hot tokens found"
            />
            <TokenSection
              title="🐸 Meme Flow"
              tokens={flowData.memeFlow}
              onTokenSelect={handleTokenSelect}
              emptyText="No meme tokens found"
            />
            <TokenSection
              title="🆕 New Pairs"
              tokens={flowData.newPairs}
              onTokenSelect={handleTokenSelect}
              emptyText="No new pairs found"
            />
          </>
        ) : null}
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
