'use client';

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from 'react';
import { ExternalLink, Volume2, VolumeX, Activity, Bell } from 'lucide-react';
import PremiumAlerts from '@/components/Signals/PremiumAlerts';

const API_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'http://localhost:3001';

interface WhaleSignal {
  type: 'BUY' | 'SELL';
  wallet: string;
  token: {
    symbol: string;
    mint: string;
    logoURI?: string;
    platform?: string;
  };
  amount: number;
  amountUsd: number;
  txSignature: string;
  timestamp: number;
}

interface HourlyStats {
  totalVolume: number;
  buyPercentage: number;
  whaleCount: number;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatWallet(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatTx(signature: string): string {
  return `${signature.slice(0, 4)}...${signature.slice(-4)}`;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function SignalsPage() {
  const [activeView, setActiveView] = useState<'feed' | 'premium'>('feed');
  const [signals, setSignals] = useState<WhaleSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [minAmount, setMinAmount] = useState(10000);
  const [filterType, setFilterType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [hourlyStats, setHourlyStats] = useState<HourlyStats>({
    totalVolume: 0,
    buyPercentage: 0,
    whaleCount: 0,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSignalsRef = useRef<string[]>([]);

  const calculateHourlyStats = useCallback((sigs: WhaleSignal[]) => {
    const hourAgo = Date.now() - 3600000;
    const hourlySignals = sigs.filter(s => s.timestamp > hourAgo);
    const totalVolume = hourlySignals.reduce((acc, s) => acc + s.amountUsd, 0);
    const buys = hourlySignals.filter(s => s.type === 'BUY').length;
    const buyPercentage = hourlySignals.length > 0 ? Math.round((buys / hourlySignals.length) * 100) : 0;
    const uniqueWallets = new Set(hourlySignals.map(s => s.wallet)).size;

    setHourlyStats({
      totalVolume,
      buyPercentage,
      whaleCount: uniqueWallets,
    });
  }, []);

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/signals`);
      const data = await res.json();
      if (data.signals) {
        const newSignals: WhaleSignal[] = data.signals;

        const newTxs = newSignals.map(s => s.txSignature);
        const hasNew = newTxs.some(tx => !prevSignalsRef.current.includes(tx));

        if (hasNew && soundEnabled && audioRef.current && prevSignalsRef.current.length > 0) {
          audioRef.current.play().catch(() => { });
        }

        prevSignalsRef.current = newTxs;
        setSignals(newSignals);
        calculateHourlyStats(newSignals);
      }
    } catch (err) {
      console.error('[Signals] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [soundEnabled, calculateHourlyStats]);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  const filteredSignals = signals.filter(s => {
    if (s.amountUsd < minAmount) return false;
    if (filterType !== 'ALL' && s.type !== filterType) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-[#EDEDED] relative overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-black to-zinc-900 pointer-events-none opacity-50" />

      {/* Audio element */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA" type="audio/wav" />
      </audio>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">

        {/* Header with View Toggle */}
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-emerald-500" />
              <h1 className="text-3xl font-medium tracking-tight text-white">Signals</h1>
              <span className="flex items-center gap-1.5 ml-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-zinc-500">Live</span>
              </span>
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg">
              <button
                onClick={() => setActiveView('feed')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeView === 'feed' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
              >
                <Activity size={14} className="inline mr-1.5" />
                Live Feed
              </button>
              <button
                onClick={() => setActiveView('premium')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeView === 'premium' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
              >
                <Bell size={14} className="inline mr-1.5" />
                Premium Alerts
              </button>
            </div>
          </div>
          <p className="text-zinc-500 text-sm max-w-lg">
            {activeView === 'feed'
              ? 'Live feed of major buy and sell activity from top Solana wallets.'
              : 'Custom alerts for whale moves, new coins & rug detection.'
            }
          </p>
        </header>

        {/* Conditional Content */}
        {activeView === 'premium' ? (
          <PremiumAlerts />
        ) : (
          <>
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
              {/* Amount Slider */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500">Min:</span>
                <input
                  type="range"
                  min="10000"
                  max="1000000"
                  step="10000"
                  value={minAmount}
                  onChange={(e) => setMinAmount(Number(e.target.value))}
                  className="w-24 md:w-32 accent-emerald-500"
                />
                <span className="text-white font-mono">{formatUsd(minAmount)}</span>
              </div>

              {/* Buy/Sell Toggle */}
              <div className="flex items-center gap-1 text-xs">
                {(['ALL', 'BUY', 'SELL'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-md transition-all ${filterType === type
                      ? type === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : type === 'SELL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                          : 'bg-white/10 text-white border border-white/20'
                      : 'text-zinc-500 hover:text-white border border-transparent'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs hover:bg-white/5 transition-colors ml-auto"
                title={soundEnabled ? 'Mute' : 'Enable sound'}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 size={14} className="text-emerald-400" />
                    <span className="text-zinc-400">Sound On</span>
                  </>
                ) : (
                  <>
                    <VolumeX size={14} className="text-zinc-500" />
                    <span className="text-zinc-500">Sound Off</span>
                  </>
                )}
              </button>
            </div>

            {/* Signals List */}
            <div className="space-y-3">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
                ))
              ) : filteredSignals.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-zinc-500">No whale activity matching filters</p>
                </div>
              ) : (
                filteredSignals.map((signal, idx) => {
                  const isBuy = signal.type === 'BUY';

                  return (
                    <div
                      key={`${signal.txSignature}-${idx}`}
                      className={`
                        group relative p-4 rounded-xl border transition-all duration-300
                        ${isBuy
                          ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                          : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]'
                        }
                      `}
                      style={{
                        animation: `stagger-reveal 0.5s ease-out ${Math.min(idx * 0.05, 0.3)}s both`,
                      }}
                    >
                      {/* Top Row: Time + Type */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {timeAgo(signal.timestamp)}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${isBuy
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                            }`}
                        >
                          {signal.type}
                        </span>
                      </div>

                      {/* Amount */}
                      <div
                        className={`text-2xl font-bold mb-1 font-mono ${isBuy ? 'text-emerald-400' : 'text-red-400'
                          }`}
                      >
                        {formatUsd(signal.amountUsd)}
                      </div>

                      {/* Token Info */}
                      <div className="text-sm mb-3 text-white">
                        {signal.token.symbol}
                        {signal.token.platform && (
                          <span className="text-zinc-500"> / {signal.token.platform}</span>
                        )}
                      </div>

                      {/* Wallet + Tx Links */}
                      <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-mono">
                        <a
                          href={`https://solscan.io/account/${signal.wallet}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          Wallet: {formatWallet(signal.wallet)}
                          <ExternalLink size={10} />
                        </a>
                        <a
                          href={`https://solscan.io/tx/${signal.txSignature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          Tx: {formatTx(signal.txSignature)}
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Stats */}
            <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/5 text-center text-sm text-zinc-500">
              Last hour:{' '}
              <span className="text-emerald-400 font-mono">{formatUsd(hourlyStats.totalVolume)}</span> vol
              <span className="mx-2">•</span>
              <span className="text-emerald-400 font-mono">{hourlyStats.buyPercentage}%</span> buys
              <span className="mx-2">•</span>
              <span className="text-emerald-400 font-mono">{hourlyStats.whaleCount}</span> whales
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-white/5">
          <p className="text-xs text-zinc-600 text-center">
            Data sourced from on-chain activity. Minimum $10,000 USD transactions displayed.
            <br />
            Not financial advice. Do your own research.
          </p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}

