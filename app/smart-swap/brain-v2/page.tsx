'use client';

/**
 * Smart Swap Prototype - Testbed for Intent Routing
 * 
 * Implements the "Simple vs Smart" toggle and ROI intent logic.
 * Default: Simple Swap (Direct Jupiter)
 * Smart: Brain V2 with Scenarios + ROI Targeting
 */

import { useSmartTokens } from '@/hooks/useSmartTokens';
import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Route, Shield, Zap, Flame, Crosshair, BarChart3, ArrowRight, Settings2, RefreshCw } from 'lucide-react';
import { ScenarioComparison, ScenarioId } from '@/types/ScenarioRunner';
import { PathHop } from '@/types/BrainV2';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export default function SmartSwapPage() {
    const { tokens, loading, valuating } = useSmartTokens({ enableValuation: true });

    // UI State
    const [swapMode, setSwapMode] = useState<'SIMPLE' | 'SMART'>('SIMPLE');
    const [startAmount, setStartAmount] = useState(0.1);
    const [roiTarget, setRoiTarget] = useState(0); // 0-20%
    const [fromTokenMint, setFromTokenMint] = useState<string>('');
    const [toTokenMint, setToTokenMint] = useState<string>('');

    // Execution State
    const [executing, setExecuting] = useState(false);
    const [executionLog, setExecutionLog] = useState<string | null>(null);
    const [comparison, setComparison] = useState<ScenarioComparison | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize defaults when tokens load
    useEffect(() => {
        if (tokens.length > 0 && !fromTokenMint) {
            const sol = tokens.find(t => t.symbol === 'SOL');
            if (sol) setFromTokenMint(sol.mint);
            else setFromTokenMint(tokens[0].mint);
        }
        if (tokens.length > 1 && !toTokenMint) {
            const dest = tokens.find(t => t.symbol !== 'SOL' && t.symbol !== 'USDC');
            if (dest) setToTokenMint(dest.mint);
            else setToTokenMint(tokens[1].mint);
        }
    }, [tokens, fromTokenMint, toTokenMint]);

    async function handleAction() {
        if (!fromTokenMint || !toTokenMint) return;

        setExecuting(true);
        setError(null);
        setComparison(null);
        setExecutionLog(null);

        try {
            if (swapMode === 'SIMPLE') {
                // Mock Simple Swap Execution
                await new Promise(resolve => setTimeout(resolve, 800));
                setExecutionLog(`✅ DIRECT SWAP EXECUTED via Jupiter\nFrom: ${getTokenSymbol(fromTokenMint)}\nTo: ${getTokenSymbol(toTokenMint)}\nAmount: ${startAmount}\nRoute: Direct / Best Split (No scenarios)`);
            } else {
                // Smart Swap Execution
                // 1. Calculate Target ROI intent
                const desiredROI = roiTarget / 100; // 0.00 - 0.20

                // 2. Call Scenario API
                const response = await fetch('/api/smart-swap/scenarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        startAmountSOL: startAmount, // Note: Simplification - assuming tokens are valued in SOL equivalent for now or engine handles valuation
                        tokens,
                        startTokenMint: fromTokenMint,
                        targetTokenMint: toTokenMint,
                        desiredROI
                    }),
                });

                if (!response.ok) throw new Error(`Scenario API failed: ${response.status}`);
                const data = await response.json();
                setComparison(data.comparison);
            }
        } catch (err: any) {
            console.error('Swap Error:', err);
            setError(err.message || 'Execution failed');
        } finally {
            setExecuting(false);
        }
    }

    const getTokenSymbol = (mint: string) => tokens.find(t => t.mint === mint)?.symbol || mint.slice(0, 4);

    const getScenarioIcon = (id: ScenarioId) => {
        switch (id) {
            case ScenarioId.CONSERVATIVE: return <Shield className="w-5 h-5 text-blue-400" />;
            case ScenarioId.BALANCED: return <BrainIcon className="w-5 h-5 text-purple-400" />;
            case ScenarioId.AGGRESSIVE: return <Zap className="w-5 h-5 text-yellow-400" />;
            case ScenarioId.VOLATILITY: return <Flame className="w-5 h-5 text-orange-500" />;
            case ScenarioId.BEST_EFFORT: return <Crosshair className="w-5 h-5 text-zinc-400" />;
        }
    };

    // Helper for Brain icon to avoid collision with lucide import if needed
    const BrainIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 12.36 0 0 0 7 4.33 2.5 12.36 0 0 0 9.5 2z" /><path d="M14.5 2A2.5 12.36 0 0 1 17 4.33 2.5 12.36 0 0 1 14.5 2z" /><path d="M12 4h-2.5a2.5 2.5 0 0 0-2.5 2.5v.5A2.5 2.5 0 0 0 9.5 9.5H12" /><path d="M12 4h2.5a2.5 2.5 0 0 1 2.5 2.5v.5A2.5 2.5 0 0 1 14.5 9.5H12" /><path d="M12 10v4" /><path d="M9 14h6a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z" /></svg>;

    return (
        <div className="min-h-screen bg-black pt-20 pb-20 px-4 flex justify-center">
            <div className="w-full max-w-lg space-y-8">

                {/* Header Toggle */}
                <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                    <button
                        onClick={() => setSwapMode('SIMPLE')}
                        className={`flex-1 py-3 text-sm font-mono font-bold rounded-lg transition-all ${swapMode === 'SIMPLE' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        SIMPLE SWAP
                    </button>
                    <button
                        onClick={() => setSwapMode('SMART')}
                        className={`flex-1 py-3 text-sm font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${swapMode === 'SMART' ? 'bg-purple-900/30 text-purple-300 shadow-md border border-purple-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Zap className="w-4 h-4" />
                        SMART SWAP
                    </button>
                </div>

                {/* Main Swap Card */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    {swapMode === 'SMART' && (
                        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                            <BrainIcon width={120} height={120} />
                        </div>
                    )}

                    <div className="space-y-6 relative z-10">

                        {/* FROM */}
                        <div>
                            <label className="text-xs font-mono text-zinc-500 mb-2 block">FROM</label>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <select
                                        value={fromTokenMint}
                                        onChange={(e) => setFromTokenMint(e.target.value)}
                                        className="w-full bg-black border border-zinc-700 rounded-lg h-12 px-3 text-white font-mono focus:border-purple-500 outline-none appearance-none"
                                    >
                                        {tokens.map(t => (
                                            <option key={t.mint} value={t.mint}>{t.symbol}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-32">
                                    <input
                                        type="number"
                                        value={startAmount}
                                        onChange={(e) => setStartAmount(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-black border border-zinc-700 rounded-lg h-12 px-3 text-right text-white font-mono focus:border-purple-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="text-right mt-1 text-xs text-zinc-500 font-mono">
                                Balance: --
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex justify-center -my-2">
                            <div className="bg-zinc-800 rounded-full p-2 border border-black">
                                <ArrowRight className="w-4 h-4 text-zinc-400" />
                            </div>
                        </div>

                        {/* TO */}
                        <div>
                            <label className="text-xs font-mono text-zinc-500 mb-2 block">TO</label>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <select
                                        value={toTokenMint}
                                        onChange={(e) => setToTokenMint(e.target.value)}
                                        className="w-full bg-black border border-zinc-700 rounded-lg h-12 px-3 text-white font-mono focus:border-purple-500 outline-none appearance-none"
                                    >
                                        {tokens.map(t => (
                                            <option key={t.mint} value={t.mint}>{t.symbol}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* SMART CONTROLS */}
                        {swapMode === 'SMART' && (
                            <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-zinc-300 font-mono text-sm">
                                        <Settings2 className="w-4 h-4 text-purple-400" />
                                        <span>Target ROI</span>
                                    </div>
                                    <div className={`font-mono font-bold ${roiTarget > 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                                        +{roiTarget}%
                                    </div>
                                </div>

                                <input
                                    type="range"
                                    min="0" max="20" step="1"
                                    value={roiTarget}
                                    onChange={(e) => setRoiTarget(parseInt(e.target.value))}
                                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />

                                <div className="flex justify-between text-[10px] text-zinc-600 font-mono uppercase">
                                    <span>Safe (0%)</span>
                                    <span>Aggressive (20%)</span>
                                </div>

                                {roiTarget > 15 && (
                                    <div className="text-xs text-orange-400 bg-orange-950/30 p-2 rounded border border-orange-900/50 flex items-center gap-2">
                                        <AlertTriangleIcon className="w-3 h-3" />
                                        High ROI targets may be unreachable.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ACTION BUTTON */}
                        <button
                            onClick={handleAction}
                            disabled={executing || loading || !fromTokenMint}
                            className={`
                                w-full py-4 rounded-xl font-bold text-lg tracking-wide transition-all
                                ${swapMode === 'SIMPLE'
                                    ? 'bg-white text-black hover:bg-zinc-200'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-purple-900/30 border border-purple-500/50'}
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            {executing ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {swapMode === 'SIMPLE' ? 'SWAPPING...' : 'SEARCHING...'}
                                </div>
                            ) : (
                                swapMode === 'SIMPLE' ? 'SWAP' : 'FIND SMART ROUTE'
                            )}
                        </button>
                    </div>
                </div>

                {/* RESULTS AREA */}

                {/* Simple Swap Log */}
                {executionLog && (
                    <div className="bg-zinc-900 border border-green-900/30 rounded-xl p-4 font-mono text-sm text-green-400 whitespace-pre-wrap">
                        {executionLog}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 font-mono text-sm text-red-400 flex items-center gap-3">
                        <XCircleIcon className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Smart Comparison Results */}
                {comparison && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

                        {/* Winner Banner */}
                        <div className="bg-gradient-to-r from-green-950/50 to-emerald-950/20 border border-green-500/30 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-500/20 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white font-mono mb-1">
                                        Recommended: {comparison.best.config.name}
                                    </h2>
                                    <p className="text-green-400 font-mono text-sm mb-4 leading-relaxed">
                                        {comparison.winnerReason}
                                    </p>
                                    <div className="flex gap-6 text-sm font-mono border-t border-green-500/20 pt-3 mt-3">
                                        <div>
                                            <div className="text-zinc-500 text-xs uppercase mb-1">Return</div>
                                            <div className={`text-lg font-bold ${comparison.best.roiPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {comparison.best.roiPct > 0 ? '+' : ''}{comparison.best.roiPct.toFixed(2)}%
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500 text-xs uppercase mb-1">Total Value</div>
                                            <div className="text-lg text-white font-bold">{comparison.best.finalAmountSOL.toFixed(4)} SOL</div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500 text-xs uppercase mb-1">Hops</div>
                                            <div className="text-lg text-white font-bold">{comparison.best.hops}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scenario Table */}
                        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                            {comparison.all.map((scenario) => {
                                const isWinner = scenario.scenarioId === comparison.best.scenarioId;
                                return (
                                    <div key={scenario.scenarioId} className={`p-4 border-b border-zinc-800 last:border-0 ${isWinner ? 'bg-green-950/10' : ''}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                {getScenarioIcon(scenario.scenarioId)}
                                                <span className={`font-mono text-sm font-bold ${isWinner ? 'text-white' : 'text-zinc-400'}`}>
                                                    {scenario.config.name}
                                                </span>
                                            </div>
                                            <div className={`font-mono font-bold ${scenario.roiPct > 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                                                {scenario.roiPct > 0 ? '+' : ''}{scenario.roiPct.toFixed(2)}%
                                            </div>
                                        </div>

                                        {/* Path Viz with Hold Annotations */}
                                        <div className="mt-2 ml-8 space-y-1">
                                            {(() => {
                                                const pathResult = scenario.result.found ? scenario.result.path : scenario.result.bestEffort;
                                                const hasPath = pathResult && pathResult.path && pathResult.path.length > 0;
                                                const holdsCount = hasPath ? pathResult!.path.filter(h => h.hold).length : 0;

                                                return hasPath ? (
                                                    <>
                                                        {/* Summary */}
                                                        <div className="text-xs text-zinc-500 font-mono flex items-center gap-4">
                                                            <span>{pathResult!.path.length} hops</span>
                                                            {holdsCount > 0 && (
                                                                <span className="text-purple-400">⏸ {holdsCount} hold{holdsCount > 1 ? 's' : ''}</span>
                                                            )}
                                                        </div>
                                                        {/* Hop list */}
                                                        <div className="flex flex-wrap items-center gap-1 text-xs font-mono text-zinc-600">
                                                            {pathResult!.path.map((hop, i) => (
                                                                <span key={i} className="flex items-center">
                                                                    {i > 0 && <span className="mx-1">→</span>}
                                                                    <span className={`${hop.hopRTL > 5 ? 'text-orange-400' : 'text-zinc-400'} ${hop.hold ? 'underline decoration-purple-500' : ''}`}>
                                                                        {hop.toSymbol}
                                                                        {hop.hold && <span className="text-purple-400 ml-0.5">⏸</span>}
                                                                    </span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : <span className="text-zinc-600 text-xs font-mono">No path found</span>;
                                            })()}
                                        </div>
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

// Minimal Icons
function XCircleIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg> }
function AlertTriangleIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg> }
