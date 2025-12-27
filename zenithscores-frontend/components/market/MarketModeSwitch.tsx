/**
 * MarketModeSwitch Component
 * 
 * Toggle between LIVE and REPLAY modes.
 * Clean teardown on switch - no state bleed.
 */

'use client';

import { motion } from 'framer-motion';
import { Radio, History } from 'lucide-react';
import { MarketMode } from '@/lib/market/live/types';

interface MarketModeSwitchProps {
    mode: MarketMode;
    onModeChange: (mode: MarketMode) => void;
    className?: string;
}

export default function MarketModeSwitch({
    mode,
    onModeChange,
    className = '',
}: MarketModeSwitchProps) {
    return (
        <div className={`inline-flex items-center bg-zinc-900 rounded-xl p-1 ${className}`}>
            {/* LIVE Button */}
            <button
                onClick={() => onModeChange(MarketMode.LIVE)}
                className={`
          relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
          transition-colors duration-200
          ${mode === MarketMode.LIVE
                        ? 'text-white'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }
        `}
            >
                {mode === MarketMode.LIVE && (
                    <motion.div
                        layoutId="mode-bg"
                        className="absolute inset-0 bg-emerald-600 rounded-lg"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                )}
                <span className="relative flex items-center gap-2">
                    <Radio size={14} />
                    LIVE
                </span>
            </button>

            {/* REPLAY Button */}
            <button
                onClick={() => onModeChange(MarketMode.REPLAY)}
                className={`
          relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
          transition-colors duration-200
          ${mode === MarketMode.REPLAY
                        ? 'text-white'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }
        `}
            >
                {mode === MarketMode.REPLAY && (
                    <motion.div
                        layoutId="mode-bg"
                        className="absolute inset-0 bg-blue-600 rounded-lg"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                )}
                <span className="relative flex items-center gap-2">
                    <History size={14} />
                    REPLAY
                </span>
            </button>
        </div>
    );
}
