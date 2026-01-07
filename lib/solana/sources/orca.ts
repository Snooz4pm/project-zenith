/**
 * Orca Pool Fetcher
 * 
 * Secondary source - catches legit tokens that Raydium doesn't have.
 */

import { SolanaToken } from '../types';

interface OrcaWhirlpool {
  address: string;
  tokenA: {
    mint: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  };
  tokenB: {
    mint: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  };
  tvl?: number;
  volume24h?: number;
  feeRate?: number;
}

/**
 * Fetch all Orca Whirlpools
 */
export async function fetchOrcaPools(): Promise<OrcaWhirlpool[]> {
  try {
    const res = await fetch(
      'https://api.orca.so/v1/whirlpool/list',
      { 
        cache: 'no-store',
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!res.ok) {
      console.error('[Orca] HTTP error:', res.status);
      return [];
    }

    const data = await res.json();
    const pools = data.whirlpools ?? [];
    
    console.log(`[Orca] Fetched ${pools.length} whirlpools`);
    return pools;
  } catch (err) {
    console.error('[Orca] Fetch failed:', err);
    return [];
  }
}

/**
 * Normalize Orca pool to SolanaToken[]
 */
export function normalizeOrcaPool(pool: OrcaWhirlpool): SolanaToken[] {
  const tokens: SolanaToken[] = [];
  const tvl = Number(pool.tvl) || 0;

  // Token A
  if (pool.tokenA?.mint) {
    tokens.push({
      mint: pool.tokenA.mint,
      symbol: pool.tokenA.symbol || 'UNKNOWN',
      name: pool.tokenA.name || pool.tokenA.symbol || 'Unknown',
      decimals: pool.tokenA.decimals ?? 9,
      logoURI: pool.tokenA.logoURI,
      liquidityUsd: tvl / 2,
      sources: ['orca'],
      poolAddresses: [pool.address],
    });
  }

  // Token B
  if (pool.tokenB?.mint) {
    tokens.push({
      mint: pool.tokenB.mint,
      symbol: pool.tokenB.symbol || 'UNKNOWN',
      name: pool.tokenB.name || pool.tokenB.symbol || 'Unknown',
      decimals: pool.tokenB.decimals ?? 9,
      logoURI: pool.tokenB.logoURI,
      liquidityUsd: tvl / 2,
      sources: ['orca'],
      poolAddresses: [pool.address],
    });
  }

  return tokens;
}

/**
 * Fetch and normalize all Orca tokens
 */
export async function getOrcaTokens(): Promise<SolanaToken[]> {
  const pools = await fetchOrcaPools();
  const tokens: SolanaToken[] = [];

  for (const pool of pools) {
    tokens.push(...normalizeOrcaPool(pool));
  }

  console.log(`[Orca] Normalized ${tokens.length} tokens`);
  return tokens;
}
