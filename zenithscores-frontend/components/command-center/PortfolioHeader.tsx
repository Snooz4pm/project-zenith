'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PortfolioHeaderProps {
    balance: number;
    totalPnL: number;
    pnlPercent: number;
    isLoading?: boolean;
}

export default function PortfolioHeader({ balance, totalPnL, pnlPercent, isLoading }: PortfolioHeaderProps) {
    const [hideBalance, setHideBalance] = useState(false);
    const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y' | 'ALL'>('1D');

    const isPositive = totalPnL >= 0;
    const timeframes: ('1D' | '1W' | '1M' | '1Y' | 'ALL')[] = ['1D', '1W', '1M', '1Y', 'ALL'];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const formatCompactCurrency = (value: number) => {
        if (Math.abs(value) >= 1000000) {
            return `$${(value / 1000000).toFixed(2)}M`;
        } else if (Math.abs(value) >= 1000) {
            return `$${(value / 1000).toFixed(2)}K`;
        }
        return formatCurrency(value);
    };

    if (isLoading) {
        return (
            <div className="px-4 pt-6 pb-8 bg-[var(--void)]">
                <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse mb-2" />
                <div className="h-12 w-48 bg-white/5 rounded-lg animate-pulse mb-4" />
                <div className="h-6 w-24 bg-white/5 rounded-lg animate-pulse" />
            </div>
        );
    }

    return (
        <div className="px-4 pt-6 pb-8 bg-gradient-to-b from-[var(--void)] to-transparent">
            {/* Balance Section */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm text-[var(--text-secondary)] font-medium tracking-wide">Portfolio Value</h2>
                    <button
                        onClick={() => setHideBalance(!hideBalance)}
                        className="p-2 hover:bg-white/5 rounded-lg transition-all touch-target"
                    >
                        {hideBalance ? (
                            <EyeOff size={16} className="text-[var(--text-muted)]" />
                        ) : (
                            <Eye size={16} className="text-[var(--text-muted)]" />
                        )}
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {hideBalance ? (
                        <motion.div
                            key="hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-4xl font-bold text-white tracking-tight"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            ••••••
                        </motion.div>
                    ) : (
                        <motion.div
                            key="visible"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-4xl font-bold text-white tracking-tight"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            {formatCurrency(balance)}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* P&L */}
                <div className={`flex items-center gap-2 mt-2 ${isPositive ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'}`}>
                    {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span className="text-base font-bold font-mono">
                        {hideBalance ? '•••••' : `${isPositive ? '+' : ''}${formatCompactCurrency(totalPnL)}`}
                    </span>
                    <span className="text-sm font-medium">
                        ({hideBalance ? '•••' : `${isPositive ? '+' : ''}${pnlPercent.toFixed(2)}%`})
                    </span>
                    <span className="text-xs text-[var(--text-muted)] ml-1">Today</span>
                </div>
            </div>

            {/* Timeframe Selector - Robinhood Style */}
            <div className="flex items-center gap-1 bg-[rgba(255,255,255,0.02)] rounded-xl p-1 border border-white/5">
                {timeframes.map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all touch-target ${
                            timeframe === tf
                                ? 'bg-[var(--accent-mint)] text-black shadow-lg shadow-[var(--glow-mint)]'
                                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {tf}
                    </button>
                ))}
            </div>
        </div>
    );
}
