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
