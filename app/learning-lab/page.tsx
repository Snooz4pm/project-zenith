'use client';

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from 'react';

interface LearningEvent {
    type: string;
    timestamp?: number;
    runId?: string;
    data?: any;
}

interface CycleSummary {
    cycle: number;
    regime: string;
    confidence: number;
    accuracy: number;
    baselineRandom: number;
    baselineMomentum: number;
    opportunity: number;
    decision: string;
    tokens: number;
}

export default function LearningLabPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [events, setEvents] = useState<LearningEvent[]>([]);
    const [cycles, setCycles] = useState<CycleSummary[]>([]);
    const [verdict, setVerdict] = useState<string | null>(null);
    const [currentRegime, setCurrentRegime] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    const startLearning = () => {
        setIsRunning(true);
        setEvents([]);
        setCycles([]);
        setVerdict(null);
        setError(null);

        const eventSource = new EventSource('/api/learning/run');
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setEvents(prev => [...prev, data]);

                // Handle specific events
                if (data.type === 'REGIME_DETECTED') {
                    setCurrentRegime(data.data?.regime || data.regime);
                }
                if (data.type === 'CYCLE_SUMMARY') {
                    setCycles(prev => [...prev, {
                        cycle: data.data?.cycle || data.cycle,
                        regime: currentRegime || 'UNKNOWN',
                        confidence: data.data?.confidence || 0,
                        accuracy: data.data?.accuracy || data.accuracy || 0,
                        baselineRandom: data.data?.random || 0.33,
                        baselineMomentum: data.data?.momentum || 0,
                        opportunity: data.data?.opportunity || data.opportunity || 0,
                        decision: data.data?.decision || data.decision || '',
                        tokens: data.data?.tokens || data.tokens || 0,
                    }]);
                }
                if (data.type === 'FINAL_REPORT') {
                    setVerdict(data.data?.verdict);
                }
                if (data.type === 'STREAM_END') {
                    setIsRunning(false);
                    eventSource.close();
                }
                if (data.type === 'ERROR') {
                    setError(data.error);
                    setIsRunning(false);
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

    const getVerdictColor = (v: string | null) => {
        if (!v) return 'bg-gray-800';
        if (v === 'EDGE_VALIDATED') return 'bg-emerald-600';
        if (v.includes('NO_TRADE')) return 'bg-amber-600';
        return 'bg-red-600';
    };

    const getVerdictIcon = (v: string | null) => {
        if (!v) return '⏳';
        if (v === 'EDGE_VALIDATED') return '✅';
        if (v.includes('NO_TRADE')) return '🟡';
        return '🔴';
    };

    const getRegimeColor = (r: string | null) => {
        if (!r) return 'text-gray-400';
        if (r === 'TREND_UP') return 'text-emerald-400';
        if (r === 'TREND_DOWN') return 'text-red-400';
        if (r === 'RANGE') return 'text-amber-400';
        return 'text-purple-400';
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                            🧠 Learning Lab
                        </h1>
                        <p className="text-gray-400 mt-1">Read-only observer dashboard • 8 Pillars + Trust</p>
                    </div>
                    <button
                        onClick={startLearning}
                        disabled={isRunning}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${isRunning
                                ? 'bg-gray-700 cursor-not-allowed'
                                : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90'
                            }`}
                    >
                        {isRunning ? '⏳ Learning...' : '▶ Start Learning Run'}
                    </button>
                </div>

                {/* Verdict Panel - BIG */}
                <div className={`${getVerdictColor(verdict)} rounded-2xl p-8 mb-8 text-center transition-all`}>
                    <div className="text-6xl mb-4">{getVerdictIcon(verdict)}</div>
                    <h2 className="text-3xl font-bold">
                        {verdict || (isRunning ? 'Running...' : 'Awaiting Run')}
                    </h2>
                    {verdict === 'EDGE_VALIDATED' && (
                        <p className="text-emerald-200 mt-2">Execution ALLOWED • Brain has earned permission</p>
                    )}
                    {verdict && verdict !== 'EDGE_VALIDATED' && (
                        <p className="text-white/70 mt-2">Execution BLOCKED • This is the correct outcome</p>
                    )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <div className="text-gray-400 text-sm">Current Regime</div>
                        <div className={`text-2xl font-bold mt-1 ${getRegimeColor(currentRegime)}`}>
                            {currentRegime || '—'}
                        </div>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <div className="text-gray-400 text-sm">Cycles Completed</div>
                        <div className="text-2xl font-bold mt-1">{cycles.length}</div>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <div className="text-gray-400 text-sm">Latest Accuracy</div>
                        <div className="text-2xl font-bold mt-1 text-cyan-400">
                            {cycles.length > 0 ? `${(cycles[cycles.length - 1].accuracy * 100).toFixed(1)}%` : '—'}
                        </div>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <div className="text-gray-400 text-sm">Tokens Remaining</div>
                        <div className="text-2xl font-bold mt-1">
                            {cycles.length > 0 ? cycles[cycles.length - 1].tokens : '—'}
                        </div>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Timeline */}
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <h3 className="text-xl font-semibold mb-4">📊 Learning Timeline</h3>
                        {cycles.length === 0 ? (
                            <p className="text-gray-500">No cycles yet...</p>
                        ) : (
                            <div className="space-y-4">
                                {cycles.map((c, i) => (
                                    <div key={i} className="bg-gray-800/50 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold">Cycle {c.cycle}</span>
                                            <span className={`px-2 py-1 rounded text-xs ${c.decision === 'CONTINUE' ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'
                                                }`}>
                                                {c.decision}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-400">Brain:</span>{' '}
                                                <span className="text-cyan-400">{(c.accuracy * 100).toFixed(1)}%</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Random:</span>{' '}
                                                <span>{(c.baselineRandom * 100).toFixed(1)}%</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Opportunity:</span>{' '}
                                                <span className="text-amber-400">{(c.opportunity * 100).toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Events Log */}
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 max-h-96 overflow-y-auto">
                        <h3 className="text-xl font-semibold mb-4">📝 Event Stream</h3>
                        {events.length === 0 ? (
                            <p className="text-gray-500">Waiting for events...</p>
                        ) : (
                            <div className="space-y-2 font-mono text-xs">
                                {events.slice(-20).map((e, i) => (
                                    <div key={i} className="bg-gray-800/50 px-3 py-2 rounded">
                                        <span className="text-purple-400">{e.type}</span>
                                        {e.data && (
                                            <span className="text-gray-500 ml-2">
                                                {JSON.stringify(e.data).slice(0, 60)}...
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mt-6 bg-red-900/50 border border-red-700 rounded-xl p-4 text-red-300">
                        ⚠️ Error: {error}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 text-center text-gray-600 text-sm">
                    Read-only dashboard • No trade controls • Data from Jupiter Proxy
                </div>
            </div>
        </div>
    );
}
