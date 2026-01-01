'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';

interface AssetCardProps {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    holdings?: number;
    value?: number;
    icon?: string;
    index: number;
    href: string;
}

export default function AssetCard({
    symbol,
    name,
    price,
    change24h,
    holdings,
    value,
    icon,
    index,
    href
}: AssetCardProps) {
    const isPositive = change24h >= 0;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val);
    };

    const formatCompact = (val: number) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
        return formatCurrency(val);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
        >
            <Link href={href}>
                <div className="group flex items-center justify-between p-4 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] border border-white/5 rounded-2xl transition-all active:scale-[0.98] touch-target">
                    {/* Left: Icon + Name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Icon */}
                        <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-[var(--accent-mint)]/20 to-[var(--accent-cyan)]/20 flex items-center justify-center flex-shrink-0 border border-white/10">
                            {icon ? (
                                <img src={icon} alt={symbol} className="w-7 h-7 rounded-full" />
                            ) : (
                                <span className="text-lg font-bold text-white">{symbol.charAt(0)}</span>
                            )}
                            {/* Trend indicator */}
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                                isPositive ? 'bg-[var(--accent-mint)]' : 'bg-[var(--accent-danger)]'
                            }`}>
                                {isPositive ? <TrendingUp size={10} className="text-black" /> : <TrendingDown size={10} className="text-black" />}
                            </div>
                        </div>

                        {/* Symbol + Name */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white text-base truncate" style={{ fontFamily: 'var(--font-display)' }}>
                                    {symbol}
                                </h3>
                                {holdings !== undefined && (
                                    <span className="text-xs text-[var(--text-muted)] font-mono">
                                        {holdings.toFixed(4)}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] truncate">{name}</p>
                        </div>
                    </div>

                    {/* Right: Price + Change */}
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="font-bold text-white text-base font-mono">
                                {value !== undefined ? formatCompact(value) : formatCurrency(price)}
                            </div>
                            <div className={`text-sm font-bold font-mono ${
                                isPositive ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'
                            }`}>
                                {isPositive ? '+' : ''}{change24h.toFixed(2)}%
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-[var(--text-muted)] group-hover:text-white transition-colors" />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
