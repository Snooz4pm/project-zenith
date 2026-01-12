'use client';

import { useState, useEffect, useRef } from 'react';

type RunMode = 'EDGE' | 'EXPLORATION';
type Phase = 'IDLE' | 'FUNNEL' | 'SIMULATION' | 'COMPLETE';

interface Event {
    type: string;
    data: any;
    timestamp: number;
}

interface SwapAttempt {
    timestamp: number;
    token: string;
    authorized: boolean;
    reason?: string;
}

interface FlatResolution {
    token: string;
    priceChange: string;
    score: number;
    verdict: string;
    cycle: number;
}

export default function Pillar10LivePage() {
    const [mode, setMode] = useState<RunMode>('EDGE');
    const [horizon, setHorizon] = useState<5 | 10 | 15>(10);
    const [tokenLimit, setTokenLimit] = useState(1000);

    const [isRunning, setIsRunning] = useState(false);
    const [phase, setPhase] = useState<Phase>('IDLE');

    // Funnel state
    const [initialTokens, setInitialTokens] = useState(0);
    const [currentTokens, setCurrentTokens] = useState(0);
    const [currentCycle, setCurrentCycle] = useState(0);
    const [regime, setRegime] = useState<string>('');
    const [predictions, setPredictions] = useState({ up: 0, down: 0, flat: 0 });
    const [waiting, setWaiting] = useState(false);
    const [waitMessage, setWaitMessage] = useState('');

    // FLAT accountability
    const [flatResolutions, setFlatResolutions] = useState<FlatResolution[]>([]);
    const [flatStats, setFlatStats] = useState({ total: 0, correct: 0, accuracy: 0, cowardice: 0 });

    // Simulation state
    const [swaps, setSwaps] = useState<SwapAttempt[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [blockedCount, setBlockedCount] = useState(0);
    const [authorizedCount, setAuthorizedCount] = useState(0);

    // Final results
    const [validatedTokens, setValidatedTokens] = useState<string[]>([]);
    const [edgeValidated, setEdgeValidated] = useState(false);
    const [finalVerdict, setFinalVerdict] = useState<string | null>(null);
    const [verdictReason, setVerdictReason] = useState<string | null>(null);
    const [pnlPct, setPnlPct] = useState<number | null>(null);
    const [penaltyScore, setPenaltyScore] = useState(0);

    // Event log
    const [events, setEvents] = useState<Event[]>([]);
    const eventSourceRef = useRef<EventSource | null>(null);
    const eventsEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [events]);

    const startSimulation = () => {
        setIsRunning(true);
        setPhase('FUNNEL');

        // Reset all state
        setInitialTokens(0);
        setCurrentTokens(0);
        setCurrentCycle(0);
        setRegime('');
        setPredictions({ up: 0, down: 0, flat: 0 });
        setWaiting(false);
        setWaitMessage('');
        setFlatResolutions([]);
        setFlatStats({ total: 0, correct: 0, accuracy: 0, cowardice: 0 });
        setSwaps([]);
        setLogs([]);
        setBlockedCount(0);
        setAuthorizedCount(0);
        setValidatedTokens([]);
        setEdgeValidated(false);
        setFinalVerdict(null);
        setVerdictReason(null);
        setPnlPct(null);
        setPenaltyScore(0);
        setEvents([]);

        const url = `/api/backtest/pillar10-brutal-stream?mode=${mode}&horizon=${horizon}&tokens=${tokenLimit}`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setEvents(prev => [...prev, data]);

                // Handle specific events
                switch (data.type) {
                    case 'FUNNEL_UNIVERSE_FROZEN':
                        setInitialTokens(data.data?.tokenCount || 0);
                        setCurrentTokens(data.data?.tokenCount || 0);
                        break;

                    case 'FUNNEL_CYCLE_START':
                        setCurrentCycle(data.data?.cycle || 0);
                        setCurrentTokens(data.data?.tokens || 0);
                        break;

                    case 'FUNNEL_PREDICTIONS_MADE':
                        setPredictions({
                            up: data.data?.up || 0,
                            down: data.data?.down || 0,
                            flat: data.data?.flat || 0,
                        });
                        break;

                    case 'FUNNEL_WAITING':
                        setWaiting(true);
                        setWaitMessage(`Waiting ${data.data?.minutes} minutes for price movements...`);
                        break;

                    case 'FUNNEL_SCORING':
                        setWaiting(false);
                        break;

                    case 'FUNNEL_CYCLE_COMPLETE':
                        setCurrentTokens(data.data?.survivors || 0);
                        break;

                    case 'FUNNEL_FLAT_RESOLVED':
                        setFlatResolutions(prev => [data.data, ...prev]);
                        break;

                    case 'FUNNEL_STOP_NO_EDGE':
                        setPhase('COMPLETE');
                        setEdgeValidated(false);
                        break;

                    case 'FUNNEL_FUNNEL_COMPLETE':
                        setPhase('SIMULATION');
                        setEdgeValidated(data.data?.edgeValidated || false);
                        setValidatedTokens(data.data?.validatedTokens || []);
                        if (data.data?.flatStats) {
                            setFlatStats({
                                total: data.data.flatStats.totalFlat,
                                correct: data.data.flatStats.correctFlat,
                                accuracy: data.data.flatStats.flatAccuracy,
                                cowardice: data.data.flatStats.cowardiceScore,
                            });
                        }
                        break;

                    case 'SIM_LOG':
                        const log = data.data?.log;
                        if (log) {
                            setLogs(prev => [...prev, log]);

                            // Track swaps
                            if (log.action === 'SWAP' && log.toToken) {
                                const blocked = log.skippedReason?.includes('BLOCKED');
                                setSwaps(prev => [...prev, {
                                    timestamp: log.timestamp,
                                    token: log.toToken,
                                    authorized: !blocked,
                                    reason: log.skippedReason,
                                }]);

                                if (blocked) {
                                    setBlockedCount(prev => prev + 1);
                                } else if (log.executed) {
                                    setAuthorizedCount(prev => prev + 1);
                                }
                            }
                        }

                        const state = data.data?.state;
                        if (state) {
                            setPenaltyScore(state.penaltyScore || 0);
                        }
                        break;

                    case 'FINAL_REPORT':
                        setPhase('COMPLETE');
                        setFinalVerdict(data.data?.verdict || null);
                        setVerdictReason(data.data?.verdictReason || null);
                        setPnlPct(data.data?.pnlPct || null);
                        setPenaltyScore(data.data?.penaltyScore || 0);
                        setEdgeValidated(data.data?.funnelAuthority?.edgeValidated || false);
                        setValidatedTokens(data.data?.funnelAuthority?.validatedTokens || []);
                        setRegime(data.data?.funnelAuthority?.regime || '');
                        if (data.data?.funnelAuthority?.flatStats) {
                            setFlatStats({
                                total: data.data.funnelAuthority.flatStats.totalFlat,
                                correct: data.data.funnelAuthority.flatStats.correctFlat,
                                accuracy: data.data.funnelAuthority.flatStats.flatAccuracy,
                                cowardice: data.data.funnelAuthority.flatStats.cowardiceScore,
                            });
                        }
                        break;

                    case 'STREAM_END':
                        setIsRunning(false);
                        eventSource.close();
                        break;

                    case 'ERROR':
                        console.error('Stream error:', data.data);
                        setIsRunning(false);
                        eventSource.close();
                        break;
                }
            } catch (e) {
                console.error('Parse error:', e);
            }
        };

        eventSource.onerror = () => {
            setIsRunning(false);
            eventSource.close();
        };
    };

    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    const getPhaseColor = (p: Phase) => {
        switch (p) {
            case 'FUNNEL': return 'from-purple-600 to-blue-600';
            case 'SIMULATION': return 'from-cyan-600 to-emerald-600';
            case 'COMPLETE': return finalVerdict === 'PASS' ? 'from-emerald-600 to-green-600' : 'from-red-600 to-orange-600';
            default: return 'from-gray-700 to-gray-800';
        }
    };

    const narrowingPct = initialTokens > 0 ? ((currentTokens / initialTokens) * 100) : 100;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-4">
            <div className="max-w-[1800px] mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-1">
                        🚀 Pillar 10 Live Dashboard
                    </h1>
                    <p className="text-gray-400 text-sm">Real-time funnel + simulation • CHAOS tokens only • Every event streamed</p>
                </div>

                {/* Configuration */}
                {!isRunning && phase === 'IDLE' && (
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-400 text-xs mb-2">Mode</label>
                                <select
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value as RunMode)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                                >
                                    <option value="EDGE">🔴 EDGE (Strict)</option>
                                    <option value="EXPLORATION">🔵 EXPLORE (Relaxed)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs mb-2">Horizon</label>
                                <select
                                    value={horizon}
                                    onChange={(e) => setHorizon(parseInt(e.target.value) as any)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                                >
                                    <option value={5}>5 min</option>
                                    <option value={10}>10 min</option>
                                    <option value={15}>15 min</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs mb-2">Tokens</label>
                                <input
                                    type="number"
                                    value={tokenLimit}
                                    onChange={(e) => setTokenLimit(parseInt(e.target.value))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                                    min={100}
                                    max={2000}
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={startSimulation}
                                    className="w-full py-2 rounded-lg font-bold bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90"
                                >
                                    ▶ Start
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Live Status Banner */}
                {isRunning && (
                    <div className={`bg-gradient-to-r ${getPhaseColor(phase)} rounded-xl p-4 mb-6 text-center`}>
                        <div className="text-2xl font-bold mb-1">
                            {phase === 'FUNNEL' && '🔮 Phase 1: Compounding Funnel'}
                            {phase === 'SIMULATION' && '🧠 Phase 2: Brain v2 Simulation'}
                            {phase === 'COMPLETE' && `${finalVerdict === 'PASS' ? '✅' : '⛔'} Complete`}
                        </div>
                        {waiting && (
                            <div className="text-white/80 animate-pulse">{waitMessage}</div>
                        )}
                    </div>
                )}

                {/* Main Grid */}
                <div className="grid grid-cols-12 gap-4">
                    {/* Left Column - Funnel Metrics (4 cols) */}
                    <div className="col-span-4 space-y-4">
                        {/* Funnel Progress */}
                        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <span>🎯</span> Funnel Progress
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400">Token Narrowing</span>
                                        <span className="font-semibold">{currentTokens} / {initialTokens}</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
                                            style={{ width: `${narrowingPct}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-gray-800 rounded p-2">
                                        <div className="text-gray-400">Cycle</div>
                                        <div className="text-lg font-bold">{currentCycle}</div>
                                    </div>
                                    <div className="bg-gray-800 rounded p-2">
                                        <div className="text-gray-400">Regime</div>
                                        <div className="text-lg font-bold text-purple-400">{regime || '—'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Predictions Breakdown */}
                        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                            <h3 className="text-sm font-semibold mb-3">📊 Predictions</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-emerald-400">UP</span>
                                    <div className="flex-1 mx-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500"
                                            style={{ width: `${((predictions.up / (predictions.up + predictions.down + predictions.flat || 1)) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-semibold w-8 text-right">{predictions.up}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-red-400">DOWN</span>
                                    <div className="flex-1 mx-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500"
                                            style={{ width: `${((predictions.down / (predictions.up + predictions.down + predictions.flat || 1)) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-semibold w-8 text-right">{predictions.down}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-amber-400">FLAT</span>
                                    <div className="flex-1 mx-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500"
                                            style={{ width: `${((predictions.flat / (predictions.up + predictions.down + predictions.flat || 1)) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-semibold w-8 text-right">{predictions.flat}</span>
                                </div>
                            </div>
                        </div>

                        {/* FLAT Accountability */}
                        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                            <h3 className="text-sm font-semibold mb-3">🎯 FLAT Accountability</h3>
                            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                <div className="bg-gray-800 rounded p-2">
                                    <div className="text-gray-400">Total</div>
                                    <div className="text-lg font-bold">{flatStats.total}</div>
                                </div>
                                <div className="bg-gray-800 rounded p-2">
                                    <div className="text-gray-400">Correct</div>
                                    <div className="text-lg font-bold text-emerald-400">{flatStats.correct}</div>
                                </div>
                                <div className="bg-gray-800 rounded p-2">
                                    <div className="text-gray-400">Accuracy</div>
                                    <div className="text-lg font-bold">{(flatStats.accuracy * 100).toFixed(0)}%</div>
                                </div>
                                <div className={`rounded p-2 ${flatStats.cowardice > 0.5 ? 'bg-red-900/30' : 'bg-gray-800'}`}>
                                    <div className="text-gray-400">Cowardice</div>
                                    <div className={`text-lg font-bold ${flatStats.cowardice > 0.5 ? 'text-red-400' : ''}`}>
                                        {(flatStats.cowardice * 100).toFixed(0)}%
                                    </div>
                                </div>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {flatResolutions.slice(0, 5).map((f, i) => (
                                    <div key={i} className={`text-xs p-2 rounded ${f.verdict.includes('CORRECT') ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">{f.token}</span>
                                            <span className={f.score > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                {f.score > 0 ? '+' : ''}{f.score}
                                            </span>
                                        </div>
                                        <div className="text-gray-400">{f.priceChange}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Discipline Metrics */}
                        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                            <h3 className="text-sm font-semibold mb-3">🛡️ Discipline</h3>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className={`rounded p-3 ${blockedCount > 0 ? 'bg-red-900/30 border border-red-700' : 'bg-emerald-900/30 border border-emerald-700'}`}>
                                    <div className="text-gray-400">Blocked</div>
                                    <div className="text-2xl font-bold">{blockedCount}</div>
                                </div>
                                <div className="bg-gray-800 rounded p-3">
                                    <div className="text-gray-400">Authorized</div>
                                    <div className="text-2xl font-bold text-emerald-400">{authorizedCount}</div>
                                </div>
                            </div>
                        </div>

                        {/* Final Verdict */}
                        {finalVerdict && (
                            <div className={`rounded-xl p-4 text-center ${finalVerdict === 'PASS' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                                <div className="text-4xl mb-2">{finalVerdict === 'PASS' ? '✅' : '⛔'}</div>
                                <div className="text-xl font-bold mb-1">{finalVerdict}</div>
                                {pnlPct !== null && (
                                    <div className="text-sm">PnL: {pnlPct > 0 ? '+' : ''}{pnlPct.toFixed(2)}%</div>
                                )}
                                <div className="text-sm mt-1">Penalty: {penaltyScore}</div>
                            </div>
                        )}
                    </div>

                    {/* Middle Column - Event Stream (4 cols) */}
                    <div className="col-span-4">
                        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 h-[800px] flex flex-col">
                            <h3 className="text-sm font-semibold mb-3">📡 Live Event Stream</h3>
                            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs">
                                {events.map((e, i) => (
                                    <div key={i} className={`p-2 rounded ${
                                        e.type.includes('ERROR') ? 'bg-red-900/30' :
                                        e.type.includes('STOP') ? 'bg-amber-900/30' :
                                        e.type.includes('COMPLETE') ? 'bg-emerald-900/30' :
                                        'bg-gray-800/50'
                                    }`}>
                                        <div className="flex justify-between items-start">
                                            <span className="text-cyan-400 font-semibold">{e.type.replace('FUNNEL_', '').replace('SIM_', '')}</span>
                                            <span className="text-gray-500 text-[10px]">
                                                {new Date(e.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {e.data && Object.keys(e.data).length > 0 && (
                                            <div className="text-gray-400 mt-1 text-[10px] truncate">
                                                {JSON.stringify(e.data).slice(0, 100)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={eventsEndRef} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Logs & Swaps (4 cols) */}
                    <div className="col-span-4 space-y-4">
                        {/* Validated Tokens */}
                        {validatedTokens.length > 0 && (
                            <div className={`rounded-xl p-4 ${edgeValidated ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-red-900/30 border border-red-700'}`}>
                                <h3 className="text-sm font-semibold mb-2">
                                    {edgeValidated ? '✅ Validated CHAOS Tokens' : '⛔ Edge Not Validated'}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {validatedTokens.map((t, i) => (
                                        <span key={i} className="px-2 py-1 bg-purple-900/50 rounded text-xs font-semibold">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Swap Tracker */}
                        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                            <h3 className="text-sm font-semibold mb-3">🔄 Swap Tracker</h3>
                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {swaps.slice().reverse().map((s, i) => (
                                    <div key={i} className={`p-2 rounded text-xs ${s.authorized ? 'bg-emerald-900/20 border border-emerald-800' : 'bg-red-900/20 border border-red-800'}`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold">{s.token}</span>
                                            <span className={s.authorized ? 'text-emerald-400' : 'text-red-400'}>
                                                {s.authorized ? '✓ AUTHORIZED' : '✗ BLOCKED'}
                                            </span>
                                        </div>
                                        {s.reason && (
                                            <div className="text-gray-400 text-[10px]">{s.reason}</div>
                                        )}
                                        <div className="text-gray-500 text-[10px]">
                                            {new Date(s.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Decision Log */}
                        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                            <h3 className="text-sm font-semibold mb-3">📝 Decision Log</h3>
                            <div className="max-h-[300px] overflow-y-auto space-y-1">
                                {logs.slice().reverse().slice(0, 20).map((log, i) => (
                                    <div key={i} className={`p-2 rounded text-xs ${
                                        log.evaluation?.outcomeClass === 'BAD_DECISION_BAD_OUTCOME' ? 'bg-red-900/20' :
                                        log.executed ? 'bg-emerald-900/20' :
                                        'bg-gray-800/50'
                                    }`}>
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">{log.action}</span>
                                            <span className="text-gray-500 text-[10px]">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {log.toToken && (
                                            <div className="text-gray-300 mt-1">→ {log.toToken}</div>
                                        )}
                                        {log.intent?.thesis && (
                                            <div className="text-gray-400 text-[10px] mt-1 truncate">{log.intent.thesis}</div>
                                        )}
                                        {log.pnlSOL && log.pnlSOL !== 0 && (
                                            <div className={`text-[10px] mt-1 ${log.pnlSOL > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                PnL: {log.pnlSOL > 0 ? '+' : ''}{log.pnlSOL.toFixed(6)} SOL
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
