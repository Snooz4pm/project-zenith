'use client'

import { useEffect } from 'react'
import { createWeb3Modal } from '@web3modal/wagmi'
import { wagmiConfig } from '@/lib/wagmi'
import { mainnet, base, arbitrum } from 'viem/chains'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '2a141e8d498f5d1b1fb991c78402c9b6'

export function WalletConnectModal() {
  useEffect(() => {
    console.log('🔵 WalletConnectModal mounted')
    console.log('🔑 WC Project ID:', projectId)

    createWeb3Modal({
      wagmiConfig,
      projectId,
      chains: [mainnet, base, arbitrum],
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#14F195',
      },
      enableAnalytics: false,
    })

    console.log('✅ Web3Modal created successfully')
  }, [])

  return null
}
