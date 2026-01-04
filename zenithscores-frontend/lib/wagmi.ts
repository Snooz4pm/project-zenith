'use client'

import { createConfig, http } from 'wagmi'
import { mainnet, bsc, base, arbitrum } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!

/**
 * EVM Wallet Config (FINAL)
 *
 * - NO Coinbase Wallet (causes provider bugs)
 * - NO Phantom EVM interference
 * - MetaMask / Trust / Binance Wallet via injected()
 * - WalletConnect for mobile & QR
 */
export const wagmiConfig = createConfig({
  chains: [mainnet, bsc, base, arbitrum],

  connectors: [
    injected({
      target() {
        return {
          id: 'metaMask',
          name: 'MetaMask',
          provider:
            typeof window !== 'undefined' &&
            window.ethereum &&
            !window.ethereum.isPhantom
              ? window.ethereum
              : undefined,
        }
      },
    }),

    walletConnect({
      projectId,
      showQrModal: true,
    }),
  ],

  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http('https://bsc-dataseed.binance.org'),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },

  ssr: false,
})
