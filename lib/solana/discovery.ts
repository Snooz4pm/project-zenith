/**
 * Solana Token Discovery
 * 
 * Production-grade discovery system:
 * - Raydium + Orca sources
 * - No shit tokens (liquidity filter)
 * - Only swappable tokens (Jupiter validated)
 * - Cached + paginated
 */

import { SolanaToken, SOL_MINT, USDC_MINT, USDT_MINT } from './types';
import { getRaydiumTokens } from './sources/raydium';
import { getOrcaTokens } from './sources/orca';
import { validateTokenRoutes } from './jupiter';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from './cache';

// Minimum liquidity to be listed (removes most rugs)
const MIN_LIQUIDITY_USD = 1000;

// Tokens to always exclude (wrapped SOL, etc.)
const EXCLUDED_MINTS = new Set([
  SOL_MINT, // Native SOL (it's the base currency)
]);

// Tokens to always include (verified blue chips)
const VERIFIED_MINTS = new Set([
  USDC_MINT,
  USDT_MINT,
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',  // mSOL
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',  // JUP
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // WETH
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYTH
]);

/**
 * Hard filters - removes obvious rugs
 */
function hardFilter(token: SolanaToken): boolean {
  // Must have minimum liquidity
  if (token.liquidityUsd < MIN_LIQUIDITY_USD) return false;

  // Must have valid decimals
  if (token.decimals <= 0 || token.decimals > 18) return false;

  // Must have symbol
  if (!token.symbol || token.symbol.length === 0) return false;

  // Symbol sanity check (no crazy long symbols)
  if (token.symbol.length > 12) return false;

  // Exclude known addresses
  if (EXCLUDED_MINTS.has(token.mint)) return false;

  return true;
}

/**
 * Merge tokens by mint address
 * Aggregates liquidity and sources
 */
function mergeTokens(tokens: SolanaToken[]): SolanaToken[] {
  const map = new Map<string, SolanaToken>();

  for (const t of tokens) {
    const existing = map.get(t.mint);
    
    if (!existing) {
      map.set(t.mint, { ...t });
    } else {
      // Aggregate liquidity
      existing.liquidityUsd += t.liquidityUsd;
      
      // Merge sources
      for (const src of t.sources) {
        if (!existing.sources.includes(src)) {
          existing.sources.push(src);
        }
      }
      
      // Merge pool addresses
      for (const addr of t.poolAddresses) {
        if (!existing.poolAddresses.includes(addr)) {
          existing.poolAddresses.push(addr);
        }
      }

      // Use earliest creation time
      if (t.createdAt && (!existing.createdAt || t.createdAt < existing.createdAt)) {
        existing.createdAt = t.createdAt;
      }

      // Use logo if we don't have one
      if (t.logoURI && !existing.logoURI) {
        existing.logoURI = t.logoURI;
      }
    }
  }

  return [...map.values()];
}

/**
 * Build full token list from all sources
 */
export async function buildSolanaTokenList(): Promise<SolanaToken[]> {
  console.log('[Discovery] Building Solana token list...');

  // Fetch from both sources in parallel
  const [raydiumTokens, orcaTokens] = await Promise.all([
    getRaydiumTokens(),
    getOrcaTokens(),
  ]);

  // Merge by mint
  let tokens = mergeTokens([...raydiumTokens, ...orcaTokens]);
  console.log(`[Discovery] Merged: ${tokens.length} unique tokens`);

  // Apply hard filters
  tokens = tokens.filter(hardFilter);
  console.log(`[Discovery] After hard filter: ${tokens.length} tokens`);

  // Validate Jupiter routes for top tokens
  const validMints = await validateTokenRoutes(tokens, {
    maxTokens: 500,
    minLiquidity: 5000,
    concurrency: 10,
  });

  // Mark tokens as swappable
  for (const t of tokens) {
    // Verified tokens are always swappable
    if (VERIFIED_MINTS.has(t.mint)) {
      t.isSwappable = true;
    } else {
      t.isSwappable = validMints.has(t.mint);
    }
  }

  // Sort by liquidity
  tokens.sort((a, b) => b.liquidityUsd - a.liquidityUsd);

  console.log(`[Discovery] Final: ${tokens.filter(t => t.isSwappable).length} swappable tokens`);
  return tokens;
}

/**
 * Get token list (cached)
 */
export async function getSolanaTokens(): Promise<SolanaToken[]> {
  // Check cache
  const cached = getCache<SolanaToken[]>(CACHE_KEYS.SOLANA_TOKENS, CACHE_TTL.TOKENS);
  if (cached) {
    console.log('[Discovery] Returning cached tokens');
    return cached;
  }

  // Build fresh
  const tokens = await buildSolanaTokenList();
  setCache(CACHE_KEYS.SOLANA_TOKENS, tokens);
  
  return tokens;
}

/**
 * Get paginated, filtered token list
 */
export async function getFilteredSolanaTokens(options: {
  page?: number;
  limit?: number;
  minLiquidity?: number;
  source?: 'raydium' | 'orca' | 'all';
  onlySwappable?: boolean;
  search?: string;
}): Promise<{
  tokens: SolanaToken[];
  page: number;
  limit: number;
  total: number;
}> {
  const {
    page = 1,
    limit = 50,
    minLiquidity = MIN_LIQUIDITY_USD,
    source = 'all',
    onlySwappable = true,
    search,
  } = options;

  let tokens = await getSolanaTokens();

  // Filter: swappable only
  if (onlySwappable) {
    tokens = tokens.filter(t => t.isSwappable);
  }

  // Filter: minimum liquidity
  tokens = tokens.filter(t => t.liquidityUsd >= minLiquidity);

  // Filter: source
  if (source !== 'all') {
    tokens = tokens.filter(t => t.sources.includes(source));
  }

  // Filter: search
  if (search && search.length > 0) {
    const q = search.toLowerCase();
    tokens = tokens.filter(t =>
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.mint.toLowerCase() === q
    );
  }

  // Pagination
  const total = tokens.length;
  const start = (page - 1) * limit;
  const paged = tokens.slice(start, start + limit);

  return {
    tokens: paged,
    page,
    limit,
    total,
  };
}
