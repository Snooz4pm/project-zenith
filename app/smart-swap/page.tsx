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
                                SMART SWAP V2 - SAFE UNIVERSE
                            </h1>
                            <p className="text-sm text-zinc-400 font-mono">
                                {loading
                                    ? 'Loading tokens...'
                                    : valuating
                                    ? `Probing ${tokens.length} tokens (bidirectional)...`
                                    : `🟢 ${tokens.filter(t => t.safeTier === 'SAFE').length} SAFE | 🟡 ${tokens.filter(t => t.safeTier === 'RANKABLE').length} RANKABLE | 🔴 ${tokens.filter(t => t.safeTier === 'REJECTED').length} REJECTED`}
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
                                {valuating && ' (probing safety...)'}
                            </span>
                            {!valuating && (
                                <div className="flex gap-4 text-xs">
                                    <span className="text-green-400">
                                        🟢 {tokens.filter(t => t.safeTier === 'SAFE').length} SAFE (executable)
                                    </span>
                                    <span className="text-yellow-400">
                                        🟡 {tokens.filter(t => t.safeTier === 'RANKABLE').length} RANKABLE (watch only)
                                    </span>
                                    <span className="text-red-400">
                                        🔴 {tokens.filter(t => t.safeTier === 'REJECTED').length} REJECTED
                                    </span>
                                </div>
                            )}
                        </div>

                        {tokens.slice(0, 50).map(t => {
                            // Determine border color based on safety tier
                            const borderColor = t.safeTier === 'SAFE'
                                ? 'border-green-500/30 hover:border-green-500/50'
                                : t.safeTier === 'RANKABLE'
                                ? 'border-yellow-500/30 hover:border-yellow-500/50'
                                : 'border-red-500/20 hover:border-red-500/30';

                            return (
                                <div
                                    key={t.id}
                                    className={`bg-zinc-900/50 border rounded-lg p-4 transition-all ${borderColor}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <strong className="text-white font-mono text-lg">
                                                    {t.symbol}
                                                </strong>
                                                {t.safeTier === 'SAFE' ? (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-mono">
                                                        🟢 SAFE
                                                    </span>
                                                ) : t.safeTier === 'RANKABLE' ? (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-mono">
                                                        🟡 RANKABLE #{t.alphaRank}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono">
                                                        🔴 REJECTED
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-zinc-500 font-mono text-sm">{t.name}</div>
                                            {t.safeTier === 'RANKABLE' && t.riskReason && (
                                                <div className="text-xs text-yellow-500 font-mono mt-1">
                                                    ⚠ {t.riskReason}
                                                </div>
                                            )}
                                        </div>

                                        {/* Safety Metrics Display */}
                                        <div className="text-right">
                                            {valuating ? (
                                                <div className="text-zinc-600 font-mono text-sm">
                                                    <Loader2 className="w-4 h-4 inline animate-spin" />
                                                </div>
                                            ) : t.safeTier === 'SAFE' ? (
                                                <div>
                                                    <div className="text-green-400 font-mono font-bold">
                                                        {t.valueInSOL ? `${t.valueInSOL.toFixed(6)} SOL` : 'N/A'}
                                                    </div>
                                                    {t.roundTripLoss !== undefined && (
                                                        <div className="text-xs text-green-500 font-mono">
                                                            {t.roundTripLoss.toFixed(1)}% loss
                                                        </div>
                                                    )}
                                                </div>
                                            ) : t.safeTier === 'RANKABLE' ? (
                                                <div>
                                                    <div className="text-yellow-400 font-mono font-bold">
                                                        Alpha: {t.alphaScore?.toFixed(1) || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-yellow-500 font-mono">
                                                        {t.valueInSOL ? `${t.valueInSOL.toFixed(6)} SOL` : 'N/A'}
                                                    </div>
                                                    {t.roundTripLoss !== undefined && (
                                                        <div className="text-xs text-yellow-600 font-mono">
                                                            {t.roundTripLoss.toFixed(1)}% R/T loss
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-red-400 font-mono text-sm">
                                                    Rejected
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

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
