'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { Zap, Shield, Wallet, Info } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import SwapPanel from '@/components/arena/SwapPanel';
import SolanaSwapPanel from '@/components/arena/SolanaSwapPanel';
import TokenDiscoveryFeed from '@/components/arena/TokenDiscoveryFeed';
import { DiscoveredToken } from '@/lib/arena/discovery';
import { getChainConfig } from '@/lib/arena/chains';

// Import Solana wallet styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Solana Wallet Configuration
function SolanaWalletWrapper({ children }: { children: React.ReactNode }) {
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
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function ArenaContent() {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useWeb3Modal();

  const [selectedToken, setSelectedToken] = useState<DiscoveredToken | null>(null);
  const [blockchain, setBlockchain] = useState<'evm' | 'solana'>('evm');

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
              {/* Blockchain Toggle */}
              <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
                <button
                  onClick={() => setBlockchain('evm')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    blockchain === 'evm'
                      ? 'bg-emerald-500 text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  EVM
                </button>
                <button
                  onClick={() => setBlockchain('solana')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    blockchain === 'solana'
                      ? 'bg-purple-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Solana
                </button>
              </div>

              {/* Chain Indicator */}
              {blockchain === 'evm' && isConnected && chain && (
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
              Your funds remain in your custody at all times. {blockchain === 'evm' ? 'Swaps are powered by 0x Protocol across Ethereum, Base, Arbitrum, and more.' : 'Swaps are powered by Jupiter on Solana with 1.1% total fee per swap.'}
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
                {blockchain === 'evm' ? (
                  <>
                    {['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon', 'BNB Chain', 'Avalanche', 'Blast', 'Scroll'].map((network) => (
                      <span
                        key={network}
                        className="px-2 py-1 bg-white/5 text-zinc-400 rounded text-xs"
                      >
                        {network}
                      </span>
                    ))}
                  </>
                ) : (
                  <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs">
                    Solana Mainnet
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-600 mt-3">
                {blockchain === 'evm'
                  ? 'All chains support 0x swaps with automatic fee routing to ZenithScores'
                  : 'Jupiter swaps with 1% platform fee + 0.1% referral bonus'}
              </p>
            </div>
          </div>

          {/* Right: Swap Panel (1/3) */}
          <div>
            {blockchain === 'evm' ? (
              <SwapPanel
                selectedToken={selectedToken}
                onSwapComplete={() => {
                  console.log('EVM Swap completed!');
                }}
              />
            ) : (
              <SolanaSwapPanel
                selectedToken={
                  selectedToken
                    ? {
                        symbol: selectedToken.symbol,
                        mint: selectedToken.address,
                        decimals: 9, // Default, would need to fetch actual decimals
                        name: selectedToken.metadata?.name,
                        logo: selectedToken.metadata?.logo,
                      }
                    : null
                }
                onSwapComplete={() => {
                  console.log('Solana Swap completed!');
                }}
              />
            )}

            {/* How Fees Work */}
            <div className={`mt-4 p-4 ${blockchain === 'evm' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-purple-600/5 border-purple-600/20'} border rounded-lg`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${blockchain === 'evm' ? 'bg-emerald-500' : 'bg-purple-600'}`} />
                <span className={`text-sm ${blockchain === 'evm' ? 'text-emerald-500' : 'text-purple-400'} font-medium`}>
                  Platform Fee: {blockchain === 'evm' ? '0.4%' : '1.0% + 0.1% referral'}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                {blockchain === 'evm'
                  ? 'A small fee on each swap helps us maintain the discovery engine and multi-chain infrastructure. Fees are automatically included in quotes.'
                  : 'Jupiter charges 1% platform fee + 0.1% automatic referral bonus. This is 2.75x MORE than EVM chains! Fees are automatically included in quotes.'}
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
              {blockchain === 'evm' ? (
                <>
                  <p>• EVM Affiliate wallet: {process.env.NEXT_PUBLIC_AFFILIATE_WALLET || 'NOT SET'}</p>
                  <p>• Fee: 0.4% per swap (0x Protocol)</p>
                  <p>• Chains: All 0x-supported EVM chains</p>
                </>
              ) : (
                <>
                  <p>• Solana Fee wallet: {process.env.NEXT_PUBLIC_SOLANA_FEE_WALLET || 'NOT SET'}</p>
                  <p>• Fee: 1% platform + 0.1% referral = 1.1% total (Jupiter)</p>
                  <p>• Chain: Solana Mainnet</p>
                </>
              )}
              <p>• Discovery: DexScreener API (strict filtering)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap with Solana wallet provider
export default function TradingArenaPage() {
  return (
    <SolanaWalletWrapper>
      <ArenaContent />
    </SolanaWalletWrapper>
  );
}
