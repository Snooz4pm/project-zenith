/**
 * Simple In-Memory Cache
 * 
 * For serverless, consider Redis or Vercel KV in production.
 */

import { SolanaToken } from './types';

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const CACHE = new Map<string, CacheEntry<any>>();

/**
 * Get cached data if not expired
 */
export function getCache<T>(key: string, ttlMs: number): T | null {
  const entry = CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttlMs) {
    CACHE.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Set cache entry
 */
export function setCache<T>(key: string, data: T): void {
  CACHE.set(key, { data, ts: Date.now() });
}

/**
 * Delete cache entry
 */
export function deleteCache(key: string): void {
  CACHE.delete(key);
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  CACHE.clear();
}

// Cache keys
export const CACHE_KEYS = {
  SOLANA_TOKENS: 'solana-tokens',
  RAYDIUM_POOLS: 'raydium-pools',
  ORCA_POOLS: 'orca-pools',
} as const;

// Cache TTLs
export const CACHE_TTL = {
  TOKENS: 10 * 60 * 1000,      // 10 minutes for full token list
  POOLS: 5 * 60 * 1000,        // 5 minutes for raw pools
  ROUTES: 6 * 60 * 60 * 1000,  // 6 hours for Jupiter routes
} as const;
