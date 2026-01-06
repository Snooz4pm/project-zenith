/**
 * useWalletBalances Hook
 * 
 * Fast, cached wallet balance fetching.
 * Uses getParsedTokenAccountsByOwner (single RPC call).
 * 
 * DO NOT query balances per token one-by-one.
 * DO NOT use @solana/spl-token on frontend.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { useEffect, useState, useRef, useCallback } from 'react';

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC, 'confirmed');

// Cache duration in ms
const CACHE_TTL = 30_000; // 30 seconds

// In-memory cache
const balanceCache: Map<string, { data: Record<string, number>; timestamp: number }> = new Map();

export type BalanceMap = Record<string, number>;

export function useWalletBalances(wallet?: string | null) {
  const [balances, setBalances] = useState<BalanceMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchBalances = useCallback(async (forceRefresh = false) => {
    if (!wallet) {
      setBalances({});
      return;
    }

    // Check cache first
    const cached = balanceCache.get(wallet);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setBalances(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const owner = new PublicKey(wallet);

      // Single parallel call for SOL + all SPL tokens
      const [solBalance, tokenAccounts] = await Promise.all([
        connection.getBalance(owner),
        connection.getParsedTokenAccountsByOwner(owner, {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
        })
      ]);

      const map: BalanceMap = {
        SOL: solBalance / 1e9,
        // Also store SOL under its mint address for consistency
        'So11111111111111111111111111111111111111112': solBalance / 1e9
      };

      // Parse all SPL token balances
      tokenAccounts.value.forEach(acc => {
        const info = acc.account.data.parsed.info;
        const mint: string = info.mint;
        const amount: number = info.tokenAmount.uiAmount;

        if (amount && amount > 0) {
          map[mint] = amount;
        }
      });

      // Update cache
      balanceCache.set(wallet, { data: map, timestamp: Date.now() });

      if (mountedRef.current) {
        setBalances(map);
      }
    } catch (e: any) {
      console.error('[useWalletBalances] Error:', e);
      if (mountedRef.current) {
        setError(e?.message || 'Failed to fetch balances');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [wallet]);

  // Initial fetch + refetch on wallet change
  useEffect(() => {
    mountedRef.current = true;
    fetchBalances();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchBalances]);

  // Refresh function for manual triggers
  const refresh = useCallback(() => fetchBalances(true), [fetchBalances]);

  return { balances, loading, error, refresh };
}

/**
 * Get balance for a specific mint
 */
export function getBalance(balances: BalanceMap, mint: string): number {
  // Handle SOL special case
  if (mint === 'SOL' || mint === 'So11111111111111111111111111111111111111112') {
    return balances['SOL'] || balances['So11111111111111111111111111111111111111112'] || 0;
  }
  return balances[mint] || 0;
}

/**
 * Clear balance cache (call on disconnect)
 */
export function clearBalanceCache(wallet?: string) {
  if (wallet) {
    balanceCache.delete(wallet);
  } else {
    balanceCache.clear();
  }
}
