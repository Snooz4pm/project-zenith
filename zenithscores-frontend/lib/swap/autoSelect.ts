/**
 * Auto-Select Logic
 * 
 * FROM — highest USD value token in wallet
 * TO — different token, highest liquidity
 * 
 * 🚫 Guarantees no SOL → SOL calls
 */

export interface SelectableToken {
  address: string;
  symbol: string;
  priceUsd?: number;
  liquidityUsd?: number;
}

/**
 * Auto-select FROM token (highest USD balance)
 */
export function autoSelectFrom(
  balances: Record<string, number>,
  tokens: SelectableToken[]
): SelectableToken | null {
  let best: SelectableToken | null = null;
  let maxUsd = 0;

  for (const t of tokens) {
    const bal = balances[t.address] || 0;
    const usd = bal * (t.priceUsd || 0);

    if (usd > maxUsd && bal > 0) {
      maxUsd = usd;
      best = t;
    }
  }

  return best;
}

/**
 * Auto-select TO token (different from FROM, highest liquidity)
 */
export function autoSelectTo(
  from: SelectableToken | null,
  tokens: SelectableToken[]
): SelectableToken | null {
  if (!from) return tokens[0] || null;

  const candidates = tokens
    .filter(t => t.address !== from.address)
    .sort((a, b) => (b.liquidityUsd || 0) - (a.liquidityUsd || 0));

  return candidates[0] || null;
}

/**
 * Find best FROM token from wallet balances
 * Prioritizes SOL, USDC, then by USD value
 */
export function selectBestFromToken(
  walletTokens: Array<{ address: string; symbol: string; uiBalance: number; priceUsd?: number }>
): typeof walletTokens[0] | null {
  if (walletTokens.length === 0) return null;

  // Priority order
  const priority = ['SOL', 'USDC', 'USDT'];
  
  // Check priority tokens first (if they have balance)
  for (const symbol of priority) {
    const token = walletTokens.find(t => t.symbol === symbol && t.uiBalance > 0);
    if (token) return token;
  }

  // Fall back to highest USD balance
  return walletTokens
    .filter(t => t.uiBalance > 0)
    .sort((a, b) => {
      const aUsd = a.uiBalance * (a.priceUsd || 0);
      const bUsd = b.uiBalance * (b.priceUsd || 0);
      return bUsd - aUsd;
    })[0] || null;
}
