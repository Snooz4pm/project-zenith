/**
 * usePriceAlert Hook
 * 
 * Create and manage price alerts from the chart
 */

import { useState, useCallback } from 'react';

interface CreateAlertParams {
    symbol: string;
    assetType: 'stock' | 'crypto' | 'forex';
    targetPrice: number;
    direction: 'above' | 'below' | 'cross';
    note?: string;
    predictedDirection?: 'up' | 'down';
    predictedWithin?: number; // hours
    priceAtCreation: number;
}

interface PriceAlert {
    id: string;
    symbol: string;
    assetType: string;
    targetPrice: number;
    direction: string;
    note: string | null;
    status: string;
    createdAt: string;
    triggeredAt: string | null;
}

export function usePriceAlert() {
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);

    const createAlert = useCallback(async (params: CreateAlertParams): Promise<PriceAlert | null> => {
        setIsCreating(true);
        setError(null);

        try {
            const res = await fetch('/api/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create alert');
            }

            // Add to local state
            setAlerts(prev => [data.alert, ...prev]);

            return data.alert;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            return null;
        } finally {
            setIsCreating(false);
        }
    }, []);

    const fetchAlerts = useCallback(async (symbol?: string) => {
        try {
            const url = symbol
                ? `/api/alerts?symbol=${symbol}`
                : '/api/alerts';

            const res = await fetch(url);
            const data = await res.json();

            if (res.ok) {
                setAlerts(data.alerts);
            }
        } catch (err) {
            console.error('Failed to fetch alerts:', err);
        }
    }, []);

    return {
        alerts,
        isCreating,
        error,
        createAlert,
        fetchAlerts
    };
}
