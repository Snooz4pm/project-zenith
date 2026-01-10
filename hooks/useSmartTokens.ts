/**
 * useSmartTokens Hook
 *
 * Smart Swap data loader.
 * Fetches ONLY from the proxy, never Jupiter directly.
 * Returns clean SmartToken array.
 *
 * With enableValuation=true, tokens will be probed for SOL value
 */

import { useEffect, useState } from 'react';
import { jupiterArrayToSmart } from '@/lib/adapters/jupiterToSmart';
import { SmartToken } from '@/types/SmartToken';

const PROXY_URL = '/api/smart-swap/tokens';
const VALUATE_URL = '/api/smart-swap/valuate';

type UseSmartTokensOptions = {
    enableValuation?: boolean;
};

export function useSmartTokens(options: UseSmartTokensOptions = {}) {
    const [tokens, setTokens] = useState<SmartToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [valuating, setValuating] = useState(false);
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

                // If valuation enabled, probe tokens for SOL value
                if (options.enableValuation && normalized.length > 0) {
                    setValuating(true);
                    valuateTokens(normalized);
                }
            })
            .catch(err => {
                console.error('[useSmartTokens] Fetch error:', err);
                setError('Failed to load tokens');
                setTokens([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [options.enableValuation]);

    async function valuateTokens(tokenList: SmartToken[]) {
        try {
            console.log(`[useSmartTokens] Starting valuation of ${tokenList.length} tokens`);

            const response = await fetch(VALUATE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokens: tokenList.map(t => ({
                        mint: t.mint,
                        decimals: t.decimals || 6,
                    })),
                }),
            });

            if (!response.ok) {
                console.error('[useSmartTokens] Valuation failed:', response.status);
                return;
            }

            const data = await response.json();
            const results = data.results || [];

            // Merge valuation results back into tokens
            const valuatedTokens = tokenList.map(token => {
                const valuation = results.find((r: any) => r.mint === token.mint);
                if (!valuation) return token;

                return {
                    ...token,
                    valueInSOL: valuation.valueInSOL,
                    priceImpactPct: valuation.priceImpactPct,
                    hasRoute: valuation.hasRoute,
                    canReverse: valuation.canReverse,
                    roundTripLoss: valuation.roundTripLoss,
                    isSafe: valuation.isSafe,
                    decimals: valuation.decimals || token.decimals,
                };
            });

            // Sort: SAFE tokens first (by SOL value), then unsafe tokens
            const sorted = valuatedTokens.sort((a, b) => {
                // Safe tokens always come first
                if (a.isSafe && !b.isSafe) return -1;
                if (!a.isSafe && b.isSafe) return 1;

                // Within safe tokens, sort by SOL value
                if (a.isSafe && b.isSafe) {
                    if (a.valueInSOL && b.valueInSOL) {
                        return b.valueInSOL - a.valueInSOL;
                    }
                }

                // Within unsafe tokens, sort by hasRoute, then canReverse
                if (a.hasRoute && !b.hasRoute) return -1;
                if (!a.hasRoute && b.hasRoute) return 1;
                if (a.canReverse && !b.canReverse) return -1;
                if (!a.canReverse && b.canReverse) return 1;

                return 0;
            });

            setTokens(sorted);
            console.log(
                `[useSmartTokens] Valuation complete: ${data.safe}/${data.total} tokens are SAFE (${data.canReverse} reversible)`
            );
        } catch (err) {
            console.error('[useSmartTokens] Valuation error:', err);
        } finally {
            setValuating(false);
        }
    }

    return { tokens, loading, valuating, error };
}
