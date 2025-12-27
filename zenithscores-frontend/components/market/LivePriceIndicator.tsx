/**
 * LivePriceIndicator Component
 * 
 * Displays current price with status badge (LIVE / DELAYED / DISCONNECTED).
 * LIVE MODE ONLY - No replay state access.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { LiveStatus } from '@/lib/market/live/types';

interface LivePriceIndicatorProps {
    price: number;
    previousClose: number;
    status: LiveStatus;
    delaySeconds?: number;
    symbol: string;
    className?: string;
}

const statusConfig: Record<LiveStatus, {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
}> = {
    LIVE: {
        label: 'Live (Near Real-Time)',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        icon: Wifi,
    },
    DELAYED: {
        label: 'Delayed',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
        icon: Clock,
    },
    DISCONNECTED: {
        label: 'Disconnected',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        icon: WifiOff,
    },
};

export default function LivePriceIndicator({
    price,
    previousClose,
    status,
    delaySeconds = 0,
    symbol,
    className = '',
}: LivePriceIndicatorProps) {
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
    const isPositive = change >= 0;

    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
        <div className={`flex flex-col ${className}`}>
            {/* Symbol and Price */}
            <div className="flex items-baseline gap-3">
                <span className="text-lg font-semibold text-zinc-400">{symbol}</span>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={price}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="text-3xl font-bold text-white tabular-nums"
                    >
                        ${price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </motion.span>
                </AnimatePresence>
            </div>

            {/* Change */}
            <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
                </span>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 mt-3">
                <div className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          ${config.bgColor} ${config.color}
        `}>
                    <StatusIcon size={12} />
                    <span>{config.label}</span>
                    {status === 'DELAYED' && delaySeconds > 0 && (
                        <span className="opacity-70">({delaySeconds}s)</span>
                    )}
                </div>

                {/* Pulse indicator for LIVE */}
                {status === 'LIVE' && (
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                )}
            </div>
        </div>
    );
}
