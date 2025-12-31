'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PulseSignal } from '@/lib/pulse/types';

interface MarketLogProps {
    signals: PulseSignal[];
    className?: string;
    maxVisible?: number;
}

/**
 * MARKET LOG - The "Terminal-style" feed
 * Design: Monospace, Commit-log style, Trust-building
 */
export default function MarketLog({ signals, className = '', maxVisible = 6 }: MarketLogProps) {
    // Sort buy timestamp descending (newest first)
    // Filter out expired signals
    const activeSignals = useMemo(() => {
        const now = Date.now();
        return signals
            .filter(s => (now - s.timestamp) / 1000 < s.ttl)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, maxVisible);
    }, [signals, maxVisible]);

    if (activeSignals.length === 0) {
        return (
            <div className={`font-mono text-xs text-gray-600 p-4 ${className}`}>
                <span className="opacity-50">[SYSTEM] Listening for market signals...</span>
            </div>
        );
    }

    return (
        <div className={`font-mono text-xs space-y-1 ${className}`}>
            <AnimatePresence initial={false}>
                {activeSignals.map((signal) => {
                    const date = new Date(signal.timestamp);
                    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                    const tag = getTagFromMessage(signal.message);
                    const content = signal.message.replace(tag, '').trim().replace(/^—\s*/, '');

                    return (
                        <motion.div
                            key={signal.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-start gap-2 text-gray-400 hover:text-gray-200 transition-colors group"
                        >
                            {/* Timestamp */}
                            <span className="text-gray-600 shrink-0">
                                [{timeStr}]
                            </span>

                            {/* Log Line */}
                            <span className="break-words">
                                <span className={`${getTagColor(tag)} font-bold`}>{tag}</span>
                                <span className="mx-1.5 text-gray-600">—</span>
                                <span>{content}</span>
                            </span>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Timeline Line (Subtle) */}
            <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-800/30 -z-10 hidden" />
        </div>
    );
}

// Helpers
function getTagFromMessage(msg: string): string {
    const match = msg.match(/^([A-Z_]+)/);
    return match ? match[1] : 'SIGNAL';
}

function getTagColor(tag: string): string {
    if (tag.includes('FALSE_BREAK')) return 'text-orange-400';
    if (tag.includes('VOL_COMPRESSION')) return 'text-blue-400';
    if (tag.includes('VOLUME_SPIKE')) return 'text-yellow-400';
    if (tag.includes('RANGE')) return 'text-gray-400';
    if (tag.includes('REGIME')) return 'text-emerald-400';
    if (tag.includes('LIQUIDITY')) return 'text-purple-400';
    return 'text-gray-400';
}
