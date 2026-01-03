'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAccount, useConnect, useSendTransaction, useChainId, useSwitchChain } from 'wagmi';
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';

/**
 * Unified Wallet Context
 * 
 * Auto-detects wallet and provides unified interface
 * MetaMask/WalletConnect → vm = "EVM"
 * Phantom/Solflare → vm = "SOLANA"
 * 
 * Solana ≠ EVM
 * Solana is NOT a network inside EVM
 * EVM networks share one VM
 */

export type VM = 'EVM' | 'SOLANA';

export interface WalletState {
    address: string | null;
    vm: VM | null;
    chainId?: number; // EVM only
    networkName: string; // "Ethereum" | "Base" | "Arbitrum" | "BNB Chain" | "Solana"
    isConnected: boolean;
}

interface WalletContextValue {
    wallet: WalletState;
    connect: () => void;
    disconnect: () => void;
    switchNetwork: (chainId: number) => Promise<void>; // EVM only
    signAndSendTx: (txPayload: any) => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

// Network name mapping for EVM chains
const EVM_NETWORK_NAMES: Record<number, string> = {
    1: 'Ethereum',
    56: 'BNB Chain',
    8453: 'Base',
    42161: 'Arbitrum',
    10: 'Optimism',
    137: 'Polygon',
    43114: 'Avalanche',
};

export function WalletProvider({ children }: { children: ReactNode }) {
    // EVM wallet (MetaMask, WalletConnect, etc.)
    const { address: evmAddress, isConnected: evmConnected } = useAccount();
    const { connect: evmConnect, connectors } = useConnect();
    const { sendTransactionAsync: sendEvmTx } = useSendTransaction();
    const { switchChainAsync } = useSwitchChain();
    const evmChainId = useChainId();

    // Solana wallet (Phantom, Solflare, etc.)
    const {
        publicKey,
        connected: solanaConnected,
        disconnect: solanaDisconnect,
        sendTransaction: sendSolanaTx,
    } = useSolanaWallet();
    const { connection } = useConnection();

    const solanaAddress = publicKey?.toBase58() || null;

    // Auto-detect VM
    const vm: VM | null =
        solanaConnected && solanaAddress ? 'SOLANA' :
            evmConnected && evmAddress ? 'EVM' :
                null;

    // Build wallet state
    const wallet: WalletState = {
        address: vm === 'SOLANA' ? solanaAddress : evmAddress || null,
        vm,
        chainId: vm === 'EVM' ? evmChainId : undefined,
        networkName: vm === 'SOLANA' ? 'Solana' : (vm === 'EVM' && evmChainId ? EVM_NETWORK_NAMES[evmChainId] || `Chain ${evmChainId}` : ''),
        isConnected: vm !== null,
    };

    // Unified connect
    const connect = () => {
        if (!wallet.isConnected) {
            // Try EVM first (MetaMask is more common)
            const connector = connectors[0];
            if (connector) {
                evmConnect({ connector });
            }
        }
    };

    // Unified disconnect
    const disconnect = () => {
        if (vm === 'SOLANA') {
            solanaDisconnect();
        }
        // EVM disconnect handled by wagmi
    };

    // Network switching (EVM only)
    const switchNetwork = async (targetChainId: number): Promise<void> => {
        if (vm !== 'EVM') {
            throw new Error('Network switching only available for EVM wallets');
        }

        if (!switchChainAsync) {
            throw new Error('Wallet does not support network switching');
        }

        await switchChainAsync({ chainId: targetChainId });
    };

    // Unified transaction signing
    const signAndSendTx = async (txPayload: any): Promise<string> => {
        if (vm === 'SOLANA') {
            // Solana transaction
            const txBuffer = Buffer.from(txPayload.data, 'base64');
            const transaction = VersionedTransaction.deserialize(txBuffer);

            if (!sendSolanaTx) throw new Error('Solana wallet not connected');

            const signature = await sendSolanaTx(transaction, connection);
            return signature;
        } else if (vm === 'EVM') {
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
        wallet,
        connect,
        disconnect,
        switchNetwork,
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
