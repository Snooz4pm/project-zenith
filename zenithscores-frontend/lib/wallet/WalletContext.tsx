'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAccount, useConnect, useSendTransaction, useChainId, useSwitchChain, useBalance, useDisconnect } from 'wagmi';
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ChainType, EVM_CHAIN_MAP, chainIdToChainType } from '@/lib/chains';

/**
 * Unified Wallet Session Context
 *
 * PRODUCTION ARCHITECTURE:
 * ════════════════════════════════════════════════════════
 * ✅ Solana and EVM sessions are ADDITIVE, not exclusive
 * ✅ Connecting one does NOT disconnect the other
 * ✅ VM determined by adapter used, not wallet brand
 * ✅ WalletConnect = EVM ONLY (never Solana)
 * ✅ Solana adapter = SOLANA ONLY
 *
 * Session Model:
 * ──────────────
 * WalletSession {
 *   solana?: { connected, address, balance }
 *   evm?: { connected, address, chainId, balance }
 * }
 *
 * Both can exist simultaneously without conflicts.
 */

// Types moved to lib/chains.ts

export interface SolanaSession {
    connected: boolean;
    address: string;
    balance: string;
    balanceFormatted: string;
}

export interface EvmSession {
    connected: boolean;
    address: string;
    chainId: number;
    networkName: string;
    balance: string;
    balanceFormatted: string;
}

export interface WalletSession {
    solana?: SolanaSession;
    evm?: EvmSession;
}

interface WalletContextValue {
    session: WalletSession;
    preferredVM: ChainType | null;
    setPreferredVM: (vm: ChainType | null) => void;
    connectSolana: () => void;
    connectEvm: () => void;
    disconnect: (chainType: ChainType) => void;
    switchEvmNetwork: (chainId: number) => Promise<void>;
    signAndSendTx: (chainType: ChainType, txPayload: any) => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    // EVM wallet (MetaMask, WalletConnect, etc.)
    const { address: evmAddress, isConnected: evmConnected } = useAccount();
    const [preferredVM, setPreferredVM] = useState<ChainType | null>(null);
    const { connect: evmConnect, connectors } = useConnect();
    const { sendTransactionAsync: sendEvmTx } = useSendTransaction();
    const { switchChainAsync } = useSwitchChain();
    const { disconnect: evmDisconnect } = useDisconnect();
    const evmChainId = useChainId();

    // EVM balance (ONLY query when connected to prevent ProviderNotFoundError)
    const { data: evmBalanceData } = useBalance({
        address: evmConnected ? evmAddress : undefined,
        query: { enabled: evmConnected },
    });

    // Solana wallet (Phantom, Solflare, etc.)
    const {
        publicKey,
        connected: solanaConnected,
        disconnect: solanaDisconnect,
        sendTransaction: sendSolanaTx,
    } = useSolanaWallet();
    const { connection } = useConnection();

    const solanaAddress = publicKey?.toBase58() || null;

    // Solana balance
    const [solanaBalance, setSolanaBalance] = useState<number>(0);

    useEffect(() => {
        if (publicKey && connection && solanaConnected) {
            connection.getBalance(publicKey).then((lamports) => {
                setSolanaBalance(lamports / LAMPORTS_PER_SOL);
            }).catch(() => {
                setSolanaBalance(0);
            });
        } else {
            setSolanaBalance(0);
        }
    }, [publicKey, connection, solanaConnected]);

    // Build session (CRITICAL: Both can exist simultaneously)
    const session: WalletSession = {};

    if (solanaConnected && solanaAddress) {
        session.solana = {
            connected: true,
            address: solanaAddress,
            balance: solanaBalance.toString(),
            balanceFormatted: solanaBalance.toFixed(4),
        };
    }

    if (evmConnected && evmAddress) {
        const chainMeta = EVM_CHAIN_MAP[evmChainId];
        session.evm = {
            connected: true,
            address: evmAddress,
            chainId: evmChainId,
            networkName: chainMeta?.name || `Chain ${evmChainId}`,
            balance: evmBalanceData?.value.toString() || '0',
            balanceFormatted: evmBalanceData
                ? (Number(evmBalanceData.value) / Math.pow(10, evmBalanceData.decimals)).toFixed(4)
                : '0.0000',
        };
    }

    // Connect Solana (does NOT disconnect EVM)
    const connectSolana = () => {
        // Solana connection handled by WalletSelectorModal
        // This is a no-op, kept for API consistency
        console.log('[WalletContext] Solana connection managed by wallet selector');
    };

    // Connect EVM (does NOT disconnect Solana)
    const connectEvm = () => {
        if (!evmConnected) {
            const connector = connectors[0];
            if (connector) {
                evmConnect({ connector });
            }
        }
    };

    // Disconnect specific chain (never disconnects both)
    const disconnect = (chainType: ChainType) => {
        if (chainType === 'SOLANA') {
            solanaDisconnect();
        } else if (chainType === 'EVM') {
            evmDisconnect();
        }
    };

    // Network switching (EVM only)
    const switchEvmNetwork = async (targetChainId: number): Promise<void> => {
        if (!session.evm) {
            throw new Error('EVM wallet not connected');
        }

        if (!switchChainAsync) {
            throw new Error('Wallet does not support network switching');
        }

        await switchChainAsync({ chainId: targetChainId });
    };

    // Transaction signing (requires chainType)
    const signAndSendTx = async (chainType: ChainType, txPayload: any): Promise<string> => {
        if (chainType === 'SOLANA') {
            if (!session.solana) {
                throw new Error('Solana wallet not connected');
            }

            const txBuffer = Buffer.from(txPayload.data, 'base64');
            const transaction = VersionedTransaction.deserialize(txBuffer);

            if (!sendSolanaTx) throw new Error('Solana wallet not connected');

            const signature = await sendSolanaTx(transaction, connection);
            return signature;
        } else if (chainType === 'EVM') {
            if (!session.evm) {
                throw new Error('EVM wallet not connected');
            }

            const hash = await sendEvmTx({
                to: txPayload.to as `0x${string}`,
                data: txPayload.data as `0x${string}`,
                value: BigInt(txPayload.value || '0'),
            });

            return hash;
        }

        throw new Error(`Unsupported chain type: ${chainType}`);
    };

    const value: WalletContextValue = {
        session,
        preferredVM,
        setPreferredVM,
        connectSolana,
        connectEvm,
        disconnect,
        switchEvmNetwork,
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
