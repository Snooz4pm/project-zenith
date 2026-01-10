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
    const { tokens, loading, error } = useSmartTokens();

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
                        <p className="text-zinc-500 font-mono text-sm">Loading smart tokens...</p>
                    </div>
                )}

                {/* Token List - DISPLAY ONLY */}
                {!loading && tokens.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-sm text-zinc-500 font-mono mb-4">
                            Showing first 50 of {tokens.length} tokens
                        </div>

                        {tokens.slice(0, 50).map(t => (
                            <div
                                key={t.id}
                                className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-purple-500/30 transition-all"
                            >
                                <strong className="text-white font-mono text-lg">{t.symbol}</strong>
                                <div className="text-zinc-500 font-mono text-sm">{t.name}</div>
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
