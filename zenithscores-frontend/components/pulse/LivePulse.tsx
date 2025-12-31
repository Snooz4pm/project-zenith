/**
 * Live Pulse Component
 * Real-time market signal stream - replaces static AI context
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PulseSignal, PulseCategory } from '@/lib/pulse/types';

interface LivePulseProps {
  signals: PulseSignal[];
  maxVisible?: number;
  onSignalClick?: (signal: PulseSignal) => void;
}

// Category styling
const categoryStyles: Record<PulseCategory, { bg: string; text: string; dot: string }> = {
  strength: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400'
  },
  weakness: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    dot: 'bg-red-400'
  },
  neutral: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    dot: 'bg-amber-400'
  },
  structure: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    dot: 'bg-blue-400'
  },
  meta: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    dot: 'bg-gray-400'
  }
};

// Confidence indicator
function ConfidenceIndicator({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const dots = confidence === 'high' ? 3 : confidence === 'medium' ? 2 : 1;

  return (
    <div className="flex gap-0.5">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={`h-1 w-1 rounded-full ${
            i < dots ? 'bg-zinc-400' : 'bg-zinc-700'
          }`}
        />
      ))}
    </div>
  );
}

// Time ago formatter
function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function LivePulse({ signals, maxVisible = 8, onSignalClick }: LivePulseProps) {
  const [visibleSignals, setVisibleSignals] = useState<PulseSignal[]>([]);
  const [timeUpdate, setTimeUpdate] = useState(0);

  // Filter expired signals and sort by timestamp
  const activeSignals = useMemo(() => {
    const now = Date.now();
    return signals
      .filter(s => (now - s.timestamp) / 1000 < s.ttl)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxVisible);
  }, [signals, maxVisible, timeUpdate]);

  // Update visible signals
  useEffect(() => {
    setVisibleSignals(activeSignals);
  }, [activeSignals]);

  // Update time ago every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUpdate(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (visibleSignals.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-500" />
            <h3 className="text-sm font-semibold text-zinc-300">LIVE PULSE</h3>
          </div>
          <span className="text-xs text-zinc-500">No active signals</span>
        </div>
        <p className="text-sm text-zinc-500">
          Market quiet. Signals will appear when patterns emerge.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-300">LIVE PULSE</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-400 font-medium">
            {visibleSignals.length} active
          </span>
        </div>
      </div>

      {/* Signal Feed */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {visibleSignals.map((signal, index) => {
            const style = categoryStyles[signal.category];
            const age = (Date.now() - signal.timestamp) / 1000;
            const lifePercent = Math.min((age / signal.ttl) * 100, 100);
            const opacity = Math.max(1 - (lifePercent / 100) * 0.6, 0.4); // Fade as it ages

            return (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{
                  opacity,
                  y: 0,
                  height: 'auto'
                }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`rounded-lg border border-zinc-800 ${style.bg} p-3 cursor-pointer hover:border-zinc-700 transition-colors`}
                onClick={() => onSignalClick?.(signal)}
              >
                <div className="flex items-start gap-3">
                  {/* Category Dot */}
                  <div className="mt-0.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${style.text}`}>
                      {signal.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-zinc-500">
                        {getTimeAgo(signal.timestamp)}
                      </span>
                      <ConfidenceIndicator confidence={signal.confidence} />
                    </div>
                  </div>
                </div>

                {/* Progress bar showing time to expiry */}
                <div className="mt-2 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${style.dot}`}
                    initial={{ width: '100%' }}
                    animate={{ width: `${100 - lifePercent}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div className="mt-4 pt-3 border-t border-zinc-800">
        <p className="text-xs text-zinc-500 text-center">
          Signals update every 2 minutes • Click signal to jump to chart
        </p>
      </div>
    </div>
  );
}
