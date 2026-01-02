/**
 * Data Freshness & Delay Detection
 *
 * Core principle: ALWAYS show users the truth about data delays
 * Trust > Beauty
 */

import { DataFreshness, DataStatus, OHLCPoint } from './types';

/**
 * Calculate data freshness status
 * Returns honest assessment of data age
 */
export function calculateDataFreshness(
  latestDataPoint: OHLCPoint | null,
  lastPollTime: number,
  pollingInterval: number
): DataFreshness {
  const now = Date.now();

  // No data yet
  if (!latestDataPoint) {
    return {
      status: 'paused',
      delaySeconds: 0,
      lastPollTime,
      nextPollTime: lastPollTime + pollingInterval,
    };
  }

  // Calculate how old the latest data point is
  const dataAge = now - latestDataPoint.timestamp;
  const delaySeconds = Math.floor(dataAge / 1000);

  // Determine status based on delay
  let status: DataStatus;

  if (delaySeconds < 10) {
    status = 'live'; // Less than 10 seconds = LIVE
  } else if (delaySeconds < 300) {
    status = 'delayed'; // 10s to 5min = DELAYED
  } else {
    status = 'paused'; // Over 5min = PAUSED
  }

  // Check if we're polling but not getting updates
  const timeSinceLastPoll = now - lastPollTime;
  if (timeSinceLastPoll > pollingInterval * 3) {
    status = 'error'; // Polling failed
  }

  return {
    status,
    delaySeconds,
    lastPollTime,
    nextPollTime: lastPollTime + pollingInterval,
  };
}

/**
 * Format delay for user display
 * Examples: "Live", "Delayed (30s)", "Paused (5m)"
 */
export function formatDelay(freshness: DataFreshness): string {
  switch (freshness.status) {
    case 'live':
      return 'Live';
    case 'delayed':
      return freshness.delaySeconds < 60
        ? `Delayed (${freshness.delaySeconds}s)`
        : `Delayed (${Math.floor(freshness.delaySeconds / 60)}m)`;
    case 'paused':
      const minutes = Math.floor(freshness.delaySeconds / 60);
      return minutes === 0 ? 'Paused' : `Paused (${minutes}m)`;
    case 'error':
      return 'Connection Error';
    default:
      return 'Unknown';
  }
}

/**
 * Get status color (for UI indicators)
 */
export function getStatusColor(status: DataStatus): string {
  switch (status) {
    case 'live':
      return '#10b981'; // emerald-500
    case 'delayed':
      return '#f59e0b'; // amber-500
    case 'paused':
      return '#6b7280'; // gray-500
    case 'error':
      return '#ef4444'; // red-500
    default:
      return '#6b7280';
  }
}

/**
 * Should we dim the chart due to delay?
 */
export function shouldDimChart(status: DataStatus): boolean {
  return status === 'delayed' || status === 'paused' || status === 'error';
}
