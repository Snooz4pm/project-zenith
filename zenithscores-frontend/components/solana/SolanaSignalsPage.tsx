'use client';

/**
 * Solana Signals Page
 * 
 * Shows token signals with edge scoring from Raydium/Orca.
 * NO DexScreener, NO wagmi - Solana only.
 */

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { SolanaSignal } from '@/lib/solana/display-types';
import { SolanaSwapDrawer } from '@/components/SolanaSwapDrawer';

interface SignalResponse {
  signals: SolanaSignal[];
  market: {
    regime: 'TRENDING' | 'MEAN-REVERTING' | 'CHOPPY' | 'CRISIS';
    avgMomentum: number;
    avgVolume: number;
  };
  lastUpdated: string;
}

function EdgeScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500 w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-zinc-400 w-8 text-right">{value}</span>
    </div>
  );
}

function SignalCard({ signal, onSwap }: { signal: SolanaSignal; onSwap: () => void }) {
  const riskColor = {
    SAFE: 'text-green-400 bg-green-500/10',
    LOW: 'text-green-300 bg-green-500/10',
    MEDIUM: 'text-yellow-400 bg-yellow-500/10',
    HIGH: 'text-orange-400 bg-orange-500/10',
    EXTREME: 'text-red-500 bg-red-500/10',
  }[signal.riskLevel ?? 'MEDIUM'];

  const flowColor = {
    accumulation: 'text-green-400',
    distribution: 'text-red-400',
    neutral: 'text-zinc-400',
  }[signal.smartMoneyFlow];

  return (
    <div className="bg-zinc-900/70 border border-zinc-700 rounded-lg p-4 hover:border-purple-500/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold">
            {signal.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-white">{signal.symbol}</div>
            <div className="text-xs text-zinc-400">{signal.name.slice(0, 25)}</div>
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${riskColor}`}>
          {signal.riskLevel}
        </div>
      </div>

      {/* Edge Score Breakdown */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-zinc-400">Edge Score</span>
          <span className="text-purple-400 font-bold">{signal.edgeScore.overall}</span>
        </div>
        <EdgeScoreBar label="Volume" value={signal.edgeScore.volume} color="bg-blue-500" />
        <EdgeScoreBar label="Liquidity" value={signal.edgeScore.liquidity} color="bg-green-500" />
        <EdgeScoreBar label="Momentum" value={signal.edgeScore.momentum} color="bg-yellow-500" />
        <EdgeScoreBar label="Smart $" value={signal.edgeScore.smartMoney} color="bg-purple-500" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3 border-t border-zinc-800 pt-3">
        <div>
          <div className="text-zinc-500">Liquidity</div>
          <div className="text-white">${signal.liquidityUsd.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-zinc-500">Max Trade</div>
          <div className="text-white">${signal.maxTradeSize.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-zinc-500">Smart Flow</div>
          <div className={flowColor}>{signal.smartMoneyFlow}</div>
        </div>
        <div>
          <div className="text-zinc-500">Safety</div>
          <div className="text-zinc-300">{signal.safetyScore ?? '?'}/100</div>
        </div>
      </div>

      <button
        onClick={onSwap}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm py-2.5 rounded font-medium transition"
      >
        Swap on Jupiter
      </button>
    </div>
  );
}

function MarketRegimeBanner({ market }: { market: SignalResponse['market'] }) {
  const regimeStyles = {
    'TRENDING': 'bg-green-500/10 border-green-500/30 text-green-400',
    'MEAN-REVERTING': 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    'CHOPPY': 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    'CRISIS': 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  const regimeDesc = {
    'TRENDING': 'Strong momentum, follow the trend',
    'MEAN-REVERTING': 'Fading extremes works well',
    'CHOPPY': 'No clear direction, trade with caution',
    'CRISIS': 'Low volume, high risk conditions',
  };

  return (
    <div className={`rounded-lg border p-4 mb-6 ${regimeStyles[market.regime]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Market Regime: {market.regime}</div>
          <div className="text-xs opacity-80 mt-1">{regimeDesc[market.regime]}</div>
        </div>
        <div className="text-right text-xs">
          <div>Avg Momentum: {Math.round(market.avgMomentum)}</div>
          <div>Avg Volume: {Math.round(market.avgVolume)}</div>
        </div>
      </div>
    </div>
  );
}

export default function SolanaSignalsPage() {
  const { connected } = useWallet();
  const [data, setData] = useState<SignalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<SolanaSignal | null>(null);
  const [showSwap, setShowSwap] = useState(false);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/solana/signals');
      if (!res.ok) throw new Error('Failed to fetch signals');
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
    fetchSignals();
    const interval = setInterval(fetchSignals, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSignalSelect = (signal: SolanaSignal) => {
    setSelectedSignal(signal);
    setShowSwap(true);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Solana Signals
            </h1>
            <p className="text-zinc-500 mt-1">Edge Score Analysis • Raydium + Orca</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchSignals}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
            >
              ↻ Refresh
            </button>
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-500" />
          </div>
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
        ) : data ? (
          <>
            <MarketRegimeBanner market={data.market} />

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Active Signals ({data.signals.length})
              </h2>
              <span className="text-xs text-zinc-500">
                Updated: {new Date(data.lastUpdated).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.signals.map(signal => (
                <SignalCard
                  key={signal.mint}
                  signal={signal}
                  onSwap={() => handleSignalSelect(signal)}
                />
              ))}
            </div>

            {data.signals.length === 0 && (
              <div className="text-center text-zinc-500 py-12">
                No signals found. Waiting for market data...
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Swap Drawer */}
      {showSwap && selectedSignal && (
        <SolanaSwapDrawer
          isOpen={showSwap}
          onClose={() => setShowSwap(false)}
          token={{
            chainType: 'SOLANA',
            chainId: 'solana',
            chain: 'solana',
            address: selectedSignal.mint,
            symbol: selectedSignal.symbol,
            name: selectedSignal.name,
            decimals: selectedSignal.decimals,
            liquidityUsd: selectedSignal.liquidityUsd,
            volume24hUsd: selectedSignal.volume24hUsd ?? 0,
            source: 'RAYDIUM' as const,
          }}
        />
      )}
    </div>
  );
}
