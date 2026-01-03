'use client'

import { createConfig, http } from 'wagmi'
import { mainnet, base, arbitrum, bsc } from 'wagmi/chains'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!

/**
 * EVM Wallet Config
 * 
 * Phantom is EXCLUDED from EVM connectors
 * Phantom must only be used via Solana adapter
 */
export const wagmiConfig = createConfig({
    chains: [mainnet, bsc, base, arbitrum],

    connectors: [
        // Injected (MetaMask only - NOT Phantom)
        injected({
            target() {
                return {
                    id: 'metaMask',
                    name: 'MetaMask',
                    provider: typeof window !== 'undefined' && window.ethereum && !window.ethereum.isPhantom
                        ? window.ethereum
                        : undefined,
                }
            },
        }),
        // WalletConnect
        walletConnect({
            projectId,
            showQrModal: true,
        }),
        // Coinbase Wallet
        coinbaseWallet({
            appName: 'ZenithScores',
        }),
    ],

    transports: {
        [mainnet.id]: http(),
        [bsc.id]: http(),
        [base.id]: http(),
        [arbitrum.id]: http(),
    },

    ssr: false,
})
