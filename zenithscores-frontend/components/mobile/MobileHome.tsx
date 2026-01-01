'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Zap, TrendingUp, Activity, FileText, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const PRIMARY_ACTIONS = [
  { icon: Zap, label: 'Trade', href: '/trading', color: 'from-emerald-500 to-teal-500' },
  { icon: TrendingUp, label: 'Markets', href: '/markets', color: 'from-blue-500 to-cyan-500' },
  { icon: Activity, label: 'Signals', href: '/signals', color: 'from-purple-500 to-pink-500' },
  { icon: FileText, label: 'Notes', href: '/notebook', color: 'from-orange-500 to-amber-500' },
];

interface MobileHomeProps {
  balance: number;
  totalPnL: number;
  pnlPercent: number;
}

export default function MobileHome({ balance, totalPnL, pnlPercent }: MobileHomeProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(' ')[0] || 'Trader';
  const isPositive = totalPnL >= 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-[var(--void)] pb-20">
      {/* Status Bar */}
      <div className="px-4 py-6 border-b border-white/5">
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Welcome back, {userName}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="px-4 py-6 bg-gradient-to-b from-[rgba(20,241,149,0.03)] to-transparent">
        <div className="text-xs text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Portfolio Value</div>
        <div className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          {formatCurrency(balance)}
        </div>
        <div className={`flex items-center gap-2 text-sm font-bold ${isPositive ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'}`}>
          <span>{isPositive ? '+' : ''}{formatCurrency(totalPnL)}</span>
          <span className="text-xs">({isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%)</span>
          <span className="text-xs text-[var(--text-muted)]">Today</span>
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

      {/* Premium Upgrade (if not premium) */}
      {!session?.user?.isPremium && (
        <div className="px-4 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => router.push('/profile/subscription')}
            className="group p-6 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 border border-purple-500/30 rounded-2xl active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Sparkles size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white mb-1">Upgrade to Premium</h3>
                <p className="text-xs text-purple-200">Advanced signals and real-time alerts</p>
              </div>
              <ArrowRight size={20} className="text-white/70" />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
