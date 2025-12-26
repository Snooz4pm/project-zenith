'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { OHLCV, RegimeType } from '@/lib/types/market';
import { getRegimeDisplay } from '@/lib/analysis/regime';

// Dynamic import to avoid SSR issues with lightweight-charts
const CandlestickChart = dynamic(() => import('./CandlestickChart'), { ssr: false });

interface MiniChartProps {
    symbol: string;
    name?: string;
    ohlcv: OHLCV[];
    regime: RegimeType;
    convictionScore?: number;
    price?: number;
    change24h?: number;
    onClick?: () => void;
    className?: string;
}

export default function MiniChart({
    symbol,
    name,
    ohlcv,
    regime,
    convictionScore,
    price,
    change24h,
    onClick,
    className = '',
}: MiniChartProps) {
    const regimeDisplay = getRegimeDisplay(regime);

    // Take last 60 candles for mini view
    const chartData = ohlcv.slice(-60);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
            className={`
        relative bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden
        cursor-pointer hover:border-zinc-600 transition-all duration-300
        group ${className}
      `}
        >
            {/* Regime Glow Effect */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `radial-gradient(ellipse at top, ${regimeDisplay.bgColor}, transparent 70%)`
                }}
            />

            {/* Header */}
            <div className="relative z-10 p-3 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-white text-sm">{symbol}</h4>
                    {name && <p className="text-xs text-zinc-500 truncate max-w-[100px]">{name}</p>}
                </div>

                <div className="flex items-center gap-2">
                    {convictionScore !== undefined && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${convictionScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                                convictionScore >= 70 ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-zinc-700/50 text-zinc-400'
                            }`}>
                            {convictionScore}
                        </span>
                    )}

                    <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded capitalize"
                        style={{
                            backgroundColor: regimeDisplay.bgColor,
                            color: regimeDisplay.color
                        }}
                    >
                        {regimeDisplay.label}
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="relative z-10 h-[100px] -mx-1">
                <CandlestickChart
                    data={chartData}
                    regime={regime}
                    height={100}
                />
            </div>

            {/* Footer */}
            <div className="relative z-10 p-3 pt-1 flex items-center justify-between border-t border-zinc-800/50">
                {price !== undefined && (
                    <span className="text-sm font-semibold text-white">
                        ${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                )}

                {change24h !== undefined && (
                    <span className={`text-xs font-medium ${change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                        {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                    </span>
                )}
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </motion.div>
    );
}
