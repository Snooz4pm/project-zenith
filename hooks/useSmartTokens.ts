/**
 * useSmartTokens Hook
 * 
 * Smart Swap data loader.
 * Fetches ONLY from the proxy, never Jupiter directly.
 * Returns clean SmartToken array.
 */

import { useEffect, useState } from 'react';
import { jupiterArrayToSmart } from '@/lib/adapters/jupiterToSmart';
import { SmartToken } from '@/types/SmartToken';

const PROXY_URL = '/api/smart-swap/tokens';

export function useSmartTokens() {
    const [tokens, setTokens] = useState<SmartToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        fetch(PROXY_URL)
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data.tokens) ? data.tokens : [];
                const normalized = jupiterArrayToSmart(list);

                console.log(`[useSmartTokens] Loaded ${normalized.length} tokens from ${list.length} raw`);
                setTokens(normalized);
            })
            .catch(err => {
                console.error('[useSmartTokens] Fetch error:', err);
                setError('Failed to load tokens');
                setTokens([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return { tokens, loading, error };
}
