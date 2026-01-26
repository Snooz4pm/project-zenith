'use client';

export const dynamic = "force-dynamic";

import Link from 'next/link';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-black to-zinc-900 pointer-events-none opacity-60 animate-fade-in" />

      {/* Content Container */}
      <div className="max-w-4xl w-full space-y-16 z-10 text-center sm:text-left animate-fade-in">
        {/* Brand */}
        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center mx-auto sm:mx-0 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20 animate-bounce">
          <span className="font-bold text-white text-lg tracking-widest">Z</span>
        </div>

        {/* Hero Section */}
        <div className="space-y-4 animate-slide-up">
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-[#EDEDED] leading-tight drop-shadow-xl">
            ZenithScore: Solana Intelligence Terminal
          </h1>
          <p className="text-lg text-zinc-400 font-light max-w-2xl mx-auto sm:mx-0 leading-relaxed">
            Non-custodial swaps, live market signals, and advanced analytics for Solana. Powered by Atlas and Argus engines.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-4">
          <Link href="/swap" className="group">
            <button className="h-12 px-8 rounded-lg bg-white text-black font-bold hover:bg-zinc-200 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 animate-pulse">
              Launch Terminal
              <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-black transition-all duration-300 group-hover:translate-x-1" />
            </button>
          </Link>
          <Link href="/documentation">
            <button className="h-12 px-8 rounded-lg text-zinc-400 hover:text-white transition-colors duration-300 font-bold">
              Documentation
            </button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-16 animate-slide-up-delayed">
          {/* Atlas Feature */}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-8 flex flex-col items-center gap-4 shadow-lg hover:shadow-cyan-500/20 transition-all animate-fade-in">
            <h2 className="text-xl font-black text-cyan-400 uppercase tracking-widest font-mono">Atlas Engine</h2>
            <p className="text-zinc-300 text-sm text-center">Continuous market analysis using 14 pillars of risk, liquidity, and momentum. No hindsight bias—just real-time insight.</p>
            <Link href="/atlas" className="text-cyan-400 hover:underline text-xs font-mono">Explore Atlas</Link>
          </div>
          {/* Argus Feature */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 flex flex-col items-center gap-4 shadow-lg hover:shadow-emerald-500/20 transition-all animate-fade-in">
            <h2 className="text-xl font-black text-emerald-400 uppercase tracking-widest font-mono">Argus Cockpit</h2>
            <p className="text-zinc-300 text-sm text-center">Token intelligence, reality analysis, and wallet exposures. See the market as it is, not as it was.</p>
            <Link href="/argus" className="text-emerald-400 hover:underline text-xs font-mono">Explore Argus</Link>
          </div>
        </div>

        {/* Animated Data Flow */}
        <div className="pt-20 animate-slide-up-delayed">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] font-mono">System Data Flow</h2>
          </div>
          <div className="border border-white/5 bg-white/[0.02] rounded-xl p-8 backdrop-blur-sm relative font-mono text-[10px] space-y-4">
            <div className="flex justify-between items-center text-zinc-500 border-b border-white/5 pb-2">
              <span className="uppercase tracking-widest">MARKET</span>
              <span className="text-cyan-500/50">ARCH_V1.0.4</span>
            </div>
            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-4">
                <div className="w-20 py-2 border border-white/10 rounded flex items-center justify-center text-zinc-400">MARKET</div>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-cyan-500/50 relative">
                  <div className="absolute right-0 -top-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                </div>
                <div className="w-20 py-2 border border-cyan-500/30 bg-cyan-500/5 rounded flex items-center justify-center text-cyan-400">MERGER</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1" />
                <div className="w-px h-8 bg-gradient-to-b from-cyan-500/50 to-emerald-500/50" />
                <div className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-full py-3 border border-emerald-500/30 bg-emerald-500/5 rounded flex flex-col items-center justify-center text-emerald-400 gap-1">
                  <span className="font-black">PHYSICS_ENGINE</span>
                  <span className="text-[8px] opacity-70">14-PILLAR_ANALYSIS_LOOP</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/50 to-white/10" />
                <div className="w-20 py-2 border border-white/10 rounded flex items-center justify-center text-zinc-400">EXECUTION</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.2s both;
        }
        .animate-slide-up-delayed {
          animation: slide-up 0.6s ease-out 0.4s both;
        }
      `}</style>
    </div>
  );
}
  );
}
