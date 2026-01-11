'use client';

/**
 * Brutal Simulation Dashboard
 * 
 * Real-time visualization of brain decisions
 */

import { useState } from 'react';
import { DecisionLog, SimulationReport } from '@/lib/smartswap/simulation/types';

interface PortfolioPosition {
    token: string;
    mint: string;
    valueSOL: number;
    costBasis: number;
    unrealizedPnL: number;
    holdCount: number;
    ageSeconds: number;
}

export default function BrutalSimulationPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<DecisionLog[]>([]);
    const [report, setReport] = useState<SimulationReport | null>(null);
    const [currentBalance, setCurrentBalance] = useState(0.2);
    const [currentToken, setCurrentToken] = useState('SOL');
    const [liquidSOL, setLiquidSOL] = useState(0.2);
    const [positions, setPositions] = useState<PortfolioPosition[]>([]);
    const [totalFees, setTotalFees] = useState(0);
    const [solPrice, setSolPrice] = useState(150);

    const runSimulation = async () => {
        setIsRunning(true);
        setLogs([]);
        setReport(null);
        setCurrentBalance(0.2);
        setCurrentToken('SOL');
        setLiquidSOL(0.2);
        setPositions([]);
        setTotalFees(0);
        setSolPrice(150);

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
                                setCurrentBalance(chunk.state.totalValueSOL || 0.2);
                                setCurrentToken(chunk.state.token || 'SOL');
                                setLiquidSOL(chunk.state.liquidSOL || chunk.state.totalValueSOL || 0.2);
                                setPositions(chunk.state.positions || []);
                                setTotalFees(chunk.state.totalFeesSOL || 0);
                            }
                        } else if (chunk.type === 'REPORT') {
                            setReport(chunk.data);
                            setLogs(chunk.data.logs);
                            setCurrentBalance(chunk.data.endSOL);
                            if (chunk.data.solPriceUSD) {
                                setSolPrice(chunk.data.solPriceUSD);
                            }
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
                <h1 className="text-4xl font-bold mb-2">🧠 Brain v2 Portfolio Simulation</h1>
                <p className="text-zinc-400 mb-2">
                    30-minute portfolio manager with multi-asset support. Can hold up to 4 positions simultaneously.
                </p>
                <div className="flex gap-4 mb-8 text-sm flex-wrap">
                    <span className="bg-emerald-950/30 text-emerald-400 px-3 py-1 rounded border border-emerald-900/30">
                        ✅ Multi-Asset Portfolio
                    </span>
                    <span className="bg-blue-950/30 text-blue-400 px-3 py-1 rounded border border-blue-900/30">
                        💰 0.2 SOL Paper Money
                    </span>
                    <span className="bg-purple-950/30 text-purple-400 px-3 py-1 rounded border border-purple-900/30">
                        📊 Live Jupiter Quotes
                    </span>
                    <span className="bg-yellow-950/30 text-yellow-400 px-3 py-1 rounded border border-yellow-900/30">
                        💼 Up to 4 Positions
                    </span>
                    <span className="bg-orange-950/30 text-orange-400 px-3 py-1 rounded border border-orange-900/30">
                        💸 Fees Deducted from Wallet
                    </span>
                </div>

                <button
                    onClick={runSimulation}
                    disabled={isRunning}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg font-bold mb-8"
                >
                    {isRunning ? '🔥 RUNNING BRUTAL TEST...' : '🚀 START SIMULATION'}
                </button>

                {/* Live Stats */}
                <div className="grid grid-cols-5 gap-4 mb-8">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-zinc-500 text-sm mb-1">Positions</div>
                        <div className="text-2xl font-bold font-mono flex items-center gap-2">
                            <span className="text-blue-400">{positions.length}</span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                            {positions.length === 0 ? 'All cash' : `${positions.length} active`}
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-zinc-500 text-sm mb-1">Liquid SOL</div>
                        <div className="text-2xl font-bold font-mono text-emerald-400">{liquidSOL.toFixed(4)}</div>
                        <div className="text-sm text-zinc-500 mt-1 font-mono">
                            ≈ ${(liquidSOL * solPrice).toFixed(2)}
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-zinc-500 text-sm mb-1">Total Value</div>
                        <div className="text-2xl font-bold font-mono">{currentBalance.toFixed(4)} SOL</div>
                        <div className="text-sm text-zinc-500 mt-1 font-mono">
                            ≈ ${(currentBalance * solPrice).toFixed(2)}
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-zinc-500 text-sm mb-1">Decisions / Penalty</div>
                        <div className="text-2xl font-bold">
                            {logs.length} <span className="text-zinc-500 text-sm ml-2">({logs.reduce((sum, l) => sum + (l.evaluation?.penaltyScore || 0), 0)} pts)</span>
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-zinc-500 text-sm mb-1">Realized PnL</div>
                        <div className={`text-2xl font-bold font-mono ${(logs[logs.length - 1]?.realizedPnlSOL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {(logs[logs.length - 1]?.realizedPnlSOL || 0).toFixed(6)} SOL
                        </div>
                        <div className={`text-sm font-mono mt-1 ${(logs[logs.length - 1]?.realizedPnlUSD || 0) >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                            ≈ ${(logs[logs.length - 1]?.realizedPnlUSD || 0).toFixed(2)}
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-zinc-500 text-sm mb-1">Fees Paid</div>
                        <div className="text-2xl font-bold font-mono text-orange-400">{totalFees.toFixed(5)} SOL</div>
                        <div className="text-sm text-zinc-500 mt-1 font-mono">
                            ≈ ${(totalFees * solPrice).toFixed(2)}
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="text-zinc-500 text-sm mb-1">PnL %</div>
                        <div className={`text-2xl font-bold font-mono ${(report?.pnlPct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {report ? `${report.pnlPct > 0 ? '+' : ''}${report.pnlPct.toFixed(2)}%` : '—'}
                        </div>
                    </div>
                </div>

                {/* Portfolio Holdings */}
                {positions.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-950/30 to-purple-950/30 border border-blue-900/30 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span>💼 Portfolio Holdings</span>
                            <span className="text-sm font-normal text-zinc-400">({positions.length} positions)</span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {positions.map((pos, idx) => {
                                const isProfitable = pos.unrealizedPnL > 0;
                                const pnlPct = (pos.unrealizedPnL / pos.costBasis) * 100;

                                return (
                                    <div
                                        key={idx}
                                        className={`bg-black/50 border rounded-lg p-4 ${
                                            isProfitable ? 'border-emerald-900/50' : 'border-red-900/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="text-lg font-bold text-blue-400 mb-1">
                                                    {pos.token}
                                                </div>
                                                <div className="text-xs text-zinc-600 font-mono">
                                                    {pos.mint.substring(0, 8)}...
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-sm font-bold ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {isProfitable ? '+' : ''}{pnlPct.toFixed(2)}%
                                                </div>
                                                <div className="text-xs text-zinc-500">
                                                    Hold x{pos.holdCount}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <div className="text-zinc-500 text-xs mb-1">Value (SOL)</div>
                                                <div className="font-mono font-bold">
                                                    {pos.valueSOL.toFixed(4)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-zinc-500 text-xs mb-1">Value (USD)</div>
                                                <div className="font-mono font-bold text-emerald-400">
                                                    ${(pos.valueSOL * solPrice).toFixed(2)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-zinc-500 text-xs mb-1">Cost Basis</div>
                                                <div className="font-mono text-zinc-400">
                                                    {pos.costBasis.toFixed(4)} SOL
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-zinc-500 text-xs mb-1">Unrealized PnL</div>
                                                <div className={`font-mono font-bold ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {isProfitable ? '+' : ''}{pos.unrealizedPnL.toFixed(5)} SOL
                                                </div>
                                                <div className={`text-xs font-mono ${isProfitable ? 'text-emerald-700' : 'text-red-900'}`}>
                                                    ≈ ${(pos.unrealizedPnL * solPrice).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-500">
                                            <div className="flex justify-between">
                                                <span>Age: {Math.floor(pos.ageSeconds)}s</span>
                                                <span>Holds: {pos.holdCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}


                {/* Action Stats */}
                {logs.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4">
                            <div className="text-blue-400 text-xs font-bold mb-1">⚡ SWAPS</div>
                            <div className="text-2xl font-bold">{logs.filter(l => l.action === 'SWAP').length}</div>
                        </div>
                        <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-4">
                            <div className="text-yellow-400 text-xs font-bold mb-1">⚠️ HOLDS</div>
                            <div className="text-2xl font-bold">{logs.filter(l => l.action === 'HOLD').length}</div>
                            <div className="text-xs text-yellow-700 mt-1">Friction detected</div>
                        </div>
                        <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4">
                            <div className="text-red-400 text-xs font-bold mb-1">🛑 HESITATE</div>
                            <div className="text-2xl font-bold">{logs.filter(l => l.action === 'HESITATE').length}</div>
                            <div className="text-xs text-red-700 mt-1">No viable path</div>
                        </div>
                        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-4">
                            <div className="text-emerald-400 text-xs font-bold mb-1">💰 EXITS</div>
                            <div className="text-2xl font-bold">{logs.filter(l => l.action === 'EXIT').length}</div>
                            <div className="text-xs text-emerald-700 mt-1">Returned to SOL</div>
                        </div>
                    </div>
                )}

                {/* Decision Timeline */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">
                        Decision Timeline
                        {logs.length > 0 && <span className="text-zinc-500 text-sm ml-2">({logs.length} decisions)</span>}
                    </h2>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {logs.map((log, i) => {
                            const isHold = log.action === 'HOLD';
                            const isHesitate = log.action === 'HESITATE';
                            const isSwap = log.action === 'SWAP';

                            return (
                            <div key={i} className={`bg-black rounded p-4 ${
                                isHold ? 'border-2 border-yellow-900/50' :
                                isHesitate ? 'border border-red-900/50' :
                                isSwap ? 'border border-blue-900/50' :
                                'border border-zinc-800'
                            }`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-zinc-500 font-mono text-sm">#{i + 1}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            log.action === 'SWAP' ? 'bg-blue-600' :
                                            log.action === 'EXIT' ? 'bg-emerald-600' :
                                            log.action === 'HOLD' ? 'bg-yellow-700 animate-pulse' :
                                            log.action === 'HESITATE' ? 'bg-red-900' :
                                            'bg-zinc-800'
                                        }`}>
                                            {log.action === 'HOLD' && '⚠️ '}
                                            {log.action === 'HESITATE' && '🛑 '}
                                            {log.action === 'SWAP' && '⚡ '}
                                            {log.action}
                                        </span>
                                        {log.toToken && (
                                            <span className="text-zinc-400">
                                                {log.fromToken === 'SOL' ? 'SOL' : log.fromToken} → {log.toToken}
                                            </span>
                                        )}
                                        {isHold && (
                                            <span className="text-xs text-yellow-600 font-bold">FRICTION DETECTED</span>
                                        )}
                                        {isHesitate && (
                                            <span className="text-xs text-red-600 font-bold">NO PATH FOUND</span>
                                        )}
                                    </div>

                                    <span className={`text-sm font-mono ${getOutcomeColor(log.evaluation?.outcomeClass)}`}>
                                        {log.evaluation?.outcomeClass.replace(/_/g, ' ')}
                                    </span>
                                </div>

                                <div className="text-sm text-zinc-400 mb-2">
                                    <strong className={isHold ? 'text-yellow-500' : isHesitate ? 'text-red-500' : ''}>
                                        Brain v2:
                                    </strong> {log.intent.thesis}
                                </div>

                                {/* Show signals for HOLD */}
                                {isHold && log.intent.signals && (
                                    <div className="bg-yellow-950/20 border border-yellow-900/30 rounded p-2 text-xs mb-2">
                                        <div className="text-yellow-600 font-bold mb-1">Friction Signals:</div>
                                        <div className="grid grid-cols-2 gap-2 text-zinc-400">
                                            <div>
                                                <span className="text-zinc-500">Momentum:</span> {((log.intent.signals.momentum || 0) * 100).toFixed(0)}%
                                            </div>
                                            <div>
                                                <span className="text-zinc-500">Volatility:</span> {((log.intent.signals.volatility || 0) * 100).toFixed(0)}%
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-zinc-500">Confidence:</span> {(log.intent.confidence * 100).toFixed(0)}%
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {log.executed && (
                                    <div className="grid grid-cols-3 gap-4 text-[10px] font-mono border-t border-zinc-800 pt-2 mt-2">
                                        <div className="col-span-3 pb-1 border-b border-zinc-900 mb-1 flex justify-between">
                                            <span>
                                                <span className="text-zinc-500">TRADE VALUE:</span>{' '}
                                                <span className="text-zinc-300">
                                                    {log.tradeValueSOL ? `${log.tradeValueSOL.toFixed(4)} SOL` : '—'}
                                                </span>
                                            </span>
                                            {log.tradeValueUSD && (
                                                <span className="text-zinc-500">
                                                    ≈ ${log.tradeValueUSD.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-zinc-500">ENTRY COST:</span> {log.entryCostSOL ? `-${log.entryCostSOL.toFixed(5)} SOL` : '0'}
                                        </div>
                                        <div>
                                            <span className="text-zinc-500">UNREALIZED:</span>{' '}
                                            <span className={(log.unrealizedPnlSOL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                {(log.unrealizedPnlSOL || 0).toFixed(5)} SOL
                                            </span>
                                            {log.unrealizedPnlUSD !== undefined && (
                                                <div className={(log.unrealizedPnlUSD || 0) >= 0 ? 'text-emerald-700' : 'text-red-900'}>
                                                    ${(log.unrealizedPnlUSD || 0).toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-zinc-500">REALIZED:</span>{' '}
                                            <span className={(log.realizedPnlSOL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                {(log.realizedPnlSOL || 0).toFixed(5)} SOL
                                            </span>
                                            {log.realizedPnlUSD !== undefined && (
                                                <div className={(log.realizedPnlUSD || 0) >= 0 ? 'text-emerald-700' : 'text-red-900'}>
                                                    ${(log.realizedPnlUSD || 0).toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {log.evaluation && (
                                    <div className="mt-2 text-xs text-zinc-500 italic">
                                        ↳ {log.evaluation.explanation} {log.evaluation.penaltyScore > 0 && `(Penalty: +${log.evaluation.penaltyScore})`}
                                    </div>
                                )}
                            </div>
                            );
                        })}

                        {logs.length === 0 && !isRunning && (
                            <div className="text-center text-zinc-600 py-12">
                                No decisions yet. Start a simulation to see brain activity.
                            </div>
                        )}

                        {isRunning && logs.length === 0 && (
                            <div className="text-center text-zinc-400 py-8 space-y-3">
                                <div className="animate-pulse text-xl">🧠 Brain v2 Initializing...</div>
                                <div className="text-sm text-zinc-500">Loading token universe from Jupiter...</div>
                                <div className="text-xs text-zinc-600">Starting with 0.2 SOL paper money</div>
                            </div>
                        )}
                        {isRunning && logs.length > 0 && (
                            <div className="text-center text-zinc-400 py-4 bg-zinc-950 border border-zinc-800 rounded">
                                <div className="animate-pulse">🔥 Brain v2 is actively trading...</div>
                                <div className="text-xs text-zinc-600 mt-1">30-minute simulation in progress</div>
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
