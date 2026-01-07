'use client'

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { wagmiConfig } from './wagmi'

createWeb3Modal({
    wagmiConfig,
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    enableOnramp: false, // Removes 'Buy crypto' from modal
    enableAnalytics: false,
})
