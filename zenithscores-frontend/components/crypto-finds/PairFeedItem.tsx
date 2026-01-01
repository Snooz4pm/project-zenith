'use client';

import { TrendingUp, TrendingDown, Droplets } from 'lucide-react';

// Chain badge config
const CHAIN_LABELS: Record<string, { label: string; color: string }> = {
    ethereum: { label: 'ETH', color: 'bg-blue-500/20 text-blue-400' },
    arbitrum: { label: 'ARB', color: 'bg-cyan-500/20 text-cyan-400' },
    base: { label: 'BASE', color: 'bg-purple-500/20 text-purple-400' },
    solana: { label: 'SOL', color: 'bg-green-500/20 text-green-400' },
    bsc: { label: 'BSC', color: 'bg-yellow-500/20 text-yellow-400' },
    polygon: { label: 'MATIC', color: 'bg-violet-500/20 text-violet-400' },
    avalanche: { label: 'AVAX', color: 'bg-red-500/20 text-red-400' },
    optimism: { label: 'OP', color: 'bg-rose-500/20 text-rose-400' }
};

interface PairFeedItemProps {
    pair: {
        pairAddress: string;
        chainId: string;
        baseSymbol: string;
        baseName: string;
        quoteSymbol: string;
        priceUsd: number;
        priceChange24h: number;
        priceChange1h: number;
        volume24h: number;
        liquidity: number;
        txns24h: number;
    };
    isSelected: boolean;
    onClick: () => void;
}

export default function PairFeedItem({ pair, isSelected, onClick }: PairFeedItemProps) {
    const isPositive = pair.priceChange24h >= 0;
    const chainConfig = CHAIN_LABELS[pair.chainId] || { label: pair.chainId.toUpperCase(), color: 'bg-zinc-500/20 text-zinc-400' };

    return (
        <div
            onClick={onClick}
            className={`
                p-2.5 rounded-lg cursor-pointer transition-all
                ${isSelected
                    ? 'bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/30'
                    : 'hover:bg-white/[0.03] border border-transparent'
                }
            `}
        >
            {/* Top Row: Symbol + Chain Badge + Price */}
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{pair.baseSymbol}</span>
                    <span className="text-[10px] text-zinc-600">/{pair.quoteSymbol}</span>
                    {/* Chain Badge */}
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${chainConfig.color}`}>
                        {chainConfig.label}
                    </span>
                </div>
                <div className="text-right">
                    <div className="text-sm font-mono text-white">
                        ${pair.priceUsd < 0.01
                            ? pair.priceUsd.toExponential(2)
                            : pair.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 4 })
                        }
                    </div>
                </div>
            </div>

            {/* Bottom Row: Change + Volume + Liquidity */}
            <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {isPositive ? '+' : ''}{pair.priceChange24h.toFixed(1)}%
                    </span>
                    <span className="text-zinc-600">24h</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500">
                    <span className="flex items-center gap-0.5">
                        <Droplets size={10} />
                        ${formatCompact(pair.liquidity)}
                    </span>
                    <span>${formatCompact(pair.volume24h)}</span>
                </div>
            </div>
        </div>
    );
}

function formatCompact(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(0);
}
