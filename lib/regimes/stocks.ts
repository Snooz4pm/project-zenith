/**
 * Stocks Regime Detection (Finnhub)
 *
 * Calculates regime strength based on:
 * - S&P500 / NASDAQ movement
 * - Market breadth (advancers vs decliners)
 * - VIX (if available)
 */

import { RegimeData, classifyRegime } from './index';

interface StocksMetrics {
  indexMovement: number; // % change (S&P500 or NASDAQ)
  breadth: number; // -100 to +100 (advancers - decliners ratio)
  vix: number; // 0-100 (volatility index)
}

/**
 * Calculate stocks regime strength
 */
export function calculateStocksRegime(metrics: StocksMetrics): RegimeData {
  // Index movement contribution (0-35 points)
  const indexScore = Math.min(35, Math.abs(metrics.indexMovement) * 10);

  // Breadth contribution (0-35 points)
  // Positive breadth = bullish, negative = bearish, but both can be "strong"
  const breadthScore = Math.min(35, Math.abs(metrics.breadth) / 2.86);

  // VIX contribution (inverted - low VIX = high strength)
  // VIX < 20 = calm (good), VIX > 30 = fear (bad)
  const vixScore = Math.max(0, 30 - metrics.vix);

  // Calculate raw strength (0-100)
  const strength = Math.max(0, Math.min(100, indexScore + breadthScore + vixScore));

  // Volatility from VIX
  const volatility = Math.min(100, metrics.vix * 2);

  // Volume from breadth (high breadth = high participation)
  const volume = Math.min(100, 50 + Math.abs(metrics.breadth) / 2);

  return classifyRegime(strength, volatility, volume);
}

/**
 * Mock data generator for stocks
 */
export function generateMockStocksMetrics(): StocksMetrics {
  return {
    indexMovement: (Math.random() - 0.4) * 3, // -1.2% to +1.8%
    breadth: (Math.random() - 0.5) * 100, // -50 to +50
    vix: 15 + Math.random() * 25, // 15-40 (typical VIX range)
  };
}
