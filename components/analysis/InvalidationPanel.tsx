'use client';

import { motion } from 'framer-motion';
import { AlertOctagon, TrendingDown, Zap, BarChart3, Link2 } from 'lucide-react';

interface InvalidationPanelProps {
    invalidations: string[];
    className?: string;
}

const iconMap: Record<number, typeof AlertOctagon> = {
    0: TrendingDown,
    1: BarChart3,
    2: Zap,
    3: Link2,
};

export default function InvalidationPanel({ invalidations, className = '' }: InvalidationPanelProps) {
    return (
        <div className={`space-y-4 ${className}`}>
            {/* Section Header */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">What Invalidates This Setup</h3>
                <p className="text-sm text-zinc-400">
                    Critical signals that would contradict the current thesis. If any of these occur,
                    the analysis should be reconsidered.
                </p>
            </div>

            {/* Warning Box */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-red-500/10 via-red-600/5 to-transparent border border-red-500/20 rounded-xl p-5"
            >
                <div className="flex items-center gap-2 mb-4">
                    <AlertOctagon size={20} className="text-red-400" />
                    <h4 className="font-semibold text-red-300">Invalidation Signals</h4>
                </div>

                <ul className="space-y-3">
                    {invalidations.map((signal, index) => {
                        const Icon = iconMap[index] ?? AlertOctagon;
                        return (
                            <motion.li
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start gap-3"
                            >
                                <div className="p-1.5 rounded bg-red-500/20 flex-shrink-0 mt-0.5">
                                    <Icon size={12} className="text-red-400" />
                                </div>
                                <span className="text-sm text-zinc-300">{signal}</span>
                            </motion.li>
                        );
                    })}
                </ul>
            </motion.div>

            {/* Risk Management Note */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                    <strong className="text-zinc-300">Risk Management Principle:</strong>{' '}
                    Professional traders define their exit criteria before entering a position.
                    If any invalidation signal occurs, the prudent action is to reassess rather than
                    hold and hope. Markets can remain irrational longer than portfolios can remain solvent.
                </p>
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-zinc-600 italic">
                These invalidation signals are based on technical analysis and may not capture
                all risk factors. Always conduct your own research and consult with a qualified
                financial advisor.
            </p>
        </div>
    );
}
