'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/wagmi'
import '@/lib/web3modal'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { useMemo } from 'react'
import { WalletProvider } from '@/lib/wallet/WalletContext'
import { WalletIdentityProvider } from '@/lib/wallet-identity'
import '@solana/wallet-adapter-react-ui/styles.css'

const queryClient = new QueryClient()

/**
 * Global Providers
 * 
 * ONE WalletProvider for entire app
 * - Wagmi for EVM wallets (MetaMask, WalletConnect)
 * - Solana Wallet Adapter for Solana wallets (Phantom, Solflare)
 * - Unified WalletContext wraps both
 * - WalletIdentityProvider for auth state (replaces NextAuth session)
 * ONE source of truth for wallet state
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Solana RPC - MUST use Helius in production
  // Empty string fallback only for build time - will error at runtime if not set
  const endpoint = useMemo(() => {
    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL
    if (!rpc && typeof window !== 'undefined') {
      console.error('NEXT_PUBLIC_SOLANA_RPC_URL is not configured!')
    }
    return rpc || 'https://api.mainnet-beta.solana.com' // Build-time fallback only
  }, [])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={endpoint}>
          <SolanaWalletProvider wallets={wallets} autoConnect={false}>
            <WalletModalProvider>
              <WalletProvider>
                <WalletIdentityProvider>
                  {children}
                </WalletIdentityProvider>
              </WalletProvider>
            </WalletModalProvider>
          </SolanaWalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
