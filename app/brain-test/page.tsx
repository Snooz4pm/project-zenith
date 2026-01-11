'use client';

/**
 * Brain V2 Test Console
 * 
 * A comprehensive UI for testing the Smart Swap Brain before wallet integration.
 * Shows all scenarios, value normalization, ROI targeting, and safety layers.
 */

import { useSmartTokens } from '@/hooks/useSmartTokens';
import { useState, useEffect, useCallback } from 'react';
import {
    Loader2, TrendingUp, Shield, Zap, Flame, Crosshair,
    ArrowRight, Brain, AlertTriangle, CheckCircle2, XCircle,
    RefreshCw, ChevronDown, ChevronUp, Sparkles, Target
} from 'lucide-react';
import { ScenarioComparison, ScenarioId, ScenarioResult } from '@/types/ScenarioRunner';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export default function BrainTestPage() {
    const { tokens, loading } = useSmartTokens({ enableValuation: true });

    // Input State
    const [fromTokenMint, setFromTokenMint] = useState<string>(SOL_MINT);
    const [toTokenMint, setToTokenMint] = useState<string>('');
    const [inputAmount, setInputAmount] = useState<string>('0.1');
    const [roiTarget, setRoiTarget] = useState(5);
    const [preservationMode, setPreservationMode] = useState(true);

    // Normalization Preview
    const [normalizedSOL, setNormalizedSOL] = useState<number | null>(null);
    const [normalizing, setNormalizing] = useState(false);

    // Results State
    const [searching, setSearching] = useState(false);
    const [comparison, setComparison] = useState<ScenarioComparison | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedScenario, setExpandedScenario] = useState<ScenarioId | null>(null);

    // Initialize token defaults
    useEffect(() => {
        if (tokens.length > 0 && !toTokenMint) {
            const dest = tokens.find(t => t.symbol !== 'SOL' && t.symbol !== 'USDC');
            if (dest) setToTokenMint(dest.mint);
        }
    }, [tokens, toTokenMint]);

    // Normalize input value to SOL (preview)
    const normalizeValue = useCallback(async () => {
        if (!fromTokenMint || !inputAmount) return;
        const amount = parseFloat(inputAmount);
        if (isNaN(amount) || amount <= 0) {
            setNormalizedSOL(null);
            return;
        }

        if (fromTokenMint === SOL_MINT) {
            setNormalizedSOL(amount);
            return;
        }

        setNormalizing(true);
        try {
            const res = await fetch(`/api/price?mint=${fromTokenMint}&amount=${amount}`);
            if (res.ok) {
                const data = await res.json();
                setNormalizedSOL(data.valueInSOL);
            } else {
                setNormalizedSOL(null);
            }
        } catch {
            setNormalizedSOL(null);
        } finally {
            setNormalizing(false);
        }
    }, [fromTokenMint, inputAmount]);

    useEffect(() => {
        const debounce = setTimeout(normalizeValue, 500);
        return () => clearTimeout(debounce);
    }, [normalizeValue]);

    // Run Brain Search
    async function runBrainSearch() {
        if (!fromTokenMint || !toTokenMint) return;
        const amount = parseFloat(inputAmount);
        if (isNaN(amount) || amount <= 0) return;

        setSearching(true);
        setError(null);
        setComparison(null);
        setExpandedScenario(null);

        try {
            const response = await fetch('/api/smart-swap/scenarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startAmount: amount,
                    startTokenMint: fromTokenMint,
                    targetTokenMint: toTokenMint,
                    tokens,
                    desiredROI: roiTarget / 100,
                    preservationMode
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `API Error: ${response.status}`);
            }
            setComparison(data.comparison);
            // Auto-expand winner
            if (data.comparison?.best) {
                setExpandedScenario(data.comparison.best.scenarioId);
            }
        } catch (err: any) {
            setError(err.message || 'Search failed');
        } finally {
            setSearching(false);
        }
    }

    const getTokenSymbol = (mint: string) =>
        tokens.find(t => t.mint === mint)?.symbol || mint.slice(0, 6);

    const getScenarioIcon = (id: ScenarioId) => {
        switch (id) {
            case ScenarioId.CONSERVATIVE: return <Shield className="w-5 h-5 text-blue-400" />;
            case ScenarioId.BALANCED: return <Brain className="w-5 h-5 text-purple-400" />;
            case ScenarioId.AGGRESSIVE: return <Zap className="w-5 h-5 text-yellow-400" />;
            case ScenarioId.VOLATILITY: return <Flame className="w-5 h-5 text-orange-500" />;
            case ScenarioId.BEST_EFFORT: return <Crosshair className="w-5 h-5 text-zinc-400" />;
            case ScenarioId.TRINITY: return <Sparkles className="w-5 h-5 text-cyan-400" />;
            default: return <Target className="w-5 h-5 text-zinc-500" />;
        }
    };

    const getStatusBadge = (scenario: ScenarioResult) => {
        const status = scenario.status || (scenario.roadmap?.blocked ? 'BLOCKED_PRESERVATION' : 'VALID');
        switch (status) {
            case 'VALID':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-900/40 text-green-400 border border-green-800">VALID</span>;
            case 'BLOCKED_PRESERVATION':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/40 text-red-400 border border-red-800">BLOCKED</span>;
            case 'NO_PATH':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">NO PATH</span>;
            case 'LOW_CONFIDENCE':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-900/40 text-yellow-400 border border-yellow-800">LOW CONF</span>;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black pt-8 pb-20 px-4">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-2">
                        <Brain className="w-10 h-10 text-purple-500" />
                        <h1 className="text-3xl font-bold text-white font-mono tracking-tight">
                            Brain V2 Test Console
                        </h1>
                    </div>
                    <p className="text-zinc-500 text-sm">
                        Test all scenario logic, value normalization, and safety layers before wallet integration.
                    </p>
                </div>

                {/* Input Panel */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 mb-6 shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* From Token */}
                        <div>
                            <label className="block text-xs font-mono text-zinc-500 mb-2">FROM TOKEN</label>
                            <select
                                value={fromTokenMint}
                                onChange={(e) => setFromTokenMint(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg h-12 px-3 text-white font-mono focus:border-purple-500 outline-none"
                                disabled={loading}
                            >
                                {tokens.map(t => (
                                    <option key={t.mint} value={t.mint}>{t.symbol}</option>
                                ))}
                            </select>
                        </div>

                        {/* To Token */}
                        <div>
                            <label className="block text-xs font-mono text-zinc-500 mb-2">TO TOKEN</label>
                            <select
                                value={toTokenMint}
                                onChange={(e) => setToTokenMint(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg h-12 px-3 text-white font-mono focus:border-purple-500 outline-none"
                                disabled={loading}
                            >
                                {tokens.map(t => (
                                    <option key={t.mint} value={t.mint}>{t.symbol}</option>
                                ))}
                            </select>
                        </div>

                        {/* Amount Input */}
                        <div>
                            <label className="block text-xs font-mono text-zinc-500 mb-2">AMOUNT</label>
                            <input
                                type="text"
                                value={inputAmount}
                                onChange={(e) => setInputAmount(e.target.value)}
                                placeholder="0.0"
                                className="w-full bg-black border border-zinc-700 rounded-lg h-12 px-3 text-white font-mono text-lg focus:border-purple-500 outline-none"
                            />
                            {/* Normalization Preview */}
                            <div className="mt-2 text-xs font-mono text-zinc-500 flex items-center gap-2">
                                {normalizing ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : normalizedSOL !== null ? (
                                    <>
                                        <span>≈</span>
                                        <span className="text-purple-400 font-bold">{normalizedSOL.toFixed(6)} SOL</span>
                                    </>
                                ) : fromTokenMint === SOL_MINT ? (
                                    <span className="text-zinc-600">Native SOL</span>
                                ) : (
                                    <span className="text-zinc-600">Enter amount to preview</span>
                                )}
                            </div>
                        </div>

                        {/* ROI Target */}
                        <div>
                            <label className="block text-xs font-mono text-zinc-500 mb-2">
                                TARGET ROI: <span className={roiTarget > 10 ? 'text-orange-400' : 'text-purple-400'}>{roiTarget}%</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="20"
                                step="1"
                                value={roiTarget}
                                onChange={(e) => setRoiTarget(Number(e.target.value))}
                                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
                                <span>Safe (0%)</span>
                                <span>Balanced (5%)</span>
                                <span>Moonshot (20%)</span>
                            </div>
                        </div>
                    </div>

                    {/* Safety Toggle */}
                    <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className={`w-5 h-5 ${preservationMode ? 'text-green-500' : 'text-zinc-600'}`} />
                            <div>
                                <span className={`font-mono text-sm ${preservationMode ? 'text-green-400' : 'text-zinc-500'}`}>
                                    Preservation Mode
                                </span>
                                <p className="text-[10px] text-zinc-600">Max 0.7% drawdown protection</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setPreservationMode(!preservationMode)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${preservationMode ? 'bg-green-900/50' : 'bg-zinc-800'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${preservationMode ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* Search Button */}
                    <button
                        onClick={runBrainSearch}
                        disabled={searching || loading || !fromTokenMint || !toTokenMint}
                        className="mt-6 w-full py-4 rounded-xl font-bold text-lg tracking-wide transition-all
                            bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 
                            shadow-lg shadow-purple-900/30 border border-purple-500/50
                            disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {searching ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Searching Scenarios...
                            </>
                        ) : (
                            <>
                                <Brain className="w-5 h-5" />
                                Run Brain Search
                            </>
                        )}
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <span className="text-red-400 font-mono text-sm">{error}</span>
                    </div>
                )}

                {/* Results Panel */}
                {comparison && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">

                        {/* Winner Banner */}
                        <div className="bg-gradient-to-r from-green-950/50 to-emerald-950/20 border border-green-500/30 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-500/20 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {getScenarioIcon(comparison.best.scenarioId)}
                                        <h2 className="text-lg font-bold text-white font-mono">
                                            Recommended: {comparison.best.config.name}
                                        </h2>
                                        {getStatusBadge(comparison.best)}
                                    </div>
                                    <p className="text-green-400 font-mono text-sm mb-4">
                                        {comparison.winnerReason}
                                    </p>
                                    <div className="grid grid-cols-3 gap-4 text-sm font-mono">
                                        <div>
                                            <div className="text-zinc-500 text-xs">Return</div>
                                            <div className={`text-xl font-bold ${comparison.best.roiPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {comparison.best.roiPct > 0 ? '+' : ''}{comparison.best.roiPct.toFixed(2)}%
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500 text-xs">Final Value</div>
                                            <div className="text-xl font-bold text-white">
                                                {comparison.best.finalAmountSOL.toFixed(6)} SOL
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500 text-xs">Hops</div>
                                            <div className="text-xl font-bold text-white">
                                                {comparison.best.hops}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* All Scenarios */}
                        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-zinc-800">
                                <h3 className="font-mono text-sm text-zinc-400">All Scenarios ({comparison.all.length})</h3>
                            </div>

                            {comparison.all.map((scenario) => {
                                const isWinner = comparison.best.scenarioId === scenario.scenarioId;
                                const isExpanded = expandedScenario === scenario.scenarioId;
                                const status = scenario.status || 'VALID';
                                const isBlocked = status === 'BLOCKED_PRESERVATION' || status === 'NO_PATH';

                                return (
                                    <div
                                        key={scenario.scenarioId}
                                        className={`border-b border-zinc-800 last:border-0 ${isWinner ? 'bg-green-950/10' : ''} ${isBlocked ? 'opacity-60' : ''}`}
                                    >
                                        {/* Scenario Header */}
                                        <button
                                            onClick={() => setExpandedScenario(isExpanded ? null : scenario.scenarioId)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {getScenarioIcon(scenario.scenarioId)}
                                                <span className={`font-mono font-bold ${isWinner ? 'text-white' : 'text-zinc-400'}`}>
                                                    {scenario.config.name}
                                                </span>
                                                {isWinner && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-900/40 text-green-400 border border-green-800">
                                                        ★ BEST
                                                    </span>
                                                )}
                                                {getStatusBadge(scenario)}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`font-mono font-bold ${scenario.roiPct > 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                                                    {scenario.roiPct > 0 ? '+' : ''}{scenario.roiPct.toFixed(2)}%
                                                </span>
                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                                            </div>
                                        </button>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 pt-2 bg-black/20">
                                                {/* Status Reason */}
                                                {scenario.reason && (
                                                    <div className="mb-3 p-2 bg-zinc-800/50 rounded text-xs font-mono text-zinc-400 flex items-center gap-2">
                                                        <AlertTriangle className="w-3 h-3 text-orange-400" />
                                                        {scenario.reason}
                                                    </div>
                                                )}

                                                {/* Roadmap Steps */}
                                                {scenario.roadmap && (
                                                    <div className="space-y-2">
                                                        <div className="text-xs text-zinc-500 font-mono mb-2">
                                                            {scenario.roadmap.summary.hops} hops • {scenario.roadmap.summary.holds} holds • Confidence: {scenario.roadmap.summary.confidence}
                                                        </div>

                                                        {scenario.roadmap.steps.map((step, i) => (
                                                            <div key={i} className="flex items-center gap-2 text-xs font-mono">
                                                                <span className="text-zinc-600 w-5">{step.index + 1}.</span>
                                                                {step.action === 'SWAP' ? (
                                                                    <>
                                                                        <span className="text-zinc-300">{step.fromSymbol}</span>
                                                                        <ArrowRight className="w-3 h-3 text-zinc-600" />
                                                                        <span className="text-zinc-300">{step.toSymbol}</span>
                                                                        <span className={`px-1 rounded text-[9px] ${step.confidence === 'HIGH' ? 'bg-green-900/30 text-green-400' :
                                                                                step.confidence === 'MEDIUM' ? 'bg-yellow-900/30 text-yellow-400' :
                                                                                    'bg-red-900/30 text-red-400'
                                                                            }`}>
                                                                            {step.confidence}
                                                                        </span>
                                                                        {step.protection !== 'SAFE' && (
                                                                            <span className="px-1 rounded text-[9px] border border-purple-500 text-purple-400">
                                                                                {step.protection}
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <span className="text-purple-400">⏸ Hold {step.holdMinutes}min</span>
                                                                )}
                                                            </div>
                                                        ))}

                                                        {/* Warnings */}
                                                        {scenario.roadmap.warnings.length > 0 && (
                                                            <div className="mt-3 pt-2 border-t border-zinc-800">
                                                                {scenario.roadmap.warnings.map((w, i) => (
                                                                    <div key={i} className="text-xs text-orange-400 font-mono flex items-center gap-2">
                                                                        <AlertTriangle className="w-3 h-3" />
                                                                        {w}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {!scenario.roadmap && (
                                                    <div className="text-xs text-zinc-600 font-mono">
                                                        No roadmap generated for this scenario.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Debug Info */}
                        <div className="text-[10px] text-zinc-600 font-mono text-center">
                            Brain V2 Test Console • Pre-Wallet Phase • No Transactions Executed
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
