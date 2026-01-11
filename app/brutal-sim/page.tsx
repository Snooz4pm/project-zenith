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

            if (!response.body) return;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const chunk = JSON.parse(line);
                        if (chunk.type === 'LOG') {
                            setLogs(prev => [...prev, chunk.data]);
                            if (chunk.state) {
                                setCurrentBalance(chunk.state.totalValueSOL);
                            }
                        } else if (chunk.type === 'REPORT') {
                            setReport(chunk.data);
                            setLogs(chunk.data.logs);
                            setCurrentBalance(chunk.data.endSOL);
                        } else if (chunk.type === 'ERROR') {
                            console.error('Simulation Error:', chunk.error);
                        }
                    } catch (e) {
                        console.error('Error parsing chunk:', e);
                    }
                }
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
        if (outcomeClass.includes('POSITION_OPENED')) return 'text-sky-400';
        if (outcomeClass.includes('POSITION_CLOSED')) return 'text-cyan-400';
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
                        <div className="text-zinc-500 text-sm">Portfolio Value</div>
                        <div className="text-2xl font-bold font-mono">{currentBalance.toFixed(4)} SOL</div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-zinc-500 text-sm">Decisions / Penalty</div>
                        <div className="text-2xl font-bold">
                            {logs.length} <span className="text-zinc-500 text-sm ml-2">({logs.reduce((sum, l) => sum + (l.evaluation?.penaltyScore || 0), 0)} pts)</span>
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-zinc-500 text-sm">Realized PnL</div>
                        <div className={`text-2xl font-bold font-mono ${(logs[logs.length - 1]?.realizedPnlSOL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {(logs[logs.length - 1]?.realizedPnlSOL || 0).toFixed(6)} SOL
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-zinc-500 text-sm">PnL %</div>
                        <div className={`text-2xl font-bold font-mono ${(report?.pnlPct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.action === 'SWAP' ? 'bg-blue-600' :
                                            log.action === 'EXIT' ? 'bg-emerald-600' :
                                                log.action === 'HOLD' ? 'bg-zinc-800' : 'bg-red-900'
                                            }`}>
                                            {log.action}
                                        </span>
                                        {log.toToken && (
                                            <span className="text-zinc-400">
                                                {log.fromToken === 'SOL' ? 'SOL' : log.fromToken} → {log.toToken}
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
                                    <div className="grid grid-cols-3 gap-4 text-[10px] font-mono border-t border-zinc-800 pt-2 mt-2">
                                        <div>
                                            <span className="text-zinc-500">ENTRY COST:</span> {log.entryCostSOL ? `-${log.entryCostSOL.toFixed(5)} SOL` : '0'}
                                        </div>
                                        <div>
                                            <span className="text-zinc-500">UNREALIZED:</span>{' '}
                                            <span className={(log.unrealizedPnlSOL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                {(log.unrealizedPnlSOL || 0).toFixed(6)} SOL
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500">REALIZED:</span>{' '}
                                            <span className={(log.realizedPnlSOL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                {(log.realizedPnlSOL || 0).toFixed(6)} SOL
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {log.evaluation && (
                                    <div className="mt-2 text-xs text-zinc-500 italic">
                                        ↳ {log.evaluation.explanation} {log.evaluation.penaltyScore > 0 && `(Penalty: +${log.evaluation.penaltyScore})`}
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
