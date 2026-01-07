'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface LiveSignal {
    type: 'entered' | 'improved' | 'invalidated';
    count: number;
    label: string;
}

interface LiveSignalsStripProps {
    signals?: LiveSignal[];
    className?: string;
}

const defaultSignals: LiveSignal[] = [
    { type: 'entered', count: 12, label: 'assets entered Algorithm Picks today' },
    { type: 'improved', count: 7, label: 'setups improved in conviction' },
    { type: 'invalidated', count: 3, label: 'setups invalidated due to volatility spike' },
];

const signalConfig = {
    entered: { icon: ArrowUpRight, color: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-500' },
    improved: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
    invalidated: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-500' },
};

export default function LiveSignalsStrip({
    signals = defaultSignals,
    className = '',
}: LiveSignalsStripProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`
        flex flex-wrap items-center justify-center gap-4 py-4 px-6
        bg-zinc-900/30 border-y border-zinc-800/50
        ${className}
      `}
        >
            {signals.map((signal, index) => {
                const config = signalConfig[signal.type];
                const Icon = config.icon;

                return (
                    <motion.div
                        key={signal.type}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-full
              ${config.bg}
            `}
                    >
                        <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
                        <span className={`text-sm font-semibold ${config.color}`}>
                            {signal.count}
                        </span>
                        <span className="text-xs text-zinc-400">
                            {signal.label}
                        </span>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
