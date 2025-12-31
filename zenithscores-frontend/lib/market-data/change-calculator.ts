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
