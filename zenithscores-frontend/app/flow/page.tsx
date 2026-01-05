'use client';

import { SolanaWalletProvider } from '@/components/solana/SolanaWalletProvider';
import SolanaFlowPage from '@/components/solana/SolanaFlowPage';

/**
 * Flow Page - Solana Only
 * 
 * Uses Raydium + Orca for token discovery.
 * NO DexScreener, NO wagmi.
 */
export default function FlowPage() {
  return (
    <SolanaWalletProvider>
      <SolanaFlowPage />
    </SolanaWalletProvider>
  );
}
