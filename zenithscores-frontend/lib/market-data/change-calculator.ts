/**
 * Strict 24h Change Calculator
 * Rules:
 * - Inputs must be finite numbers
 * - Reference (prevClose) must be non-zero
 * - Throws error on invalid input (no silent failures)
 */
export function compute24hChange(
  current: number,
  reference: number
): number {
  if (!Number.isFinite(current)) {
    throw new Error(`Invalid current price: ${current}`);
  }
  if (!Number.isFinite(reference)) {
    throw new Error(`Invalid reference price: ${reference}`);
  }
  if (reference === 0) {
    throw new Error('Reference price cannot be zero');
  }

  return ((current - reference) / reference) * 100;
}

/**
 * Get color class for price change
 */
export function getChangeColorClass(change24h: number): string {
  if (change24h > 0) return 'text-green-500';
  if (change24h < 0) return 'text-red-500';
  return 'text-gray-400';
}

/**
 * Time-Based 24h Change (The Nuclear Rule)
 * Finds closest candle >= 24h ago
 */
export type ChangeResult = {
  change24h: number;
  status: 'LIVE' | 'CLOSED' | 'STALE';
};

export function computeTimeBased24hChange(
  series: Array<{ time: number; price: number }>
): ChangeResult {
  if (series.length < 2) {
    throw new Error('Not enough data to compute change');
  }

  // Sort newest -> oldest
  const sorted = series.sort((a, b) => b.time - a.time);

  const nowPrice = sorted[0].price;
  const nowTime = sorted[0].time;

  // Find closest candle >= 24h ago
  // 23 hours allows for slight jitter/slippage in candle times
  const ref = sorted.find(
    p => nowTime - p.time >= 23 * 60 * 60
  );

  if (!ref) {
    throw new Error('No 24h reference point found');
  }

  const change24h = ((nowPrice - ref.price) / ref.price) * 100;

  // Market status
  return {
    change24h,
    status: getMarketStatus(nowTime * 1000)
  };
}

/**
 * Determine market status based on data freshness
 * @param dataTimestampMs Unix timestamp of last data point in milliseconds
 */
export function getMarketStatus(dataTimestampMs: number): ChangeResult['status'] {
  const ageMs = Date.now() - dataTimestampMs;

  if (ageMs > 24 * 60 * 60 * 1000) return 'STALE';
  if (ageMs > 2 * 60 * 60 * 1000) return 'CLOSED';
  return 'LIVE';
}
