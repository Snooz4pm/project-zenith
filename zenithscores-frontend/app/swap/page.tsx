import SwapCard from '@/components/swap/SwapCard';
import { TrendingSection } from '@/components/swap/TrendingSection';
import { SwapProvider } from '@/components/swap/SwapContext';

export default function SwapPage() {
  return (
    <SwapProvider>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Swap Interface (5 cols) */}
          <div className="lg:col-span-12 xl:col-span-5 order-first">
            <div className="sticky top-24">
              <SwapCard />
            </div>
          </div>

          {/* Right Column: Trending & Discovery (7 cols) */}
          <div className="lg:col-span-12 xl:col-span-7 space-y-8">
            {/* Market Stats / Trending Header could go here */}
            <TrendingSection />

            {/* Future: Recent Swaps or Signals */}
            <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-500/20">
              <h3 className="text-sm font-bold text-blue-400 mb-1">💡 Zenith Insight</h3>
              <p className="text-xs text-blue-200/70">
                Market volatility is low. Great time to accumulate major pairs.
                Connect wallet to see personalized signals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SwapProvider>
  );
}
