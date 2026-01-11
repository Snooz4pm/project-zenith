'use client';

/**
 * Brutal Simulation Dashboard
 * 
 * Real-time visualization of brain decisions
 */

import { useState } from 'react';
import { DecisionLog, SimulationReport } from '@/lib/smartswap/simulation/types';

export default function BrutalSimulationPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<DecisionLog[]>([]);
    const [report, setReport] = useState<SimulationReport | null>(null);
    const [currentBalance, setCurrentBalance] = useState(0.1);

    const runSimulation = async () => {
        setIsRunning(true);
        setLogs([]);
        setReport(null);
        setCurrentBalance(0.1);

        try {
            const response = await fetch('/api/backtest/brutal', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                setReport(data.report);
                setLogs(data.report.logs);
                setCurrentBalance(data.report.endSOL);
            }
        } catch (error) {
            console.error('Simulation error:', error);
        } finally {
            setIsRunning(false);
        }
    };

    const getOutcomeColor = (outcomeClass?: string) => {
        if (!outcomeClass) return 'text-gray-400';
        if (outcomeClass.includes('GOOD_DECISION_GOOD')) return 'text-emerald-400';
        if (outcomeClass.includes('GOOD_DECISION_BAD')) return 'text-yellow-400';
        if (outcomeClass.includes('BAD_DECISION_GOOD')) return 'text-orange-400';
        if (outcomeClass.includes('BAD_DECISION_BAD')) return 'text-red-400';
        if (outcomeClass.includes('HESITATION_CORRECT')) return 'text-blue-400';
        return 'text-gray-400';
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">🚨 Brutal Brain Simulation</h1>
                <p className="text-zinc-400 mb-8">
                    30-minute truth machine. Watch every decision in real-time.
                </p>

                <button
                    onClick={runSimulation}
                    disabled={isRunning}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg font-bold mb-8"
                >
                    {isRunning ? '🔥 RUNNING BRUTAL TEST...' : '🚀 START SIMULATION'}
                </button>

                {/* Live Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-zinc-500 text-sm">Balance</div>
                        <div className="text-2xl font-bold">{currentBalance.toFixed(4)} SOL</div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-zinc-500 text-sm">Decisions</div>
                        <div className="text-2xl font-bold">{logs.length}</div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-zinc-500 text-sm">Penalty Score</div>
                        <div className="text-2xl font-bold text-red-400">
                            {logs.reduce((sum, l) => sum + (l.evaluation?.penaltyScore || 0), 0)}
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-zinc-500 text-sm">PnL</div>
                        <div className={`text-2xl font-bold ${report && report.pnlPct > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {report ? `${report.pnlPct > 0 ? '+' : ''}${report.pnlPct.toFixed(2)}%` : '—'}
                        </div>
                    </div>
                </div>

                {/* Decision Timeline */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Decision Timeline</h2>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {logs.map((log, i) => (
                            <div key={i} className="bg-black border border-zinc-800 rounded p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-zinc-500 font-mono text-sm">#{i + 1}</span>
                                        <span className="font-bold">{log.action}</span>
                                        {log.toToken && (
                                            <span className="text-zinc-400">
                                                {log.fromToken} → {log.toToken}
                                            </span>
                                        )}
                                    </div>

                                    <span className={`text-sm font-mono ${getOutcomeColor(log.evaluation?.outcomeClass)}`}>
                                        {log.evaluation?.outcomeClass.replace(/_/g, ' ')}
                                    </span>
                                </div>

                                <div className="text-sm text-zinc-400 mb-2">
                                    <strong>Thesis:</strong> {log.intent.thesis}
                                </div>

                                {log.executed && (
                                    <div className="flex gap-4 text-xs font-mono">
                                        <span>Expected: {log.expectedEdgePct?.toFixed(2)}%</span>
                                        <span>Realized: {log.realizedEdgePct?.toFixed(2)}%</span>
                                        <span className={log.pnlSOL > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                            PnL: {log.pnlSOL > 0 ? '+' : ''}{log.pnlSOL.toFixed(6)} SOL
                                        </span>
                                    </div>
                                )}

                                {log.evaluation && (
                                    <div className="mt-2 text-xs text-zinc-500">
                                        {log.evaluation.explanation} (Penalty: {log.evaluation.penaltyScore})
                                    </div>
                                )}
                            </div>
                        ))}

                        {logs.length === 0 && !isRunning && (
                            <div className="text-center text-zinc-600 py-12">
                                No decisions yet. Start a simulation to see brain activity.
                            </div>
                        )}

                        {isRunning && (
                            <div className="text-center text-zinc-400 py-8">
                                <div className="animate-pulse">🧠 Brain is thinking...</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Final Report */}
                {report && (
                    <div className="mt-8 bg-zinc-900 border-2 border-zinc-700 rounded-lg p-6">
                        <h2 className="text-2xl font-bold mb-4">Final Report</h2>

                        <div className={`text-3xl font-bold mb-2 ${report.verdict === 'PASS' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {report.verdict === 'PASS' ? '✅ PASS' : '❌ FAIL'}
                        </div>

                        <p className="text-zinc-400 mb-6">{report.verdictReason}</p>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <div className="text-zinc-500 text-sm">Start</div>
                                <div className="text-xl font-mono">{report.startSOL} SOL</div>
                            </div>

                            <div>
                                <div className="text-zinc-500 text-sm">End</div>
                                <div className="text-xl font-mono">{report.endSOL.toFixed(4)} SOL</div>
                            </div>

                            <div>
                                <div className="text-zinc-500 text-sm">Total Penalty</div>
                                <div className="text-xl font-mono text-red-400">{report.penaltyScore}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
