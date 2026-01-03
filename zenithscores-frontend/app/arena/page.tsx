'use client';

import { useState, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { Zap, Shield, Info } from 'lucide-react';
import { WalletProvider } from '@/lib/wallet/WalletContext';
import { SwapDrawer } from '@/components/SwapDrawer';
import WalletStatus from '@/components/arena/WalletStatus';
import TokenDiscoveryFeed from '@/components/arena/TokenDiscoveryFeed';
import { DiscoveredToken } from '@/lib/arena/discovery';

// Import Solana wallet styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Token type for SwapDrawer
type SwapToken = {
  address: string;
  symbol: string;
  name: string;
  chainType?: 'SOLANA' | 'EVM';
};

// Main Arena Component - Wrapped with all wallet providers
export default function TradingArenaPage() {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <WalletProvider>
            <ArenaContent />
          </WalletProvider>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

// Unified Arena Content
function ArenaContent() {
  const [blockchain, setBlockchain] = useState<'evm' | 'solana'>('evm');
  const [selectedToken, setSelectedToken] = useState<DiscoveredToken | null>(null);
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState(false);

  // Convert DiscoveredToken to SwapDrawer token format
  const swapToken: SwapToken | null = selectedToken
    ? {
      address: selectedToken.address,
      symbol: selectedToken.symbol,
      name: selectedToken.name,
      chainType: blockchain === 'solana' ? 'SOLANA' : 'EVM',
    }
    : null;

  const handleSelectToken = (token: DiscoveredToken) => {
    setSelectedToken(token);
    setIsSwapDrawerOpen(true);
  };

  const accentColor = blockchain === 'solana' ? 'purple' : 'emerald';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0d0d12]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-${accentColor}-500/10 flex items-center justify-center`}>
                <Zap className={`w-5 h-5 text-${accentColor}-500`} />
              </div>
              <div>
                <h1 className="text-xl font-bold">Trading Arena</h1>
                <p className="text-xs text-zinc-500">
                  Non-custodial spot swaps • {blockchain === 'solana' ? 'Solana' : 'Multi-chain'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Blockchain Toggle */}
              <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
                <button
                  onClick={() => setBlockchain('evm')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${blockchain === 'evm'
                      ? 'bg-emerald-500 text-black'
                      : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  EVM
                </button>
                <button
                  onClick={() => setBlockchain('solana')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${blockchain === 'solana'
                      ? 'bg-purple-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  Solana
                </button>
              </div>

              {/* Chain Indicator */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${blockchain === 'solana' ? 'bg-purple-600/20' : 'bg-white/5'
                }`}>
                <div className={`w-2 h-2 rounded-full ${blockchain === 'solana' ? 'bg-purple-500' : 'bg-emerald-500'
                  }`} />
                <span className={`text-xs ${blockchain === 'solana' ? 'text-purple-400' : 'text-zinc-400'
                  }`}>
                  {blockchain === 'solana' ? 'Solana' : 'Multi-Chain'}
                </span>
              </div>

              {/* Non-Custodial Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                <Shield size={14} className={`text-${accentColor}-500`} />
                <span className="text-xs text-zinc-400">Non-Custodial</span>
              </div>

              {/* Wallet Status */}
              <WalletStatus targetChainId={selectedToken ? parseInt(selectedToken.chainId) : undefined} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Info Banner */}
        <div className={`mb-6 p-4 bg-${accentColor}-500/5 border border-${accentColor}-500/20 rounded-xl flex items-start gap-3`}>
          <Info className={`w-5 h-5 text-${accentColor}-500 flex-shrink-0 mt-0.5`} />
          <div>
            <h3 className={`text-sm font-semibold text-${accentColor}-500 mb-1`}>
              {blockchain === 'solana' ? 'Solana Trading Arena' : 'How Trading Arena Works'}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {blockchain === 'solana' ? (
                <>
                  ZenithScores scans Solana to surface <strong>early, undiscovered SPL tokens</strong> before they trend.
                  Click any token to see details, then execute <strong>real Jupiter swaps</strong> directly from your Phantom or Solflare wallet.
                </>
              ) : (
                <>
                  ZenithScores scans multiple chains to surface <strong>early, undiscovered tokens</strong> before they trend.
                  Click any token to see details, then execute <strong>real on-chain swaps</strong> directly from your wallet.
                </>
              )}
              {' '}Your funds remain in your custody at all times.
            </p>
          </div>
        </div>

        {/* Token Discovery Feed */}
        <TokenDiscoveryFeed
          selectedToken={selectedToken}
          onSelectToken={handleSelectToken}
        />

        {/* Supported Chains */}
        <div className="mt-6 p-4 bg-[#111116] border border-white/10 rounded-xl">
          <h4 className="text-sm font-semibold text-white mb-3">
            {blockchain === 'solana' ? 'Supported Network' : 'Supported Networks'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {blockchain === 'solana' ? (
              <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs">
                Solana Mainnet
              </span>
            ) : (
              ['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon', 'BNB Chain', 'Avalanche', 'Blast', 'Scroll'].map((network) => (
                <span
                  key={network}
                  className="px-2 py-1 bg-white/5 text-zinc-400 rounded text-xs"
                >
                  {network}
                </span>
              ))
            )}
          </div>
          <p className="text-[10px] text-zinc-600 mt-3">
            {blockchain === 'solana'
              ? 'Jupiter swaps with 1% platform fee + 0.1% referral bonus = 1.1% total'
              : 'All chains support 0x swaps with automatic fee routing to ZenithScores'
            }
          </p>
        </div>

        {/* Revenue Notice (Developer) */}
        {process.env.NODE_ENV === 'development' && (
          <div className={`mt-6 p-4 bg-${accentColor}-500/5 border border-${accentColor}-500/20 rounded-xl`}>
            <h4 className={`text-sm font-semibold text-${accentColor}-500 mb-2`}>
              🔧 Developer Mode - {blockchain === 'solana' ? 'Solana' : 'EVM'}
            </h4>
            <div className="text-xs text-zinc-400 space-y-1">
              {blockchain === 'solana' ? (
                <>
                  <p>• Solana Fee wallet: {process.env.NEXT_PUBLIC_SOLANA_FEE_WALLET || 'NOT SET'}</p>
                  <p>• Fee: 1% platform + 0.1% referral = 1.1% total (Jupiter)</p>
                  <p>• Chain: Solana Mainnet</p>
                </>
              ) : (
                <>
                  <p>• EVM Affiliate wallet: {process.env.NEXT_PUBLIC_AFFILIATE_WALLET || 'NOT SET'}</p>
                  <p>• Fee: 0.4% per swap (0x Protocol)</p>
                  <p>• Chains: All 0x-supported EVM chains</p>
                </>
              )}
              <p>• Discovery: DexScreener API (strict filtering)</p>
            </div>
          </div>
        )}
      </div>

      {/* Unified Swap Drawer */}
      <SwapDrawer
        isOpen={isSwapDrawerOpen}
        onClose={() => setIsSwapDrawerOpen(false)}
        token={swapToken}
      />
    </div>
  );
}
