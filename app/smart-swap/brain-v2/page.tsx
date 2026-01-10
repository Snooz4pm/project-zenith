'use client';

/**
 * Smart Swap Scenario Tester
 * 
 * Runs 5 independent searches (Conservative → Best-Effort) and compares results.
 * Simple, transparent UI for testing the new engine.
 */

import { useSmartTokens } from '@/hooks/useSmartTokens';
import { useState } from 'react';
import { Loader2, AlertTriangle, Brain, CheckCircle2, XCircle, TrendingUp, Route, Shield, Zap, Flame, Crosshair, BarChart3 } from 'lucide-react';
import { ScenarioComparison, ScenarioResult, ScenarioId } from '@/types/ScenarioRunner';

export default function ScenarioTesterPage() {
    const { tokens, loading, valuating, error } = useSmartTokens({ enableValuation: true });
    const [comparison, setComparison] = useState<ScenarioComparison | null>(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [startAmountSOL, setStartAmountSOL] = useState(0.1);

    async function runScenarios() {
        if (tokens.length === 0) return;

        setSearching(true);
        setSearchError(null);
        setComparison(null);

        try {
            const response = await fetch('/api/smart-swap/scenarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startAmountSOL, tokens }),
            });

            if (!response.ok) throw new Error(`Scenario API failed: ${response.status}`);

            const data = await response.json();
            setComparison(data.comparison);
        } catch (err: any) {
            console.error('[Scenario Tester] Error:', err);
            setSearchError(err.message || 'Search failed');
        } finally {
            setSearching(false);
        }
    }

    const getScenarioIcon = (id: ScenarioId) => {
        switch (id) {
            case ScenarioId.CONSERVATIVE: return <Shield className="w-5 h-5 text-blue-400" />;
            case ScenarioId.BALANCED: return <Brain className="w-5 h-5 text-purple-400" />;
            case ScenarioId.AGGRESSIVE: return <Zap className="w-5 h-5 text-yellow-400" />;
            case ScenarioId.VOLATILITY: return <Flame className="w-5 h-5 text-orange-500" />;
            case ScenarioId.BEST_EFFORT: return <Crosshair className="w-5 h-5 text-zinc-400" />;
        }
    };

    return (
        <div className="min-h-screen bg-black pt-20 pb-20 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 border-b border-zinc-800 pb-6">
                    <h1 className="text-3xl font-bold text-white font-mono tracking-tight mb-2 flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-purple-500" />
                        SCENARIO RUNNER
                    </h1>
                    <p className="text-zinc-400 font-mono">
                        Running 5 parallel realities to find the optimal path.
                    </p>
                </div>

                {/* Input Section */}
                {!loading && !valuating && (
                    <div className="mb-8 flex gap-4 items-end bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                        <div className="flex-1 max-w-xs">
                            <label className="block text-sm text-zinc-400 font-mono mb-2">
                                Start Amount (SOL)
                            </label>
                            <input
                                type="number"
                                min="0.01" step="0.01" value={startAmountSOL}
                                onChange={(e) => setStartAmountSOL(parseFloat(e.target.value) || 0.1)}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <button
                            onClick={runScenarios}
                            disabled={searching}
                            className="px-8 py-3 bg-white text-black font-mono font-bold rounded-lg hover:bg-zinc-200 disabled:opacity-50 flex items-center gap-2"
                        >
                            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run 5 Scenarios'}
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {searching && (
                    <div className="text-center py-20">
                        <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
                        <p className="text-zinc-500 font-mono">Exploring 5 parallel universes...</p>
                    </div>
                )}

                {/* Results Grid */}
                {comparison && (
                    <div className="space-y-8">
                        {/* Winner Banner */}
                        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6 flex items-start gap-4">
                            <div className="p-3 bg-green-500/20 rounded-lg">
                                <TrendingUp className="w-8 h-8 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white font-mono mb-1">
                                    Recommended: {comparison.best.config.name}
                                </h2>
                                <p className="text-green-400 font-mono text-sm mb-4">
                                    {comparison.winnerReason}
                                </p>
                                <div className="flex gap-6 text-sm font-mono">
                                    <div>
                                        <div className="text-zinc-500">Return</div>
                                        <div className={`text-xl font-bold ${comparison.best.roiPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {comparison.best.roiPct > 0 ? '+' : ''}{comparison.best.roiPct.toFixed(2)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-zinc-500">Final SOL</div>
                                        <div className="text-xl text-white font-bold">{comparison.best.finalAmountSOL.toFixed(4)}</div>
                                    </div>
                                    <div>
                                        <div className="text-zinc-500">Hops</div>
                                        <div className="text-xl text-white font-bold">{comparison.best.hops}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* All Scenarios List */}
                        <div className="grid gap-4">
                            {comparison.all.map((scenario) => {
                                const isWinner = scenario.scenarioId === comparison.best.scenarioId;
                                const isProfitable = scenario.roiPct > 0;

                                return (
                                    <div
                                        key={scenario.scenarioId}
                                        className={`
                                            relative overflow-hidden rounded-xl border p-5 transition-all
                                            ${isWinner ? 'bg-zinc-900 border-green-500/50 shadow-lg shadow-green-900/20' : 'bg-zinc-950 border-zinc-800 opacity-80 hover:opacity-100'}
                                        `}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                                                    {getScenarioIcon(scenario.scenarioId)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white font-mono">{scenario.config.name}</h3>
                                                    <p className="text-xs text-zinc-500 font-mono">{scenario.config.description}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-xl font-bold font-mono ${isProfitable ? 'text-green-400' : 'text-zinc-500'}`}>
                                                    {scenario.roiPct > 0 ? '+' : ''}{scenario.roiPct.toFixed(2)}%
                                                </div>
                                                <div className="text-xs text-zinc-500 font-mono">
                                                    {scenario.finalAmountSOL.toFixed(4)} SOL
                                                </div>
                                            </div>
                                        </div>

                                        {/* Result Details */}
                                        <div className="grid grid-cols-4 gap-4 text-xs font-mono text-zinc-400 bg-zinc-900/50 p-3 rounded-lg">
                                            <div>
                                                <span className="text-zinc-600 block">Result</span>
                                                {scenario.found ? <span className="text-green-400">PATH FOUND</span> : <span className="text-zinc-500">BEST EFFORT</span>}
                                            </div>
                                            <div>
                                                <span className="text-zinc-600 block">Hops</span>
                                                {scenario.hops}
                                            </div>
                                            <div>
                                                <span className="text-zinc-600 block">RTL</span>
                                                {scenario.cumulativeRTL.toFixed(1)}%
                                            </div>
                                            <div>
                                                <span className="text-zinc-600 block">Constraints</span>
                                                {scenario.config.maxHops} hops / {scenario.config.maxTotalRTL}% RTL
                                            </div>
                                        </div>

                                        {/* Path Snippet */}
                                        {(scenario.result.found ? scenario.result.path : scenario.result.bestEffort)?.path?.length ? (
                                            <div className="mt-3 flex flex-wrap gap-2 items-center text-xs font-mono text-zinc-500">
                                                <Route className="w-3 h-3" />
                                                {(scenario.result.found ? scenario.result.path : scenario.result.bestEffort)?.path.map((hop, i) => (
                                                    <span key={i} className="flex items-center">
                                                        {i > 0 && <span className="mx-1">→</span>}
                                                        <span className={hop.hopRTL > 3 ? 'text-red-400' : 'text-zinc-300'}>
                                                            {hop.toSymbol}
                                                        </span>
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="mt-3 text-xs text-zinc-600 font-mono italic">
                                                No path components found
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
