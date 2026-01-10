'use client';

/**
 * Smart Swap Brain v2 - Path Search Debug View
 *
 * Shows graph search results with full path visualization.
 * Honest about when target is NOT reachable.
 */

import { useSmartTokens } from '@/hooks/useSmartTokens';
import { useState } from 'react';
import { Loader2, AlertTriangle, Brain, CheckCircle2, XCircle, TrendingUp, Route } from 'lucide-react';
import { BrainGoal, BrainSearchResult } from '@/types/BrainV2';

export default function BrainV2Page() {
    const { tokens, loading, valuating, error } = useSmartTokens({ enableValuation: true });
    const [searchResult, setSearchResult] = useState<BrainSearchResult | null>(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [universeStats, setUniverseStats] = useState<{
        total: number;
        safe: number;
        alpha: number;
        routable: number;
        excluded: number;
    } | null>(null);

    // Goal state
    const [startAmountSOL, setStartAmountSOL] = useState(0.1);
    const [targetAmountSOL, setTargetAmountSOL] = useState(0.12);
    const [maxHops, setMaxHops] = useState(20);
    const [maxTotalRTL, setMaxTotalRTL] = useState(20);
    const [maxPerHopRTL, setMaxPerHopRTL] = useState(5);

    async function runSearch() {
        if (tokens.length === 0) return;

        setSearching(true);
        setSearchError(null);

        try {
            const goal: BrainGoal = {
                startToken: 'SOL',
                startAmountSOL,
                targetAmountSOL,
                maxHops,
                maxTotalRTL,
                maxPerHopRTL,
            };

            const response = await fetch('/api/smart-swap/brain-v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal, tokens }),
            });

            if (!response.ok) {
                throw new Error(`Brain v2 API failed: ${response.status}`);
            }

            const data = await response.json();
            setSearchResult(data.result);
            if (data.universeStats) {
                setUniverseStats(data.universeStats);
            }
        } catch (err: any) {
            console.error('[Brain v2 Debug] Error:', err);
            setSearchError(err.message || 'Search failed');
        } finally {
            setSearching(false);
        }
    }

    return (
        <div className="min-h-screen bg-black pt-20 pb-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white font-mono tracking-tight">
                                BRAIN v2 - GRAPH SEARCH ENGINE
                            </h1>
                            <p className="text-sm text-zinc-400 font-mono">
                                Beam search pathfinder. Target is a constraint, not a promise.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {(error || searchError) && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 font-mono text-sm text-red-400">
                        <AlertTriangle className="w-4 h-4 inline mr-2" />
                        {error || searchError}
                    </div>
                )}

                {/* Search Configuration */}
                {!loading && !valuating && tokens.length > 0 && (
                    <div className="mb-8 bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-red-900/20 border border-purple-500/30 rounded-xl p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-white font-mono mb-2">
                                Search Goal
                            </h2>
                            <div className="text-sm text-zinc-400 font-mono space-y-1">
                                {universeStats ? (
                                    <>
                                        <div>• <span className="text-white">{universeStats.total}</span> indexed tokens</div>
                                        <div>• <span className="text-green-400">{universeStats.safe}</span> SAFE fuel tokens</div>
                                        <div>• <span className="text-orange-400">{universeStats.alpha}</span> ALPHA candidates</div>
                                        <div>• <span className="text-zinc-500">{universeStats.excluded}</span> excluded by constraints</div>
                                    </>
                                ) : (
                                    <div>Universe: {tokens.length} tokens (run search to see breakdown)</div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm text-zinc-400 font-mono mb-2">
                                    Start Amount (SOL)
                                </label>
                                <input
                                    type="number"
                                    min="0.01"
                                    max="10"
                                    step="0.01"
                                    value={startAmountSOL}
                                    onChange={(e) => setStartAmountSOL(parseFloat(e.target.value) || 0.1)}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 font-mono mb-2">
                                    Target Amount (SOL) - CONSTRAINT
                                </label>
                                <input
                                    type="number"
                                    min="0.01"
                                    max="10"
                                    step="0.01"
                                    value={targetAmountSOL}
                                    onChange={(e) => setTargetAmountSOL(parseFloat(e.target.value) || 0.2)}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="block text-sm text-zinc-400 font-mono mb-2">
                                    Max Hops
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    step="1"
                                    value={maxHops}
                                    onChange={(e) => setMaxHops(parseInt(e.target.value) || 20)}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 font-mono mb-2">
                                    Max Total RTL (%)
                                </label>
                                <input
                                    type="number"
                                    min="5"
                                    max="50"
                                    step="1"
                                    value={maxTotalRTL}
                                    onChange={(e) => setMaxTotalRTL(parseInt(e.target.value) || 20)}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 font-mono mb-2">
                                    Max Per-Hop RTL (%)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    step="1"
                                    value={maxPerHopRTL}
                                    onChange={(e) => setMaxPerHopRTL(parseInt(e.target.value) || 5)}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <button
                            onClick={runSearch}
                            disabled={searching}
                            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white font-mono font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {searching ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Searching graph...
                                </>
                            ) : (
                                <>
                                    <Route className="w-5 h-5" />
                                    Run Beam Search
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Search Results */}
                {searchResult && (
                    <div className="space-y-6">
                        {/* Result Status */}
                        <div className={`border rounded-lg p-6 ${searchResult.found ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                {searchResult.found ? (
                                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                                ) : (
                                    <XCircle className="w-8 h-8 text-red-400" />
                                )}
                                <div>
                                    <h2 className={`text-2xl font-bold font-mono ${searchResult.found ? 'text-green-400' : 'text-red-400'}`}>
                                        {searchResult.found ? 'PATH FOUND' : 'PATH NOT FOUND'}
                                    </h2>
                                    <p className="text-sm text-zinc-400 font-mono">
                                        {searchResult.found
                                            ? `Target reachable in ${searchResult.reachableAtHop} hops`
                                            : searchResult.reason}
                                    </p>
                                </div>
                            </div>

                            {!searchResult.found && (
                                <div className="text-sm text-zinc-400 font-mono">
                                    Explored {searchResult.exploredPaths} paths
                                    {searchResult.bestEffort && (
                                        <span className="ml-2">
                                            • Best effort: {searchResult.bestEffort.currentAmountSOL.toFixed(6)} SOL ({((searchResult.bestEffort.currentAmountSOL / targetAmountSOL) * 100).toFixed(1)}% of target)
                                        </span>
                                    )}
                                </div>
                            )}

                            {searchResult.found && (
                                <div className="grid grid-cols-3 gap-4 mt-4 text-sm font-mono">
                                    <div className="bg-zinc-900/50 rounded px-3 py-2">
                                        <span className="text-zinc-500">Confidence:</span>
                                        <span className={`ml-2 font-bold ${searchResult.confidence === 'high' ? 'text-green-400' : searchResult.confidence === 'medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {searchResult.confidence.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="bg-zinc-900/50 rounded px-3 py-2">
                                        <span className="text-zinc-500">Hops:</span>
                                        <span className="text-white ml-2 font-bold">{searchResult.path.hopsUsed}</span>
                                    </div>
                                    <div className="bg-zinc-900/50 rounded px-3 py-2">
                                        <span className="text-zinc-500">Cumulative RTL:</span>
                                        <span className="text-yellow-400 ml-2 font-bold">{searchResult.path.cumulativeRTL.toFixed(1)}%</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Warnings */}
                        {searchResult.found && searchResult.warnings.length > 0 && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        {searchResult.warnings.map((warning, idx) => (
                                            <p key={idx} className="text-sm text-yellow-400 font-mono">
                                                {warning}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Path Visualization */}
                        {searchResult.found && (
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-white font-mono mb-4 flex items-center gap-2">
                                    <Route className="w-5 h-5" />
                                    Path Breakdown
                                </h3>
                                <div className="space-y-2">
                                    {searchResult.path.path.map((hop, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-zinc-800/30 rounded-lg px-4 py-3">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono text-sm font-bold">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-white font-mono">
                                                    {hop.fromSymbol} → {hop.toSymbol}
                                                </div>
                                                <div className="text-xs text-zinc-500 font-mono">
                                                    {hop.estimatedInSOL.toFixed(6)} SOL → {hop.estimatedOutSOL.toFixed(6)} SOL
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-yellow-400 font-mono text-sm">
                                                    {hop.hopRTL.toFixed(2)}% RTL
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Final result */}
                                    <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
                                        <TrendingUp className="w-5 h-5 text-green-400" />
                                        <div className="flex-1">
                                            <div className="text-green-400 font-mono font-bold">
                                                Final: {searchResult.path.currentAmountSOL.toFixed(6)} SOL
                                            </div>
                                            <div className="text-xs text-zinc-500 font-mono">
                                                {((searchResult.path.currentAmountSOL / startAmountSOL - 1) * 100).toFixed(1)}% gain
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Best Effort (if not found) */}
                        {!searchResult.found && searchResult.bestEffort && (
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-white font-mono mb-4 flex items-center gap-2">
                                    <Route className="w-5 h-5 text-yellow-400" />
                                    Best Effort Path
                                </h3>
                                <div className="text-sm text-zinc-400 font-mono mb-4">
                                    Got to <span className="text-yellow-400 font-bold">{searchResult.bestEffort.currentSymbol}</span> with{' '}
                                    <span className="text-yellow-400 font-bold">{searchResult.bestEffort.currentAmountSOL.toFixed(6)} SOL</span>{' '}
                                    in {searchResult.bestEffort.hopsUsed} hops
                                    {searchResult.bestEffort.currentAmountSOL >= targetAmountSOL && (
                                        <span className="ml-2 text-green-400">✓ Exceeded target!</span>
                                    )}
                                </div>

                                {/* Hop Trace Visualization */}
                                {searchResult.bestEffort.path.length > 0 && (
                                    <div className="space-y-2">
                                        {searchResult.bestEffort.path.map((hop, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-zinc-800/30 rounded-lg px-4 py-3">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-mono text-sm font-bold">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-white font-mono">
                                                        {hop.fromSymbol} → {hop.toSymbol}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 font-mono">
                                                        {hop.estimatedInSOL.toFixed(6)} SOL → {hop.estimatedOutSOL.toFixed(6)} SOL
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`font-mono text-sm ${hop.hopRTL > 3 ? 'text-red-400' : hop.hopRTL > 1.5 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                        {hop.hopRTL.toFixed(2)}% RTL
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Final Summary */}
                                        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 mt-2">
                                            <TrendingUp className="w-5 h-5 text-yellow-400" />
                                            <div className="flex-1">
                                                <div className="text-yellow-400 font-mono font-bold">
                                                    Best Effort: {searchResult.bestEffort.currentAmountSOL.toFixed(6)} SOL
                                                </div>
                                                <div className="text-xs text-zinc-500 font-mono">
                                                    {searchResult.bestEffort.currentAmountSOL >= startAmountSOL
                                                        ? `+${((searchResult.bestEffort.currentAmountSOL / startAmountSOL - 1) * 100).toFixed(1)}% from start`
                                                        : `${((searchResult.bestEffort.currentAmountSOL / startAmountSOL - 1) * 100).toFixed(1)}% from start`
                                                    }
                                                    {' '}| {((searchResult.bestEffort.currentAmountSOL / targetAmountSOL) * 100).toFixed(1)}% of target
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Why it failed hint */}
                                <div className="mt-4 text-xs text-zinc-500 font-mono italic border-t border-zinc-700 pt-3">
                                    ⚠ Path reached a profitable state but couldn't satisfy all constraints (e.g., no valid return to SOL).
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Loading/Valuating States */}
                {loading && (
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                        <Loader2 className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
                        <p className="text-zinc-500 font-mono text-sm">Loading token universe...</p>
                    </div>
                )}

                {valuating && (
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                        <Loader2 className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
                        <p className="text-zinc-500 font-mono text-sm">Probing {tokens.length} tokens for safety...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
