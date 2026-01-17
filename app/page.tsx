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

        {/* Atlas Protocol (Technical Deep-Dive) */}
        <div className="pt-24 space-y-8 animate-slide-up-delayed">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] font-mono">Atlas_Protocol_014</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-medium text-white leading-tight">
                The 14-Pillar <span className="text-cyan-400 italic">Physics Engine</span>
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                Atlas isn't just a dashboard—it's a continuous analytical tick.
                Our simulation core filters the broad market through 14 distinct pillars of risk, liquidity, and momentum to identify high-conviction gems with zero hindsight bias.
              </p>
              <div className="flex gap-6 pt-2">
                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Execution</div>
                  <div className="text-white font-mono text-xs">JUP_V6_PROXY</div>
                </div>
                <div className="space-y-1 border-l border-white/10 pl-6">
                  <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Model</div>
                  <div className="text-white font-mono text-xs">NON_CUSTODIAL</div>
                </div>
              </div>
            </div>

            {/* Visual Data Flow Diagram */}
            <div className="relative group overflow-hidden">
              <div className="absolute inset-0 bg-cyan-500/5 rounded-xl blur-3xl group-hover:bg-cyan-500/10 transition-colors" />
              <div className="border border-white/5 bg-white/[0.02] rounded-xl p-8 backdrop-blur-sm relative font-mono text-[10px] space-y-4">
                <div className="flex justify-between items-center text-zinc-500 border-b border-white/5 pb-2">
                  <span className="uppercase tracking-widest">System_Data_Flow</span>
                  <span className="text-cyan-500/50">ARCH_V1.0.4</span>
                </div>

                <div className="space-y-6 pt-2">
                  {/* Step 1 */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 py-2 border border-white/10 rounded flex items-center justify-center text-zinc-400">MARKET</div>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-cyan-500/50 relative">
                      <div className="absolute right-0 -top-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                    </div>
                    <div className="w-20 py-2 border border-cyan-500/30 bg-cyan-500/5 rounded flex items-center justify-center text-cyan-400">MERGER</div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1" />
                    <div className="w-px h-8 bg-gradient-to-b from-cyan-500/50 to-emerald-500/50" />
                    <div className="flex-1" />
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-center gap-4">
                    <div className="w-full py-3 border border-emerald-500/30 bg-emerald-500/5 rounded flex flex-col items-center justify-center text-emerald-400 gap-1">
                      <span className="font-black">PHYSICS_ENGINE</span>
                      <span className="text-[8px] opacity-70">14-PILLAR_ANALYSIS_LOOP</span>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/50 to-white/10" />
                    <div className="w-20 py-2 border border-white/10 rounded flex items-center justify-center text-zinc-400">EXECUTION</div>
                  </div>
                </div>
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
