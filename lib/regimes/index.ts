/**
 * Market Regime Detection System
 *
 * Calculates a Regime Strength Index (0-100) for different market types.
 * This is NOT price - it's a perception of market health/participation.
 */

export type RegimeType = 'trending' | 'ranging' | 'volatile' | 'illiquid';

export interface RegimeData {
  type: RegimeType;
  strength: number; // 0-100
  label: string; // e.g., "Trending (Strong)"
}

/**
 * Add micro-noise to make the chart feel alive
 */
export function addMicroNoise(value: number): number {
  const noise = (Math.random() - 0.5) * 2; // ±1
  return Math.max(0, Math.min(100, value + noise));
}

/**
 * Smooth transition between values (no jumps)
 */
export function smoothTransition(
  current: number[],
  target: number,
  steps: number = 5
): number[] {
  const lastValue = current[current.length - 1] || 50;
  const step = (target - lastValue) / steps;

  const newValues = [...current];
  for (let i = 1; i <= steps; i++) {
    newValues.push(addMicroNoise(lastValue + step * i));
  }

  // Keep only last 30 data points
  return newValues.slice(-30);
}

/**
 * Classify regime based on strength score
 */
export function classifyRegime(
  strength: number,
  volatility: number,
  volume: number
): RegimeData {
  // Illiquid: low volume, low strength
  if (volume < 30 && strength < 40) {
    return {
      type: 'illiquid',
      strength,
      label: strength < 20 ? 'Dormant' : 'Illiquid',
    };
  }

  // Volatile: high volatility, moderate strength
  if (volatility > 60) {
    return {
      type: 'volatile',
      strength,
      label: volatility > 75 ? 'Chaotic' : 'Volatile',
    };
  }

  // Trending: high strength, moderate volatility
  if (strength > 60 && volatility < 50) {
    return {
      type: 'trending',
      strength,
      label: strength > 75 ? 'Trending (Strong)' : 'Trending',
    };
  }

  // Ranging: moderate strength, low volatility
  return {
    type: 'ranging',
    strength,
    label: 'Ranging',
  };
}
