/**
 * useSwapHistory Hook
 * 
 * Fetch and manage swap history for a wallet.
 * Includes real-time status updates via polling.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Connection } from '@solana/web3.js';

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC, 'confirmed');

// ============================================================================
// TYPES
// ============================================================================

export interface SwapReceipt {
  id: string;
  wallet: string;
  inputMint: string;
  outputMint: string;
  inputSymbol?: string;
  outputSymbol?: string;
  inAmount: string;
  outAmount: string;
  inAmountUi?: number;
  outAmountUi?: number;
  inAmountUsd?: number;
  outAmountUsd?: number;
  txid: string;
  routeType?: string;
  routeHops?: number;
  slippageBps?: number;
  priceImpactPct?: number;
  feeAmount?: number;
  status: 'pending' | 'confirmed' | 'failed';
  jitoBundle: boolean;
  jitoBundleId?: string;
  errorMessage?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface SwapHistoryResponse {
  receipts: SwapReceipt[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSwapHistory(wallet?: string | null) {
  const [receipts, setReceipts] = useState<SwapReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchHistory = useCallback(async (offset = 0, append = false) => {
    if (!wallet) {
      setReceipts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/swap/receipt?wallet=${wallet}&limit=20&offset=${offset}`);
      const data: SwapHistoryResponse = await res.json();

      if (append) {
        setReceipts(prev => [...prev, ...data.receipts]);
      } else {
        setReceipts(data.receipts);
      }
      
      setTotal(data.total);
      setHasMore(data.hasMore);

    } catch (e: any) {
      console.error('[useSwapHistory] Error:', e);
      setError(e?.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  // Initial fetch
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Load more
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    fetchHistory(receipts.length, true);
  }, [fetchHistory, hasMore, loading, receipts.length]);

  // Refresh
  const refresh = useCallback(() => {
    fetchHistory(0, false);
  }, [fetchHistory]);

  return {
    receipts,
    loading,
    error,
    total,
    hasMore,
    loadMore,
    refresh
  };
}

// ============================================================================
// RECEIPT SAVING
// ============================================================================

export async function saveSwapReceipt(receipt: Partial<SwapReceipt>): Promise<SwapReceipt | null> {
  try {
    const res = await fetch('/api/swap/receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receipt)
    });

    const data = await res.json();
    return data.receipt || null;

  } catch (e) {
    console.error('[saveSwapReceipt] Error:', e);
    return null;
  }
}

export async function updateSwapStatus(
  txid: string, 
  status: 'pending' | 'confirmed' | 'failed',
  errorMessage?: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/swap/receipt/${txid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, errorMessage })
    });

    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// LIVE TX STATUS (WebSocket-like polling)
// ============================================================================

export function watchTransaction(
  txid: string,
  onStatusChange: (status: 'confirmed' | 'failed', error?: string) => void
): () => void {
  let cancelled = false;

  const check = async () => {
    if (cancelled) return;

    try {
      const status = await connection.getSignatureStatus(txid, {
        searchTransactionHistory: true
      });

      if (status.value) {
        if (status.value.err) {
          onStatusChange('failed', JSON.stringify(status.value.err));
        } else if (status.value.confirmationStatus === 'confirmed' || 
                   status.value.confirmationStatus === 'finalized') {
          onStatusChange('confirmed');
        } else {
          // Still pending, check again
          setTimeout(check, 2000);
        }
      } else {
        // Not found yet, keep checking
        setTimeout(check, 2000);
      }
    } catch (e) {
      // Error checking, try again
      if (!cancelled) {
        setTimeout(check, 3000);
      }
    }
  };

  // Start checking after a short delay
  setTimeout(check, 1000);

  // Return cleanup function
  return () => {
    cancelled = true;
  };
}

// ============================================================================
// FORMATTERS
// ============================================================================

export function formatSwapReceipt(receipt: SwapReceipt): {
  inputDisplay: string;
  outputDisplay: string;
  statusDisplay: string;
  statusColor: string;
  timeAgo: string;
  explorerUrl: string;
} {
  const inputDisplay = receipt.inputSymbol 
    ? `${receipt.inAmountUi?.toFixed(4) || '?'} ${receipt.inputSymbol}`
    : `${receipt.inAmountUi?.toFixed(4) || '?'}`;

  const outputDisplay = receipt.outputSymbol
    ? `${receipt.outAmountUi?.toFixed(4) || '?'} ${receipt.outputSymbol}`
    : `${receipt.outAmountUi?.toFixed(4) || '?'}`;

  const statusMap = {
    pending: { display: 'Pending', color: 'text-yellow-400' },
    confirmed: { display: 'Confirmed', color: 'text-emerald-400' },
    failed: { display: 'Failed', color: 'text-red-400' }
  };

  const { display: statusDisplay, color: statusColor } = statusMap[receipt.status];

  // Time ago
  const created = new Date(receipt.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let timeAgo: string;
  if (diffMins < 1) timeAgo = 'Just now';
  else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
  else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
  else timeAgo = `${diffDays}d ago`;

  const explorerUrl = `https://solscan.io/tx/${receipt.txid}`;

  return {
    inputDisplay,
    outputDisplay,
    statusDisplay,
    statusColor,
    timeAgo,
    explorerUrl
  };
}
