/**
 * Sliding Window Logic
 *
 * Keeps charts anchored to NOW
 * - Right edge = latest data
 * - History flows left
 * - Auto-drops oldest candles
 */

import { OHLCPoint } from './types';

export interface SlidingWindowConfig {
  maxCandles: number; // Maximum candles to keep (e.g., 100)
  autoScroll: boolean; // Keep NOW visible
}

/**
 * Apply sliding window to OHLC data
 * Keeps only the most recent N candles
 */
export function applySlidingWindow(
  data: OHLCPoint[],
  config: SlidingWindowConfig
): OHLCPoint[] {
  if (!config.autoScroll) {
    return data; // User can scroll manually
  }

  // Keep only last N candles
  if (data.length > config.maxCandles) {
    return data.slice(-config.maxCandles);
  }

  return data;
}

/**
 * Merge new data point into existing data
 * Handles both updates to latest candle and new candles
 */
export function mergeNewData(
  existingData: OHLCPoint[],
  newPoint: OHLCPoint,
  interval: number // Candle interval in milliseconds
): OHLCPoint[] {
  if (existingData.length === 0) {
    return [newPoint];
  }

  const latest = existingData[existingData.length - 1];
  const timeDiff = newPoint.timestamp - latest.timestamp;

  // If new point is within the same interval, update latest candle
  if (timeDiff < interval) {
    const updated = [...existingData];
    updated[updated.length - 1] = {
      ...latest,
      high: Math.max(latest.high, newPoint.high),
      low: Math.min(latest.low, newPoint.low),
      close: newPoint.close,
      volume: (latest.volume || 0) + (newPoint.volume || 0),
    };
    return updated;
  }

  // New candle - append it
  return [...existingData, newPoint];
}

/**
 * Calculate price bounds for chart scaling
 */
export function calculatePriceBounds(data: OHLCPoint[]): {
  min: number;
  max: number;
} {
  if (data.length === 0) {
    return { min: 0, max: 100 };
  }

  let min = Infinity;
  let max = -Infinity;

  for (const point of data) {
    min = Math.min(min, point.low);
    max = Math.max(max, point.high);
  }

  // Add 2% padding
  const padding = (max - min) * 0.02;
  return {
    min: min - padding,
    max: max + padding,
  };
}
