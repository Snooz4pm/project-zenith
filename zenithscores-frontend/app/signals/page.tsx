'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'http://localhost:3001';

interface WhaleSignal {
  type: 'BUY' | 'SELL';
  wallet: string;
  token: {
    symbol: string;
    mint: string;
    logoURI?: string;
  };
  amount: number;
  amountUsd: number;
  txSignature: string;
  timestamp: number;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatAmount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatWallet(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<WhaleSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const fetchSignals = async () => {
    try {
      const res = await fetch(`${API_URL}/signals`);
      const data = await res.json();
      if (data.signals) {
        setSignals(data.signals);
        setLastUpdate(Date.now());
      }
    } catch (err) {
      console.error('[Signals] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    // Refresh every 15 seconds (matches backend cache)
    const interval = setInterval(fetchSignals, 15_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-8 h-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-white tracking-tight">Whale Signals</h1>
          </div>
          <p className="text-zinc-500 text-sm max-w-lg">
            Live feed of major buy and sell activity from top Solana wallets. 
            Minimum $10K transactions only.
          </p>
          <div className="flex items-center gap-4 mt-4 text-xs text-zinc-600">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
            {lastUpdate > 0 && (
              <span>Updated {timeAgo(lastUpdate)}</span>
            )}
            <button 
              onClick={fetchSignals}
              className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </header>

        {/* Signals List */}
        <div className="space-y-3">
          {loading ? (
            // Skeleton loading
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
            ))
          ) : signals.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-500">No whale activity detected</p>
            </div>
          ) : (
            signals.map((signal, idx) => (
              <div
                key={`${signal.txSignature}-${idx}`}
                className={`
                  group relative flex items-center gap-4 p-4 rounded-xl border transition-all
                  ${signal.type === 'BUY' 
                    ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40' 
                    : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                  }
                `}
              >
                {/* Type Indicator */}
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full shrink-0
                  ${signal.type === 'BUY' ? 'bg-emerald-500/20' : 'bg-red-500/20'}
                `}>
                  {signal.type === 'BUY' ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                </div>

                {/* Token Info */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  {signal.token.logoURI ? (
                    <img 
                      src={signal.token.logoURI} 
                      alt={signal.token.symbol}
                      className="w-8 h-8 rounded-full bg-zinc-800"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                      {signal.token.symbol[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-white">{signal.token.symbol}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {formatWallet(signal.wallet)}
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex-1 text-right">
                  <div className={`font-mono font-bold text-lg ${signal.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {signal.type === 'BUY' ? '+' : '-'}{formatAmount(signal.amount)} {signal.token.symbol}
                  </div>
                  <div className="text-sm text-zinc-400 font-mono">
                    {formatUsd(signal.amountUsd)}
                  </div>
                </div>

                {/* Time & Link */}
                <div className="flex flex-col items-end gap-1 min-w-[80px]">
                  <span className="text-xs text-zinc-500">{timeAgo(signal.timestamp)}</span>
                  <a
                    href={`https://solscan.io/tx/${signal.txSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Solscan
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Note */}
        <footer className="mt-12 pt-8 border-t border-white/5">
          <p className="text-xs text-zinc-600 text-center">
            Data sourced from on-chain activity. Minimum $10,000 USD transactions displayed.
            <br />
            Not financial advice. Do your own research.
          </p>
        </footer>
      </div>
    </div>
  );
}
