'use client';

import { useState, useEffect } from 'react';
import { GlobalToken } from '@/lib/discovery/normalize';
import TokenCard from './TokenCard';
import { Loader2, AlertCircle } from 'lucide-react';

interface ArenaGridProps {
    onSelectToken: (token: GlobalToken) => void;
}

/**
 * ArenaGrid Component
 * 
 * Displays ALL tokens from ALL chains
 * Fetches from /api/tokens (global discovery)
 * 
 * ❌ Does NOT:
 * - Detect chain
 * - Fetch balances
 * - Contain swap logic
 */
export default function ArenaGrid({ onSelectToken }: ArenaGridProps) {
    const [tokens, setTokens] = useState<GlobalToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTokens();
    }, []);

    const fetchTokens = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/tokens?limit=100');

            if (!response.ok) {
                throw new Error('Failed to fetch tokens');
            }

            const data = await response.json();

            if (data.success) {
                setTokens(data.tokens);
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (err: any) {
            console.error('[ArenaGrid] Failed to fetch tokens:', err);
            setError(err.message || 'Failed to load tokens');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-zinc-400">Discovering tokens across all chains...</p>
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
                        onClick={fetchTokens}
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
                <div className="text-center">
                    <p className="text-zinc-400 mb-4">No tokens discovered</p>
                    <button
                        onClick={fetchTokens}
                        className="px-4 py-2 bg-emerald-500 text-black font-medium rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Token Discovery</h2>
                    <p className="text-sm text-zinc-500">
                        {tokens.length} tokens across all chains
                    </p>
                </div>

                <button
                    onClick={fetchTokens}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors text-sm"
                >
                    Refresh
                </button>
            </div>

            {/* Token Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tokens.map((token) => (
                    <TokenCard
                        key={token.id}
                        token={token}
                        onSelect={onSelectToken}
                    />
                ))}
            </div>
        </div>
    );
}
