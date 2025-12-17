'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Lightbulb, Award, AlertTriangle } from 'lucide-react';
import type { TradeFeedback } from '@/lib/coaching-engine';

interface TradeFeedbackCardProps {
    feedback: TradeFeedback;
}

const GRADE_COLORS = {
    'A': 'from-green-500 to-emerald-500',
    'B': 'from-blue-500 to-cyan-500',
    'C': 'from-yellow-500 to-orange-500',
    'D': 'from-orange-500 to-red-500',
    'F': 'from-red-500 to-red-700',
};

const GRADE_BG = {
    'A': 'bg-green-500/10 border-green-500/30',
    'B': 'bg-blue-500/10 border-blue-500/30',
    'C': 'bg-yellow-500/10 border-yellow-500/30',
    'D': 'bg-orange-500/10 border-orange-500/30',
    'F': 'bg-red-500/10 border-red-500/30',
};

export default function TradeFeedbackCard({ feedback }: TradeFeedbackCardProps) {
    const isWin = feedback.result === 'win';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-5 ${GRADE_BG[feedback.grade]}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{feedback.emoji}</span>
                    <div>
                        <h4 className="font-bold text-white">{feedback.symbol}</h4>
                        <p className="text-xs text-gray-400">Trade #{feedback.tradeId}</p>
                    </div>
                </div>

                {/* Grade Badge */}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADE_COLORS[feedback.grade]} flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">{feedback.grade}</span>
                </div>
            </div>

            {/* P&L */}
            <div className={`flex items-center gap-2 mb-4 ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                {isWin ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                <span className="font-mono font-bold text-lg">
                    {isWin ? '+' : ''}{feedback.pnl.toFixed(2)} USD
                </span>
                <span className="text-sm opacity-70">
                    ({isWin ? '+' : ''}{feedback.pnlPercent.toFixed(2)}%)
                </span>
            </div>

            {/* Coach Message */}
            <div className="mb-4 p-3 rounded-xl bg-white/5">
                <p className="text-sm text-gray-300 flex items-start gap-2">
                    <Award size={14} className="text-purple-400 mt-0.5 flex-shrink-0" />
                    {feedback.message}
                </p>
            </div>

            {/* Suggestions */}
            {feedback.suggestions.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Lightbulb size={12} className="text-yellow-400" />
                        Suggestions
                    </p>
                    {feedback.suggestions.map((suggestion, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                            <span className="text-cyan-400">→</span>
                            {suggestion}
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
