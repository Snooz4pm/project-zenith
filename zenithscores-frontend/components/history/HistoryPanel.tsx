/**
 * HistoryPanel - Educational History View (Book Mode)
 * 
 * Shows historical events during replay.
 * Designed to feel like reading a book:
 * - Chapter framing
 * - Calm, factual tone
 * - "Continue" to proceed
 * - Key lessons
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, BookOpen, Clock, Lightbulb, X } from 'lucide-react';
import { MarketEvent } from '@/lib/history/events';

interface HistoryPanelProps {
    event: MarketEvent | null;
    onContinue: () => void;
    onClose: () => void;
    chapterNumber?: number;
    totalChapters?: number;
}

export default function HistoryPanel({
    event,
    onContinue,
    onClose,
    chapterNumber = 1,
    totalChapters = 1
}: HistoryPanelProps) {
    if (!event) return null;

    const importanceLabel = event.importance === 1
        ? 'Major Event'
        : event.importance === 2
            ? 'Significant Event'
            : 'Notable Event';

    const scopeLabel = event.scope === 'GLOBAL'
        ? 'Global Market Event'
        : event.scope === 'MARKET'
            ? `${event.market} Market Event`
            : `${event.symbol} Specific`;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl"
                >
                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <BookOpen className="text-amber-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500">
                                    Chapter {chapterNumber} of {totalChapters}
                                </p>
                                <p className="text-xs text-amber-400 font-medium">
                                    {scopeLabel}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-zinc-500 hover:text-white transition p-2"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Date */}
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Clock size={14} />
                            <span>{event.startDate}</span>
                            {event.endDate && (
                                <>
                                    <span>→</span>
                                    <span>{event.endDate}</span>
                                </>
                            )}
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-zinc-800 text-xs">
                                {importanceLabel}
                            </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-white leading-tight">
                            {event.title}
                        </h2>

                        {/* Summary */}
                        <p className="text-zinc-300 leading-relaxed">
                            {event.summary}
                        </p>

                        {/* Why It Mattered */}
                        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                            <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                                <Lightbulb size={14} />
                                Why It Mattered
                            </h3>
                            <p className="text-zinc-300 text-sm leading-relaxed">
                                {event.whyItMatters}
                            </p>
                        </div>

                        {/* What Happened Next */}
                        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                            <h3 className="text-sm font-semibold text-blue-400 mb-2">
                                What Happened Next
                            </h3>
                            <p className="text-zinc-300 text-sm leading-relaxed">
                                {event.whatHappenedNext}
                            </p>
                        </div>
                    </div>

                    {/* Footer / Continue */}
                    <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/50">
                        <button
                            onClick={onContinue}
                            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-xl text-white font-semibold transition flex items-center justify-center gap-2 group"
                        >
                            Continue
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="text-center text-xs text-zinc-600 mt-2">
                            Press Enter or click to continue the replay
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
