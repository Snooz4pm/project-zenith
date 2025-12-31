/**
 * Signal Detection Engine
 * Generates Live Pulse signals from OHLCV data
 */

import { PulseSignal, PulseCategory, PulseConfidence } from './types';
import type { OHLCV } from '@/lib/market-data/types';

// Helper: Generate unique signal ID
function generateSignalId(category: PulseCategory, type: string): string {
  return `${category}-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Calculate ATR (Average True Range)
function calculateATR(candles: OHLCV[], period: number = 14): number {
  if (candles.length < period) return 0;

  const trueRanges = candles.slice(0, period).map((candle, i) => {
    if (i === 0) return candle.high - candle.low;
    const prevClose = candles[i - 1].close;
    return Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - prevClose),
      Math.abs(candle.low - prevClose)
    );
  });

  return trueRanges.reduce((sum, tr) => sum + tr, 0) / period;
}

// Helper: Calculate volume average
function calculateVolumeAverage(candles: OHLCV[], period: number = 20): number {
  if (candles.length < period) return 0;
  const volumes = candles.slice(0, period).map(c => c.volume);
  return volumes.reduce((sum, v) => sum + v, 0) / period;
}

/**
 * DETECTOR 1: Volume Anomaly
 * Detects unusual volume spikes or drops
 */
export function detectVolumeAnomaly(candles: OHLCV[]): PulseSignal | null {
  if (candles.length < 20) return null;

  const latest = candles[0];
  const avgVolume = calculateVolumeAverage(candles, 20);

  if (avgVolume === 0) return null;

  const ratio = latest.volume / avgVolume;

  // Volume surge
  if (ratio >= 2.5) {
    const category: PulseCategory = 'strength';
    const confidence: PulseConfidence = ratio >= 4 ? 'high' : ratio >= 3 ? 'medium' : 'low';

    return {
      id: generateSignalId(category, 'volume-surge'),
      timestamp: Date.now(),
      category,
      message: `Volume surge +${Math.round((ratio - 1) * 100)}%`,
      confidence,
      ttl: 1800, // 30 minutes
      data: { volumeRatio: ratio, avgVolume }
    };
  }

  // Volume compression
  if (ratio <= 0.4) {
    return {
      id: generateSignalId('neutral', 'volume-compression'),
      timestamp: Date.now(),
      category: 'neutral',
      message: `Low participation (${Math.round(ratio * 100)}% of avg)`,
      confidence: 'medium',
      ttl: 3600, // 1 hour
      data: { volumeRatio: ratio }
    };
  }

  return null;
}

/**
 * DETECTOR 2: Range Detection
 * Detects when price is consolidating in a range
 */
export function detectRangeState(candles: OHLCV[]): PulseSignal | null {
  if (candles.length < 50) return null;

  const recent = candles.slice(0, 24); // Last 24 candles
  const high = Math.max(...recent.map(c => c.high));
  const low = Math.min(...recent.map(c => c.low));
  const range = high - low;
  const mid = (high + low) / 2;
  const rangePercent = (range / mid) * 100;

  // Tight range
  if (rangePercent < 2) {
    return {
      id: generateSignalId('neutral', 'range-tight'),
      timestamp: Date.now(),
      category: 'neutral',
      message: `Tight range for ${recent.length}h (${rangePercent.toFixed(1)}%)`,
      confidence: 'high',
      ttl: 7200, // 2 hours
      data: { high, low, rangePercent, duration: recent.length }
    };
  }

  return null;
}

/**
 * DETECTOR 3: Wick Rejections
 * Detects significant wick rejections (failed breakouts)
 */
export function detectWickRejection(candles: OHLCV[]): PulseSignal | null {
  if (candles.length < 5) return null;

  const latest = candles[0];
  const body = Math.abs(latest.close - latest.open);
  const upperWick = latest.high - Math.max(latest.open, latest.close);
  const lowerWick = Math.min(latest.open, latest.close) - latest.low;

  const wickRatio = Math.max(upperWick, lowerWick) / (body || 0.0001);

  // Upper wick rejection
  if (upperWick > body * 2 && wickRatio > 3) {
    return {
      id: generateSignalId('weakness', 'upper-rejection'),
      timestamp: Date.now(),
      category: 'weakness',
      message: `Rejection at $${latest.high.toLocaleString()}`,
      confidence: wickRatio > 5 ? 'high' : 'medium',
      ttl: 1800, // 30 minutes
      data: { level: latest.high, wickRatio }
    };
  }

  // Lower wick rejection (bullish)
  if (lowerWick > body * 2 && wickRatio > 3) {
    return {
      id: generateSignalId('strength', 'lower-rejection'),
      timestamp: Date.now(),
      category: 'strength',
      message: `Bounce off $${latest.low.toLocaleString()}`,
      confidence: wickRatio > 5 ? 'high' : 'medium',
      ttl: 1800,
      data: { level: latest.low, wickRatio }
    };
  }

  return null;
}

/**
 * DETECTOR 4: Volatility Compression
 * Detects when ATR is declining (coiling for a move)
 */
export function detectVolatilityCompression(candles: OHLCV[]): PulseSignal | null {
  if (candles.length < 30) return null;

  const currentATR = calculateATR(candles.slice(0, 14), 14);
  const previousATR = calculateATR(candles.slice(14, 28), 14);

  if (currentATR === 0 || previousATR === 0) return null;

  const atrChange = ((currentATR - previousATR) / previousATR) * 100;

  // Compression (ATR declining)
  if (atrChange < -20) {
    return {
      id: generateSignalId('neutral', 'volatility-compression'),
      timestamp: Date.now(),
      category: 'neutral',
      message: `Volatility compression (${Math.abs(atrChange).toFixed(0)}% decline)`,
      confidence: Math.abs(atrChange) > 40 ? 'high' : 'medium',
      ttl: 7200, // 2 hours
      data: { atrChange, currentATR, previousATR }
    };
  }

  // Expansion
  if (atrChange > 30) {
    return {
      id: generateSignalId('meta', 'volatility-expansion'),
      timestamp: Date.now(),
      category: 'meta',
      message: `Volatility expanding (+${atrChange.toFixed(0)}%)`,
      confidence: 'medium',
      ttl: 3600,
      data: { atrChange }
    };
  }

  return null;
}

/**
 * DETECTOR 5: Level Testing
 * Detects repeated tests of a price level
 */
export function detectLevelTesting(candles: OHLCV[], level: number): PulseSignal | null {
  if (candles.length < 20) return null;

  const tolerance = level * 0.005; // 0.5% tolerance
  const recent = candles.slice(0, 20);

  // Count touches
  const touches = recent.filter(c =>
    (c.high >= level - tolerance && c.high <= level + tolerance) ||
    (c.low >= level - tolerance && c.low <= level + tolerance)
  ).length;

  if (touches >= 3) {
    const isResistance = recent[0].close < level;

    return {
      id: generateSignalId('structure', 'level-testing'),
      timestamp: Date.now(),
      category: 'structure',
      message: `Testing ${isResistance ? 'resistance' : 'support'} (${touches}x touch)`,
      confidence: touches >= 5 ? 'high' : 'medium',
      ttl: 3600,
      data: { level, touches, type: isResistance ? 'resistance' : 'support' }
    };
  }

  return null;
}

/**
 * DETECTOR 6: Higher Lows / Lower Highs Pattern
 * Detects trending structure
 */
export function detectTrendStructure(candles: OHLCV[]): PulseSignal | null {
  if (candles.length < 10) return null;

  const swings = candles.slice(0, 10);
  const lows = swings.map(c => c.low);
  const highs = swings.map(c => c.high);

  // Check for higher lows (bullish structure)
  const higherLows = lows.slice(0, 5).every((low, i) =>
    i === 0 || low > lows[i - 1]
  );

  if (higherLows) {
    return {
      id: generateSignalId('strength', 'higher-lows'),
      timestamp: Date.now(),
      category: 'strength',
      message: 'Higher lows forming',
      confidence: 'medium',
      ttl: 3600,
      data: { pattern: 'higher-lows' }
    };
  }

  // Check for lower highs (bearish structure)
  const lowerHighs = highs.slice(0, 5).every((high, i) =>
    i === 0 || high < highs[i - 1]
  );

  if (lowerHighs) {
    return {
      id: generateSignalId('weakness', 'lower-highs'),
      timestamp: Date.now(),
      category: 'weakness',
      message: 'Lower highs compressing',
      confidence: 'medium',
      ttl: 3600,
      data: { pattern: 'lower-highs' }
    };
  }

  return null;
}

/**
 * MASTER FUNCTION: Generate all signals
 * Returns array of detected signals from all detectors
 */
export function generatePulseSignals(candles: OHLCV[]): PulseSignal[] {
  if (!candles || candles.length === 0) return [];

  // Sort newest first
  const sorted = [...candles].sort((a, b) => b.time - a.time);

  const signals: (PulseSignal | null)[] = [
    detectVolumeAnomaly(sorted),
    detectRangeState(sorted),
    detectWickRejection(sorted),
    detectVolatilityCompression(sorted),
    detectTrendStructure(sorted),
    // Can add level testing if we have support/resistance levels
  ];

  // Filter out nulls and return
  return signals.filter((s): s is PulseSignal => s !== null);
}
