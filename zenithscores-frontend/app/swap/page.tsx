'use client';

import { EmptyState } from '@/components/ui/EmptyState';
import WalletGate from '@/components/wallet/WalletGate';
import SwapCard from '@/components/swap/SwapCard';

export default function SwapPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Swap</h1>
      <WalletGate>
        <div className="mt-8">
          <SwapCard />
        </div>
      </WalletGate>
    </div>
  );
}
