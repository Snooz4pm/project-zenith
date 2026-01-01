'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Zap, TrendingUp, Activity, FileText, ArrowRight, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import DiscoverWidget from './DiscoverWidget';

const PRIMARY_ACTIONS = [
  { icon: Zap, label: 'Trade', href: '/trading', color: 'from-emerald-500 to-teal-500' },
  { icon: TrendingUp, label: 'Markets', href: '/markets', color: 'from-blue-500 to-cyan-500' },
  { icon: Activity, label: 'Signals', href: '/signals', color: 'from-purple-500 to-pink-500' },
  { icon: FileText, label: 'Notes', href: '/notebook', color: 'from-orange-500 to-amber-500' },
];

interface TrackedMarket {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export default function MobileHome() {
  const router = useRouter();
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(' ')[0] || 'Trader';

  // Market Watch - Tracked markets for analysis (NOT portfolio)
  const trackedMarkets: TrackedMarket[] = [
    { symbol: 'BTC', name: 'Bitcoin', price: 45230.50, change24h: 3.45 },
    { symbol: 'ETH', name: 'Ethereum', price: 2340.80, change24h: 5.12 },
    { symbol: 'SOL', name: 'Solana', price: 98.45, change24h: -2.34 },
  ];

  return (
    <div className="min-h-screen bg-[var(--void)] pb-20">
      {/* Status Bar */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Welcome back, {userName}
        </h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-sm text-[var(--text-secondary)]">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          {PRIMARY_ACTIONS.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(action.href)}
                className="group p-6 bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-white/5 rounded-2xl active:scale-95 transition-transform touch-target"
              >
                <div className={`w-12 h-12 mb-4 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-active:scale-90 transition-transform`}>
                  <Icon size={22} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {action.label}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Highlight Card - Crypto Finds */}
      <div className="px-4 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => router.push('/markets/crypto-finds')}
          className="group p-6 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 border border-emerald-500/20 rounded-2xl active:scale-[0.98] transition-transform"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-emerald-400 uppercase tracking-wider font-bold mb-2">Crypto Finds</div>
              <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                New Opportunities
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Discover emerging tokens on ETH, ARB & BASE
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center group-active:scale-90 transition-transform">
              <ArrowRight size={20} className="text-emerald-400" />
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <span>Real-time scanning</span>
            <span>•</span>
            <span>Low liquidity gems</span>
          </div>
        </motion.div>
      </div>

      {/* Market Watch - Tracked markets for analysis */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Market Watch
            </h2>
            <p className="text-xs text-[var(--text-muted)]">Assets you're tracking for analysis</p>
          </div>
          <button
            onClick={() => router.push('/markets')}
            className="text-sm font-medium text-[var(--accent-mint)] hover:text-[var(--accent-cyan)] transition-colors"
          >
            View All
          </button>
        </div>

        <div className="space-y-2">
          {trackedMarkets.map((market, index) => (
            <motion.div
              key={market.symbol}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              onClick={() => router.push(`/crypto/${market.symbol}`)}
              className="flex items-center justify-between p-4 bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-xl active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-mint)]/20 to-[var(--accent-cyan)]/20 flex items-center justify-center border border-white/10">
                  <span className="text-sm font-bold text-white">{market.symbol.charAt(0)}</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {market.symbol}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">{market.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white font-mono">
                  ${market.price.toLocaleString()}
                </div>
                <div className={`text-xs font-bold font-mono flex items-center justify-end gap-1 ${
                  market.change24h >= 0 ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'
                }`}>
                  {market.change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Discover Section */}
      <DiscoverWidget />
    </div>
  );
}
