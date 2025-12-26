'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

// Subtle slow-moving gradient background
function SubtleBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base dark */}
      <div className="absolute inset-0 bg-[#060010]" />

      {/* Slow moving gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-cyan-500/[0.03] blur-[100px]"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/[0.02] blur-[100px]"
        animate={{
          x: [0, -40, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

// Top Opportunities data (will be fetched in production)
const topOpportunities = [
  { rank: 1, symbol: 'NVDA', name: 'Technology / AI', change: 4.2, score: 92, scoreColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { rank: 2, symbol: 'BTC', name: 'Bitcoin Network', change: 1.8, score: 88, scoreColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { rank: 3, symbol: 'SOXS', name: 'Bear 3x Semi', change: -2.4, score: 34, scoreColor: 'text-red-400 border-red-500/30 bg-red-500/10' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen text-white">
      <SubtleBackground />

      {/* ========== HERO SECTION - 100vh ========== */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl"
        >
          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-white mb-6">
            DATA FOR MARKET ANALYSIS
          </h1>

          {/* Subtext */}
          <p className="text-lg sm:text-xl text-gray-400 font-normal mb-12 max-w-xl mx-auto leading-relaxed">
            Real stocks, crypto, and macro data.<br />
            Structured. Explained. No noise.
          </p>

          {/* Two buttons - same size, same weight */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="px-8 py-3.5 bg-white/[0.08] border border-white/[0.12] text-white font-medium rounded-lg hover:bg-white/[0.12] hover:border-white/[0.2] transition-all duration-200 min-w-[160px]"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3.5 bg-white/[0.08] border border-white/[0.12] text-white font-medium rounded-lg hover:bg-white/[0.12] hover:border-white/[0.2] transition-all duration-200 min-w-[160px]"
            >
              Browse Platform
            </Link>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center p-1"
          >
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ========== SECTION 1: TOP OPPORTUNITIES ========== */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp size={18} className="text-gray-500" />
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                Top Opportunities
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Live Ranking</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-500 text-sm mb-8">
            Assets where the algorithm finds alignment across trend, volatility, and liquidity.
          </p>

          {/* Opportunities List */}
          <div className="border border-white/[0.06] rounded-xl overflow-hidden bg-white/[0.02]">
            {topOpportunities.map((item, index) => (
              <Link
                key={item.symbol}
                href={item.symbol === 'BTC' ? '/crypto/BTC' : `/stocks/${item.symbol}`}
                className={`flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors ${index !== topOpportunities.length - 1 ? 'border-b border-white/[0.06]' : ''
                  }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 font-mono text-xs w-6">{String(item.rank).padStart(2, '0')}</span>
                  <div>
                    <div className="font-semibold text-white">{item.symbol}</div>
                    <div className="text-xs text-gray-500">{item.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-mono ${item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
                  </span>
                  <div className={`w-12 h-9 rounded-lg border flex items-center justify-center font-bold text-sm ${item.scoreColor}`}>
                    {item.score}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* View more link */}
          <div className="mt-4 text-center">
            <Link
              href="/stocks"
              className="text-xs text-gray-500 uppercase tracking-wider hover:text-white transition-colors inline-flex items-center gap-1"
            >
              View Full Leaderboard <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== SECTION 2: ALGORITHM SPOTLIGHT ========== */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Algorithm Spotlight</p>

          <h2 className="text-2xl sm:text-3xl font-medium text-white mb-6 leading-snug">
            Zenith does not predict markets.
          </h2>

          <p className="text-gray-400 leading-relaxed mb-8 max-w-xl">
            It evaluates structure, regime, and risk using transparent data inputs.
            Every score reflects momentum, volume dynamics, and historical pattern recognition—not speculation.
          </p>

          <Link
            href="/methodology"
            className="text-sm text-gray-500 hover:text-cyan-400 transition-colors inline-flex items-center gap-2"
          >
            How Zenith Thinks <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ========== SECTION 3: HOW ZENITH THINKS (Philosophy) ========== */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Methodology</p>
          <h2 className="text-2xl sm:text-3xl font-medium text-white mb-12">How Zenith Thinks</h2>

          {/* Philosophy Cards - Keep existing style from user's image */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                <span className="text-cyan-400 text-lg">◈</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Market Strength</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Zenith isolates pure price movement from noise, measuring momentum, volume influx, and volatility compression.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <span className="text-purple-400 text-lg">◎</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Risk Awareness</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Every score is penalized for downside instability, drawdown frequency, and low liquidity events.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <span className="text-emerald-400 text-lg">↻</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Historical Truth</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Zenith does not predict blindly. Current setups are cross-referenced against 5 years of historical outcome data.
              </p>
            </div>
          </div>

          {/* Philosophy text block */}
          <div className="mt-16 pt-12 border-t border-white/[0.04]">
            <p className="text-gray-400 leading-relaxed max-w-lg">
              Markets are uncertain.<br />
              Noise is constant.<br />
              Understanding is rare.
            </p>
            <p className="text-gray-500 mt-6 leading-relaxed max-w-lg">
              ZenithScore exists to slow the user down, not push them into action.
            </p>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="py-12 px-6 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-600">
            © 2025 ZenithScore
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <Link href="/disclaimer" className="hover:text-gray-400 transition-colors">
              Financial Disclaimer & Regulatory Disclosure
            </Link>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
