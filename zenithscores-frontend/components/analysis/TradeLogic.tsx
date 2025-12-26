'use client';

import type { TradeLogic as TradeLogicType } from '@/lib/types/market';
import { motion } from 'framer-motion';
import { Clock, Target, XCircle, Scale, AlertTriangle } from 'lucide-react';

interface TradeLogicProps {
    tradeLogic: TradeLogicType;
    symbol: string;
    className?: string;
}

const horizonLabels = {
    short: '1-4 Weeks',
    medium: '1-3 Months',
    long: '3-12 Months',
};

function formatPrice(price: number): string {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
}

export default function TradeLogic({ tradeLogic, symbol, className = '' }: TradeLogicProps) {
    const { horizon, entryZone, invalidationLevel, positionSizing } = tradeLogic;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Section Header */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">Trade Expression</h3>
                <p className="text-sm text-zinc-400">
                    <span className="italic">"If one were to express this view..."</span>
                    {' '}The following represents one possible framework for position structuring.
                    This is educational content only.
                </p>
            </div>

            {/* Educational Warning Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3"
            >
                <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-amber-300">Educational Content Only</p>
                    <p className="text-xs text-zinc-400 mt-1">
                        This is not financial advice. The following represents a hypothetical trade framework
                        for educational purposes. Consult with a qualified financial advisor before making
                        any investment decisions.
                    </p>
                </div>
            </motion.div>

            {/* Trade Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Time Horizon */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Clock size={16} className="text-blue-400" />
                        <h4 className="text-sm font-semibold text-white">Time Horizon</h4>
                    </div>
                    <p className="text-2xl font-bold text-white capitalize">{horizon}</p>
                    <p className="text-xs text-zinc-500 mt-1">{horizonLabels[horizon]}</p>
                </motion.div>

                {/* Position Sizing */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Scale size={16} className="text-purple-400" />
                        <h4 className="text-sm font-semibold text-white">Risk Allocation</h4>
                    </div>
                    <p className="text-2xl font-bold text-white">{positionSizing.riskPercent}%</p>
                    <p className="text-xs text-zinc-400 mt-1">{positionSizing.explanation}</p>
                </motion.div>

                {/* Entry Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 rounded-xl p-5"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Target size={16} className="text-emerald-400" />
                        <h4 className="text-sm font-semibold text-white">Potential Entry Zone</h4>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-emerald-400">{formatPrice(entryZone.min)}</span>
                        <span className="text-zinc-500">to</span>
                        <span className="text-lg font-bold text-emerald-400">{formatPrice(entryZone.max)}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">{entryZone.reasoning}</p>
                </motion.div>

                {/* Invalidation Level */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 rounded-xl p-5"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <XCircle size={16} className="text-red-400" />
                        <h4 className="text-sm font-semibold text-white">Invalidation Level</h4>
                    </div>
                    <p className="text-lg font-bold text-red-400">{formatPrice(invalidationLevel.price)}</p>
                    <p className="text-xs text-zinc-400 mt-2">{invalidationLevel.reasoning}</p>
                    <p className="text-[10px] text-red-400/60 mt-2 italic">
                        If price reaches this level, the thesis is considered invalid.
                    </p>
                </motion.div>
            </div>

            {/* Final Disclaimer */}
            <div className="mt-6 p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg">
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                    <strong>Important:</strong> The above represents one hypothetical expression of a market view
                    based on quantitative analysis. This is not investment advice. Trading involves substantial
                    risk of loss. Past performance does not guarantee future results. Never invest more than
                    you can afford to lose. ZenithScore is an educational platform and does not provide personalized
                    investment recommendations.
                </p>
            </div>
        </div>
    );
}
