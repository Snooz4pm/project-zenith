'use client';

/**
 * Wallet Balance Store (Zustand)
 * 
 * Single source of truth for wallet SOL balance.
 * Components should READ from this store, not fetch directly.
 * Only ONE component should FETCH and update.
 */

import { create } from 'zustand';
import { PublicKey } from '@solana/web3.js';
import { getSolanaConnection } from '@/lib/solana/connection';

interface WalletBalanceState {
    // Balance in SOL (human-readable)
    sol: number | null;
    // Loading state
    loading: boolean;
    // Error message if any
    error: string | null;
    // Last fetch timestamp
    lastFetch: number;
    // Wallet address this balance belongs to
    walletAddress: string | null;

    // Actions
    setBalance: (sol: number, walletAddress: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    fetchBalance: (publicKey: string) => Promise<void>;
    clearBalance: () => void;
}

// Minimum time between fetches (prevent spam)
const MIN_FETCH_INTERVAL = 10000; // 10 seconds

export const useWalletBalanceStore = create<WalletBalanceState>((set, get) => ({
    sol: null,
    loading: false,
    error: null,
    lastFetch: 0,
    walletAddress: null,

    setBalance: (sol, walletAddress) => set({
        sol,
        walletAddress,
        error: null,
        lastFetch: Date.now()
    }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error, loading: false }),

    clearBalance: () => set({
        sol: null,
        loading: false,
        error: null,
        walletAddress: null
    }),

    fetchBalance: async (publicKey: string) => {
        const state = get();

        // Skip if already loading
        if (state.loading) {
            console.log('[WalletBalanceStore] Already loading, skipping');
            return;
        }

        // Skip if recently fetched for same wallet
        const timeSinceLastFetch = Date.now() - state.lastFetch;
        if (
            state.walletAddress === publicKey &&
            timeSinceLastFetch < MIN_FETCH_INTERVAL &&
            state.sol !== null
        ) {
            console.log('[WalletBalanceStore] Using cached balance');
            return;
        }

        set({ loading: true, error: null });

        try {
            const connection = getSolanaConnection();
            const pubkey = new PublicKey(publicKey);
            const balance = await connection.getBalance(pubkey);
            const solBalance = balance / 1e9;

            set({
                sol: solBalance,
                walletAddress: publicKey,
                loading: false,
                error: null,
                lastFetch: Date.now(),
            });

            console.log('[WalletBalanceStore] Balance fetched:', solBalance, 'SOL');
        } catch (err: any) {
            console.error('[WalletBalanceStore] Fetch error:', err);
            set({
                error: err.message || 'Failed to fetch balance',
                loading: false,
            });
        }
    },
}));
