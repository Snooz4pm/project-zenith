'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ExternalLink, Volume2, VolumeX, Sun, Moon } from 'lucide-react';

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

// Particle component for large trades
function Particle({ delay, left }: { delay: number; left: number }) {
  return (
    <div
      className="absolute w-1 h-1 rounded-full opacity-0"
      style={{
        left: `${left}%`,
        bottom: 0,
        background: 'var(--neon-green)',
        animation: `particle-float 8s ease-out ${delay}s infinite`,
      }}
    />
  );
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<WhaleSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [minAmount, setMinAmount] = useState(10000);
  const [filterType, setFilterType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [hourlyStats, setHourlyStats] = useState<HourlyStats>({
    totalVolume: 0,
    buyPercentage: 0,
    whaleCount: 0,
  });
  const [particles, setParticles] = useState<{ id: number; delay: number; left: number }[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSignalsRef = useRef<string[]>([]);
  const particleIdRef = useRef(0);

  // Calculate hourly stats from signals
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

  // Spawn particles for large trades
  const spawnParticles = useCallback(() => {
    const newParticles = Array.from({ length: 5 }, () => ({
      id: particleIdRef.current++,
      delay: Math.random() * 2,
      left: Math.random() * 100,
    }));
    setParticles(prev => [...prev, ...newParticles]);
    // Clean up old particles
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 10000);
  }, []);

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/signals`);
      const data = await res.json();
      if (data.signals) {
        const newSignals: WhaleSignal[] = data.signals;

        // Check for new signals and play sound
        const newTxs = newSignals.map(s => s.txSignature);
        const hasNew = newTxs.some(tx => !prevSignalsRef.current.includes(tx));

        if (hasNew && soundEnabled && audioRef.current && prevSignalsRef.current.length > 0) {
          audioRef.current.play().catch(() => { });
        }

        // Check for large trades to spawn particles
        const largeTrade = newSignals.find(
          s => s.amountUsd >= 500000 && !prevSignalsRef.current.includes(s.txSignature)
        );
        if (largeTrade) {
          spawnParticles();
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
  }, [soundEnabled, calculateHourlyStats, spawnParticles]);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  // Filter signals
  const filteredSignals = signals.filter(s => {
    if (s.amountUsd < minAmount) return false;
    if (filterType !== 'ALL' && s.type !== filterType) return false;
    return true;
  });

  const bgColor = darkMode ? '#0f0f0f' : '#fafafa';
  const textColor = darkMode ? '#ededed' : '#0f0f0f';
  const mutedColor = darkMode ? '#525252' : '#a1a1aa';
  const cardBg = darkMode ? 'rgba(20, 20, 20, 0.6)' : 'rgba(240, 240, 240, 0.9)';

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: "var(--font-signals, 'JetBrains Mono', monospace)",
      }}
    >
      {/* Audio element for ping sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA" type="audio/wav" />
      </audio>

      {/* Particles container */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map(p => (
          <Particle key={p.id} delay={p.delay} left={p.left} />
        ))}
      </div>

      {/* ===== SLIM FIXED HEADER (50px) ===== */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6"
        style={{
          height: 50,
          backgroundColor: darkMode ? 'rgba(15, 15, 15, 0.9)' : 'rgba(250, 250, 250, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        }}
      >
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--neon-green)' }}>
            ZenithScores
          </span>
        </div>

        {/* Center: Live indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--neon-green)' }}
          />
          <span style={{ color: mutedColor }}>Solana Whale Signals</span>
          <span style={{ color: 'var(--neon-green)' }}>• Live</span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded transition-colors hover:bg-white/10"
            title={soundEnabled ? 'Mute' : 'Enable sound'}
          >
            {soundEnabled ? (
              <Volume2 size={16} style={{ color: 'var(--neon-green)' }} />
            ) : (
              <VolumeX size={16} style={{ color: mutedColor }} />
            )}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded transition-colors hover:bg-white/10"
            title="Toggle theme"
          >
            {darkMode ? (
              <Sun size={16} style={{ color: mutedColor }} />
            ) : (
              <Moon size={16} style={{ color: mutedColor }} />
            )}
          </button>
        </div>
      </header>

      {/* ===== FILTER BAR ===== */}
      <div
        className="fixed top-[50px] left-0 right-0 z-40 flex items-center justify-between px-4 md:px-6 py-2 gap-4"
        style={{
          backgroundColor: darkMode ? 'rgba(15, 15, 15, 0.8)' : 'rgba(250, 250, 250, 0.8)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
        }}
      >
        {/* Amount Slider */}
        <div className="flex items-center gap-2 text-xs">
          <span style={{ color: mutedColor }}>Min:</span>
          <input
            type="range"
            min="10000"
            max="1000000"
            step="10000"
            value={minAmount}
            onChange={(e) => setMinAmount(Number(e.target.value))}
            className="w-24 md:w-32 accent-[var(--neon-green)]"
          />
          <span style={{ color: textColor }}>{formatUsd(minAmount)}</span>
        </div>

        {/* Buy/Sell Toggle */}
        <div className="flex items-center gap-1 text-xs">
          {(['ALL', 'BUY', 'SELL'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className="px-2 py-1 rounded transition-all"
              style={{
                backgroundColor: filterType === type
                  ? type === 'BUY' ? 'rgba(0, 255, 157, 0.2)'
                    : type === 'SELL' ? 'rgba(255, 0, 110, 0.2)'
                      : 'rgba(255, 255, 255, 0.1)'
                  : 'transparent',
                color: filterType === type
                  ? type === 'BUY' ? 'var(--neon-green)'
                    : type === 'SELL' ? 'var(--neon-red)'
                      : textColor
                  : mutedColor,
                border: `1px solid ${filterType === type
                  ? type === 'BUY' ? 'var(--neon-green)'
                    : type === 'SELL' ? 'var(--neon-red)'
                      : 'rgba(255,255,255,0.2)'
                  : 'transparent'}`,
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* ===== LIVE FEED ===== */}
      <main className="flex-1 pt-[100px] pb-[60px] overflow-y-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto space-y-2">
          {loading ? (
            // Skeleton loading
            [...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-lg animate-pulse"
                style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
              />
            ))
          ) : filteredSignals.length === 0 ? (
            <div className="text-center py-20">
              <p style={{ color: mutedColor }}>No whale activity matching filters</p>
            </div>
          ) : (
            filteredSignals.map((signal, idx) => {
              const isBuy = signal.type === 'BUY';
              const accentColor = isBuy ? 'var(--neon-green)' : 'var(--neon-red)';
              const glowColor = isBuy ? 'var(--glow-neon-green)' : 'var(--glow-neon-red)';

              return (
                <div
                  key={`${signal.txSignature}-${idx}`}
                  className="group rounded-lg p-4 transition-all duration-300 cursor-default"
                  style={{
                    background: cardBg,
                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                    animation: `slide-in-left 0.4s ease-out ${Math.min(idx * 0.05, 0.3)}s both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`;
                    e.currentTarget.style.borderColor = accentColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                  }}
                >
                  {/* Top Row: Time + Type */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px]" style={{ color: mutedColor }}>
                      {timeAgo(signal.timestamp)}
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{
                        color: accentColor,
                        backgroundColor: isBuy ? 'rgba(0, 255, 157, 0.15)' : 'rgba(255, 0, 110, 0.15)',
                      }}
                    >
                      {signal.type}
                    </span>
                  </div>

                  {/* Amount (Big) */}
                  <div
                    className="text-2xl font-bold mb-1"
                    style={{ color: accentColor }}
                  >
                    {formatUsd(signal.amountUsd)}
                  </div>

                  {/* Token Info */}
                  <div className="text-sm mb-2" style={{ color: textColor }}>
                    {signal.token.symbol}
                    {signal.token.platform && (
                      <span style={{ color: mutedColor }}> / {signal.token.platform}</span>
                    )}
                  </div>

                  {/* Wallet + Tx Links */}
                  <div className="flex items-center gap-4 text-[10px]" style={{ color: mutedColor }}>
                    <a
                      href={`https://solscan.io/account/${signal.wallet}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                      style={{ color: mutedColor }}
                    >
                      Wallet: {formatWallet(signal.wallet)}
                      <ExternalLink size={10} />
                    </a>
                    <a
                      href={`https://solscan.io/tx/${signal.txSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                      style={{ color: mutedColor }}
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
      </main>

      {/* ===== FIXED BOTTOM STATS BAR ===== */}
      <footer
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center px-4 text-xs"
        style={{
          height: 48,
          backgroundColor: darkMode ? 'rgba(15, 15, 15, 0.9)' : 'rgba(250, 250, 250, 0.9)',
          backdropFilter: 'blur(12px)',
          borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          color: mutedColor,
        }}
      >
        <span>
          Last hour:{' '}
          <span style={{ color: 'var(--neon-green)' }}>{formatUsd(hourlyStats.totalVolume)}</span> vol
          <span className="mx-2">•</span>
          <span style={{ color: 'var(--neon-green)' }}>{hourlyStats.buyPercentage}%</span> buys
          <span className="mx-2">•</span>
          <span style={{ color: 'var(--neon-green)' }}>{hourlyStats.whaleCount}</span> whales
        </span>
      </footer>
    </div>
  );
}
