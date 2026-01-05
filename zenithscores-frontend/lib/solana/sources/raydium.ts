/**
 * Raydium Pool Fetcher
 * 
 * Primary source for Solana tokens.
 * If it's not on Raydium, 80% chance it's garbage.
 */

import { SolanaToken } from '../types';

interface RaydiumPool {
  id: string;
  baseMint: string;
  quoteMint: string;
  baseSymbol?: string;
  quoteSymbol?: string;
  baseDecimals?: number;
  quoteDecimals?: number;
  liquidity?: number | string;
  openTime?: number;
  lpMint?: string;
}

/**
 * Fetch all Raydium pools
 */
export async function fetchRaydiumPools(): Promise<RaydiumPool[]> {
  try {
    const res = await fetch(
      'https://api.raydium.io/v2/sdk/liquidity/mainnet.json',
      { 
        cache: 'no-store',
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!res.ok) {
      console.error('[Raydium] HTTP error:', res.status);
      return [];
    }

    const data = await res.json();
    
    // Raydium returns { official: {...}, unOfficial: {...} }
    const official = Object.values(data.official ?? {}) as RaydiumPool[];
    const unofficial = Object.values(data.unOfficial ?? {}) as RaydiumPool[];
    
    console.log(`[Raydium] Fetched ${official.length} official + ${unofficial.length} unofficial pools`);
    
    // Only use official pools for safety
    return official;
  } catch (err) {
    console.error('[Raydium] Fetch failed:', err);
    return [];
  }
}

/**
 * Normalize Raydium pool to SolanaToken[]
 * Each pool has 2 tokens (base + quote)
 */
export function normalizeRaydiumPool(pool: RaydiumPool): SolanaToken[] {
  const tokens: SolanaToken[] = [];
  const liquidity = Number(pool.liquidity) || 0;

  // Base token
  if (pool.baseMint && pool.baseSymbol) {
    tokens.push({
      mint: pool.baseMint,
      symbol: pool.baseSymbol,
      name: pool.baseSymbol,
      decimals: pool.baseDecimals ?? 9,
      liquidityUsd: liquidity / 2, // Split liquidity between tokens
      sources: ['raydium'],
      poolAddresses: [pool.id],
      createdAt: pool.openTime ? pool.openTime * 1000 : undefined,
    });
  }

  // Quote token
  if (pool.quoteMint && pool.quoteSymbol) {
    tokens.push({
      mint: pool.quoteMint,
      symbol: pool.quoteSymbol,
      name: pool.quoteSymbol,
      decimals: pool.quoteDecimals ?? 9,
      liquidityUsd: liquidity / 2,
      sources: ['raydium'],
      poolAddresses: [pool.id],
      createdAt: pool.openTime ? pool.openTime * 1000 : undefined,
    });
  }

  return tokens;
}

/**
 * Fetch and normalize all Raydium tokens
 */
export async function getRaydiumTokens(): Promise<SolanaToken[]> {
  const pools = await fetchRaydiumPools();
  const tokens: SolanaToken[] = [];

  for (const pool of pools) {
    tokens.push(...normalizeRaydiumPool(pool));
  }

  console.log(`[Raydium] Normalized ${tokens.length} tokens`);
  return tokens;
}
