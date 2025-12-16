'use client';

import { motion } from 'framer-motion';
import { getZenithSignal, getMockTagline } from '@/lib/zenith';
import { formatNumber } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface Token {
    symbol: string;
    name: string;
    price_usd: number;
    price_change_24h: number; // mapped from API
    zenith_score: number;
    volume_24h: number;
    url: string;
}

interface HeroCardProps {
    token: Token;
}

export default function HeroCard({ token }: HeroCardProps) {
    const signal = getZenithSignal(token.zenith_score || 0);
    const isPositive = (token.price_change_24h || 0) >= 0;

    return (
        <motion.a
            href={`/crypto/${token.symbol}`}
            className="block relative min-w-[300px] glass-panel rounded-2xl p-6 overflow-hidden group cursor-pointer transition-all duration-300"
            whileHover={{ y: -6, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.6)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Hover Gradient Glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${signal.bg.replace('bg-', 'from-') || 'from-blue-500'} to-transparent`} />

            {/* Top Border Accent */}
            <div className={`absolute top-0 left-0 w-full h-1 ${signal.bg}`} />

            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold text-white font-sans">{token.symbol}</h3>
                        {/* Signal Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 ${signal.text} border border-white/10 backdrop-blur-sm`}>
                            {signal.label}
                        </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate max-w-[150px] font-mono">{token.name}</p>
                </div>

                {/* Price */}
                <div className="text-right">
                    <div className="text-lg font-bold text-white font-mono">
                        ${token.price_usd < 1 ? token.price_usd.toFixed(4) : token.price_usd.toFixed(2)}
                    </div>
                    <div className={`flex items-center justify-end text-sm font-medium ${isPositive ? 'text-zenith-green' : 'text-zenith-red'}`}>
                        {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        {Math.abs(token.price_change_24h || 0).toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* Tagline / Secondary Metrics Switcher */}
            <div className="h-12 relative mb-2 z-10">
                {/* Default Tagline - Fades out on hover */}
                <p className="text-sm text-gray-400 italic absolute top-0 left-0 w-full transition-opacity duration-300 opacity-100 group-hover:opacity-0">
                    "{getMockTagline(token.zenith_score || 0, token.price_change_24h || 0)}"
                </p>

                {/* Secondary Metrics - Fades in on hover */}
                <div className="flex gap-4 absolute top-0 left-0 w-full transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                    <div className="text-xs">
                        <div className="text-gray-500 font-bold uppercase tracking-wider">Volume</div>
                        <div className="text-white font-mono">Active</div>
                    </div>
                    <div className="text-xs">
                        <div className="text-gray-500 font-bold uppercase tracking-wider">Trend</div>
                        <div className="text-zenith-green font-mono">Strong Up</div>
                    </div>
                    <div className="text-xs">
                        <div className="text-gray-500 font-bold uppercase tracking-wider">Volat</div>
                        <div className="text-white font-mono">Low</div>
                    </div>
                </div>
            </div>

            {/* Zenith Score Bar */}
            <div className="relative z-10">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 font-semibold tracking-widest">ZENITH SCORE</span>
                    <span className={`font-bold font-mono ${signal.text}`}>{token.zenith_score?.toFixed(0) || 0}</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full ${signal.bg}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${token.zenith_score || 0}%` }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }} // smooth easeOut
                    />
                </div>
            </div>
        </motion.a>
    );
}
