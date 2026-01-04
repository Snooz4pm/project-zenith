'use client'

import { createConfig, http } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!

/**
 * EVM Wallet Config (BSC ONLY - FINAL)
 *
 * ✅ BSC / BNB Chain ONLY
 * ❌ NO Ethereum, Base, Arbitrum, Avalanche, Polygon
 * ❌ NO Coinbase Wallet (causes provider bugs)
 * ❌ NO Phantom EVM (Solana-only wallet)
 *
 * Connectors:
 * - MetaMask / Trust Wallet / Binance Wallet via injected()
 * - WalletConnect for mobile & QR scanning
 */
export const wagmiConfig = createConfig({
  chains: [bsc],

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
    [bsc.id]: http('https://bsc-dataseed.binance.org'),
  },

  ssr: false,
})
