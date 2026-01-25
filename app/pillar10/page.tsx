'use client';

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from 'react';

type RunMode = 'EDGE' | 'EXPLORATION';
type PredictionHorizon = 5 | 10 | 15;

interface FunnelEvent {
    type: string;
    data?: any;
    timestamp: number;
}

interface CycleData {
    cycle: number;
    accuracy: string;
    survivors: number;
    eliminated: number;
    regime: string;
}

interface NoEdgeDiagnostics {
    directionalCommitment?: {
        upCount: number;
        downCount: number;
        flatCount: number;
        directionalPct: string;
        flatPct: string;
        minRequired: string;
        maxFlatAllowed: string;
        violation?: string;
    };
    regime?: {
        current: string;
        explanation: string;
    };
    funnelStage?: {
        tokenCount: number;
        cycle: number;
        initialCount: number;
        narrowingRatio: string;
    };
    reasoning?: string;
}

interface FlatResolution {
    token: string;
    priceChange: string;
    score: number;
    verdict: string;
    cycle: number;
}

export default function Pillar10Page() {
    const [mode, setMode] = useState<RunMode>('EDGE');
    const [horizon, setHorizon] = useState<PredictionHorizon>(5);
    const [tokenLimit, setTokenLimit] = useState(1000);

    const [isRunning, setIsRunning] = useState(false);
    const [events, setEvents] = useState<FunnelEvent[]>([]);
    const [cycles, setCycles] = useState<CycleData[]>([]);
    const [currentTokens, setCurrentTokens] = useState(0);
    const [initialTokens, setInitialTokens] = useState(0);
    const [verdict, setVerdict] = useState<string | null>(null);
    const [noEdgeDiagnostics, setNoEdgeDiagnostics] = useState<NoEdgeDiagnostics | null>(null);
    const [flatResolutions, setFlatResolutions] = useState<FlatResolution[]>([]);
    const [waitingMessage, setWaitingMessage] = useState<string | null>(null);

    const eventSourceRef = useRef<EventSource | null>(null);

    const startFunnel = () => {
        setIsRunning(true);
        setEvents([]);
        setCycles([]);
        setCurrentTokens(0);
        setInitialTokens(0);
        setVerdict(null);
        setNoEdgeDiagnostics(null);
        setFlatResolutions([]);
        setWaitingMessage(null);

        const url = `/api/learning/pillar10?mode=${mode}&horizon=${horizon}&tokens=${tokenLimit}`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setEvents(prev => [...prev, data]);

                if (data.type === 'UNIVERSE_FROZEN') {
                    setInitialTokens(data.data?.tokenCount || 0);
                }

                if (data.type === 'FUNNEL_CREATED') {
                    setCurrentTokens(data.data?.initialTokens || 0);
                }

                if (data.type === 'CYCLE_START') {
                    setCurrentTokens(data.data?.tokenCount || 0);
                }

                if (data.type === 'WAITING') {
                    setWaitingMessage(data.data?.message || 'Waiting...');
                }

                if (data.type === 'CYCLE_COMPLETE') {
                    setWaitingMessage(null);
                    setCycles(prev => [...prev, {
                        cycle: data.data?.cycle || 0,
                        accuracy: data.data?.accuracy || '0%',
                        survivors: data.data?.survivorsCount || 0,
                        eliminated: data.data?.eliminatedCount || 0,
                        regime: data.data?.regime || 'UNKNOWN',
                    }]);
                    setCurrentTokens(data.data?.survivorsCount || 0);
                }

                if (data.type === 'STOP_NO_EDGE') {
                    setNoEdgeDiagnostics(data.data || null);
                }

                if (data.type === 'FLAT_RESOLVED') {
                    setFlatResolutions(prev => [...prev, data.data]);
                }

                if (data.type === 'FINAL_VERDICT') {
                    setVerdict(data.data?.shouldExecute ? 'EXECUTION_ALLOWED' : 'NO_TRADE');
                }

                if (data.type === 'STREAM_END') {
                    setIsRunning(false);
                    eventSource.close();
                }
            } catch (e) {
                console.error('Parse error:', e);
            }
        };

        eventSource.onerror = () => {
            setIsRunning(false);
            setWaitingMessage(null);
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

    const getModeColor = (m: RunMode) => m === 'EDGE' ? 'from-red-600 to-orange-600' : 'from-blue-600 to-cyan-600';
    const getModeIcon = (m: RunMode) => m === 'EDGE' ? '🔴' : '🔵';

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
                        🎯 Pillar 10: Compounding Prediction Funnel
                    </h1>
                    <p className="text-gray-400">Real-time prediction → wait → score → narrow → repeat until edge confirmed or funnel collapses</p>
                </div>

                {/* Configuration Panel */}
                {!isRunning && (
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
                        <h2 className="text-xl font-semibold mb-4">⚙️ Configuration</h2>

                        <div className="grid grid-cols-3 gap-6 mb-6">
                            {/* Mode Selection */}
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Run Mode</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setMode('EDGE')}
                                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                                            mode === 'EDGE'
                                                ? 'bg-gradient-to-r from-red-600 to-orange-600'
                                                : 'bg-gray-800 hover:bg-gray-700'
                                        }`}
                                    >
                                        🔴 EDGE
                                    </button>
                                    <button
                                        onClick={() => setMode('EXPLORATION')}
                                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                                            mode === 'EXPLORATION'
                                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                                                : 'bg-gray-800 hover:bg-gray-700'
                                        }`}
                                    >
                                        🔵 EXPLORE
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {mode === 'EDGE' ? 'Strict thresholds' : 'Relaxed constraints'}
                                </p>
                            </div>

                            {/* Horizon Selection */}
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Prediction Horizon</label>
                                <select
                                    value={horizon}
                                    onChange={(e) => setHorizon(parseInt(e.target.value) as PredictionHorizon)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500"
                                >
                                    <option value={5}>5 minutes</option>
                                    <option value={10}>10 minutes (Recommended)</option>
                                    <option value={15}>15 minutes</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-2">
                                    Longer = clearer signals
                                </p>
                            </div>

                            {/* Token Limit */}
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Token Universe</label>
                                <input
                                    type="number"
                                    value={tokenLimit}
                                    onChange={(e) => setTokenLimit(parseInt(e.target.value))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500"
                                    min={100}
                                    max={2000}
                                    step={100}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    CHAOS tokens only
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={startFunnel}
                            disabled={isRunning}
                            className="w-full py-4 rounded-lg font-bold text-lg bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            ▶ Start Compounding Funnel
                        </button>
                    </div>
                )}

                {/* Active Run Status */}
                {isRunning && (
                    <div className={`bg-gradient-to-r ${getModeColor(mode)} rounded-xl p-6 mb-8 text-center`}>
                        <div className="text-5xl mb-3">{getModeIcon(mode)}</div>
                        <div className="text-2xl font-bold mb-2">
                            {mode} MODE • {horizon}min Horizon
                        </div>
                        {waitingMessage && (
                            <div className="text-white/80 text-lg animate-pulse">
                                ⏳ {waitingMessage}
                            </div>
                        )}
                    </div>
                )}

                {/* Verdict Panel */}
                {verdict && (
                    <div className={`rounded-2xl p-8 mb-8 text-center ${
                        verdict === 'EXECUTION_ALLOWED' ? 'bg-emerald-600' : 'bg-red-600'
                    }`}>
                        <div className="text-6xl mb-4">
                            {verdict === 'EXECUTION_ALLOWED' ? '✅' : '⛔'}
                        </div>
                        <h2 className="text-3xl font-bold">{verdict}</h2>
                        {verdict === 'EXECUTION_ALLOWED' && (
                            <p className="text-white/80 mt-2">Funnel survived • Edge confirmed • Permission granted</p>
                        )}
                        {verdict !== 'EXECUTION_ALLOWED' && (
                            <p className="text-white/80 mt-2">Funnel blocked • NO TRADE = PASS • This is correct</p>
                        )}
                    </div>
                )}

                {/* NO EDGE Diagnostics Panel */}
                {noEdgeDiagnostics && (
                    <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 mb-8">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">⛔ WHY NO EDGE</h2>

                        {noEdgeDiagnostics.directionalCommitment && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-3 text-red-300">1️⃣ Directional Commitment</h3>
                                <div className="grid grid-cols-2 gap-4 bg-gray-900/50 rounded-lg p-4">
                                    <div>
                                        <div className="text-gray-400 text-sm">Predictions</div>
                                        <div className="mt-1">
                                            <span className="text-emerald-400">UP: {noEdgeDiagnostics.directionalCommitment.upCount}</span>
                                            {' • '}
                                            <span className="text-red-400">DOWN: {noEdgeDiagnostics.directionalCommitment.downCount}</span>
                                            {' • '}
                                            <span className="text-amber-400">FLAT: {noEdgeDiagnostics.directionalCommitment.flatCount}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 text-sm">Thresholds</div>
                                        <div className="mt-1">
                                            <div className={noEdgeDiagnostics.directionalCommitment.violation === 'FLAT_EXCEEDED' ? 'text-red-400 font-bold' : ''}>
                                                FLAT: {noEdgeDiagnostics.directionalCommitment.flatPct} {noEdgeDiagnostics.directionalCommitment.violation === 'FLAT_EXCEEDED' ? '❌' : '✓'} (max: {noEdgeDiagnostics.directionalCommitment.maxFlatAllowed})
                                            </div>
                                            <div className={noEdgeDiagnostics.directionalCommitment.violation === 'DIRECTIONAL_INSUFFICIENT' ? 'text-red-400 font-bold' : ''}>
                                                Directional: {noEdgeDiagnostics.directionalCommitment.directionalPct} {noEdgeDiagnostics.directionalCommitment.violation === 'DIRECTIONAL_INSUFFICIENT' ? '❌' : '✓'} (min: {noEdgeDiagnostics.directionalCommitment.minRequired})
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {noEdgeDiagnostics.regime && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-3 text-red-300">2️⃣ Market Regime</h3>
                                <div className="bg-gray-900/50 rounded-lg p-4">
                                    <div className="text-xl font-bold text-purple-400 mb-2">
                                        {noEdgeDiagnostics.regime.current}
                                    </div>
                                    <div className="text-gray-300">
                                        {noEdgeDiagnostics.regime.explanation}
                                    </div>
                                </div>
                            </div>
                        )}

                        {noEdgeDiagnostics.reasoning && (
                            <div className="bg-gray-900/50 rounded-lg p-4 border-l-4 border-red-500">
                                <div className="font-mono text-red-300">{noEdgeDiagnostics.reasoning}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Funnel Progress */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <div className="text-gray-400 text-sm">Initial Tokens</div>
                        <div className="text-3xl font-bold mt-1">{initialTokens}</div>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <div className="text-gray-400 text-sm">Current Tokens</div>
                        <div className="text-3xl font-bold mt-1 text-cyan-400">{currentTokens}</div>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <div className="text-gray-400 text-sm">Cycles Completed</div>
                        <div className="text-3xl font-bold mt-1">{cycles.length}</div>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <div className="text-gray-400 text-sm">Narrowing Ratio</div>
                        <div className="text-3xl font-bold mt-1 text-purple-400">
                            {initialTokens > 0 ? ((currentTokens / initialTokens) * 100).toFixed(0) : 0}%
                        </div>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Cycle Timeline */}
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <h3 className="text-xl font-semibold mb-4">📊 Cycle Timeline</h3>
                        {cycles.length === 0 ? (
                            <p className="text-gray-500">No cycles yet...</p>
                        ) : (
                            <div className="space-y-4">
                                {cycles.map((c, i) => (
                                    <div key={i} className="bg-gray-800/50 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold">Cycle {c.cycle}</span>
                                            <span className="text-purple-400">{c.regime}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-400">Accuracy:</span>{' '}
                                                <span className="text-cyan-400">{c.accuracy}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Survivors:</span>{' '}
                                                <span className="text-emerald-400">{c.survivors}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Eliminated:</span>{' '}
                                                <span className="text-red-400">{c.eliminated}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* FLAT Accountability */}
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 max-h-96 overflow-y-auto">
                        <h3 className="text-xl font-semibold mb-4">🎯 FLAT Accountability (Pillar 10.3)</h3>
                        {flatResolutions.length === 0 ? (
                            <p className="text-gray-500">No FLAT predictions resolved yet...</p>
                        ) : (
                            <div className="space-y-2">
                                {flatResolutions.slice(-20).reverse().map((f, i) => (
                                    <div key={i} className={`rounded-lg p-3 text-sm ${
                                        f.verdict.includes('CORRECT') ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-red-900/30 border border-red-700'
                                    }`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold">{f.token}</span>
                                            <span className={f.score > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                {f.score > 0 ? '+' : ''}{f.score}
                                            </span>
                                        </div>
                                        <div className="text-gray-400">
                                            Move: {f.priceChange} • {f.verdict}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-gray-600 text-sm">
                    Pillar 10: Compounding funnel with FLAT accountability • Real Jupiter data • CHAOS tokens only
                </div>
            </div>
        </div>
    );
}
