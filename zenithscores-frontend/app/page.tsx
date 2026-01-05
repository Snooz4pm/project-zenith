'use client';

import Link from 'next/link';
import { ArrowRight, Terminal } from 'lucide-react';
import { TrendingSection } from '@/components/swap/TrendingSection';
import { SwapProvider } from '@/components/swap/SwapContext';

export default function Home() {
  return (
    <SwapProvider>
      <div className="min-h-screen bg-black flex flex-col relative overflow-hidden font-sans text-[#EDEDED] selection:bg-teal-500/30">

        {/* Subtle Background Glows (Grok-inspired) */}
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl w-full mx-auto px-6 sm:px-12 py-12 z-10 flex-grow flex flex-col justify-center">

          {/* Hero Section */}
          <div className="max-w-4xl space-y-8 mb-20">
            {/* Brand Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-mono text-zinc-400 tracking-wider">ZENITH TERMINAL V2.0</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-medium tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              Solana Trading <br /> Intelligence.
            </h1>

            <p className="text-lg sm:text-xl text-zinc-500 font-light max-w-xl leading-relaxed">
              Non-custodial execution engine. Real-time market signals.
              <span className="text-zinc-300"> No account required.</span>
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-4">
              {/* Alive CTA Button */}
              <Link href="/swap" className="group">
                <button className="cta-button relative px-8 py-4 rounded-xl text-black font-bold bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-300 hover:to-blue-400 transition-all duration-300 ease-out transform hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] active:scale-[0.98] flex items-center gap-2 overflow-hidden">
                  <span className="relative z-10">Launch Terminal</span>
                  <ArrowRight className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  {/* Ripple/Sheen effect layer could go here */}
                </button>
              </Link>

              <Link href="/documentation" className="text-zinc-500 hover:text-white transition-colors text-sm font-medium flex items-center gap-2 group">
                <Terminal className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300" />
                Documentation
              </Link>
            </div>
          </div>

          {/* Swap Panel Preview Section */}
          <section className="mt-12 p-1 border border-white/10 rounded-2xl bg-zinc-900/20 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/50">
            <div className="bg-black/40 p-6 sm:p-8 rounded-xl">
              <div className="flex flex-col lg:flex-row gap-12">

                {/* Left: Visual Swap Mock */}
                <div className="w-full lg:w-1/3 space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-medium text-white">Instant Swap</h2>
                    <p className="text-sm text-zinc-500">Best-price routing via Jupiter.</p>
                  </div>

                  <div className="bg-zinc-900/80 border border-white/5 p-5 rounded-xl space-y-4 pointer-events-none opacity-80 select-none">
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 font-medium ml-1">Sell</label>
                      <div className="bg-black border border-white/10 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-zinc-300 font-mono">10.0</span>
                        <div className="bg-zinc-800 px-2 py-1 rounded text-xs text-white">SOL</div>
                      </div>
                    </div>
                    <div className="flex justify-center -my-2 relative z-10">
                      <div className="bg-zinc-800 p-1.5 rounded-full border border-black"><ArrowRight className="w-3 h-3 text-zinc-500 rotate-90" /></div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 font-medium ml-1">Buy</label>
                      <div className="bg-black border border-white/10 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-zinc-300 font-mono">1,420.69</span>
                        <div className="bg-zinc-800 px-2 py-1 rounded text-xs text-white">USDC</div>
                      </div>
                    </div>
                  </div>

                  <Link href="/swap" className="block">
                    <button className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors border border-white/5 text-sm">
                      Open Full Interface
                    </button>
                  </Link>
                </div>

                {/* Right: Real Trending Data */}
                <div className="w-full lg:w-2/3">
                  <div className="mb-6">
                    <h2 className="text-2xl font-medium text-white">Live Market Data</h2>
                    <p className="text-sm text-zinc-500">Top performers filtered by Trust Engine.</p>
                  </div>
                  {/* We limit height and hide overflow to keep it compact on home */}
                  <div className="relative h-[400px] overflow-hidden -mr-4 pr-4 custom-scrollbar overflow-y-auto mask-linear-fade">
                    <TrendingSection />
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </SwapProvider>
  );
}

