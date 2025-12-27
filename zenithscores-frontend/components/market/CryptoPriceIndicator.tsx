/**
 * CryptoPriceIndicator Component
 * 
 * Displays crypto price with liquidity badge and on-chain status.
 * ALWAYS shows liquidity context - never hide this from users.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, Droplets, TrendingUp, TrendingDown } from 'lucide-react';
import { CryptoLiveStatus, LiquidityTier } from '@/lib/market/crypto/types';

interface CryptoPriceIndicatorProps {
    symbol: string;
    priceUsd: number;
    priceChange24h: number;
    liquidityUsd: number;
    liquidityTier: LiquidityTier;
    volume24h: number;
    txnsH1: number;
    status: CryptoLiveStatus;
    className?: string;
}

const statusConfig: Record<CryptoLiveStatus, {
    label: string;
    color: string;
    bgColor: string;
}> = {
    LIVE: {
        label: 'Live (On-Chain)',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
    },
    LOW_ACTIVITY: {
        label: 'Low Activity',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
    },
    DISCONNECTED: {
        label: 'Disconnected',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
    },
};

const liquidityConfig: Record<LiquidityTier, {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    warning?: string;
}> = {
    HIGH: {
        label: 'High Liquidity',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        icon: Droplets,
    },
    MEDIUM: {
        label: 'Medium Liquidity',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        icon: Droplets,
    },
    LOW: {
        label: 'Low Liquidity',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        icon: AlertTriangle,
        warning: 'Price may jump significantly',
    },
};

function formatPrice(price: number): string {
    if (price >= 1) {
        return price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    // For small prices, show more decimals
    if (price >= 0.0001) {
        return price.toFixed(6);
    }
    return price.toExponential(4);
}

function formatLiquidity(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
}

export default function CryptoPriceIndicator({
    symbol,
    priceUsd,
    priceChange24h,
    liquidityUsd,
    liquidityTier,
    volume24h,
    txnsH1,
    status,
    className = '',
}: CryptoPriceIndicatorProps) {
    const isPositive = priceChange24h >= 0;
    const statusCfg = statusConfig[status];
    const liquidityCfg = liquidityConfig[liquidityTier];
    const LiquidityIcon = liquidityCfg.icon;

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Symbol and Price */}
            <div className="flex items-baseline gap-3">
                <span className="text-lg font-semibold text-zinc-400">{symbol}</span>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={priceUsd}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        className="text-3xl font-bold text-white tabular-nums"
                    >
                        ${formatPrice(priceUsd)}
                    </motion.span>
                </AnimatePresence>
            </div>

            {/* 24h Change */}
            <div className="flex items-center gap-2">
                {isPositive ? (
                    <TrendingUp size={14} className="text-emerald-400" />
                ) : (
                    <TrendingDown size={14} className="text-red-400" />
                )}
                <span className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{priceChange24h.toFixed(2)}%
                </span>
                <span className="text-xs text-zinc-500">24h</span>
            </div>

            {/* Status Badge */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Live Status */}
                <div className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          ${statusCfg.bgColor} ${statusCfg.color}
        `}>
                    <Activity size={12} />
                    <span>{statusCfg.label}</span>
                    {status === 'LIVE' && (
                        <span className="relative flex h-1.5 w-1.5 ml-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                    )}
                </div>

                {/* Liquidity Badge - ALWAYS SHOWN */}
                <div className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          ${liquidityCfg.bgColor} ${liquidityCfg.color}
        `}>
                    <LiquidityIcon size={12} />
                    <span>{formatLiquidity(liquidityUsd)}</span>
                </div>
            </div>

            {/* Low Liquidity Warning */}
            {liquidityTier === 'LOW' && liquidityCfg.warning && (
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <AlertTriangle size={14} className="text-orange-400 flex-shrink-0" />
                    <span className="text-xs text-orange-300">{liquidityCfg.warning}</span>
                </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>Vol 24h: {formatLiquidity(volume24h)}</span>
                <span>Txns/hr: {txnsH1}</span>
            </div>
        </div>
    );
}
