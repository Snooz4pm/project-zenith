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
            <header className="h-14 px-4 border-b border-zinc-800/50 bg-[#0a0c10]/80 backdrop-blur-sm flex items-center justify-between fixed top-0 left-0 right-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Zap className="text-emerald-500" size={20} />
                        <span className="font-bold tracking-tight">ALTCOIN TERMINAL</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold uppercase">
                        Live
                    </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                        <Activity size={12} className="text-emerald-500" />
                        <span className="font-mono">{new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-20 px-4 pb-8 max-w-[1800px] mx-auto">
                <TrendingGrid onTokenSelect={setSelectedToken} />
            </main>

            {/* Swap Drawer */}
            {selectedToken && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 z-40"
                        onClick={() => setSelectedToken(null)}
                    />
                    <SwapDrawer
                        token={selectedToken}
                        onClose={() => setSelectedToken(null)}
                    />
                </>
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
