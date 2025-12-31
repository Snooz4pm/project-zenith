/**
 * Market Change Calculator
 *
 * Returns null for unavailable data instead of fake 0.00%
 * Ensures honest market data representation
 */

export interface ChangeResult {
  change24h: number | null;
  changePercent: number | null;
}

/**
 * Compute 24h percentage change
 * @param current - Current price
 * @param reference - Reference price (24h ago for crypto, previous close for stocks/forex)
 * @returns null if data unavailable, otherwise percentage change
 */
export function compute24hChange(
  current?: number | null,
  reference?: number | null
): number | null {
  // Validate inputs
  if (
    !Number.isFinite(current) ||
    !Number.isFinite(reference) ||
    current === null ||
    reference === null ||
    reference === 0
  ) {
    return null;
  }

  return ((current - reference) / reference) * 100;
}

/**
 * Asset-specific change calculation
 */
export function computeCryptoChange(currentPrice: number | null, price24hAgo: number | null): number | null {
  return compute24hChange(currentPrice, price24hAgo);
}

export function computeStockChange(currentPrice: number | null, previousClose: number | null): number | null {
  return compute24hChange(currentPrice, previousClose);
}

export function computeForexChange(currentPrice: number | null, yesterdayClose: number | null): number | null {
  return compute24hChange(currentPrice, yesterdayClose);
}

/**
 * Format change for display
 * @param change - Percentage change or null
 * @returns Formatted string with sign, or null
 */
export function formatChange(change: number | null): string | null {
  if (change === null) return null;

  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Get change color class for UI
 */
export function getChangeColorClass(change: number | null): string {
  if (change === null) return 'text-muted';
  if (change > 0) return 'text-accent-mint';
  if (change < 0) return 'text-accent-danger';
  return 'text-muted';
}
