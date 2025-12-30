'use client';

import { NormalizedToken } from '@/lib/dexscreener';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface FlowTokenCardProps {
    token: NormalizedToken;
    onClick: () => void;
    showLiveBadge?: boolean;
}

const formatPrice = (price: number): string => {
    if (!price || price === 0) return '—';
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    if (price >= 0.0001) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(8)}`;
};

const formatCompact = (num: number): string => {
    if (!num || num === 0) return '—';
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num.toFixed(0)}`;
};

const SWAPPABLE_CHAINS = ['ethereum', 'base', 'arbitrum'];

export default function FlowTokenCard({ token, onClick, showLiveBadge }: FlowTokenCardProps) {
    const isPositive = token.priceChange24h >= 0;
    const canSwap = SWAPPABLE_CHAINS.includes(token.chainId);
    const ctaText = canSwap ? 'SWAP →' : 'VIEW';

    // Chain-specific colors
    const getChainStyle = (chainId: string) => {
        switch (chainId) {
            case 'ethereum':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'base':
                return 'bg-blue-600/20 text-blue-300 border-blue-600/30';
            case 'arbitrum':
                return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
            case 'solana':
                return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'bsc':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default:
                return 'bg-zinc-700/20 text-zinc-400 border-zinc-700/30';
        }
    };

    return (
        <button
            onClick={onClick}
            className={`group relative w-full p-4 bg-[#0a0c10] border rounded-lg text-left transition-all ${
                canSwap
                    ? 'border-zinc-800 hover:border-emerald-500/50 hover:bg-[#0d1017] hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                    : 'border-zinc-800 hover:border-zinc-700 hover:bg-[#0d1017]'
            }`}
        >
            {/* Top Row: Live Badge + Chain Badge */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
                {showLiveBadge && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 border border-red-500/40 rounded text-[9px] font-bold text-red-400 animate-pulse">
                        <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                        LIVE
                    </div>
                )}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getChainStyle(token.chainId)}`}>
                    {token.chainName}
                </span>
            </div>

            {/* Symbol & Name */}
            <div className="mb-3 pr-16">
                <div className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    {token.symbol}
                    {token.isMeme && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-pink-500/20 text-pink-400 rounded border border-pink-500/30">
                            MEME
                        </span>
                    )}
                </div>
                <div className="text-xs text-zinc-500 truncate max-w-[160px]">{token.name || '—'}</div>
            </div>

            {/* Price */}
            <div className="text-xl font-mono font-bold text-white mb-2">
                {formatPrice(token.priceUsd)}
            </div>

            {/* 24h Change */}
            <div className={`flex items-center gap-1 text-sm font-bold mb-3 ${
                isPositive ? 'text-emerald-400' : 'text-red-400'
            }`}>
                {token.priceChange24h !== 0 ? (
                    <>
                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {isPositive ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                    </>
                ) : (
                    <span className="text-zinc-500">—</span>
                )}
            </div>

            {/* Volume & Liquidity */}
            <div className="pt-3 border-t border-zinc-800/50 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                    <div className="text-zinc-600 uppercase mb-0.5">Volume</div>
                    <div className="text-zinc-300 font-mono font-bold">{formatCompact(token.volume24hUsd)}</div>
                </div>
                <div>
                    <div className="text-zinc-600 uppercase mb-0.5">Liquidity</div>
                    <div className="text-zinc-300 font-mono font-bold">{formatCompact(token.liquidityUsd)}</div>
                </div>
            </div>

            {/* CTA Overlay */}
            <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg ${
                canSwap ? 'bg-emerald-500/10' : 'bg-zinc-800/50'
            }`}>
                <span className={`px-5 py-2.5 font-bold text-sm rounded-lg shadow-lg flex items-center gap-2 ${
                    canSwap
                        ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                        : 'bg-zinc-700 text-white'
                }`}>
                    {canSwap && <Zap size={14} className="fill-current" />}
                    {ctaText}
                </span>
            </div>
        </button>
    );
}
