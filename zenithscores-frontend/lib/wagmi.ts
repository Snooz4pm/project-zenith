'use client'

import { http, createConfig } from 'wagmi'
import { mainnet, base, arbitrum } from 'viem/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
    chains: [mainnet, base, arbitrum],
    connectors: [
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
