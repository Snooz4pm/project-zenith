/**
 * CryptoPriceIndicator Component - PREMIUM VERSION
 * 
 * Clean, minimal, alive. Same energy as LivePriceIndicator.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CryptoPriceIndicatorProps {
    symbol: string;
    priceUsd: number;
    priceChange24h: number;
    liquidityUsd: number;
    liquidityTier: 'HIGH' | 'MEDIUM' | 'LOW';
    volume24h: number;
    txnsH1: number;
    status: 'LIVE' | 'LOW_ACTIVITY' | 'DISCONNECTED';
    className?: string;
}

function formatPrice(price: number): string {
    if (price >= 1) {
        return price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    if (price >= 0.0001) {
        return price.toFixed(6);
    }
    return price.toExponential(4);
}

export default function CryptoPriceIndicator({
    symbol,
    priceUsd,
    priceChange24h,
    status,
    className = '',
}: CryptoPriceIndicatorProps) {
    const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const prevPriceRef = useRef(priceUsd);

    const isPositive = priceChange24h >= 0;

    // Flash animation on price change
    useEffect(() => {
        if (prevPriceRef.current !== priceUsd && priceUsd > 0) {
            const direction = priceUsd > prevPriceRef.current ? 'green' : 'red';
            setFlashColor(direction);
            setTimeout(() => setFlashColor(null), 300);
            prevPriceRef.current = priceUsd;
        }
    }, [priceUsd]);

    return (
        <motion.div
            className={`flex flex-col relative ${className}`}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
        >
            {/* Flash overlay */}
            <AnimatePresence>
                {flashColor && (
                    <motion.div
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`absolute inset-0 rounded-lg ${flashColor === 'green' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                            }`}
                    />
                )}
            </AnimatePresence>

            {/* Symbol + Pulse */}
            <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-zinc-300">{symbol}</span>
                {status === 'LIVE' && (
                    <span className="relative flex h-2 w-2" title="Live from Coinbase">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                )}
                {status === 'LOW_ACTIVITY' && (
                    <span className="h-2 w-2 rounded-full bg-amber-500" title="Low activity" />
                )}
                {status === 'DISCONNECTED' && (
                    <span className="h-2 w-2 rounded-full bg-red-500" title="Disconnected" />
                )}
            </div>

            {/* Price */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={priceUsd}
                    initial={{ opacity: 0.8, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="text-2xl font-bold text-white tabular-nums tracking-tight"
                >
                    ${formatPrice(priceUsd)}
                </motion.div>
            </AnimatePresence>

            {/* 24h Change */}
            <div className="flex items-center gap-1 mt-1">
                {isPositive ? (
                    <TrendingUp size={12} className="text-emerald-400" />
                ) : (
                    <TrendingDown size={12} className="text-red-400" />
                )}
                <span className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{priceChange24h.toFixed(2)}%
                </span>
            </div>

            {/* Hover CTA */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="mt-2 text-xs text-orange-400 font-medium flex items-center gap-1"
                    >
                        Open Intelligence →
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
