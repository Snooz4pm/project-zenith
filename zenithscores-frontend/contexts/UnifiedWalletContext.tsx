'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { ChainType } from '@/lib/swap/types';

/**
 * Unified Wallet Context
 *
 * Auto-detects chain type (SOLANA | EVM) based on connected wallet
 * Provides unified interface for both wallet types
 *
 * NO MANUAL CHAIN SELECTION - fully automatic
 */

interface UnifiedWalletState {
  // Connection state
  isConnected: boolean;
  chainType: ChainType | null;

  // Addresses
  address: string | null;
  evmAddress: string | null; // Always available if EVM wallet connected
  solanaAddress: string | null; // Always available if Solana wallet connected

  // Chain info (EVM only)
  evmChainId: number | null;

  // Helpers
  needsNetworkSwitch: (targetChainId?: number) => boolean;
  isCorrectNetwork: (targetChainId?: number) => boolean;
}

const UnifiedWalletContext = createContext<UnifiedWalletState | undefined>(undefined);

export function UnifiedWalletProvider({ children }: { children: ReactNode }) {
  // EVM wallet state
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const evmChainId = useChainId();

  // Solana wallet state
  const { publicKey, connected: solanaConnected } = useWallet();
  const solanaAddress = publicKey?.toBase58() || null;

  // Auto-detect chain type
  const chainType: ChainType | null = useMemo(() => {
    if (solanaConnected && solanaAddress) return 'SOLANA';
    if (evmConnected && evmAddress) return 'EVM';
    return null;
  }, [solanaConnected, solanaAddress, evmConnected, evmAddress]);

  // Unified connection state
  const isConnected = chainType !== null;

  // Unified address
  const address = chainType === 'SOLANA' ? solanaAddress : evmAddress || null;

  // Network helpers (EVM only)
  const needsNetworkSwitch = (targetChainId?: number) => {
    if (chainType !== 'EVM' || !targetChainId) return false;
    return evmChainId !== targetChainId;
  };

  const isCorrectNetwork = (targetChainId?: number) => {
    if (chainType !== 'EVM' || !targetChainId) return true;
    return evmChainId === targetChainId;
  };

  const value: UnifiedWalletState = {
    isConnected,
    chainType,
    address,
    evmAddress: evmAddress || null,
    solanaAddress,
    evmChainId: evmChainId || null,
    needsNetworkSwitch,
    isCorrectNetwork,
  };

  return (
    <UnifiedWalletContext.Provider value={value}>
      {children}
    </UnifiedWalletContext.Provider>
  );
}

export function useUnifiedWallet() {
  const context = useContext(UnifiedWalletContext);
  if (context === undefined) {
    throw new Error('useUnifiedWallet must be used within UnifiedWalletProvider');
  }
  return context;
}
