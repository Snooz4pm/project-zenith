'use client'

import { createConfig, http } from 'wagmi'
import { mainnet, base, arbitrum } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!

export const wagmiConfig = createConfig({
    chains: [mainnet, base, arbitrum],

    connectors: [
        walletConnect({
            projectId, // ✅ ONLY this - no showQrModal
        }),
        injected({
            shimDisconnect: true,
        }),
    ],

    transports: {
        [mainnet.id]: http(),
        [base.id]: http(),
        [arbitrum.id]: http(),
    },

    ssr: false,
})
