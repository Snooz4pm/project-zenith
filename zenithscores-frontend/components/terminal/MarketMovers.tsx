'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import Link from 'next/link';

interface MarketMover {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    sparkline?: number[];
}

interface MarketMoversProps {
    title?: string;
    movers: MarketMover[];
    onSelect?: (symbol: string) => void;
    className?: string;
}

/**
 * Simple sparkline chart
 */
function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const height = 24;
    const width = 50;

    const points = data.map((value, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="flex-shrink-0">
            <polyline
                points={points}
                fill="none"
                stroke={positive ? '#22c55e' : '#ef4444'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/**
 * MarketMovers - Left panel component for Terminal View
 * Shows top movers with sparklines
 */
export default function MarketMovers({
    title = 'Market Movers',
    movers,
    onSelect,
    className = '',
}: MarketMoversProps) {
    return (
        <div className={`space-y-2 ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-2 px-2 mb-3">
                <Activity size={14} className="text-gray-500" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">{title}</span>
            </div>

            {/* Movers List */}
            <div className="space-y-1">
                {movers.map((mover, index) => (
                    <motion.div
                        key={mover.symbol}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onSelect?.(mover.symbol)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors group"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="flex-shrink-0">
                                {mover.change >= 0 ? (
                                    <TrendingUp size={12} className="text-emerald-400" />
                                ) : (
                                    <TrendingDown size={12} className="text-red-400" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                                    {mover.symbol}
                                </div>
                                <div className="text-[10px] text-gray-500 truncate">
                                    {mover.name}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {mover.sparkline && (
                                <Sparkline data={mover.sparkline} positive={mover.change >= 0} />
                            )}
                            <div className="text-right">
                                <div className="text-xs font-mono text-gray-300">
                                    ${mover.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className={`text-[10px] font-mono ${mover.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {mover.change >= 0 ? '+' : ''}{mover.changePercent.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* View All Link */}
            <div className="pt-2 px-2">
                <Link
                    href="/stocks"
                    className="text-[10px] text-gray-500 hover:text-cyan-400 transition-colors uppercase tracking-wide"
                >
                    View All →
                </Link>
            </div>
        </div>
    );
}
