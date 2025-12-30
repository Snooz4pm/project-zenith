'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmi'
import SignalsView from './SignalsView'

const queryClient = new QueryClient()

export default function SignalsClient() {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <SignalsView />
            </QueryClientProvider>
        </WagmiProvider>
    )
}
