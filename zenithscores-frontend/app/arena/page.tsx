'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Zap, Shield, Wallet, Info } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import SwapPanel from '@/components/arena/SwapPanel';
import TokenDiscoveryFeed from '@/components/arena/TokenDiscoveryFeed';
import { DiscoveredToken } from '@/lib/arena/discovery';
import { getChainConfig } from '@/lib/arena/chains';

export default function TradingArenaPage() {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useWeb3Modal();

  const [selectedToken, setSelectedToken] = useState<DiscoveredToken | null>(null);

  const chain = chainId ? getChainConfig(chainId) : null;

  const handleConnect = () => {
    open();
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
                <p className="text-xs text-zinc-500">Non-custodial spot swaps • Multi-chain</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Chain Indicator */}
              {isConnected && chain && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-zinc-400">{chain.name}</span>
                </div>
              )}

              {/* Non-Custodial Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                <Shield size={14} className="text-emerald-500" />
                <span className="text-xs text-zinc-400">Non-Custodial</span>
              </div>

              {/* Wallet Status */}
              {isConnected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10">
                  <Wallet size={14} className="text-emerald-500" />
                  <span className="text-xs text-emerald-500">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-lg transition-colors"
                >
                  Connect Wallet
                </button>
              )}
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
            <h3 className="text-sm font-semibold text-blue-500 mb-1">How Trading Arena Works</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              ZenithScores scans multiple chains to surface <strong>early, undiscovered tokens</strong> before they trend.
              Click any token to see details, then execute <strong>real on-chain swaps</strong> directly from your wallet.
              Your funds remain in your custody at all times. Swaps are powered by 0x Protocol across Ethereum, Base, Arbitrum,
              and more.
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Discovery Feed (2/3) */}
          <div className="lg:col-span-2">
            <TokenDiscoveryFeed
              selectedToken={selectedToken}
              onSelectToken={setSelectedToken}
            />

            {/* Supported Chains */}
            <div className="mt-6 p-4 bg-[#111116] border border-white/10 rounded-xl">
              <h4 className="text-sm font-semibold text-white mb-3">Supported Networks</h4>
              <div className="flex flex-wrap gap-2">
                {['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon', 'BNB Chain', 'Avalanche', 'Blast', 'Scroll'].map((network) => (
                  <span
                    key={network}
                    className="px-2 py-1 bg-white/5 text-zinc-400 rounded text-xs"
                  >
                    {network}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-zinc-600 mt-3">
                All chains support 0x swaps with automatic fee routing to ZenithScores
              </p>
            </div>
          </div>

          {/* Right: Swap Panel (1/3) */}
          <div>
            <SwapPanel
              selectedToken={selectedToken}
              onSwapComplete={() => {
                console.log('Swap completed!');
              }}
            />

            {/* How Fees Work */}
            <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-emerald-500 font-medium">Platform Fee: 0.4%</span>
              </div>
              <p className="text-xs text-zinc-500">
                A small fee on each swap helps us maintain the discovery engine and multi-chain infrastructure.
                Fees are automatically included in quotes.
              </p>
            </div>

            {/* Disclaimer */}
            <div className="mt-4 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
              <p className="text-xs text-yellow-500/80 leading-relaxed">
                <strong>⚠️ High Risk:</strong> Early tokens are extremely volatile. Only trade what you can afford to lose.
                Early activity does not guarantee continuation. DYOR.
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Notice (Developer) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
            <h4 className="text-sm font-semibold text-purple-500 mb-2">🔧 Developer Mode</h4>
            <div className="text-xs text-zinc-400 space-y-1">
              <p>• Affiliate wallet: {process.env.NEXT_PUBLIC_AFFILIATE_WALLET || 'NOT SET'}</p>
              <p>• Fee: 0.4% per swap</p>
              <p>• Chains: All 0x-supported EVM chains</p>
              <p>• Discovery: DexScreener API (strict filtering)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
