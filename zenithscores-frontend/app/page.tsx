'use client';

import Link from 'next/link';
import { ArrowRight, Activity, Building2, Cpu, ShieldCheck, History } from 'lucide-react';
import { motion } from 'framer-motion';
import HeroNetworkBackground from '@/components/HeroNetworkBackground';

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

            {/* Live Search Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const query = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
                if (query) {
                  window.location.href = `/crypto/${query.toUpperCase()}`;
                }
              }}
              className="relative max-w-md w-full mb-8"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                name="search"
                type="text"
                className="block w-full pl-10 pr-3 py-4 border border-transparent rounded-lg leading-5 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:bg-white/20 focus:border-blue-500 transition-colors sm:text-sm backdrop-blur-md"
                placeholder="Search by Ticker (e.g., AAPL, BTC)..."
              />
            </form>

            {/* Live Ticker */}
            <div className="mb-10 overflow-hidden relative w-full max-w-lg">
              <div className="flex animate-marquee whitespace-nowrap gap-8 text-sm font-mono-premium text-gray-400">
                <span className="flex items-center gap-2">AAPL <span className="text-zenith-green font-bold text-lg">82</span></span>
                <span className="flex items-center gap-2">BTC <span className="text-zenith-yellow font-bold text-lg">76</span></span>
                <span className="flex items-center gap-2">TSLA <span className="text-zenith-red font-bold text-lg">64</span></span>
                <span className="flex items-center gap-2">NVDA <span className="text-zenith-green font-bold text-lg">88</span></span>
                <span className="flex items-center gap-2">ETH <span className="text-zenith-yellow font-bold text-lg">71</span></span>
                {/* Duplicate for seamless loop */}
                <span className="flex items-center gap-2">AAPL <span className="text-zenith-green font-bold text-lg">82</span></span>
                <span className="flex items-center gap-2">BTC <span className="text-zenith-yellow font-bold text-lg">76</span></span>
              </div>
              <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-black to-transparent pointer-events-none" />
            </div>

            <div className="flex gap-4">
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
