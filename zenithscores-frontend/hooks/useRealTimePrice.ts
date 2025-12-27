import { useState, useEffect, useRef } from 'react';
import { MarketPrice, AssetType } from '@/lib/market-data/types';

interface RealTimePriceOpts {
    symbol: string;
    assetType?: AssetType;
    initialPrice?: number;
    pollInterval?: number;
}

interface PriceState {
    price: number | null;
    change: number;
    changePercent: number;
    direction: 'up' | 'down' | 'flat';
    status: 'loading' | 'active' | 'stale' | 'error';
    lastUpdated: number;
    source?: string;
}

export function useRealTimePrice({
    symbol,
    assetType = 'stock',
    initialPrice
}: RealTimePriceOpts) {
    const [data, setData] = useState<PriceState>({
        price: initialPrice || null,
        change: 0,
        changePercent: 0,
        direction: 'flat',
        status: 'loading',
        lastUpdated: Date.now()
    });

    const prevPriceRef = useRef<number | null>(initialPrice || null);

    useEffect(() => {
        let isMounted = true;

        // Crypto moves faster, so poll faster (10s), others 60s
        const intervalMs = assetType === 'crypto' ? 10_000 : 60_000;

        const fetchPrice = async () => {
            try {
                const res = await fetch(`/api/market-data/price?symbol=${symbol}&assetType=${assetType}`);
                if (!res.ok) throw new Error('Failed to fetch price');

                const result: MarketPrice = await res.json();

                if (!isMounted) return;

                // Determine direction for animation
                const prev = prevPriceRef.current;
                const current = result.price;
                let direction: 'up' | 'down' | 'flat' = 'flat';

                if (prev !== null) {
                    if (current > prev) direction = 'up';
                    if (current < prev) direction = 'down';
                }

                prevPriceRef.current = current;

                setData({
                    price: current,
                    change: result.change,
                    changePercent: result.changePercent,
                    direction,
                    status: 'active',
                    lastUpdated: Date.now(),
                    source: result.source
                });

            } catch (error) {
                console.error('Price polling error:', error);
                if (isMounted) setData(prev => ({ ...prev, status: 'error' }));
            }
        };

        // Initial fetch
        fetchPrice();

        const timer = setInterval(fetchPrice, intervalMs);

        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, [symbol, assetType]);

    return data;
}
