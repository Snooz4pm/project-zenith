'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">

      {/* Content Container */}
      <div className="max-w-3xl w-full space-y-10 z-10 text-center sm:text-left">

        {/* Brand (Minimal) */}
        <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
          <span className="font-medium text-white text-sm">Z</span>
        </div>

        {/* Main Heading */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-[#EDEDED] leading-tight">
            Solana Trading Terminal
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 font-light max-w-xl mx-auto sm:mx-0 leading-relaxed">
            Non-custodial swaps and market signals built on Solana.
            Direct execution through Jupiter. No account required.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-4">
          <Link href="/swap" className="group">
            <button className="h-12 px-6 rounded-md bg-white text-black font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2">
              Launch Terminal
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-black transition-colors" />
            </button>
          </Link>

          <Link href="/about">
            <button className="h-12 px-6 rounded-md text-zinc-400 hover:text-white transition-colors font-medium">
              Documentation
            </button>
          </Link>
        </div>

        {/* Features (Editorial List) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-16 border-t border-white/5">
          <div className="space-y-2">
            <h3 className="text-white font-medium text-sm">Execution Engine</h3>
            <p className="text-sm text-zinc-500 leading-normal">
              Aggregated liquidity via Jupiter for best-price execution.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-medium text-sm">Token Discovery</h3>
            <p className="text-sm text-zinc-500 leading-normal">
              Real-time market data filtered for trusted assets.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-medium text-sm">Non-Custodial</h3>
            <p className="text-sm text-zinc-500 leading-normal">
              Your keys, your assets. Direct wallet connection.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
