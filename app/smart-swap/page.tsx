'use client';

/**
 * Smart Swap Page V2 - Three-Tier Universe + Brain
 *
 * Architecture:
 * Proxy → Adapter → Hook → UI → Brain (Pathfinding)
 */

import { useSmartTokens } from '@/hooks/useSmartTokens';
import { Sparkles, Loader2, AlertTriangle, Zap, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { RoadmapCandidate } from '@/types/Roadmap';

export default function SmartSwapPage() {
    const { tokens, loading, valuating, error } = useSmartTokens({ enableValuation: true });
    const [roadmaps, setRoadmaps] = useState<RoadmapCandidate[]>([]);
    const [discovering, setDiscovering] = useState(false);
    const [inputSOL, setInputSOL] = useState(0.1);

    async function discoverRoadmaps() {
        if (tokens.length === 0) return;

        setDiscovering(true);
        try {
            const response = await fetch('/api/smart-swap/roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inputSOL,
                    tokens: tokens.filter(t => t.safeTier === 'SAFE' || t.safeTier === 'RANKABLE'),
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            setRoadmaps(data.roadmaps || []);
        } catch (err: any) {
            console.error('[Roadmap Discovery] Error:', err);
        } finally {
            setDiscovering(false);
        }
    }

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

                {/* Roadmap Discovery Panel */}
                {!loading && !valuating && tokens.filter(t => t.safeTier === 'SAFE').length > 0 && (
                    <div className="mb-8 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border border-purple-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="w-6 h-6 text-purple-400" />
                            <div>
                                <h2 className="text-xl font-bold text-white font-mono">SMART SWAP BRAIN</h2>
                                <p className="text-sm text-zinc-400 font-mono">
                                    Discover executable trading roadmaps (SOL → A → B → SOL)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-end gap-4">
                            <div className="flex-1">
                                <label className="block text-sm text-zinc-400 font-mono mb-2">
                                    Input SOL
                                </label>
                                <input
                                    type="number"
                                    min="0.01"
                                    max="10"
                                    step="0.01"
                                    value={inputSOL}
                                    onChange={(e) => setInputSOL(parseFloat(e.target.value) || 0.1)}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <button
                                onClick={discoverRoadmaps}
                                disabled={discovering}
                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-mono font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {discovering ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Thinking...
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="w-5 h-5" />
                                        Discover Roadmaps
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Roadmap Results */}
                {roadmaps.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-white font-mono mb-4">
                            {roadmaps.length} Roadmap{roadmaps.length !== 1 ? 's' : ''} Discovered
                        </h3>
                        <div className="space-y-4">
                            {roadmaps.map((roadmap, idx) => (
                                <div
                                    key={idx}
                                    className="bg-zinc-900/50 border border-purple-500/30 rounded-lg p-4"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">
                                                {roadmap.riskLevel === 'low' ? '🟢' : roadmap.riskLevel === 'medium' ? '🟡' : '🔴'}
                                            </span>
                                            <div>
                                                <div className="font-mono text-white font-bold">
                                                    {roadmap.path.join(' → ')}
                                                </div>
                                                <div className="text-xs text-zinc-500 font-mono">
                                                    Risk: {roadmap.riskLevel} | Confidence: {(roadmap.confidence * 100).toFixed(0)}% | Valid: {roadmap.validFor}s
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-2xl font-bold font-mono ${roadmap.simulatedROI >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {roadmap.simulatedROI >= 0 ? '+' : ''}{roadmap.simulatedROI.toFixed(2)}%
                                            </div>
                                            <div className="text-xs text-zinc-500 font-mono">
                                                Simulated ROI
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hop Details */}
                                    <div className="space-y-2">
                                        {roadmap.hops.map((hop, hopIdx) => (
                                            <div key={hopIdx} className="flex items-center justify-between text-sm font-mono bg-zinc-800/30 rounded px-3 py-2">
                                                <span className="text-zinc-400">
                                                    Hop {hopIdx + 1}: {hop.from} → {hop.to}
                                                </span>
                                                <span className="text-yellow-500">
                                                    {hop.slippage.toFixed(2)}% slippage
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Metrics */}
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-zinc-800/30 rounded px-3 py-2">
                                            <span className="text-zinc-500 font-mono">Total Slippage:</span>
                                            <span className="text-yellow-400 font-mono ml-2">{roadmap.totalSlippage.toFixed(2)}%</span>
                                        </div>
                                        <div className="bg-zinc-800/30 rounded px-3 py-2">
                                            <span className="text-zinc-500 font-mono">Max Hop Slippage:</span>
                                            <span className="text-yellow-400 font-mono ml-2">{roadmap.maxHopSlippage.toFixed(2)}%</span>
                                        </div>
                                    </div>

                                    {/* Warning */}
                                    <div className="mt-3 text-xs text-zinc-500 font-mono italic">
                                        ⚠ This is a simulation. Real execution requires wallet approval for each hop. Routes can change.
                                    </div>
                                </div>
                            ))}
                        </div>
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
