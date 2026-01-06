import { useEffect, useState, useRef, useCallback } from 'react';

export type BalanceMap = Record<string, number>;

export function useWalletBalances(wallet?: string | null) {
  const [balances, setBalances] = useState<BalanceMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchBalances = useCallback(async () => {
    if (!wallet) {
      setBalances({});
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wallet/${wallet}`);
      if (!res.ok) throw new Error('Failed to fetch wallet snapshot');
      const data = await res.json();
      const map: BalanceMap = {
        SOL: data.balanceLamports / 1e9,
        'So11111111111111111111111111111111111111112': data.balanceLamports / 1e9
      };
      data.tokens.forEach((token: any) => {
        if (token.amount && token.amount > 0) {
          map[token.mint] = token.amount;
        }
      });
      if (mountedRef.current) {
        setBalances(map);
      }
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e?.message || 'Failed to fetch balances');
        setBalances({});
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [wallet]);

  useEffect(() => {
    mountedRef.current = true;
    fetchBalances();
    return () => {
      mountedRef.current = false;
    };
  }, [wallet, fetchBalances]);

  return { balances, loading, error, refresh: fetchBalances };
}

export function getBalance(balances: BalanceMap, mint: string): number {
  if (mint === 'SOL' || mint === 'So11111111111111111111111111111111111111112') {
    return balances['SOL'] || balances['So11111111111111111111111111111111111111112'] || 0;
  }
  return balances[mint] || 0;
}

// No cache logic needed for backend API version
