'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAccount, useConnect, useSendTransaction, useChainId } from 'wagmi';
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { ChainType } from '@/lib/swap/types';

/**
 * Unified Wallet Context
 *
 * Single interface for BOTH Solana and EVM wallets
 * NO manual chain selection - auto-detects based on connected wallet
 */

interface WalletContextValue {
  // Connection state
  address: string | null;
  chainType: ChainType | null;
  isConnected: boolean;

  // Actions
  connect: () => void;
  disconnect: () => void;
  signAndSendTx: (txPayload: any) => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  // EVM wallet
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { connect: evmConnect, connectors } = useConnect();
  const { sendTransactionAsync: sendEvmTx } = useSendTransaction();
  const evmChainId = useChainId();

  // Solana wallet
  const {
    publicKey,
    connected: solanaConnected,
    connect: solanaConnect,
    disconnect: solanaDisconnect,
    sendTransaction: sendSolanaTx,
  } = useSolanaWallet();
  const { connection } = useConnection();

  const solanaAddress = publicKey?.toBase58() || null;

  // Auto-detect chain type
  const chainType: ChainType | null =
    solanaConnected && solanaAddress ? 'SOLANA' :
    evmConnected && evmAddress ? 'EVM' :
    null;

  const address = chainType === 'SOLANA' ? solanaAddress : evmAddress || null;
  const isConnected = chainType !== null;

  // Unified connect
  const connect = () => {
    if (!isConnected) {
      // Try EVM first (MetaMask is more common)
      const connector = connectors[0];
      if (connector) {
        evmConnect({ connector });
      }
    }
  };

  // Unified disconnect
  const disconnect = () => {
    if (chainType === 'SOLANA') {
      solanaDisconnect();
    }
    // EVM disconnect handled by wagmi
  };

  // Unified transaction signing
  const signAndSendTx = async (txPayload: any): Promise<string> => {
    if (chainType === 'SOLANA') {
      // Solana transaction
      const txBuffer = Buffer.from(txPayload.data, 'base64');
      const transaction = VersionedTransaction.deserialize(txBuffer);

      if (!sendSolanaTx) throw new Error('Solana wallet not connected');

      const signature = await sendSolanaTx(transaction, connection);
      return signature;
    } else if (chainType === 'EVM') {
      // EVM transaction
      const hash = await sendEvmTx({
        to: txPayload.to as `0x${string}`,
        data: txPayload.data as `0x${string}`,
        value: BigInt(txPayload.value || '0'),
      });

      return hash;
    }

    throw new Error('No wallet connected');
  };

  const value: WalletContextValue = {
    address,
    chainType,
    isConnected,
    connect,
    disconnect,
    signAndSendTx,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
