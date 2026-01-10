'use client';

/**
 * Smart Swap Page V1 - Display Only
 * 
 * No logic. No filters. No roadmap.
 * Just prove access works.
 * 
 * Architecture:
 * Proxy → Adapter → Hook → UI
 */

import { useSmartTokens } from '@/hooks/useSmartTokens';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';

export default function SmartSwapPage() {
    const { tokens, loading, valuating, error } = useSmartTokens({ enableValuation: true });

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
                                SMART SWAP V2 - EYES
                            </h1>
                            <p className="text-sm text-zinc-400 font-mono">
                                {loading
                                    ? 'Loading tokens...'
                                    : valuating
                                    ? `Valuating ${tokens.length} tokens...`
                                    : `${tokens.filter(t => t.hasRoute).length} liquid tokens`}
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
                        <p className="text-zinc-500 font-mono text-sm">Loading smart tokens...</p>
                    </div>
                )}

                {/* Token List with SOL Values */}
                {!loading && tokens.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-sm text-zinc-500 font-mono mb-4 flex justify-between items-center">
                            <span>
                                Showing first 50 of {tokens.length} tokens
                                {valuating && ' (valuating...)'}
                            </span>
                            {!valuating && (
                                <span className="text-green-400">
                                    {tokens.filter(t => t.hasRoute).length} have SOL routes
                                </span>
                            )}
                        </div>

                        {tokens.slice(0, 50).map(t => (
                            <div
                                key={t.id}
                                className={`bg-zinc-900/50 border rounded-lg p-4 transition-all ${
                                    t.hasRoute
                                        ? 'border-green-500/30 hover:border-green-500/50'
                                        : 'border-zinc-800 hover:border-zinc-700'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <strong className="text-white font-mono text-lg">
                                                {t.symbol}
                                            </strong>
                                            {t.hasRoute && (
                                                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-mono">
                                                    LIQUID
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-zinc-500 font-mono text-sm">{t.name}</div>
                                    </div>

                                    {/* SOL Value Display */}
                                    <div className="text-right">
                                        {valuating ? (
                                            <div className="text-zinc-600 font-mono text-sm">
                                                <Loader2 className="w-4 h-4 inline animate-spin" />
                                            </div>
                                        ) : t.valueInSOL !== undefined ? (
                                            <div>
                                                <div className="text-green-400 font-mono font-bold">
                                                    {t.valueInSOL.toFixed(6)} SOL
                                                </div>
                                                {t.priceImpactPct !== undefined && (
                                                    <div className="text-xs text-zinc-500 font-mono">
                                                        {t.priceImpactPct.toFixed(2)}% impact
                                                    </div>
                                                )}
                                            </div>
                                        ) : t.hasRoute === false ? (
                                            <div className="text-zinc-600 font-mono text-sm">No route</div>
                                        ) : null}
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
                )}

                {/* Empty state */}
                {!loading && tokens.length === 0 && !error && (
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                        <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-500 font-mono text-sm">No tokens available</p>
                    </div>
                )}
            </div>
        </div>
    );
}
