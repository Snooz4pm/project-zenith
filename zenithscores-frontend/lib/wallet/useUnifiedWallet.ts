/**
 * Unified Wallet Controller (Zenith Way)
 * 
 * Single source of truth for wallet state across EVM + Solana
 * Chain-aware routing, clean disconnect, no fake prompts
 */

import { useAccount, useDisconnect } from 'wagmi';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';

export type ChainType = 'evm' | 'solana' | 'none';

export function useUnifiedWallet(activeChain: ChainType) {
    // EVM state
    const { address: evmAddress, isConnected: evmConnected } = useAccount();
    const { disconnect: disconnectEvm } = useDisconnect();

    // Solana state
    const {
        connected: solConnected,
        publicKey,
        disconnect: disconnectSol,
    } = useSolanaWallet();

    // Derive connection status based on active chain
    const isConnected =
        activeChain === 'evm'
            ? evmConnected
            : activeChain === 'solana'
                ? solConnected && !!publicKey
                : false;

    // Unified disconnect (chain-aware)
    const disconnect = async () => {
        try {
            if (activeChain === 'evm' && evmConnected) {
                disconnectEvm();
            }

            if (activeChain === 'solana' && solConnected) {
                await disconnectSol();
            }
        } catch (e) {
            console.error('[useUnifiedWallet] Disconnect failed:', e);
        }
    };

    // Unified address
    const address = activeChain === 'evm'
        ? evmAddress
        : activeChain === 'solana' && publicKey
            ? publicKey.toBase58()
            : undefined;

    return {
        isConnected,
        address,
        disconnect,
        chainType: activeChain,
    };
}
