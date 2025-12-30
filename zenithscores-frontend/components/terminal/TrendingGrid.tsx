'use client';

import { useState, useEffect, useCallback } from 'react';
import { NormalizedToken, getTrendingTokens } from '@/lib/dexscreener';
import TokenCard from './TokenCard';
import { useAccount } from 'wagmi';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

interface TrendingGridProps {
    onTokenSelect: (token: NormalizedToken) => void;
}

const CHAIN_ID_MAP: Record<number, string> = {
    1: 'ethereum',
    8453: 'base',
    42161: 'arbitrum'
};

export default function TrendingGrid({ onTokenSelect }: TrendingGridProps) {
    const { chainId, isConnected } = useAccount();
    const [tokens, setTokens] = useState<NormalizedToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const activeChainSlug = chainId ? CHAIN_ID_MAP[chainId] : 'ethereum';

    const fetchTokens = useCallback(async () => {
        try {
            setError(null);
            // Fetch tokens for the specific active chain or default to ethereum
            const data = await getTrendingTokens(activeChainSlug);

            if (data.length === 0) {
                setError(`No tokens available on ${activeChainSlug.toUpperCase()}`);
            } else {
                setTokens(data);
                setLastUpdate(new Date());
            }
        } catch (err) {
            setError('Failed to fetch data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activeChainSlug]);

    useEffect(() => {
        setLoading(true);
        fetchTokens();

        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchTokens, 60000);
        return () => clearInterval(interval);
    }, [fetchTokens]);

    const handleRefresh = () => {
        setLoading(true);
        fetchTokens();
    };

    if (loading && tokens.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
            </div>
        );
    }

    if (error && tokens.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                <AlertCircle size={32} className="mb-2 text-red-500" />
                <p>{error}</p>
                <button
                    onClick={handleRefresh}
                    className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                        Trending on {activeChainSlug.toUpperCase()}
                    </h2>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold">
                        {tokens.length} PAIRS
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {lastUpdate && (
                        <span className="text-[10px] text-zinc-600 font-mono">
                            {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {tokens.map((token) => (
                    <TokenCard
                        key={token.id}
                        token={token}
                        onClick={() => onTokenSelect(token)}
                    />
                ))}
            </div>
        </div>
    );
}
