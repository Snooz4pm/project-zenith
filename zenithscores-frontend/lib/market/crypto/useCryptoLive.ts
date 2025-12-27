/**
 * useCryptoLive Hook
 * 
 * CRYPTO LIVE MODE - Uses crypto-engine (Coinbase/CoinGecko).
 * DexScreener REMOVED for launch.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchCryptoPrice, SUPPORTED_CRYPTOS } from '@/lib/market/crypto-engine';

export type CryptoLiveStatus = 'LIVE' | 'DELAYED' | 'DISCONNECTED';

interface CryptoLiveState {
    symbol: string;
    priceUsd: number;
    priceChange24h: number;
    liquidityUsd: number;
    liquidityTier: 'HIGH' | 'MEDIUM' | 'LOW';
    volume24h: number;
    txnsH1: number;
    status: CryptoLiveStatus;
    lastFetchedAt: number;
    source?: string;
}

interface UseCryptoLiveOptions {
    symbol: string;
    enabled?: boolean;
}

interface UseCryptoLiveReturn extends Partial<CryptoLiveState> {
    refresh: () => void;
    isLoading: boolean;
    status: CryptoLiveStatus;
}

const CRYPTO_POLL_INTERVAL_MS = 15000; // 15 seconds

export function useCryptoLive({
    symbol,
    enabled = true,
}: UseCryptoLiveOptions): UseCryptoLiveReturn {
    const [state, setState] = useState<Partial<CryptoLiveState>>({
        symbol,
        priceUsd: 0,
        priceChange24h: 0,
        liquidityUsd: 0,
        liquidityTier: 'HIGH', // Coinbase/CoinGecko = high quality
        volume24h: 0,
        txnsH1: 0,
        status: 'DISCONNECTED',
        lastFetchedAt: 0,
    });

    const [isLoading, setIsLoading] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);

    const fetchData = useCallback(async () => {
        if (!enabled || !symbol) return;

        // Reject unsupported cryptos
        if (!SUPPORTED_CRYPTOS.includes(symbol.toUpperCase())) {
            setState(prev => ({
                ...prev,
                status: 'DISCONNECTED',
            }));
            setIsLoading(false);
            return;
        }

        try {
            const result = await fetchCryptoPrice(symbol);

            if (!mountedRef.current) return;

            if (result && result.price > 0) {
                setState({
                    symbol: result.symbol,
                    priceUsd: result.price,
                    priceChange24h: result.changePercent,
                    liquidityUsd: 1000000, // CEX = high liquidity
                    liquidityTier: 'HIGH',
                    volume24h: 0,
                    txnsH1: 0,
                    status: 'LIVE',
                    lastFetchedAt: result.timestamp,
                    source: result.source,
                });
                setIsLoading(false);
            } else {
                setState(prev => ({
                    ...prev,
                    status: 'DISCONNECTED',
                }));
                setIsLoading(false);
            }
        } catch (error) {
            console.error('[useCryptoLive] Error:', error);
            if (mountedRef.current) {
                setState(prev => ({
                    ...prev,
                    status: 'DISCONNECTED',
                }));
                setIsLoading(false);
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

        // Set up polling
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
