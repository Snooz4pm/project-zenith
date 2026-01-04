'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAccount, useConnect, useSendTransaction, useSwitchChain, useBalance, useDisconnect, useChainId } from 'wagmi';
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ChainType, EVM_CHAIN_MAP } from '@/lib/chains';

/**
 * VM-FIRST WALLET ARCHITECTURE
 * ════════════════════════════════════════════════════════
 * 
 * CORE RULE:
 * activeVM = "SOLANA" | "EVM" | null
 * 
 * - wagmi hooks ONLY run when activeVM === "EVM" OR evmConnected
 * - Solana hooks ONLY run when activeVM === "SOLANA" OR solanaConnected
 * - Discovery fetches based on activeVM
 * - Never mix VMs in one response
 */

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
    // VM State (source of truth)
    activeVM: ChainType | null;
    setActiveVM: (vm: ChainType | null) => void;

    // Sessions
    session: WalletSession;

    // Legacy (for backward compat during transition)
    preferredVM: ChainType | null;
    setPreferredVM: (vm: ChainType | null) => void;

    // Actions
    connectSolana: () => void;
    connectEvm: () => void;
    disconnect: (chainType: ChainType) => void;
    switchEvmNetwork: (chainId: number) => Promise<void>;
    signAndSendTx: (chainType: ChainType, txPayload: any) => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    // ════════════════════════════════════════════════════════
    // VM STATE (SOURCE OF TRUTH)
    // ════════════════════════════════════════════════════════
    const [activeVM, setActiveVM] = useState<ChainType | null>(null);
    const [preferredVM, setPreferredVM] = useState<ChainType | null>(null);

    // ════════════════════════════════════════════════════════
    // EVM HOOKS (Always mounted but guarded)
    // ════════════════════════════════════════════════════════
    const { address: evmAddress, isConnected: evmConnected } = useAccount();
    const { connect: evmConnect, connectors } = useConnect();
    const { sendTransactionAsync: sendEvmTx } = useSendTransaction();
    const { switchChainAsync } = useSwitchChain();
    const { disconnect: evmDisconnect } = useDisconnect();

    // CRITICAL: Only read chainId when EVM is connected
    const evmChainId = useChainId();

    // CRITICAL: Only query balance when EVM is actually connected
    const { data: evmBalanceData } = useBalance({
        address: evmConnected ? evmAddress : undefined,
        query: { enabled: evmConnected },
    });

    // ════════════════════════════════════════════════════════
    // SOLANA HOOKS (Always mounted but guarded)
    // ════════════════════════════════════════════════════════
    const {
        publicKey,
        connected: solanaConnected,
        disconnect: solanaDisconnect,
        sendTransaction: sendSolanaTx,
    } = useSolanaWallet();
    const { connection } = useConnection();

    const solanaAddress = publicKey?.toBase58() || null;
    const [solanaBalance, setSolanaBalance] = useState<number>(0);

    // Fetch Solana balance (only when connected)
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

    // ════════════════════════════════════════════════════════
    // AUTO-SET VM BASED ON CONNECTION
    // ════════════════════════════════════════════════════════
    useEffect(() => {
        if (solanaConnected && !evmConnected) {
            setActiveVM('SOLANA');
        } else if (evmConnected && !solanaConnected) {
            setActiveVM('EVM');
        }
        // If both connected, keep current activeVM
    }, [solanaConnected, evmConnected]);

    // ════════════════════════════════════════════════════════
    // BUILD SESSION OBJECTS
    // ════════════════════════════════════════════════════════
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

    // ════════════════════════════════════════════════════════
    // ACTIONS
    // ════════════════════════════════════════════════════════
    const connectSolana = () => {
        setActiveVM('SOLANA');
        console.log('[WalletContext] VM set to SOLANA');
    };

    const connectEvm = () => {
        setActiveVM('EVM');
        if (!evmConnected) {
            const connector = connectors[0];
            if (connector) {
                evmConnect({ connector });
            }
        }
    };

    const disconnect = (chainType: ChainType) => {
        if (chainType === 'SOLANA') {
            solanaDisconnect();
            if (activeVM === 'SOLANA') setActiveVM(null);
        } else if (chainType === 'EVM') {
            evmDisconnect();
            if (activeVM === 'EVM') setActiveVM(null);
        }
    };

    const switchEvmNetwork = async (targetChainId: number): Promise<void> => {
        if (!session.evm) {
            throw new Error('EVM wallet not connected');
        }
        if (!switchChainAsync) {
            throw new Error('Wallet does not support network switching');
        }
        await switchChainAsync({ chainId: targetChainId });
    };

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

    // ════════════════════════════════════════════════════════
    // CONTEXT VALUE
    // ════════════════════════════════════════════════════════
    const value: WalletContextValue = {
        activeVM,
        setActiveVM,
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
