'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Activity, Building2, Cpu, ShieldCheck, History, Zap, TrendingUp, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';
import HeroNetworkBackground from '@/components/HeroNetworkBackground';
import PredictiveSearch from '@/components/PredictiveSearch';
import MarketPulse from '@/components/MarketPulse';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">

      {/* Network Background */}
      <HeroNetworkBackground />

      {/* HERO SECTION */}
      <div className="relative border-b border-white/5">

        <div className="container mx-auto px-6 py-32 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: Product Statement */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zenith-blue/10 border border-zenith-blue/30 text-zenith-blue text-xs font-mono font-medium mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-zenith-blue animate-pulse"></span>
              SYSTEM STATUS: LIVE
            </div>
            <h1 className="text-5xl lg:text-7xl font-heading mb-8 text-white drop-shadow-xl">
              Live Market Scores for Stocks & Crypto. <span className="text-zenith-green">Free Forever.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-lg leading-relaxed mb-12 font-sans">
              Real-time algorithmically-driven scores. No sign-up required.
            </p>

            {/* Live Search Bar - ULTRA PROMINENT */}
            <div className="mb-10 relative z-20">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-25 animate-pulse"></div>
              <Suspense fallback={<div className="w-full max-w-lg h-14 bg-gray-900 rounded-lg" />}>
                <PredictiveSearch
                  mode="all"
                  behavior="navigate"
                  placeholder="Analyze any asset (e.g. NVDA, BTC, SOXS)..."
                  className="w-full max-w-lg shadow-2xl"
                />
              </Suspense>
            </div>

            {/* TOP MOVERS LEADERBOARD (Replaces Marquee) */}
            <div className="mb-12 w-full max-w-lg bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5">
              <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={14} className="text-zenith-green" /> Top Opportunities
                </h3>
                <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE RANKING
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {/* Row 1: NVDA */}
                <Link href="/stocks/NVDA" className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-mono text-xs">01</span>
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">NVDA</div>
                      <div className="text-[10px] text-gray-500">Technology / AI</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-zenith-green">+4.2%</span>
                    <div className="w-10 h-8 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">
                      92
                    </div>
                  </div>
                </Link>

                {/* Row 2: BTC */}
                <Link href="/crypto/BTC" className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-mono text-xs">02</span>
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-orange-400 transition-colors">BTC</div>
                      <div className="text-[10px] text-gray-500">Bitcoin Network</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-zenith-green">+1.8%</span>
                    <div className="w-10 h-8 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">
                      88
                    </div>
                  </div>
                </Link>

                {/* Row 3: SOXS (Bearish Example) */}
                <Link href="/stocks/SOXS" className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-mono text-xs">03</span>
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">SOXS</div>
                      <div className="text-[10px] text-gray-500">Bear 3x Semi</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-zenith-red">-2.4%</span>
                    <div className="w-10 h-8 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-bold text-sm">
                      34
                    </div>
                  </div>
                </Link>

                <Link href="/stocks" className="block bg-white/5 py-2 text-center text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors uppercase tracking-wider">
                  View Full Leaderboard →
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/stocks"
                className="px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transform hover:-translate-y-1 duration-300"
              >
                Stock Portal <ArrowRight size={16} />
              </Link>
              <Link
                href="/crypto"
                className="px-8 py-4 glass-panel text-white font-bold rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 transform hover:-translate-y-1 duration-300"
              >
                Crypto Portal <ArrowRight size={16} />
              </Link>
              <Link
                href="/opportunity"
                className="px-8 py-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30 text-white font-bold rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] transform hover:-translate-y-1 duration-300 group"
              >
                <Zap size={16} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                Ecommerce Opps
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/news"
                className="px-8 py-4 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border border-emerald-500/30 text-white font-bold rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transform hover:-translate-y-1 duration-300 group"
              >
                <Newspaper size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                News Signal
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Right: Abstract Visualization (Radar Scanner) */}
          <div className="relative h-[400px] w-full glass-panel rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl z-10">

            {/* Radar Conic Gradient (The Sweep) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[800px] h-[800px] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(41,121,255,0.3)_360deg)] animate-[spin_3s_linear_infinite] rounded-full opacity-50" />
            </div>

            {/* Static Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[150px] h-[150px] border border-zenith-blue/20 rounded-full" />
              <div className="w-[280px] h-[280px] border border-zenith-blue/10 rounded-full absolute" />
              <div className="w-[410px] h-[410px] border border-zenith-blue/5 rounded-full absolute" />
              <div className="w-[540px] h-[540px] border border-zenith-blue/5 rounded-full absolute" />
              {/* Crosshairs */}
              <div className="absolute w-full h-[1px] bg-zenith-blue/10" />
              <div className="absolute h-full w-[1px] bg-zenith-blue/10" />
            </div>

            {/* Active TARGET Blips */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
              className="absolute top-1/4 left-1/3 w-3 h-3 bg-zenith-red rounded-full shadow-[0_0_15px_var(--zenith-red)]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-zenith-green rounded-full shadow-[0_0_15px_var(--zenith-green)]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.2 }}
              className="absolute top-1/2 right-1/3 w-2 h-2 bg-zenith-blue rounded-full shadow-[0_0_15px_var(--zenith-blue)]"
            />

            {/* Center Text */}
            <div className="z-10 text-center space-y-2 bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-2xl">
              <div className="text-4xl font-mono font-bold tracking-tighter text-white drop-shadow-lg flex items-center justify-center gap-1">
                Scanning<span className="animate-pulse">...</span>
              </div>
              <div className="text-[10px] text-zenith-blue font-mono tracking-[0.2em] uppercase">
                24,392 Assets Analyzed Real-Time
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1.2: FEATURED DEEP DIVE */}
      <div className="container mx-auto px-6 mb-24 relative z-10">
        <div className="glass-panel p-[1px] rounded-2xl bg-gradient-to-br from-white/10 to-transparent">
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden">

            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Left: Ticker & Score */}
            <div className="flex-1 text-center lg:text-left relative z-10">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                <span className="px-3 py-1 rounded-full bg-zenith-green/10 text-zenith-green text-xs font-bold border border-zenith-green/20 uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <Zap size={12} className="inline mr-1 mb-0.5 " /> Algo Spotlight
                </span>
                <span className="text-gray-500 text-[10px] font-mono border-l border-white/10 pl-3">DETECTED 4M AGO</span>
              </div>

              <h2 className="text-6xl md:text-7xl font-bold text-white mb-2 tracking-tight">NVDA</h2>
              <p className="text-xl md:text-2xl text-gray-400 mb-8 font-light">Nvidia Corporation <span className="text-gray-600 mx-2">•</span> AI Hardware</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 max-w-sm mx-auto lg:mx-0">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                  <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Momentum</div>
                  <div className="text-white font-bold text-lg">Extremely High</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                  <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Volume Inflow</div>
                  <div className="text-zenith-green font-bold text-lg">+240% <span className="text-xs font-normal text-gray-500">vs Avg</span></div>
                </div>
              </div>

              <Link href="/stocks/NVDA" className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-blue-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] transform hover:-translate-y-1">
                Unlock Full Analysis
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform text-blue-600" />
              </Link>
            </div>

            {/* Right: Visual Score/Chart Tease */}
            <div className="flex-1 w-full max-w-md relative z-10">
              <div className="relative glass-panel rounded-2xl p-8 border border-white/10 flex flex-col items-center bg-black/40 shadow-2xl">
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-white/5 pb-4 w-full text-center">Live Zenith Score</div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-zenith-green/20 blur-3xl rounded-full animate-pulse" />
                  <div className="text-9xl font-black text-white tracking-tighter drop-shadow-2xl relative z-10">
                    92
                  </div>
                </div>

                <div className="text-zenith-green font-bold text-xl mb-8 flex items-center gap-2 bg-green-900/20 px-4 py-2 rounded-lg border border-green-500/20">
                  <TrendingUp size={24} /> Strong Accumulation
                </div>

                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '92%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-green-600 to-zenith-green shadow-[0_0_20px_#10B981]"
                  />
                </div>
                <div className="flex justify-between w-full text-[10px] text-gray-500 font-mono mt-2 uppercase">
                  <span>Bearish</span>
                  <span>Neutral</span>
                  <span className="text-white font-bold">Bullish</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1.5: MARKET PULSE & FORECAST */}
      <MarketPulse />

      {/* SECTION 2: HOW ZENITH THINKS */}
      <div className="container mx-auto px-6 py-24 relative z-10">
        <div className="mb-16">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 font-mono">Methodology</h2>
          <h3 className="text-3xl font-bold text-white font-sans">How Zenith Thinks</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 glass-panel glass-panel-hover rounded-2xl group cursor-default">
            <Cpu className="w-8 h-8 text-zenith-blue mb-6 group-hover:scale-110 transition-transform duration-300" />
            <h4 className="text-xl font-bold text-white mb-2 font-sans">Market Strength</h4>
            <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
              Zenith isolates pure price movement from noise, measuring momentum, volume influx, and volatility compression.
            </p>
          </div>

          <div className="p-8 glass-panel glass-panel-hover rounded-2xl group cursor-default">
            <ShieldCheck className="w-8 h-8 text-purple-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
            <h4 className="text-xl font-bold text-white mb-2 font-sans">Risk Awareness</h4>
            <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
              Every score is penalized for downside instability, drawdown frequency, and low liquidity events.
            </p>
          </div>

          <div className="p-8 glass-panel glass-panel-hover rounded-2xl group cursor-default">
            <History className="w-8 h-8 text-zenith-green mb-6 group-hover:scale-110 transition-transform duration-300" />
            <h4 className="text-xl font-bold text-white mb-2 font-sans">Historical Truth</h4>
            <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
              Zenith does not predict blindly. Current setups are cross-referenced against 5 years of historical outcome data.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-gray-600 text-sm relative z-10 glass-panel">
        <p className="font-mono">&copy; 2025 Zenith Scores. Institutional-Grade Intelligence.</p>
      </footer>

    </div>
  );
}
