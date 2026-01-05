'use client';

import { SolanaWalletProvider } from '@/components/solana/SolanaWalletProvider';
import SolanaTerminalPage from '@/components/solana/SolanaTerminalPage';

/**
 * Terminal Page - Solana Only
 * 
 * Trending tokens from Raydium + Orca.
 * NO DexScreener, NO wagmi.
 */
export default function TerminalPage() {
  return (
    <SolanaWalletProvider>
      <SolanaTerminalPage />
    </SolanaWalletProvider>
  );
}
