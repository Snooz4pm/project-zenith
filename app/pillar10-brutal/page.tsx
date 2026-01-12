'use client';

import { useState } from 'react';
import { DecisionLog } from '@/lib/smartswap/simulation/types';

type RunMode = 'EDGE' | 'EXPLORATION';

interface FunnelAuthority {
    edgeValidated: boolean;
    validatedTokens: string[];
    regime: string;
    cycles: number;
    flatStats: {
        totalFlat: number;
        correctFlat: number;
        flatAccuracy: number;
        cowardiceScore: number;
    };
    stopReason?: string;
}

interface DisciplineMetrics {
    blockedSwaps: number;
    authorizedSwaps: number;
    violations: string[];
}

export default function Pillar10BrutalPage() {
    const [mode, setMode] = useState<RunMode>('EDGE');
    const [horizon, setHorizon] = useState<5 | 10 | 15>(10);
    const [tokenLimit, setTokenLimit] = useState(1000);

    const [isRunning, setIsRunning] = useState(false);
    const [currentPhase, setCurrentPhase] = useState<'IDLE' | 'FUNNEL' | 'SIMULATION' | 'COMPLETE'>('IDLE');

    // Results
    const [funnelAuthority, setFunnelAuthority] = useState<FunnelAuthority | null>(null);
    const [disciplineMetrics, setDisciplineMetrics] = useState<DisciplineMetrics | null>(null);
    const [finalVerdict, setFinalVerdict] = useState<string | null>(null);
    const [verdictReason, setVerdictReason] = useState<string | null>(null);
    const [pnlPct, setPnlPct] = useState<number | null>(null);
    const [penaltyScore, setPenaltyScore] = useState(0);
    const [logs, setLogs] = useState<DecisionLog[]>([]);

    const startSimulation = async () => {
        setIsRunning(true);
        setCurrentPhase('FUNNEL');
        setFunnelAuthority(null);
        setDisciplineMetrics(null);
        setFinalVerdict(null);
        setVerdictReason(null);
        setPnlPct(null);
        setPenaltyScore(0);
        setLogs([]);

        try {
            const response = await fetch('/api/backtest/pillar10-brutal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode,
                    horizonMinutes: horizon,
                    tokenLimit,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setCurrentPhase('COMPLETE');
                setFunnelAuthority(data.funnelAuthority);
                setDisciplineMetrics(data.disciplineMetrics);
                setFinalVerdict(data.report.verdict);
                setVerdictReason(data.report.verdictReason);
                setPnlPct(data.report.pnlPct);
                setPenaltyScore(data.report.penaltyScore);
                setLogs(data.logs || []);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
                        🧠 Pillar 10 + Brutal Brain v2 Integration
                    </h1>
                    <p className="text-gray-400">Complete governance stack: Funnel → Authority → Execution (CHAOS tokens only, no stables)</p>
                </div>

                {/* Configuration */}
                {!isRunning && currentPhase === 'IDLE' && (
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
                        <h2 className="text-xl font-semibold mb-4">⚙️ Configuration</h2>

                        <div className="grid grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Run Mode</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setMode('EDGE')}
                                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                                            mode === 'EDGE' ? 'bg-gradient-to-r from-red-600 to-orange-600' : 'bg-gray-800'
                                        }`}
                                    >
                                        🔴 EDGE
                                    </button>
                                    <button
                                        onClick={() => setMode('EXPLORATION')}
                                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                                            mode === 'EXPLORATION' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-gray-800'
                                        }`}
                                    >
                                        🔵 EXPLORE
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Prediction Horizon</label>
                                <select
                                    value={horizon}
                                    onChange={(e) => setHorizon(parseInt(e.target.value) as any)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                                >
                                    <option value={5}>5 minutes</option>
                                    <option value={10}>10 minutes (Recommended)</option>
                                    <option value={15}>15 minutes</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Token Limit (CHAOS only)</label>
                                <input
                                    type="number"
                                    value={tokenLimit}
                                    onChange={(e) => setTokenLimit(parseInt(e.target.value))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                                    min={100}
                                    max={2000}
                                />
                            </div>
                        </div>

                        <button
                            onClick={startSimulation}
                            className="w-full py-4 rounded-lg font-bold text-lg bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:opacity-90"
                        >
                            ▶ Start Full Governance Stack
                        </button>
                    </div>
                )}

                {/* Running Status */}
                {isRunning && (
                    <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-xl p-8 mb-8 text-center">
                        <div className="text-5xl mb-4 animate-pulse">⚡</div>
                        <div className="text-2xl font-bold mb-2">
                            {currentPhase === 'FUNNEL' && 'Phase 1: Running Pillar 10 Funnel...'}
                            {currentPhase === 'SIMULATION' && 'Phase 2: Running Brain v2 Simulation...'}
                        </div>
                        <div className="text-gray-300">
                            {currentPhase === 'FUNNEL' && `Predicting → Waiting ${horizon}min → Scoring → Narrowing`}
                            {currentPhase === 'SIMULATION' && 'Authority-gated execution with validated CHAOS tokens'}
                        </div>
                    </div>
                )}

                {/* Final Verdict */}
                {currentPhase === 'COMPLETE' && finalVerdict && (
                    <div className={`rounded-2xl p-8 mb-8 text-center ${
                        finalVerdict === 'PASS' ? 'bg-emerald-600' : 'bg-red-600'
                    }`}>
                        <div className="text-6xl mb-4">
                            {finalVerdict === 'PASS' ? '✅' : '⛔'}
                        </div>
                        <h2 className="text-3xl font-bold mb-2">{finalVerdict}</h2>
                        <p className="text-white/80">{verdictReason}</p>
                        {pnlPct !== null && (
                            <div className="mt-4 text-2xl font-semibold">
                                PnL: {pnlPct > 0 ? '+' : ''}{pnlPct.toFixed(2)}% | Penalty: {penaltyScore}
                            </div>
                        )}
                    </div>
                )}

                {/* Funnel Authority Panel */}
                {funnelAuthority && (
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <span>🎯</span>
                            Phase 1: Funnel Authority
                        </h2>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Edge Validation */}
                            <div className={`rounded-lg p-6 ${
                                funnelAuthority.edgeValidated ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-red-900/30 border border-red-700'
                            }`}>
                                <div className="text-sm text-gray-400 mb-1">Edge Status</div>
                                <div className="text-3xl font-bold">
                                    {funnelAuthority.edgeValidated ? '✅ VALIDATED' : '⛔ NOT VALIDATED'}
                                </div>
                                {funnelAuthority.stopReason && (
                                    <div className="mt-2 text-sm text-gray-300">{funnelAuthority.stopReason}</div>
                                )}
                            </div>

                            {/* Validated Tokens */}
                            <div className="bg-gray-800 rounded-lg p-6">
                                <div className="text-sm text-gray-400 mb-2">Validated CHAOS Tokens</div>
                                <div className="flex flex-wrap gap-2">
                                    {funnelAuthority.validatedTokens.length > 0 ? (
                                        funnelAuthority.validatedTokens.map((token, i) => (
                                            <span key={i} className="px-3 py-1 bg-purple-900/50 rounded text-sm font-semibold">
                                                {token}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500">None</span>
                                    )}
                                </div>
                            </div>

                            {/* Regime */}
                            <div className="bg-gray-800 rounded-lg p-6">
                                <div className="text-sm text-gray-400 mb-1">Market Regime</div>
                                <div className="text-2xl font-bold text-purple-400">{funnelAuthority.regime}</div>
                                <div className="text-sm text-gray-500 mt-1">{funnelAuthority.cycles} cycles completed</div>
                            </div>

                            {/* FLAT Stats (Pillar 10.3) */}
                            <div className="bg-gray-800 rounded-lg p-6">
                                <div className="text-sm text-gray-400 mb-2">FLAT Accountability</div>
                                <div className="space-y-1 text-sm">
                                    <div>Total FLAT: {funnelAuthority.flatStats.totalFlat}</div>
                                    <div>Correct: {funnelAuthority.flatStats.correctFlat}</div>
                                    <div>Accuracy: {(funnelAuthority.flatStats.flatAccuracy * 100).toFixed(1)}%</div>
                                    <div className={funnelAuthority.flatStats.cowardiceScore > 0.5 ? 'text-red-400 font-bold' : ''}>
                                        Cowardice: {(funnelAuthority.flatStats.cowardiceScore * 100).toFixed(0)}%
                                        {funnelAuthority.flatStats.cowardiceScore > 0.5 && ' ⚠️'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Discipline Metrics */}
                {disciplineMetrics && (
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <span>🛡️</span>
                            Phase 2: Discipline Metrics
                        </h2>

                        <div className="grid grid-cols-3 gap-6">
                            <div className={`rounded-lg p-6 ${
                                disciplineMetrics.blockedSwaps > 0 ? 'bg-red-900/30 border border-red-700' : 'bg-emerald-900/30 border border-emerald-700'
                            }`}>
                                <div className="text-sm text-gray-400 mb-1">Blocked Swaps</div>
                                <div className="text-4xl font-bold">
                                    {disciplineMetrics.blockedSwaps}
                                </div>
                                {disciplineMetrics.blockedSwaps > 0 && (
                                    <div className="text-xs text-red-300 mt-2">Violations detected!</div>
                                )}
                            </div>

                            <div className="bg-gray-800 rounded-lg p-6">
                                <div className="text-sm text-gray-400 mb-1">Authorized Swaps</div>
                                <div className="text-4xl font-bold text-emerald-400">
                                    {disciplineMetrics.authorizedSwaps}
                                </div>
                            </div>

                            <div className="bg-gray-800 rounded-lg p-6">
                                <div className="text-sm text-gray-400 mb-1">Total Violations</div>
                                <div className="text-4xl font-bold text-amber-400">
                                    {disciplineMetrics.violations.length}
                                </div>
                            </div>
                        </div>

                        {disciplineMetrics.violations.length > 0 && (
                            <div className="mt-4 bg-red-900/20 rounded-lg p-4">
                                <div className="text-sm font-semibold text-red-400 mb-2">Violations:</div>
                                <ul className="space-y-1 text-sm text-gray-300">
                                    {disciplineMetrics.violations.slice(0, 5).map((v, i) => (
                                        <li key={i}>• {v}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Decision Log */}
                {logs.length > 0 && (
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <h2 className="text-xl font-bold mb-4">📝 Decision Log</h2>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {logs.slice(-20).reverse().map((log, i) => (
                                <div key={i} className={`p-3 rounded-lg text-sm ${
                                    log.evaluation?.outcomeClass === 'BAD_DECISION_BAD_OUTCOME'
                                        ? 'bg-red-900/30'
                                        : log.executed
                                            ? 'bg-emerald-900/30'
                                            : 'bg-gray-800'
                                }`}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">{log.action}</span>
                                        <span className="text-gray-400 text-xs">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    {log.toToken && (
                                        <div className="text-gray-300 mt-1">→ {log.toToken}</div>
                                    )}
                                    {log.skippedReason && (
                                        <div className="text-red-400 text-xs mt-1">{log.skippedReason}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 text-center text-gray-600 text-sm">
                    Pillar 10 + Brutal Brain v2 • CHAOS tokens only • Complete governance stack
                </div>
            </div>
        </div>
    );
}
