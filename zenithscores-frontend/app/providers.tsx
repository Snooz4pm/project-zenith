'use client'

import { useEffect, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/wagmi'
import { createWeb3Modal } from '@web3modal/wagmi'

const queryClient = new QueryClient()

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '2a141e8d498f5d1b1fb991c78402c9b6'

// Track if modal has been initialized
let modalInitialized = false

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Initialize Web3Modal only once on client-side
    if (!modalInitialized && typeof window !== 'undefined') {
      createWeb3Modal({
        wagmiConfig,
        projectId,
        themeMode: 'dark',
        themeVariables: {
          '--w3m-accent': '#14F195',
        },
        enableAnalytics: false,
      })
      modalInitialized = true
      console.log('🚀 Web3Modal initialized with projectId:', projectId)
    }
    setMounted(true)
  }, [])

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
