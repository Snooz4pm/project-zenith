/**
 * Forex Regime Detection (Alpha Vantage)
 *
 * Calculates regime strength based on:
 * - DXY (USD strength)
 * - Major pairs volatility
 * - ATR or volatility proxy
 */

import { RegimeData, classifyRegime } from './index';

interface ForexMetrics {
  dxyStrength: number; // -100 to +100 (negative = weak USD, positive = strong USD)
  volatility: number; // 0-100
  trend: number; // -100 to +100 (directional bias)
}

/**
 * Calculate forex regime strength
 */
export function calculateForexRegime(metrics: ForexMetrics): RegimeData {
  // DXY contribution (0-40 points)
  // Strong USD OR strong counter-trend = high score
  const dxyScore = Math.min(40, Math.abs(metrics.dxyStrength) / 2.5);

  // Trend strength (0-40 points)
  const trendScore = Math.min(40, Math.abs(metrics.trend) / 2.5);

  // Volatility contribution (0-20 points, but penalizes if too high)
  // Moderate volatility is good, extreme is bad
  const volatilityScore =
    metrics.volatility < 50
      ? (metrics.volatility / 50) * 20
      : Math.max(0, 20 - (metrics.volatility - 50) / 2.5);

  // Calculate raw strength (0-100)
  const strength = Math.max(0, Math.min(100, dxyScore + trendScore + volatilityScore));

  // Volume proxy (forex is always liquid, so higher baseline)
  const volume = 60 + Math.random() * 30; // 60-90 (forex never truly illiquid)

  return classifyRegime(strength, metrics.volatility, volume);
}

/**
 * Mock data generator for forex
 */
export function generateMockForexMetrics(): ForexMetrics {
  return {
    dxyStrength: (Math.random() - 0.5) * 80, // -40 to +40
    volatility: 20 + Math.random() * 50, // 20-70 (lower than crypto)
    trend: (Math.random() - 0.5) * 100, // -50 to +50
  };
}
