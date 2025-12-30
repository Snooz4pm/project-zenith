'use client';

import { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi';
import TrendingGrid from '@/components/terminal/TrendingGrid';
import SwapDrawer from '@/components/terminal/SwapDrawer';
import { NormalizedToken } from '@/lib/dexscreener';
import { Activity, Zap } from 'lucide-react';

const queryClient = new QueryClient();

function TerminalContent() {
    const [selectedToken, setSelectedToken] = useState<NormalizedToken | null>(null);

    return (
        <div className="min-h-screen bg-[#050709] text-white">
            {/* Header */}
            {/* Main Content */}
            <main className="pt-24 px-4 pb-8 max-w-[1800px] mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                            <Zap className="text-emerald-500" size={24} />
                            ALTCOIN TERMINAL
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold uppercase">
                                Live
                            </span>
                            <span className="text-xs text-zinc-500">Real-time market intelligence</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                            <Activity size={12} className="text-emerald-500" />
                            <span className="font-mono">{new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>

                <TrendingGrid onTokenSelect={setSelectedToken} />
            </main>

            {/* Swap Drawer */}
            {selectedToken && (
                <SwapDrawer
                    token={selectedToken}
                    onClose={() => setSelectedToken(null)}
                />
            )}
        </div>
    );
}

export default function TerminalPage() {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <TerminalContent />
            </QueryClientProvider>
        </WagmiProvider>
    );
}
