'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/wagmi'
import SignalsView from './SignalsView'

const queryClient = new QueryClient()

export default function SignalsClient() {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <SignalsView />
            </QueryClientProvider>
        </WagmiProvider>
    )
}
