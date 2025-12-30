'use client'

import { createConfig, http } from 'wagmi'
import { mainnet, base, arbitrum } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

const projectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
    '2a141e8d498f5d1b1fb991c78402c9b6'

export const wagmiConfig = createConfig({
    chains: [mainnet, base, arbitrum],

    connectors: [
        walletConnect({
            projectId,
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

    ssr: true,
})
