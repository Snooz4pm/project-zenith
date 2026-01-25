'use client';

export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import SwapPanel from '@/components/swap/SwapPanel';
import SwapTokenGrid from '@/components/swap/SwapTokenGrid';
import { buildZenithTokenList, ZenithToken } from '@/lib/zenith';
import { useSwapStore } from '@/lib/store/useSwapStore';

  const [selectedToken, setSelectedToken] = useState<any | null>(null);

  return (
    <div className="min-h-screen bg-black relative">
      {/* Subtle background gradient - matching home page */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-black to-zinc-900 pointer-events-none opacity-50" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 py-8 lg:px-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT: Fixed Swap Panel */}
          <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 lg:sticky lg:top-24 z-20">
            <SwapPanel />

            {/* Helper Text */}
            <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 backdrop-blur-sm">
              <div className="flex gap-3">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <p className="text-xs text-blue-200/60 leading-relaxed">
                  Select any token from the live market feed to instantly load it into the swap terminal.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Token Grid (cards) */}
          <div className="flex-1 min-w-0 w-full">
            <SwapTokenGrid onSelectToken={setSelectedToken} />
          </div>
        </div>
      </div>
    </div>
  );
}
