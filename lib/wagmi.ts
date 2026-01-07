'use client'

import { createConfig, http } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!

/**
 * EVM Wallet Config (BSC ONLY - FINAL)
 *
 * ✅ BSC / BNB Chain ONLY
 * ✅ MetaMask / Trust / Binance Wallet via injected()
 * ✅ WalletConnect for mobile & QR scanning
 * ❌ NO Ethereum, Base, Arbitrum, Avalanche, Polygon
 * ❌ NO Coinbase Wallet (causes provider bugs)
 * ❌ NO Phantom (blocked explicitly - Solana only)
 */
export const wagmiConfig = createConfig({
  chains: [bsc],

  connectors: [
    // 🔒 INJECTED — HARD FILTER METAMASK / TRUST / BINANCE
    injected({
      target() {
        if (typeof window === 'undefined') return undefined

        const eth = window.ethereum

        // ❌ Block Phantom explicitly
        if (!eth || eth.isPhantom) return undefined

        return {
          id: 'evm-injected',
          name: 'Browser Wallet',
          provider: eth,
        }
      },
    }),

    // 🔗 WalletConnect (mobile + desktop fallback)
    walletConnect({
      projectId,
      showQrModal: true,
      metadata: {
        name: 'ZenithScores',
        description: 'Non-custodial swaps on Solana & BNB',
        url: 'https://zenithscores.com',
        icons: ['https://zenithscores.com/icon.png'],
      },
    }),
  ],

  transports: {
    [bsc.id]: http('https://bsc-dataseed.binance.org'),
  },

  ssr: false,
})
