'use client';

import { useState, useEffect } from 'react';
import { DiscoveredToken } from '@/lib/discovery/types';
import { useWallet } from '@/lib/wallet/WalletContext';
import TokenCard from './TokenCard';
import { Loader2, AlertCircle, Wallet } from 'lucide-react';

interface ArenaGridProps {
    onSelectToken: (token: DiscoveredToken) => void;
}

/**
 * ArenaGrid Component (VM-FIRST ARCHITECTURE)
 * 
 * Fetches tokens based on activeVM state:
 * - activeVM === "SOLANA" → /api/arena/tokens?vm=SOLANA
 * - activeVM === "EVM" → /api/arena/tokens?vm=EVM
 * - activeVM === null → Show "Connect wallet" prompt
 */
export default function ArenaGrid({ onSelectToken }: ArenaGridProps) {
    const { activeVM, session, setActiveVM } = useWallet();
    const [tokens, setTokens] = useState<DiscoveredToken[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch tokens when activeVM changes
    useEffect(() => {
        if (activeVM) {
            fetchTokens(activeVM);
        } else {
            setTokens([]);
        }
    }, [activeVM]);

    const fetchTokens = async (vm: string) => {
        setLoading(true);
        setError(null);

        try {
            // New route returns all tokens - we filter client side for responsiveness
            const response = await fetch('/api/arena/discovery');

            const text = await response.text();

            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                console.error('[ArenaGrid] API returned HTML');
                setTokens([]);
                setError('Discovery service Unavailable');
                return;
            }

            const data = JSON.parse(text);
            const allTokens = data.tokens || [];

            // Filter by active VM
            const filtered = allTokens.filter((t: DiscoveredToken) =>
                t.chainType === vm
            );

            setTokens(filtered);

        } catch (err: any) {
            console.error('[ArenaGrid] Fetch error:', err);
            setError(err.message || 'Failed to load tokens');
        } finally {
            setLoading(false);
        }
    };

    // No VM selected - show wallet connect prompt
    if (!activeVM) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center max-w-md">
                    <Wallet className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Select a Network</h3>
                    <p className="text-zinc-400 mb-6 text-sm">
                        Choose Solana or EVM to start discovering tokens.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => setActiveVM('SOLANA')}
                            className="px-6 py-3 bg-[#14F195]/10 hover:bg-[#14F195]/20 border border-[#14F195]/30 text-[#14F195] font-medium rounded-lg transition-colors"
                        >
                            🟣 Solana
                        </button>
                        <button
                            onClick={() => setActiveVM('EVM')}
                            className="px-6 py-3 bg-[#627EEA]/10 hover:bg-[#627EEA]/20 border border-[#627EEA]/30 text-[#627EEA] font-medium rounded-lg transition-colors"
                        >
                            Ξ EVM
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-zinc-400">Discovering {activeVM} tokens...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => fetchTokens(activeVM)}
                        className="px-4 py-2 bg-emerald-500 text-black font-medium rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (tokens.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Tokens Found</h3>
                    <p className="text-zinc-400 mb-6 text-sm">
                        The upstream API may be temporarily unavailable.
                    </p>
                    <button
                        onClick={() => fetchTokens(activeVM)}
                        className="px-6 py-2 bg-emerald-500 text-black font-medium rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Refresh Discovery
                    </button>
                </div>
            </div>
        );
    }

    const vmLabel = activeVM === 'SOLANA' ? 'Solana' : 'EVM';
    const vmColor = activeVM === 'SOLANA' ? 'text-[#14F195]' : 'text-[#627EEA]';

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                        <span className={vmColor}>{vmLabel}</span> Token Discovery
                    </h2>
                    <p className="text-sm text-zinc-500">
                        {tokens.length} tokens • Click to swap
                    </p>
                </div>

                <div className="flex gap-2">
                    {/* VM Switcher */}
                    <button
                        onClick={() => setActiveVM(activeVM === 'SOLANA' ? 'EVM' : 'SOLANA')}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors text-sm"
                    >
                        Switch to {activeVM === 'SOLANA' ? 'EVM' : 'Solana'}
                    </button>
                    <button
                        onClick={() => fetchTokens(activeVM)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors text-sm"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Token Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tokens.map((token) => (
                    <TokenCard
                        key={`${token.chainId}:${token.address}`}
                        token={token}
                        onSelect={onSelectToken}
                    />
                ))}
            </div>
        </div>
    );
}
