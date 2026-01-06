'use client';

import { useState, useEffect } from 'react';
import SwapPanel from '@/components/swap/SwapPanel';
import { SimpleTokenGrid } from '@/components/swap/SimpleTokenGrid';
import { buildZenithTokenList, ZenithToken } from '@/lib/zenith';
import { useSwapStore } from '@/lib/store/useSwapStore';

export default function SwapPage() {
  const [tokens, setTokens] = useState<ZenithToken[]>([]);
  const { setIntent } = useSwapStore();

  useEffect(() => {
    buildZenithTokenList().then(setTokens).catch(console.error);
  }, []);

  const handleSelect = (t: ZenithToken) => {
    setIntent({
      toToken: {
        symbol: t.symbol,
        address: t.mint,
        decimals: t.decimals,
        logoURI: t.logoURI
      },
      source: 'card'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 py-8 lg:px-8 lg:py-12">
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

          {/* RIGHT: Token Grid (3 cols × 8 rows) */}
          <div className="flex-1 min-w-0 w-full">
            <SimpleTokenGrid tokens={tokens} onSelect={handleSelect} />
          </div>
        </div>
      </div>
    </div>
  );
}
