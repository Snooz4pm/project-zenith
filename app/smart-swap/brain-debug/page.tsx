'use client';

/**
 * Smart Swap Brain Debug View
 *
 * Exposes brain decision-making before any execution layer.
 * Shows: Token | IQS | Volatility | RTL | Stable Hops | Verdict
 */

import { useSmartTokens } from '@/hooks/useSmartTokens';
import { useState } from 'react';
import { Loader2, AlertTriangle, Brain, CheckCircle2, XCircle } from 'lucide-react';
import { BrainOutput, RankedTarget } from '@/types/Brain';

export default function BrainDebugPage() {
    const { tokens, loading, valuating, error } = useSmartTokens({ enableValuation: true });
    const [brainOutput, setBrainOutput] = useState<BrainOutput | null>(null);
    const [processing, setProcessing] = useState(false);
    const [brainError, setBrainError] = useState<string | null>(null);

    async function runBrainAnalysis() {
        if (tokens.length === 0) return;

        setProcessing(true);
        setBrainError(null);

        try {
            // Build brain input from current tokens
            const safeAndRankable = tokens.filter(
                t => t.safeTier === 'SAFE' || t.safeTier === 'RANKABLE'
            );

            if (safeAndRankable.length === 0) {
                setBrainError('No SAFE or RANKABLE tokens available for brain analysis');
                return;
            }

            const brainInput = {
                baseToken: {
                    address: 'So11111111111111111111111111111111111111112',
                    symbol: 'SOL' as const,
                    priceUSD: 100, // Mock price for now
                },
                amountSOL: 0.1,
                tokens: safeAndRankable.map(t => ({
                    address: t.mint,
                    symbol: t.symbol,
                    name: t.name,
                    decimals: t.decimals || 6,
                })),
                valuations: safeAndRankable.reduce((acc, t) => {
                    if (t.valueInSOL) {
                        acc[t.mint] = {
                            priceInSOL: t.valueInSOL,
                            priceUSD: t.valueInSOL * 100, // Mock USD conversion
                        };
                    }
                    return acc;
                }, {} as any),
                routes: safeAndRankable.reduce((acc, t) => {
                    acc[t.mint] = {
                        exists: t.hasRoute ?? false,
                        hops: 1, // Direct SOL → Token
                        inAmountSOL: 0.1,
                        outAmountSOL: t.valueInSOL ?? 0,
                        entrySlippage: t.priceImpactPct ?? 0,
                        exitSlippage: t.priceImpactPct ?? 0,
                        roundTripLoss: t.roundTripLoss ?? 99,
                        liquidityScore: t.hasRoute ? 0.5 : 0,
                    };
                    return acc;
                }, {} as any),
                alphaSignals: {}, // No alpha signals for now
            };

            const response = await fetch('/api/smart-swap/brain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(brainInput),
            });

            if (!response.ok) {
                throw new Error(`Brain API failed: ${response.status}`);
            }

            const data = await response.json();
            setBrainOutput(data.output);
        } catch (err: any) {
            console.error('[Brain Debug] Error:', err);
            setBrainError(err.message || 'Brain processing failed');
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div className="min-h-screen bg-black pt-20 pb-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white font-mono tracking-tight">
                                BRAIN DEBUG VIEW
                            </h1>
                            <p className="text-sm text-zinc-400 font-mono">
                                Exposes brain decision-making before execution layer
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {(error || brainError) && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 font-mono text-sm text-red-400">
                        <AlertTriangle className="w-4 h-4 inline mr-2" />
                        {error || brainError}
                    </div>
                )}

                {/* Control Panel */}
                {!loading && !valuating && tokens.length > 0 && (
                    <div className="mb-8 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white font-mono mb-2">
                                    Token Universe Ready
                                </h2>
                                <p className="text-sm text-zinc-400 font-mono">
                                    {tokens.filter(t => t.safeTier === 'SAFE').length} SAFE + {tokens.filter(t => t.safeTier === 'RANKABLE').length} RANKABLE tokens loaded
                                </p>
                            </div>
                            <button
                                onClick={runBrainAnalysis}
                                disabled={processing}
                                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-mono font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing Brain...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="w-5 h-5" />
                                        Run Brain Analysis
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Brain Output Table */}
                {brainOutput && (
                    <div className="space-y-6">
                        {/* Metadata */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                            <div className="grid grid-cols-3 gap-4 text-sm font-mono">
                                <div>
                                    <span className="text-zinc-500">Total Tokens:</span>
                                    <span className="text-white ml-2">{brainOutput.universeStats.totalTokens}</span>
                                </div>
                                <div>
                                    <span className="text-cyan-500">Routeable:</span>
                                    <span className="text-white ml-2">{brainOutput.universeStats.routeableTokens}</span>
                                </div>
                                <div>
                                    <span className="text-green-500">Safe (Passed Constraints):</span>
                                    <span className="text-white ml-2">{brainOutput.universeStats.safeTokens}</span>
                                </div>
                            </div>
                        </div>

                        {/* Results Table */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full font-mono text-sm">
                                    <thead>
                                        <tr className="bg-zinc-800/50 text-zinc-400">
                                            <th className="text-left px-4 py-3 font-bold">Token</th>
                                            <th className="text-right px-4 py-3 font-bold">IQ Score</th>
                                            <th className="text-right px-4 py-3 font-bold">Alpha Score</th>
                                            <th className="text-center px-4 py-3 font-bold">Volatility</th>
                                            <th className="text-right px-4 py-3 font-bold">RTL %</th>
                                            <th className="text-center px-4 py-3 font-bold">Stable Hops</th>
                                            <th className="text-center px-4 py-3 font-bold">Roadmap Bias</th>
                                            <th className="text-center px-4 py-3 font-bold">Class</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {brainOutput.rankedTargets.map((target: RankedTarget, idx: number) => {
                                            const isClassA = target.classification === 'A';
                                            const rowBg = isClassA
                                                ? 'hover:bg-green-500/5'
                                                : 'hover:bg-yellow-500/5';

                                            return (
                                                <tr
                                                    key={target.targetToken.address}
                                                    className={`border-t border-zinc-800/50 ${rowBg} transition-colors`}
                                                >
                                                    {/* Token */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white font-bold">
                                                                {target.targetToken.symbol}
                                                            </span>
                                                            <span className="text-zinc-600 text-xs">
                                                                #{idx + 1}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* IQ Score */}
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="text-cyan-400 font-bold">
                                                            {target.metrics.iqScore.toFixed(1)}
                                                        </span>
                                                    </td>

                                                    {/* Alpha Score */}
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="text-purple-400 font-bold">
                                                            {target.metrics.alphaScore.toFixed(2)}
                                                        </span>
                                                    </td>

                                                    {/* Volatility */}
                                                    <td className="px-4 py-3 text-center">
                                                        <span
                                                            className={`px-2 py-1 rounded text-xs ${
                                                                target.metrics.volatility < 0.3
                                                                    ? 'bg-blue-500/20 text-blue-400'
                                                                    : target.metrics.volatility < 0.7
                                                                    ? 'bg-yellow-500/20 text-yellow-400'
                                                                    : 'bg-red-500/20 text-red-400'
                                                            }`}
                                                        >
                                                            {target.metrics.volatility.toFixed(2)}
                                                        </span>
                                                    </td>

                                                    {/* RTL % */}
                                                    <td className="px-4 py-3 text-right">
                                                        <span
                                                            className={`font-bold ${
                                                                target.metrics.roundTripLoss <= 10
                                                                    ? 'text-green-400'
                                                                    : target.metrics.roundTripLoss <= 12
                                                                    ? 'text-yellow-400'
                                                                    : 'text-red-400'
                                                            }`}
                                                        >
                                                            {target.metrics.roundTripLoss.toFixed(1)}%
                                                        </span>
                                                    </td>

                                                    {/* Stable Hops */}
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="text-white">
                                                            {target.metrics.stableHopCount}
                                                        </span>
                                                    </td>

                                                    {/* Roadmap Bias */}
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="text-xs text-zinc-400 uppercase">
                                                            {target.roadmapPreview.expectedBias.replace(/\//g, '/')}
                                                        </span>
                                                    </td>

                                                    {/* Classification */}
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {isClassA ? (
                                                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                            ) : (
                                                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                                            )}
                                                            <span
                                                                className={`font-bold ${
                                                                    isClassA
                                                                        ? 'text-green-400'
                                                                        : 'text-yellow-400'
                                                                }`}
                                                            >
                                                                {target.classification}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* No Results */}
                        {brainOutput.rankedTargets.length === 0 && (
                            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                                <Brain className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                <p className="text-zinc-500 font-mono text-sm">No targets ranked by brain</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                        <Loader2 className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-spin" />
                        <p className="text-zinc-500 font-mono text-sm">Loading token universe...</p>
                    </div>
                )}

                {/* Valuating State */}
                {valuating && (
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                        <Loader2 className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-spin" />
                        <p className="text-zinc-500 font-mono text-sm">Probing {tokens.length} tokens for safety...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
