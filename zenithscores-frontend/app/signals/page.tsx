'use client';

import { SolanaWalletProvider } from '@/components/solana/SolanaWalletProvider';
import SolanaSignalsPage from '@/components/solana/SolanaSignalsPage';

/**
 * Signals Page - Solana Only
 * 
 * Edge Score analysis from Raydium + Orca.
 * NO DexScreener, NO wagmi.
 */
export default function SignalLabPage() {
  return (
    <SolanaWalletProvider>
      <SolanaSignalsPage />
    </SolanaWalletProvider>
  );
}
