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
        let cancelled = false;
        setLoading(true);
        setError(null);

        async function fetchWithTimeout(url: string, timeout = 5000) {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            try {
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(id);
                return res;
            } catch (err) {
                clearTimeout(id);
                throw err;
            }
        }

        async function loadTokens() {
            let tokens: any[] = [];
            let fromCache = false;
            try {
                let res = await fetchWithTimeout(PROXY_URL, 5000);
                if (!res.ok) throw new Error('Proxy fetch failed');
                let data = await res.json();
                tokens = Array.isArray(data.tokens) ? data.tokens : [];
                // Save last-good snapshot
                localStorage.setItem('jup-cache', JSON.stringify(tokens));
            } catch (err) {
                // Retry once
                try {
                    let res = await fetchWithTimeout(PROXY_URL, 5000);
                    if (!res.ok) throw new Error('Proxy fetch failed (retry)');
                    let data = await res.json();
                    tokens = Array.isArray(data.tokens) ? data.tokens : [];
                    localStorage.setItem('jup-cache', JSON.stringify(tokens));
                } catch (err2) {
                    // Fallback to cache
                    const cached = localStorage.getItem('jup-cache');
                    if (cached) {
                        tokens = JSON.parse(cached);
                        fromCache = true;
                        console.warn('[useSmartTokens] Using cached Jupiter universe');
                    } else {
                        setError('Failed to load tokens');
                        setTokens([]);
                        setLoading(false);
                        return;
                    }
                }
            }

            if (cancelled) return;
            const normalized = jupiterArrayToSmart(tokens);
            setTokens(normalized);
            if (fromCache) setError('Loaded from cache due to fetch failure');

            // If valuation enabled, probe tokens for SOL value
            if (options.enableValuation && normalized.length > 0) {
                setValuating(true);
                valuateTokens(normalized);
            }
            setLoading(false);
        }

        loadTokens();
        return () => { cancelled = true; };
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
                    safeTier: valuation.safeTier,
                    alphaScore: valuation.alphaScore,
                    riskReason: valuation.riskReason,
                    decimals: valuation.decimals || token.decimals,
                };
            });

            // Sort: SAFE first, then RANKABLE (by alphaScore), then REJECTED
            const sorted = valuatedTokens.sort((a, b) => {
                // Tier priority: SAFE > RANKABLE > REJECTED
                const tierOrder = { 'SAFE': 0, 'RANKABLE': 1, 'REJECTED': 2 };
                const aTier = a.safeTier ? tierOrder[a.safeTier] : 3;
                const bTier = b.safeTier ? tierOrder[b.safeTier] : 3;

                if (aTier !== bTier) return aTier - bTier;

                // Within SAFE tier, sort by SOL value
                if (a.safeTier === 'SAFE' && b.safeTier === 'SAFE') {
                    if (a.valueInSOL && b.valueInSOL) {
                        return b.valueInSOL - a.valueInSOL;
                    }
                }

                // Within RANKABLE tier, sort by alphaScore
                if (a.safeTier === 'RANKABLE' && b.safeTier === 'RANKABLE') {
                    return (b.alphaScore || 0) - (a.alphaScore || 0);
                }

                return 0;
            });

            // Assign alpha ranks to RANKABLE tokens
            let rankCounter = 1;
            sorted.forEach(token => {
                if (token.safeTier === 'RANKABLE') {
                    token.alphaRank = rankCounter++;
                }
            });

            setTokens(sorted);
            console.log(
                `[useSmartTokens] THREE-TIER RESULTS: ${data.safe} SAFE + ${data.rankable} RANKABLE + ${data.rejected} REJECTED = ${data.total} total`
            );
        } catch (err) {
            console.error('[useSmartTokens] Valuation error:', err);
        } finally {
            setValuating(false);
        }
    }

    return { tokens, loading, valuating, error };
}
