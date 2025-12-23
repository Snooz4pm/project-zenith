'use client';

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, State } from 'wagmi';
import { ReactNode, useState } from 'react';
import { wagmiConfig, projectId } from '@/lib/web3-config';

// Initialize Web3Modal
if (projectId) {
    createWeb3Modal({
        wagmiConfig,
        projectId,
        enableAnalytics: false,
        enableOnramp: false,
        themeMode: 'dark',
        themeVariables: {
            '--w3m-color-mix': '#0a0a0a',
            '--w3m-color-mix-strength': 40,
            '--w3m-accent': '#10b981', // Zenith green
            '--w3m-border-radius-master': '12px',
        },
    });
}

interface Web3ProviderProps {
    children: ReactNode;
    initialState?: State;
}

export function Web3Provider({ children, initialState }: Web3ProviderProps) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
                refetchOnWindowFocus: false,
            },
        },
    }));

    return (
        <WagmiProvider config={wagmiConfig} initialState={initialState}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}

export default Web3Provider;
