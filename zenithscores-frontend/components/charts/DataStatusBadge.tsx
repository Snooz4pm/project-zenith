'use client';

import { motion } from 'framer-motion';
import { DataFreshness } from '@/lib/charts/types';
import { formatDelay, getStatusColor } from '@/lib/charts/dataFreshness';

interface DataStatusBadgeProps {
  freshness: DataFreshness;
}

/**
 * Status Badge Component
 *
 * Shows users the honest truth about data freshness
 * - Live = green pulse
 * - Delayed = amber with delay duration
 * - Paused = gray
 * - Error = red
 */
export default function DataStatusBadge({ freshness }: DataStatusBadgeProps) {
  const color = getStatusColor(freshness.status);
  const label = formatDelay(freshness);
  const isLive = freshness.status === 'live';

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {/* Status dot */}
      <motion.div
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
        animate={
          isLive
            ? {
                opacity: [0.6, 1, 0.6],
              }
            : undefined
        }
        transition={
          isLive
            ? {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : undefined
        }
      />

      {/* Status text */}
      <span style={{ color }} className="font-medium">
        {label}
      </span>
    </div>
  );
}
