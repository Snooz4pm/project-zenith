'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden font-sans selection:bg-emerald-500/30">

      {/* Subtle background gradient for depth */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-black to-zinc-900 pointer-events-none opacity-50" />

      {/* Content Container */}
      <div className="max-w-3xl w-full space-y-12 z-10 text-center sm:text-left animate-fade-in">

        {/* Brand (Minimal) */}
        <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center mx-auto sm:mx-0 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20">
          <span className="font-medium text-white text-sm">Z</span>
        </div>

        {/* Main Heading */}
        <div className="space-y-4 animate-slide-up">
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-[#EDEDED] leading-tight">
            Solana Trading Terminal
          </h1>
          <p className="text-lg text-zinc-400 font-light max-w-xl mx-auto sm:mx-0 leading-relaxed">
            Non-custodial swaps and market signals built on Solana.
            Direct execution through Jupiter. No account required.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-4">
          <Link href="/swap" className="group">
            <button className="h-12 px-6 rounded-md bg-white text-black font-medium hover:bg-zinc-200 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105">
              Launch Terminal
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-black transition-all duration-300 group-hover:translate-x-1" />
            </button>
          </Link>

          <Link href="/documentation">
            <button className="h-12 px-6 rounded-md text-zinc-400 hover:text-white transition-colors duration-300 font-medium">
              Documentation
            </button>
          </Link>
        </div>

        {/* Features (Editorial List) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-16 border-t border-white/5 animate-slide-up-delayed">
          <div className="space-y-2 group">
            <h3 className="text-white font-medium text-sm group-hover:text-emerald-400 transition-colors duration-300">Execution Engine</h3>
            <p className="text-sm text-zinc-500 leading-normal">
              Aggregated liquidity via Jupiter for best-price execution.
            </p>
          </div>
          <div className="space-y-2 group">
            <h3 className="text-white font-medium text-sm group-hover:text-emerald-400 transition-colors duration-300">Token Discovery</h3>
            <p className="text-sm text-zinc-500 leading-normal">
              Real-time market data filtered for trusted assets.
            </p>
          </div>
          <div className="space-y-2 group">
            <h3 className="text-white font-medium text-sm group-hover:text-emerald-400 transition-colors duration-300">Non-Custodial</h3>
            <p className="text-sm text-zinc-500 leading-normal">
              Your keys, your assets. Direct wallet connection.
            </p>
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
