'use client';

import { NormalizedToken } from '@/lib/dexscreener';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface TokenCardProps {
    token: NormalizedToken;
    onClick: () => void;
}

const formatPrice = (price: number): string => {
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
};

const formatVolume = (vol: number): string => {
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
    return `$${vol.toFixed(0)}`;
};

export default function TokenCard({ token, onClick }: TokenCardProps) {
    const isPositive = token.priceChange24h >= 0;
    const isLowLiquidity = token.liquidityUsd < 100000;

    return (
        <button
            onClick={onClick}
            className="group relative w-full p-4 bg-[#0a0c10] border border-zinc-800 hover:border-emerald-500/50 rounded-lg text-left transition-all hover:bg-[#0d1017] hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]"
        >
            {/* Chain Badge */}
            <div className="absolute top-2 right-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${token.chainId === 'ethereum' ? 'bg-blue-500/20 text-blue-400' :
                        token.chainId === 'base' ? 'bg-blue-600/20 text-blue-300' :
                            token.chainId === 'bsc' ? 'bg-yellow-500/20 text-yellow-400' :
                                token.chainId === 'solana' ? 'bg-purple-500/20 text-purple-400' :
                                    'bg-zinc-700 text-zinc-400'
                    }`}>
                    {token.chainName}
                </span>
            </div>

            {/* Symbol & Name */}
            <div className="mb-3">
                <div className="text-lg font-bold text-white tracking-tight">{token.symbol}</div>
                <div className="text-xs text-zinc-500 truncate max-w-[120px]">{token.name}</div>
            </div>

            {/* Price */}
            <div className="text-xl font-mono font-bold text-white mb-2">
                {formatPrice(token.priceUsd)}
            </div>

            {/* 24h Change */}
            <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {isPositive ? '+' : ''}{token.priceChange24h.toFixed(2)}%
            </div>

            {/* Volume & Liquidity */}
            <div className="mt-3 pt-3 border-t border-zinc-800/50 flex justify-between text-[10px] text-zinc-500">
                <div>
                    <span className="uppercase">Vol</span>
                    <span className="ml-1 text-zinc-400 font-mono">{formatVolume(token.volume24hUsd)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="uppercase">Liq</span>
                    <span className="text-zinc-400 font-mono">{formatVolume(token.liquidityUsd)}</span>
                    {isLowLiquidity && <AlertTriangle size={10} className="text-amber-500" />}
                </div>
            </div>

            {/* Swap CTA on hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <span className="px-4 py-2 bg-emerald-500 text-black font-bold text-sm rounded-lg shadow-lg">
                    SWAP →
                </span>
            </div>
        </button>
    );
}
