'use client';

import Link from 'next/link';
import { ArrowRight, Activity, Building2, Cpu, ShieldCheck, History } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">

      {/* HERO SECTION */}
      <div className="relative overflow-hidden border-b border-gray-900">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none" />

        <div className="container mx-auto px-6 py-32 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: Product Statement */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-500/20 text-blue-400 text-xs font-mono font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              SYSTEM STATUS: LIVE
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent">
              Live market intelligence powered by a continuously running algorithm.
            </h1>
            <p className="text-xl text-gray-400 max-w-lg leading-relaxed mb-12">
              ZenithScores evaluates stocks and crypto assets using multi-factor signals, historical outcomes, and real-time market data.
            </p>

            <div className="flex gap-4">
              <Link
                href="/stocks"
                className="px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                Stock Portal <ArrowRight size={16} />
              </Link>
              <Link
                href="/crypto"
                className="px-8 py-4 bg-gray-900 border border-gray-700 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                Crypto Portal <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Right: Abstract Visualization (CSS Animation) */}
          <div className="relative h-[400px] w-full bg-gray-900/30 rounded-3xl border border-gray-800 backdrop-blur flex items-center justify-center overflow-hidden">
            {/* Simulation of "Processing" */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="w-[300px] h-[300px] border border-blue-500/50 rounded-full animate-[spin_10s_linear_infinite]" />
              <div className="w-[200px] h-[200px] border border-purple-500/50 rounded-full absolute animate-[spin_15s_linear_infinite_reverse]" />
              <div className="w-[100px] h-[100px] border border-white/20 rounded-full absolute animate-pulse" />
            </div>
            <div className="z-10 text-center space-y-2">
              <div className="text-4xl font-mono font-bold">Scanning...</div>
              <div className="text-xs text-gray-500 font-mono">24,392 ASSETS ANALYZED IN REAL-TIME</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: HOW ZENITH THINKS */}
      <div className="container mx-auto px-6 py-24">
        <div className="mb-16">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Methodology</h2>
          <h3 className="text-3xl font-bold text-white">How Zenith Thinks</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 border border-gray-800 bg-gray-900/20 rounded-2xl hover:bg-gray-900/40 transition-colors">
            <Cpu className="w-8 h-8 text-blue-400 mb-6" />
            <h4 className="text-xl font-bold text-white mb-2">Market Strength</h4>
            <p className="text-gray-400 leading-relaxed">
              Zenith isolates pure price movement from noise, measuring momentum, volume influx, and volatility compression.
            </p>
          </div>

          <div className="p-8 border border-gray-800 bg-gray-900/20 rounded-2xl hover:bg-gray-900/40 transition-colors">
            <ShieldCheck className="w-8 h-8 text-purple-400 mb-6" />
            <h4 className="text-xl font-bold text-white mb-2">Risk Awareness</h4>
            <p className="text-gray-400 leading-relaxed">
              Every score is penalized for downside instability, drawdown frequency, and low liquidity events.
            </p>
          </div>

          <div className="p-8 border border-gray-800 bg-gray-900/20 rounded-2xl hover:bg-gray-900/40 transition-colors">
            <History className="w-8 h-8 text-green-400 mb-6" />
            <h4 className="text-xl font-bold text-white mb-2">Historical Truth</h4>
            <p className="text-gray-400 leading-relaxed">
              Zenith does not predict blindly. Current setups are cross-referenced against 5 years of historical outcome data.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-12 text-center text-gray-600 text-sm">
        <p>&copy; 2025 Zenith Scores. Institutional-Grade Intelligence.</p>
      </footer>

    </div>
  );
}
