'use client';

/**
 * Standalone Solana Wallet Provider
 * 
 * For pages that ONLY need Solana (no EVM).
 * Uses Phantom + Solflare only.
 * 
 * Note: WalletModalProvider removed — we use direct Phantom connection (Jupiter-style)
 */

import { useMemo, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

interface Props {
  children: ReactNode;
}

export function SolanaWalletProvider({ children }: Props) {
  // Helius RPC for production
  const endpoint = useMemo(() => {
    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (!rpc && typeof window !== 'undefined') {
      console.error('[SolanaWalletProvider] NEXT_PUBLIC_SOLANA_RPC_URL not set!');
    }
    return rpc || 'https://api.mainnet-beta.solana.com';
  }, []);

  // Phantom + Solflare only
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
