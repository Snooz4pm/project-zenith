/**
 * Crypto Regime Detection (DexScreener)
 *
 * Calculates regime strength based on:
 * - Volume change %
 * - Liquidity trends
 * - Number of pairs moving
 * - Price dispersion across tokens
 */

import { RegimeData, classifyRegime } from './index';

interface CryptoMetrics {
  volumeChange: number; // % change
  liquidityScore: number; // 0-100
  activePairs: number;
  priceDispersion: number; // standard deviation of price changes
}

/**
 * Calculate crypto regime strength from DexScreener data
 */
export function calculateCryptoRegime(metrics: CryptoMetrics): RegimeData {
  // Volume contribution (0-35 points)
  const volumeScore = Math.min(35, Math.abs(metrics.volumeChange) / 3);

  // Liquidity contribution (0-30 points)
  const liquidityScore = (metrics.liquidityScore / 100) * 30;

  // Active pairs contribution (0-20 points)
  // Assume healthy market has 50+ active pairs
  const pairsScore = Math.min(20, (metrics.activePairs / 50) * 20);

  // Dispersion penalty (reduces score if too chaotic)
  // Low dispersion = healthy, high dispersion = chaotic
  const dispersionPenalty = Math.min(15, metrics.priceDispersion / 2);

  // Calculate raw strength (0-100)
  const rawStrength = volumeScore + liquidityScore + pairsScore;
  const strength = Math.max(0, Math.min(100, rawStrength - dispersionPenalty));

  // Volatility proxy from dispersion
  const volatility = Math.min(100, metrics.priceDispersion * 2);

  // Volume proxy from volume change
  const volume = Math.min(100, Math.abs(metrics.volumeChange));

  return classifyRegime(strength, volatility, volume);
}

/**
 * Mock data generator for crypto (until real DexScreener integration)
 */
export function generateMockCryptoMetrics(): CryptoMetrics {
  return {
    volumeChange: (Math.random() - 0.3) * 100, // -30% to +70%
    liquidityScore: 40 + Math.random() * 50, // 40-90
    activePairs: Math.floor(20 + Math.random() * 60), // 20-80 pairs
    priceDispersion: Math.random() * 40, // 0-40
  };
}
