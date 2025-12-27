/**
 * useCryptoLive Hook
 * 
 * CRYPTO LIVE MODE - Polls Dexscreener for on-chain DEX prices.
 * 
 * RULES:
 * - Poll every 12 seconds
 * - Show liquidity tier ALWAYS
 * - No fake price movement
 * - "Low Activity" when no trades
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    CryptoLiveState,
    CryptoLiveStatus,
    CRYPTO_POLL_INTERVAL_MS,
} from '@/lib/market/crypto/types';
import { fetchCryptoLive } from '@/lib/market/crypto/dexscreener-live';

interface UseCryptoLiveOptions {
    symbol: string;
    enabled?: boolean;
}

interface UseCryptoLiveReturn extends Partial<CryptoLiveState> {
    refresh: () => void;
    isLoading: boolean;
    status: CryptoLiveStatus;
}

export function useCryptoLive({
    symbol,
    enabled = true,
}: UseCryptoLiveOptions): UseCryptoLiveReturn {
    const [state, setState] = useState<Partial<CryptoLiveState>>({
        symbol,
        priceUsd: 0,
        liquidityUsd: 0,
        liquidityTier: 'LOW',
        volume24h: 0,
        txnsH1: 0,
        status: 'DISCONNECTED',
        lastFetchedAt: 0,
    });

    const [isLoading, setIsLoading] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);
    const prevPriceRef = useRef<number | null>(null);

    const fetchData = useCallback(async () => {
        if (!enabled || !symbol) return;

        try {
            const result = await fetchCryptoLive(symbol);

            if (!mountedRef.current) return;

            if (result) {
                // Check if price actually changed (trade happened)
                const priceChanged = prevPriceRef.current !== null &&
                    Math.abs(result.priceUsd - prevPriceRef.current) > 0.0000001;

                if (priceChanged) {
                    console.log(`[useCryptoLive] Trade detected: ${symbol} $${prevPriceRef.current} → $${result.priceUsd}`);
                }

                prevPriceRef.current = result.priceUsd;

                setState({
                    ...result,
                });

                setIsLoading(false);
            } else {
                setState(prev => ({
                    ...prev,
                    status: 'DISCONNECTED',
                }));
            }
        } catch (error) {
            console.error('[useCryptoLive] Error:', error);
            if (mountedRef.current) {
                setState(prev => ({
                    ...prev,
                    status: 'DISCONNECTED',
                }));
            }
        }
    }, [symbol, enabled]);

    // Initial fetch and polling
    useEffect(() => {
        mountedRef.current = true;

        if (!enabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Initial fetch
        fetchData();

        // Set up polling (12 seconds)
        intervalRef.current = setInterval(fetchData, CRYPTO_POLL_INTERVAL_MS);

        return () => {
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [fetchData, enabled]);

    // Reset when symbol changes
    useEffect(() => {
        setIsLoading(true);
        prevPriceRef.current = null;
        setState(prev => ({
            ...prev,
            symbol,
            priceUsd: 0,
            status: 'DISCONNECTED',
        }));
    }, [symbol]);

    return {
        ...state,
        refresh: fetchData,
        isLoading,
        status: state.status || 'DISCONNECTED',
    };
}
