/**
 * HistoryModeButton - Trigger for entering history mode
 */

'use client';

import { motion } from 'framer-motion';
import { History, BookOpen } from 'lucide-react';

interface HistoryModeButtonProps {
    onClick: () => void;
    eventsCount: number;
    disabled?: boolean;
}

export default function HistoryModeButton({
    onClick,
    eventsCount,
    disabled = false
}: HistoryModeButtonProps) {
    if (eventsCount === 0) return null;

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition
                ${disabled
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-600/30'
                }
            `}
        >
            <BookOpen size={16} />
            <span className="text-sm font-medium">Review History</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-xs">
                {eventsCount} events
            </span>
        </motion.button>
    );
}
