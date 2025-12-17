'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, TrendingUp, TrendingDown, Flame, Snowflake,
    Zap, AlertTriangle, Target, Award, Lock, ChevronRight, Star
} from 'lucide-react';
import { isPremiumUser } from '@/lib/premium';
import { generatePulseData, type PulseData } from '@/lib/pulse-engine';

interface ThreeHourPulseProps {
    assets?: { symbol: string; score: number; change: number }[];
}

const MOOD_COLORS = {
    'risk-on': 'from-green-500 to-emerald-500',
    'risk-off': 'from-red-500 to-orange-500',
    'neutral': 'from-yellow-500 to-amber-500',
};

const MOOD_BG = {
    'risk-on': 'bg-green-500/10 border-green-500/30',
    'risk-off': 'bg-red-500/10 border-red-500/30',
    'neutral': 'bg-yellow-500/10 border-yellow-500/30',
};

const ALERT_PULSE = {
    'calm': 'animate-pulse',
    'active': 'animate-pulse',
    'volatile': 'animate-ping',
};

export default function ThreeHourPulse({ assets = [] }: ThreeHourPulseProps) {
    const [premium, setPremium] = useState(false);
    const [pulse, setPulse] = useState<PulseData | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        setPremium(isPremiumUser());

        // Generate demo assets if none provided
        const demoAssets = assets.length > 0 ? assets : [
            { symbol: 'NVDA', score: 92, change: 4.5 },
            { symbol: 'BTC', score: 85, change: 2.1 },
            { symbol: 'TSLA', score: 78, change: -1.2 },
            { symbol: 'ETH', score: 72, change: 1.8 },
            { symbol: 'SOL', score: 68, change: 3.2 },
            { symbol: 'AAPL', score: 45, change: -0.5 },
            { symbol: 'META', score: 38, change: -2.1 },
            { symbol: 'XRP', score: 32, change: -4.2 },
        ];

        setPulse(generatePulseData(demoAssets));

        // Refresh every minute to update countdown
        const interval = setInterval(() => {
            setPulse(generatePulseData(demoAssets));
        }, 60000);

        return () => clearInterval(interval);
    }, [assets]);

    if (!pulse) return null;

    // Locked view for free users
    if (!premium) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f3460]/80 p-6 backdrop-blur-xl overflow-hidden"
            >
                {/* Blur overlay */}
                <div className="absolute inset-0 backdrop-blur-sm bg-black/30 z-10 flex flex-col items-center justify-center">
                    <Lock className="w-8 h-8 text-purple-400 mb-2" />
                    <p className="text-white font-bold">3-Hour Market Pulse</p>
                    <p className="text-xs text-gray-400 mb-3">Real-time market intelligence every 3 hours</p>
                    <span className="text-[10px] text-purple-400 flex items-center gap-1">
                        <Star size={10} /> Premium Feature
                    </span>
                </div>

                {/* Blurred content */}
                <div className="blur-sm opacity-50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20" />
                        <div className="h-4 w-32 bg-white/10 rounded" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-20 bg-white/5 rounded-xl" />
                        <div className="h-20 bg-white/5 rounded-xl" />
                        <div className="h-20 bg-white/5 rounded-xl" />
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border ${MOOD_BG[pulse.marketMood]} p-5 backdrop-blur-xl cursor-pointer transition-all`}
            onClick={() => setExpanded(!expanded)}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`relative p-2 rounded-xl bg-gradient-to-br ${MOOD_COLORS[pulse.marketMood]}`}>
                        <Zap size={20} className="text-white" />
                        <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white ${ALERT_PULSE[pulse.alertLevel]}`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white flex items-center gap-2">
                            3-Hour Pulse
                            <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">Live</span>
                        </h3>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={10} />
                            Next pulse in {pulse.timeUntilNext}
                        </p>
                    </div>
                </div>

                {/* Market Mood Badge */}
                <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${MOOD_COLORS[pulse.marketMood]}`}>
                    <span className="text-sm font-bold text-white uppercase">
                        {pulse.marketMood.replace('-', ' ')}
                    </span>
                </div>
            </div>

            {/* Hot & Cold Assets */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Hot */}
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-[10px] text-gray-500 flex items-center gap-1 mb-2">
                        <Flame size={10} className="text-orange-400" />
                        HOT RIGHT NOW
                    </p>
                    {pulse.hotAssets.map((asset, i) => (
                        <div key={asset.symbol} className="flex items-center justify-between py-1">
                            <span className="text-sm font-bold text-white">{asset.symbol}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-green-400 font-mono">+{asset.change.toFixed(1)}%</span>
                                <span className="text-xs text-gray-500">{asset.score}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cold */}
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-[10px] text-gray-500 flex items-center gap-1 mb-2">
                        <Snowflake size={10} className="text-blue-400" />
                        COOLING OFF
                    </p>
                    {pulse.coldAssets.map((asset, i) => (
                        <div key={asset.symbol} className="flex items-center justify-between py-1">
                            <span className="text-sm font-bold text-white">{asset.symbol}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-red-400 font-mono">{asset.change.toFixed(1)}%</span>
                                <span className="text-xs text-gray-500">{asset.score}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Your Edge */}
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-3">
                <p className="text-[10px] text-purple-400 flex items-center gap-1 mb-1">
                    <Target size={10} />
                    YOUR EDGE THIS HOUR
                </p>
                <p className="text-sm text-white">{pulse.yourEdge}</p>
            </div>

            {/* Trading Bias */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                    <p className="text-[10px] text-gray-500">TRADING BIAS</p>
                    <p className="text-sm text-cyan-400 font-medium">{pulse.tradingBias}</p>
                </div>
                <ChevronRight size={16} className={`text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3"
                    >
                        <div className="p-3 rounded-xl bg-white/5 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Alert Level</span>
                                <span className={`font-bold ${pulse.alertLevel === 'volatile' ? 'text-red-400' :
                                        pulse.alertLevel === 'active' ? 'text-yellow-400' : 'text-green-400'
                                    }`}>{pulse.alertLevel.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Last Updated</span>
                                <span className="text-white">{pulse.timestamp.toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
