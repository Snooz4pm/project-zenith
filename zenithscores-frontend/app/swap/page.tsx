'use client';

import SwapPanel from '@/components/swap/SwapPanel';
import TokenExplorer from '@/components/swap/TokenExplorer';

export default function SwapPage() {
  return (
    <div className="container mx-auto max-w-[1400px]">
      <div className="flex flex-col lg:flex-row gap-8 px-4 py-8 lg:p-12 items-start">
        {/* LEFT: Fixed Swap Panel (Desktop) */}
        <div className="lg:w-[420px] shrink-0 sticky top-24 z-20">
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

        {/* RIGHT: Token Explorer (Scrollable) */}
        <div className="flex-1 min-w-0">
          <TokenExplorer />
        </div>
      </div>
    </div>
  );
}
