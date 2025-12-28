/**
 * LivePriceIndicator Component - PREMIUM VERSION
 * 
 * Bloomberg-adjacent. Clean. Alive.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { LiveStatus } from '@/lib/market/live/types';

// Currency symbol helper
function getCurrencySymbol(symbol: string): string {
    const upperSymbol = symbol.toUpperCase();
    let quoteCurrency = '';
    if (upperSymbol.includes('/')) {
        quoteCurrency = upperSymbol.split('/')[1];
    } else if (upperSymbol.length === 6) {
        quoteCurrency = upperSymbol.slice(3, 6);
    }

    if (quoteCurrency === 'JPY') return '¥';
    if (quoteCurrency === 'EUR') return '€';
    if (quoteCurrency === 'GBP') return '£';
    if (quoteCurrency === 'CHF') return 'CHF ';
    if (quoteCurrency === 'CAD') return 'C$';
    if (quoteCurrency === 'AUD') return 'A$';
    if (quoteCurrency === 'USD') return '$';

    return '$';
}

interface LivePriceIndicatorProps {
    price: number;
    previousClose: number;
    status: LiveStatus;
    delaySeconds?: number;
    symbol: string;
    className?: string;
}

export default function LivePriceIndicator({
    price,
    previousClose,
    status,
    delaySeconds = 0,
    symbol,
    className = '',
}: LivePriceIndicatorProps) {
    const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const prevPriceRef = useRef(price);

    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
    const isPositive = change >= 0;
    const currencySymbol = getCurrencySymbol(symbol);

    // Flash animation on price change
    useEffect(() => {
        if (prevPriceRef.current !== price && price > 0) {
            const direction = price > prevPriceRef.current ? 'green' : 'red';
            setFlashColor(direction);
            setTimeout(() => setFlashColor(null), 300);
            prevPriceRef.current = price;
        }
    }, [price]);

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
                    <span className="relative flex h-2 w-2" title="Live data">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                )}
                {status === 'DELAYED' && (
                    <span className="h-2 w-2 rounded-full bg-amber-500" title="Delayed" />
                )}
                {status === 'DISCONNECTED' && (
                    <span className="h-2 w-2 rounded-full bg-red-500" title="Disconnected" />
                )}
            </div>

            {/* Price */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={price}
                    initial={{ opacity: 0.8, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="text-2xl font-bold text-white tabular-nums tracking-tight"
                >
                    {currencySymbol}{price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}
                </motion.div>
            </AnimatePresence>

            {/* Change - only show if non-zero or market is open */}
            {(changePercent !== 0 || status === 'LIVE') && (
                <div className={`text-xs font-medium mt-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
                </div>
            )}

            {/* Hover CTA */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="mt-2 text-xs text-blue-400 font-medium flex items-center gap-1"
                    >
                        Open Intelligence →
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
