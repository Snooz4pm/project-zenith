'use client';

import { useState } from 'react';
import { Zap, Shield, Info } from 'lucide-react';
import { useWallet } from '@/lib/wallet/WalletContext';
import ArenaGrid from '@/components/ArenaGrid';
import { SwapDrawer } from '@/components/SwapDrawer';
import { GlobalToken } from '@/lib/discovery/normalize';

/**
 * Trading Arena
 * 
 * Chain-Agnostic Token Discovery & Swapping
 * 
 * Architecture:
 * - Discovery = ALL tokens from ALL chains
 * - Wallet = Auto-detected (reads from global WalletContext)
 * - Swap = Enabled only if token.chainType === wallet.vm
 * 
 * Rules:
 * ❌ No chain selector UI
 * ❌ No per-page wallet provider
 * ❌ No "Solana Trading Arena" branding
 * ✅ Reads wallet state from global context
 * ✅ Non-custodial swaps only
 */
export default function TradingArenaPage() {
  const { wallet } = useWallet();
  const [selectedToken, setSelectedToken] = useState<GlobalToken | null>(null);
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState(false);

  const handleSelectToken = (token: GlobalToken) => {
    setSelectedToken(token);
    setIsSwapDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0d0d12]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Trading Arena</h1>
                <p className="text-xs text-zinc-500">
                  Multi-chain discovery • Non-custodial swaps
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Non-Custodial Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                <Shield size={14} className="text-emerald-500" />
                <span className="text-xs text-zinc-400">Non-Custodial</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-500 mb-1">How It Works</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Browse <strong>all tokens from all chains</strong>. Connect your wallet to enable swaps.
              You can only swap tokens that match your wallet type.
              All swaps are <strong>non-custodial</strong> - your wallet signs directly.
            </p>
          </div>
        </div>

        {/* Token Grid */}
        <ArenaGrid onSelectToken={handleSelectToken} />
      </div>

      {/* Unified Swap Drawer */}
      <SwapDrawer
        isOpen={isSwapDrawerOpen}
        onClose={() => setIsSwapDrawerOpen(false)}
        token={selectedToken}
      />
    </div>
  );
}
