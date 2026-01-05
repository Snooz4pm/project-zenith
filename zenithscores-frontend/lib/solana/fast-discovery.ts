/**
 * Optimized Token Discovery for Sub-200ms Load
 * 
 * Strategy:
 * 1. Serve stale-while-revalidate from cache
 * 2. Pre-computed "hot" token list (top 100)
 * 3. Background refresh
 * 4. Lazy load full list
 */

import { SolanaToken, SOL_MINT, USDC_MINT, USDT_MINT } from './types';
import { getCache, setCache } from './cache';

// Cache keys for fast path
const CACHE_KEYS = {
  HOT_TOKENS: 'solana-hot-tokens',      // Top 100 pre-validated
  FULL_TOKENS: 'solana-full-tokens',    // Full list
  LAST_REFRESH: 'solana-last-refresh',  // Timestamp
};

// TTLs
const TTL = {
  HOT_TOKENS: 5 * 60 * 1000,      // 5 minutes (frequently refreshed)
  FULL_TOKENS: 30 * 60 * 1000,   // 30 minutes
  STALE_OK: 60 * 60 * 1000,      // 1 hour (serve stale if needed)
};

// Pre-baked verified tokens (always included, instant load)
const VERIFIED_TOKENS: SolanaToken[] = [
  {
    mint: USDC_MINT,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    liquidityUsd: 500_000_000,
    sources: ['raydium', 'orca'],
    poolAddresses: [],
    isSwappable: true,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  {
    mint: USDT_MINT,
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    liquidityUsd: 200_000_000,
    sources: ['raydium', 'orca'],
    poolAddresses: [],
    isSwappable: true,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
  },
  {
    mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    symbol: 'mSOL',
    name: 'Marinade staked SOL',
    decimals: 9,
    liquidityUsd: 100_000_000,
    sources: ['raydium', 'orca'],
    poolAddresses: [],
    isSwappable: true,
  },
  {
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    symbol: 'BONK',
    name: 'Bonk',
    decimals: 5,
    liquidityUsd: 50_000_000,
    sources: ['raydium', 'orca'],
    poolAddresses: [],
    isSwappable: true,
  },
  {
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    symbol: 'JUP',
    name: 'Jupiter',
    decimals: 6,
    liquidityUsd: 80_000_000,
    sources: ['raydium', 'orca'],
    poolAddresses: [],
    isSwappable: true,
  },
  {
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    symbol: 'RAY',
    name: 'Raydium',
    decimals: 6,
    liquidityUsd: 30_000_000,
    sources: ['raydium'],
    poolAddresses: [],
    isSwappable: true,
  },
  {
    mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    symbol: 'ORCA',
    name: 'Orca',
    decimals: 6,
    liquidityUsd: 20_000_000,
    sources: ['orca'],
    poolAddresses: [],
    isSwappable: true,
  },
  {
    mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
    symbol: 'PYTH',
    name: 'Pyth Network',
    decimals: 6,
    liquidityUsd: 25_000_000,
    sources: ['raydium', 'orca'],
    poolAddresses: [],
    isSwappable: true,
  },
];

/**
 * Get hot tokens (instant, <50ms)
 * Returns verified + cached top tokens
 */
export function getHotTokens(): SolanaToken[] {
  // Always return verified tokens first
  const verified = [...VERIFIED_TOKENS];
  
  // Try to get cached hot tokens
  const cached = getCache<SolanaToken[]>(CACHE_KEYS.HOT_TOKENS, TTL.STALE_OK);
  
  if (cached) {
    // Merge: verified first, then cached (deduped)
    const verifiedMints = new Set(verified.map(t => t.mint));
    const additional = cached.filter(t => !verifiedMints.has(t.mint));
    return [...verified, ...additional].slice(0, 100);
  }
  
  return verified;
}

/**
 * Set hot tokens cache
 */
export function setHotTokens(tokens: SolanaToken[]): void {
  // Only cache top 100 by liquidity
  const sorted = [...tokens]
    .filter(t => t.isSwappable)
    .sort((a, b) => b.liquidityUsd - a.liquidityUsd)
    .slice(0, 100);
  
  setCache(CACHE_KEYS.HOT_TOKENS, sorted);
}

/**
 * Fast initial response
 * Returns immediately with best available data
 */
export async function getFastTokenResponse(options?: {
  limit?: number;
  search?: string;
}): Promise<{
  tokens: SolanaToken[];
  source: 'verified' | 'cache' | 'fresh';
  stale: boolean;
}> {
  const { limit = 50, search } = options ?? {};
  
  // 1. Try hot tokens (instant)
  let tokens = getHotTokens();
  let source: 'verified' | 'cache' | 'fresh' = 'verified';
  let stale = false;
  
  // 2. Check if we have fuller cache
  const fullCache = getCache<SolanaToken[]>(CACHE_KEYS.FULL_TOKENS, TTL.STALE_OK);
  if (fullCache && fullCache.length > tokens.length) {
    tokens = fullCache;
    source = 'cache';
    
    // Check staleness
    const lastRefresh = getCache<number>(CACHE_KEYS.LAST_REFRESH, TTL.STALE_OK);
    stale = !lastRefresh || Date.now() - lastRefresh > TTL.FULL_TOKENS;
  }
  
  // 3. Apply search filter
  if (search) {
    const q = search.toLowerCase();
    tokens = tokens.filter(t =>
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.mint.toLowerCase() === q
    );
  }
  
  // 4. Apply limit
  tokens = tokens.slice(0, limit);
  
  return { tokens, source, stale };
}

/**
 * Background refresh trigger
 * Call this from API route to trigger async refresh
 */
export function triggerBackgroundRefresh(): void {
  // Check if refresh needed
  const lastRefresh = getCache<number>(CACHE_KEYS.LAST_REFRESH, TTL.STALE_OK);
  if (lastRefresh && Date.now() - lastRefresh < TTL.FULL_TOKENS) {
    return; // Recent enough
  }
  
  // Trigger async refresh (don't await)
  refreshTokensAsync().catch(err => {
    console.error('[FastDiscovery] Background refresh failed:', err);
  });
}

/**
 * Async token refresh
 */
async function refreshTokensAsync(): Promise<void> {
  try {
    // Dynamic import to avoid circular deps
    const { getSolanaTokens } = await import('./discovery');
    
    console.log('[FastDiscovery] Starting background refresh...');
    const tokens = await getSolanaTokens();
    
    // Update caches
    setCache(CACHE_KEYS.FULL_TOKENS, tokens);
    setCache(CACHE_KEYS.LAST_REFRESH, Date.now());
    setHotTokens(tokens);
    
    console.log(`[FastDiscovery] Refreshed ${tokens.length} tokens`);
  } catch (err) {
    console.error('[FastDiscovery] Refresh error:', err);
  }
}

/**
 * Warm up cache on cold start
 * Call this in app initialization
 */
export async function warmUpCache(): Promise<void> {
  const cached = getCache<SolanaToken[]>(CACHE_KEYS.FULL_TOKENS, TTL.STALE_OK);
  if (!cached) {
    console.log('[FastDiscovery] Cold start - warming cache...');
    await refreshTokensAsync();
  }
}
