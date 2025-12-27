
import { useState, useEffect, useRef } from 'react';

interface MarketContextParams {
    name: string;
    symbol: string;
    assetType: string;
    regime: string;
    zones: any[]; // Zone objects
    context: string; // Additional context string
    enabled: boolean;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function useMarketContext({
    name,
    symbol,
    assetType,
    regime,
    zones,
    context,
    enabled
}: MarketContextParams) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const lastFetchParams = useRef<string>('');
    const lastFetchTime = useRef<number>(0);
    const cache = useRef<Record<string, { data: string, timestamp: number }>>({});

    useEffect(() => {
        if (!enabled || !symbol || !regime) return;

        // Create a signature of specific conditions. If regime changes, we re-fetch.
        const currentSignature = `${symbol}-${regime}-${zones.length}`;

        // Check cache
        const now = Date.now();
        if (
            cache.current[currentSignature] &&
            (now - cache.current[currentSignature].timestamp < CACHE_DURATION)
        ) {
            setAnalysis(cache.current[currentSignature].data);
            return;
        }

        // Debounce/Prevent rapid refetches
        if (currentSignature === lastFetchParams.current && (now - lastFetchTime.current < 10000)) {
            return;
        }

        const fetchAnalysis = async () => {
            setIsLoading(true);
            try {
                // Formatting zones for text prompt
                const zoneText = zones.slice(0, 3).map(z =>
                    `[${z.min.toFixed(2)}-${z.max.toFixed(2)}]`
                ).join(', ') || "None currently detected";

                const res = await fetch('/api/ai/context', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        symbol,
                        assetType,
                        regime,
                        zones: zoneText,
                        context
                    })
                });

                if (!res.ok) throw new Error('Failed to fetch context');

                const data = await res.json();
                if (data.analysis) {
                    setAnalysis(data.analysis);
                    // Update Cache
                    cache.current[currentSignature] = {
                        data: data.analysis,
                        timestamp: Date.now()
                    };
                    lastFetchParams.current = currentSignature;
                    lastFetchTime.current = Date.now();
                }
            } catch (err) {
                console.error(err);
                // Don't clear old analysis on error to prevent flickering
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchAnalysis, 1000); // 1s debounce to let regime settle
        return () => clearTimeout(timer);

    }, [name, symbol, assetType, regime, zones, context, enabled]);

    return { analysis, isLoading };
}
