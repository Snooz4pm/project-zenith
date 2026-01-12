'use client';

import { useState, useEffect, useRef } from 'react';

interface Event {
    type: string;
    data: any;
    timestamp: number;
}

interface CycleMetric {
    cycle: number;
    regime: string;
    predictions: { up: number; down: number; flat: number };
    accuracy: number;
    survivors: number;
    eliminated: number;
    biases: { upBias: number; downBias: number; flatBias: number };
    flatStats: { total: number; correct: number; accuracy: number; cowardice: number };
}

interface Position {
    token: string;
    valueSOL: number;
    costBasis: number;
    unrealizedPnL: number;
    ageSeconds: number;
}

export default function BrainDashboardPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [phase, setPhase] = useState<string>('IDLE');

    // Funnel State
    const [initialTokens, setInitialTokens] = useState(0);
    const [currentTokens, setCurrentTokens] = useState(0);
    const [validatedTokens, setValidatedTokens] = useState<string[]>([]);
    const [edgeValidated, setEdgeValidated] = useState(false);
    const [currentRegime, setCurrentRegime] = useState('');

    // Cycle Metrics
    const [cycleMetrics, setCycleMetrics] = useState<CycleMetric[]>([]);
    const [currentCycle, setCurrentCycle] = useState(0);
    const [currentBiases, setCurrentBiases] = useState({ upBias: 1.0, downBias: 1.0, flatBias: 1.0 });

    // Predictions & Accountability
    const [currentPredictions, setCurrentPredictions] = useState({ up: 0, down: 0, flat: 0 });
    const [flatResolutions, setFlatResolutions] = useState<any[]>([]);
    const [hesitationPenalties, setHesitationPenalties] = useState<any[]>([]);
    const [behaviorAdjustments, setBehaviorAdjustments] = useState<any[]>([]);

    // Portfolio State
    const [liquidSOL, setLiquidSOL] = useState(0.1);
    const [positions, setPositions] = useState<Position[]>([]);
    const [unrealizedPnL, setUnrealizedPnL] = useState(0);
    const [totalValue, setTotalValue] = useState(0.1);

    // Discipline
    const [blockedBuys, setBlockedBuys] = useState(0);
    const [authorizedBuys, setAuthorizedBuys] = useState(0);
    const [violations, setViolations] = useState<string[]>([]);
    const [trustLevel, setTrustLevel] = useState('');

    // Final Results
    const [finalVerdict, setFinalVerdict] = useState<string | null>(null);
    const [verdictReason, setVerdictReason] = useState<string | null>(null);
    const [pnlPct, setPnlPct] = useState<number | null>(null);
    const [penaltyScore, setPenaltyScore] = useState(0);

    // Events
    const [events, setEvents] = useState<Event[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const eventSourceRef = useRef<EventSource | null>(null);
    const eventsEndRef = useRef<HTMLDivElement>(null);
    const eventsContainerRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    useEffect(() => {
        if (autoScroll && eventsEndRef.current) {
            eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [events, autoScroll]);

    const handleScroll = () => {
        if (eventsContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = eventsContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setAutoScroll(isNearBottom);
        }
    };

    const startSimulation = () => {
        setIsRunning(true);
        setPhase('STARTING');

        // Reset all state
        setInitialTokens(0);
        setCurrentTokens(0);
        setValidatedTokens([]);
        setEdgeValidated(false);
        setCurrentRegime('');
        setCycleMetrics([]);
        setCurrentCycle(0);
        setCurrentBiases({ upBias: 1.0, downBias: 1.0, flatBias: 1.0 });
        setCurrentPredictions({ up: 0, down: 0, flat: 0 });
        setFlatResolutions([]);
        setHesitationPenalties([]);
        setBehaviorAdjustments([]);
        setLiquidSOL(0.1);
        setPositions([]);
        setUnrealizedPnL(0);
        setTotalValue(0.1);
        setBlockedBuys(0);
        setAuthorizedBuys(0);
        setViolations([]);
        setTrustLevel('');
        setFinalVerdict(null);
        setVerdictReason(null);
        setPnlPct(null);
        setPenaltyScore(0);
        setEvents([]);
        setLogs([]);

        const eventSource = new EventSource('/api/unified-simulation');
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setEvents(prev => [...prev, data]);

                // Handle specific events
                switch (data.type) {
                    case 'FUNNEL_PHASE':
                        setPhase(data.data?.phase || '');
                        break;

                    case 'FUNNEL_UNIVERSE_FROZEN':
                        setInitialTokens(data.data?.tokenCount || 0);
                        setCurrentTokens(data.data?.tokenCount || 0);
                        break;

                    case 'FUNNEL_CYCLE_START':
                        setCurrentCycle(data.data?.cycle || 0);
                        setCurrentTokens(data.data?.tokens || 0);
                        break;

                    case 'FUNNEL_BEHAVIOR_ADJUSTED':
                        setCurrentBiases(data.data?.changes || { upBias: 1.0, downBias: 1.0, flatBias: 1.0 });
                        setBehaviorAdjustments(prev => [data.data, ...prev]);
                        break;

                    case 'FUNNEL_PREDICTIONS_MADE':
                        setCurrentPredictions({
                            up: data.data?.up || 0,
                            down: data.data?.down || 0,
                            flat: data.data?.flat || 0,
                        });
                        break;

                    case 'FUNNEL_REGIME':
                        setCurrentRegime(data.data?.regime || '');
                        break;

                    case 'FUNNEL_FLAT_RESOLVED':
                        setFlatResolutions(prev => [data.data, ...prev]);
                        break;

                    case 'FUNNEL_HESITATION_PENALTY':
                        setHesitationPenalties(prev => [data.data, ...prev]);
                        break;

                    case 'FUNNEL_CYCLE_COMPLETE':
                        setCurrentTokens(data.data?.survivors || 0);
                        break;

                    case 'FUNNEL_FUNNEL_COMPLETE':
                        setEdgeValidated(data.data?.edgeValidated || false);
                        setValidatedTokens(data.data?.validatedTokens || []);
                        break;

                    case 'FUNNEL_TRUST_ERROR':
                        setViolations(prev => [...prev, `Trust Error: ${data.data?.error || 'Unknown'} - ${data.data?.fallback || 'Using fallback'}`]);
                        break;

                    case 'FUNNEL_TRUST_DECISION':
                        setTrustLevel(data.data?.level || '');
                        break;

                    case 'SIM_LOG':
                        const log = data.data?.log;
                        if (log) {
                            setLogs(prev => [...prev, log]);

                            // Track buys
                            if (log.action === 'SWAP') {
                                if (log.skippedReason?.includes('BLOCKED')) {
                                    setBlockedBuys(prev => prev + 1);
                                    setViolations(prev => [...prev, log.skippedReason]);
                                } else if (log.executed) {
                                    setAuthorizedBuys(prev => prev + 1);
                                }
                            }
                        }

                        const state = data.data?.state;
                        if (state) {
                            setLiquidSOL(state.liquidSOL || 0);
                            setPositions(state.positions || []);
                            setUnrealizedPnL(state.unrealizedPnLSOL || 0);
                            setTotalValue(state.totalValueSOL || 0);
                            setPenaltyScore(state.penaltyScore || 0);
                        }
                        break;

                    case 'FINAL_REPORT':
                        setPhase('COMPLETE');
                        const report = data.data?.report;
                        if (report) {
                            setFinalVerdict(report.verdict);
                            setVerdictReason(report.verdictReason);
                            setPnlPct(report.pnlPct);
                            setPenaltyScore(report.penaltyScore);
                            setCycleMetrics(report.cycleMetrics || []);
                            setTrustLevel(report.trustLevel);
                            setBlockedBuys(report.blockedBuys);
                            setAuthorizedBuys(report.authorizedBuys);
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

    const totalPredictions = currentPredictions.up + currentPredictions.down + currentPredictions.flat;
    const directionalPct = totalPredictions > 0 ? ((currentPredictions.up + currentPredictions.down) / totalPredictions) * 100 : 0;
    const flatPct = totalPredictions > 0 ? (currentPredictions.flat / totalPredictions) * 100 : 0;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-3">
            <div className="max-w-[2000px] mx-auto">
                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        🧠 Brain Analysis Dashboard - All Pillars (1-10)
                    </h1>
                    <p className="text-gray-400 text-sm">Complete learning validation + portfolio execution • CHAOS tokens only • Real-time analysis</p>
                </div>

                {/* Start Button */}
                {!isRunning && phase === 'IDLE' && (
                    <button
                        onClick={startSimulation}
                        className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:opacity-90 mb-4"
                    >
                        ▶ Start Brain Test (All Pillars)
                    </button>
                )}

                {/* Phase Banner */}
                {isRunning && (
                    <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-xl p-4 mb-4 text-center">
                        <div className="text-xl font-bold animate-pulse">⚡ {phase.replace('_', ' ')}</div>
                    </div>
                )}

                {/* Main Grid - 4 columns */}
                <div className="grid grid-cols-12 gap-3">
                    {/* Column 1: Funnel Metrics (3 cols) */}
                    <div className="col-span-3 space-y-3">
                        {/* Token Funnel */}
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                            <h3 className="text-sm font-bold mb-3">🎯 Token Funnel</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400">Narrowing</span>
                                        <span className="font-semibold">{currentTokens} / {initialTokens}</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
                                            style={{ width: `${initialTokens > 0 ? (currentTokens / initialTokens) * 100 : 100}%` }}
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
                                        <div className="text-lg font-bold text-purple-400">{currentRegime || '—'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Behavioral Adaptation (Pillar 10.5) */}
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                            <h3 className="text-sm font-bold mb-3">🎛️ Behavior (P10.5)</h3>
                            <div className="space-y-2 text-xs">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-emerald-400">UP Bias</span>
                                        <span className="font-semibold">{currentBiases.upBias.toFixed(2)}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500"
                                            style={{ width: `${(currentBiases.upBias / 1.5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-red-400">DOWN Bias</span>
                                        <span className="font-semibold">{currentBiases.downBias.toFixed(2)}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500"
                                            style={{ width: `${(currentBiases.downBias / 1.5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-amber-400">FLAT Bias</span>
                                        <span className="font-semibold">{currentBiases.flatBias.toFixed(2)}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500"
                                            style={{ width: `${(currentBiases.flatBias / 1.5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            {behaviorAdjustments.length > 0 && (
                                <div className="mt-2 text-[10px] text-gray-500">
                                    Last: {behaviorAdjustments[0]?.reason?.slice(0, 30)}...
                                </div>
                            )}
                        </div>

                        {/* Predictions */}
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                            <h3 className="text-sm font-bold mb-3">📊 Predictions</h3>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-emerald-400">UP</span>
                                    <span className="font-semibold">{currentPredictions.up}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-red-400">DOWN</span>
                                    <span className="font-semibold">{currentPredictions.down}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-amber-400">FLAT</span>
                                    <span className="font-semibold">{currentPredictions.flat}</span>
                                </div>
                                <div className="pt-2 border-t border-gray-800">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Directional</span>
                                        <span>{directionalPct.toFixed(0)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">FLAT</span>
                                        <span>{flatPct.toFixed(0)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Edge Status */}
                        <div className={`rounded-lg p-4 ${edgeValidated ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-red-900/30 border border-red-700'}`}>
                            <h3 className="text-sm font-bold mb-2">
                                {edgeValidated ? '✅ Edge Validated' : '⛔ No Edge'}
                            </h3>
                            {validatedTokens.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {validatedTokens.slice(0, 6).map((t, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-purple-900/50 rounded text-[10px]">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Discipline */}
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                            <h3 className="text-sm font-bold mb-3">🛡️ Discipline</h3>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className={`rounded p-2 ${blockedBuys > 0 ? 'bg-red-900/30' : 'bg-emerald-900/30'}`}>
                                    <div className="text-gray-400">Blocked</div>
                                    <div className="text-xl font-bold">{blockedBuys}</div>
                                </div>
                                <div className="bg-gray-800 rounded p-2">
                                    <div className="text-gray-400">Authorized</div>
                                    <div className="text-xl font-bold text-emerald-400">{authorizedBuys}</div>
                                </div>
                            </div>
                            {trustLevel && (
                                <div className="mt-2 text-[10px] text-gray-400">
                                    Trust: {trustLevel}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column 2: Accountability (3 cols) */}
                    <div className="col-span-3 space-y-3">
                        {/* FLAT Accountability (Pillar 10.3) */}
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 h-[400px] flex flex-col">
                            <h3 className="text-sm font-bold mb-3">🎯 FLAT Accountability (P10.3)</h3>
                            <div className="flex-1 overflow-y-auto space-y-1">
                                {flatResolutions.slice(0, 20).map((f, i) => (
                                    <div key={i} className={`text-xs p-2 rounded ${f.verdict?.includes('CORRECT') ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">{f.token}</span>
                                            <span className={f.score > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                {f.score > 0 ? '+' : ''}{f.score}
                                            </span>
                                        </div>
                                        <div className="text-gray-400">{f.priceChange} • {f.verdict?.slice(0, 20)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Hesitation Penalties (Pillar 10.4) */}
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 h-[250px] flex flex-col">
                            <h3 className="text-sm font-bold mb-3">⚠️ Hesitation (P10.4)</h3>
                            <div className="flex-1 overflow-y-auto space-y-1">
                                {hesitationPenalties.slice(0, 10).map((h, i) => (
                                    <div key={i} className="text-xs p-2 rounded bg-amber-900/20">
                                        <div className="flex justify-between">
                                            <span className="font-semibold">{h.token}</span>
                                            <span className="text-amber-400">{h.penalty}</span>
                                        </div>
                                        <div className="text-gray-400">Move: {h.priceChange} • {h.regime}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cycle History */}
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                            <h3 className="text-sm font-bold mb-3">📈 Cycle History</h3>
                            <div className="space-y-2">
                                {cycleMetrics.slice(-5).reverse().map((c, i) => (
                                    <div key={i} className="bg-gray-800/50 rounded p-2 text-xs">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-semibold">Cycle {c.cycle}</span>
                                            <span className="text-purple-400">{c.regime}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                                            <div>Acc: {(c.accuracy * 100).toFixed(0)}%</div>
                                            <div>Tokens: {c.survivors}</div>
                                            <div>Coward: {(c.flatStats.cowardice * 100).toFixed(0)}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Portfolio (3 cols) */}
                    <div className="col-span-3 space-y-3">
                        {/* Portfolio Value */}
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                            <h3 className="text-sm font-bold mb-3">💼 Portfolio</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-gray-400 text-xs">Total Value</div>
                                    <div className="text-2xl font-bold">{totalValue.toFixed(6)} SOL</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-gray-800 rounded p-2">
                                        <div className="text-gray-400">Liquid</div>
                                        <div className="font-semibold">{liquidSOL.toFixed(6)}</div>
                                    </div>
                                    <div className="bg-gray-800 rounded p-2">
                                        <div className="text-gray-400">Unrealized</div>
                                        <div className={`font-semibold ${unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {unrealizedPnL > 0 ? '+' : ''}{unrealizedPnL.toFixed(6)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Positions */}
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 h-[300px] flex flex-col">
                            <h3 className="text-sm font-bold mb-3">📍 Positions</h3>
                            <div className="flex-1 overflow-y-auto space-y-2">
                                {positions.map((pos, i) => (
                                    <div key={i} className={`p-2 rounded text-xs ${pos.unrealizedPnL >= 0 ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>
                                        <div className="font-semibold">{pos.token}</div>
                                        <div className="grid grid-cols-2 gap-1 text-[10px] mt-1">
                                            <div>Value: {pos.valueSOL.toFixed(6)}</div>
                                            <div className={pos.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                PnL: {pos.unrealizedPnL > 0 ? '+' : ''}{pos.unrealizedPnL.toFixed(6)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {positions.length === 0 && (
                                    <div className="text-gray-500 text-xs text-center py-4">No positions</div>
                                )}
                            </div>
                        </div>

                        {/* Final Verdict */}
                        {finalVerdict && (
                            <div className={`rounded-lg p-4 text-center ${finalVerdict === 'PASS' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                                <div className="text-4xl mb-2">{finalVerdict === 'PASS' ? '✅' : '⛔'}</div>
                                <div className="text-xl font-bold">{finalVerdict}</div>
                                {pnlPct !== null && (
                                    <div className="text-sm mt-1">PnL: {pnlPct > 0 ? '+' : ''}{pnlPct.toFixed(2)}%</div>
                                )}
                                <div className="text-sm">Penalty: {penaltyScore}</div>
                            </div>
                        )}
                    </div>

                    {/* Column 4: Events & Logs (3 cols) */}
                    <div className="col-span-3 space-y-3">
                        {/* Event Stream */}
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 h-[400px] flex flex-col">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold">📡 Events</h3>
                                {!autoScroll && (
                                    <button
                                        onClick={() => setAutoScroll(true)}
                                        className="text-[10px] px-2 py-1 bg-cyan-600 hover:bg-cyan-500 rounded"
                                    >
                                        ↓ Auto
                                    </button>
                                )}
                            </div>
                            <div
                                ref={eventsContainerRef}
                                onScroll={handleScroll}
                                className="flex-1 overflow-y-auto space-y-1 font-mono text-[10px]"
                            >
                                {events.map((e, i) => (
                                    <div key={i} className={`p-2 rounded ${
                                        e.type.includes('ERROR') ? 'bg-red-900/30' :
                                        e.type.includes('STOP') ? 'bg-amber-900/30' :
                                        e.type.includes('COMPLETE') ? 'bg-emerald-900/30' :
                                        'bg-gray-800/50'
                                    }`}>
                                        <div className="flex justify-between">
                                            <span className="text-cyan-400 font-semibold">{e.type.replace('FUNNEL_', '').slice(0, 25)}</span>
                                            <span className="text-gray-500">{new Date(e.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={eventsEndRef} />
                            </div>
                        </div>

                        {/* Decision Log */}
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 h-[350px] flex flex-col">
                            <h3 className="text-sm font-bold mb-3">📝 Decisions</h3>
                            <div className="flex-1 overflow-y-auto space-y-1">
                                {logs.slice().reverse().slice(0, 20).map((log, i) => (
                                    <div key={i} className={`p-2 rounded text-xs ${
                                        log.evaluation?.outcomeClass === 'BAD_DECISION_BAD_OUTCOME' ? 'bg-red-900/20' :
                                        log.executed ? 'bg-emerald-900/20' :
                                        'bg-gray-800/50'
                                    }`}>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">{log.action}</span>
                                            <span className="text-gray-500 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        {log.toToken && (
                                            <div className="text-gray-300 mt-1">→ {log.toToken}</div>
                                        )}
                                        {log.pnlSOL && log.pnlSOL !== 0 && (
                                            <div className={`text-[10px] ${log.pnlSOL > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
