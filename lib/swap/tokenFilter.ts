/**
 * Token Filter
 * 
 * Filters obviously unswappable trash.
 * Does NOT pre-judge routes — that's Jupiter's job.
 */

export interface FilterableToken {
  address: string;
  symbol: string;
  decimals: number;
  liquidityUsd?: number;
  isFrozen?: boolean;
  isScam?: boolean;
  logoURI?: string;
}

/**
 * Check if token is tradeable (basic sanity checks only)
 * We do NOT filter based on "has route" — Jupiter handles that
 */
export function isTradeableToken(t: FilterableToken): boolean {
  return (
    !!t.address &&
    !!t.symbol &&
    t.decimals != null &&
    (t.liquidityUsd ?? 0) >= 30_000 && // Minimum liquidity threshold
    !t.isFrozen &&
    !t.isScam
  );
}

/**
 * Filter token list to only tradeable tokens
 */
export function filterTradeableTokens<T extends FilterableToken>(tokens: T[]): T[] {
  return tokens.filter(isTradeableToken);
}

/**
 * Check if token has minimum viability for swap
 * Less strict than isTradeableToken — for wallet tokens
 */
export function isSwappableToken(t: FilterableToken): boolean {
  return (
    !!t.address &&
    !!t.symbol &&
    t.decimals != null &&
    !t.isFrozen
  );
}
