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

import { SOLANA_RPC_URL } from '@/lib/solana/connection';

export function SolanaWalletProvider({ children }: Props) {
  // Helius RPC for production

  const endpoint = useMemo(() => {
    return SOLANA_RPC_URL;
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
