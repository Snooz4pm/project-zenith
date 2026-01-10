'use client';

/**
 * Smart Swap Page - ULTRA SIMPLE VERSION
 * 
 * RULES:
 * ❌ No token.address in JSX
 * ❌ No logoURI / IPFS
 * ❌ No map() on raw API data
 * ❌ No execution logic
 * ✅ Only ONE component renders tokens
 */

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { TokenUI } from '@/lib/tokenUI';
import { normalizeTokens } from '@/lib/normalizeTokens';

const TOKENS_API = '/api/smart-swap/tokens';

export default function SmartSwapPage() {
    const [tokens, setTokens] = useState<TokenUI[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch tokens on mount
    useEffect(() => {
        setLoading(true);
        setError(null);

        fetch(TOKENS_API)
            .then(res => res.json())
            .then(data => {
                // NORMALIZE - no inline .map(), no assumptions
                const normalized = normalizeTokens(data.tokens ?? data);
                console.log(`[Smart Swap] Normalized ${normalized.length} tokens`);
                setTokens(normalized);
            })
            .catch(err => {
                console.error('[Smart Swap] Fetch error:', err);
                setError('Failed to load tokens');
                setTokens([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-black pt-20 pb-20 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white font-mono tracking-tight">
                                SMART SWAP V1
                            </h1>
                            <p className="text-sm text-zinc-400 font-mono">
                                {loading ? 'Loading...' : `${tokens.length} tokens loaded`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 font-mono text-sm text-red-400">
                        <AlertTriangle className="w-4 h-4 inline mr-2" />
                        {error}
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                        <Loader2 className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
                        <p className="text-zinc-500 font-mono text-sm">Loading tokens...</p>
                    </div>
                )}

                {/* Token List - DUMB COMPONENT */}
                {!loading && <TokenList tokens={tokens} />}
            </div>
        </div>
    );
}

/**
 * TokenList - DUMB RENDER COMPONENT
 * 
 * Cannot crash
 * Cannot dereference undefined
 * Does not depend on network
 * Does not care about IPFS
 */
function TokenList({ tokens }: { tokens: TokenUI[] }) {
    if (!tokens.length) {
        return (
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500 font-mono text-sm">No tokens available</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="text-sm text-zinc-500 font-mono mb-4">
                Showing {tokens.length} tokens
            </div>

            {/* SAFE: tokens is TokenUI[], id is index-based */}
            {tokens.slice(0, 50).map(t => (
                <div
                    key={t.id}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-purple-500/30 transition-all"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <strong className="text-white font-mono text-lg">{t.symbol}</strong>
                            <div className="text-zinc-500 font-mono text-sm">{t.name}</div>
                        </div>
                    </div>
                </div>
            ))}

            {tokens.length > 50 && (
                <div className="text-center text-zinc-500 font-mono text-sm py-4">
                    + {tokens.length - 50} more tokens
                </div>
            )}
        </div>
    );
}
