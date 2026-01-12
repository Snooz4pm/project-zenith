'use client';

import { useState, useEffect, useRef } from 'react';

interface Event {
    type: string;
    cycle?: number;
    timestamp?: number;
    [key: string]: any;
}

interface CycleData {
    cycle: number;
    tokensBefore: number;
    tokensAfter: number;
    accuracy: string;
    survivors: string[];
    eliminated: number;
}

export default function PaperTradingPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [cycles, setCycles] = useState<CycleData[]>([]);
    const [predictions, setPredictions] = useState({ up: 0, down: 0, flat: 0, total: 0 });
    const [regime, setRegime] = useState('—');
    const [trustLevel, setTrustLevel] = useState(0);
    const [currentCycle, setCurrentCycle] = useState(0);
    const [funnelTokens, setFunnelTokens] = useState(0);
    const [phase, setPhase] = useState('IDLE');
    const [waitProgress, setWaitProgress] = useState({ waited: 0, total: 0 });
    const [trades, setTrades] = useState<{ action: string; token: string; amount: string; pnl?: string }[]>([]);
    const [funnelVerdict, setFunnelVerdict] = useState<{ shouldExecute: boolean; reason: string; candidates: string[] } | null>(null);
    const [finalResult, setFinalResult] = useState<any>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    const startRun = () => {
        setIsRunning(true);
        setEvents([]);
        setCycles([]);
        setTrades([]);
        setFinalResult(null);
        setFunnelVerdict(null);
        setCurrentCycle(0);
        setFunnelTokens(0);
        setPhase('STARTING');
        setPredictions({ up: 0, down: 0, flat: 0, total: 0 });
        setWaitProgress({ waited: 0, total: 0 });

        const eventSource = new EventSource('/api/paper-trading/run');
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setEvents(prev => [...prev.slice(-200), data]);

                switch (data.type) {
                    case 'PHASE':
                        setPhase(data.phase);
                        break;
                    case 'UNIVERSE_FROZEN':
                        setFunnelTokens(data.count);
                        setPhase('UNIVERSE FROZEN');
                        break;
                    case 'REGIME':
                        setRegime(data.regime);
                        break;
                    case 'TRUST':
                        setTrustLevel(data.level);
                        break;
                    case 'CYCLE_START':
                        setCurrentCycle(data.cycle);
                        setFunnelTokens(data.tokens);
                        setPhase('PREDICTING');
                        break;
                    case 'PREDICTIONS':
                        setPredictions({
                            up: data.up,
                            down: data.down,
                            flat: data.flat,
                            total: data.total,
                        });
                        break;
                    case 'WAITING':
                        setPhase('OBSERVING');
                        setWaitProgress({ waited: 0, total: data.seconds });
                        break;
                    case 'TICK':
                        setWaitProgress({ waited: data.waited, total: data.total });
                        break;
                    case 'CYCLE_RESULT':
                        setCycles(prev => [...prev, {
                            cycle: data.cycle,
                            tokensBefore: data.tokensBefore,
                            tokensAfter: data.tokensAfter,
                            accuracy: data.accuracy,
                            survivors: data.survivors || [],
                            eliminated: data.eliminated,
                        }]);
                        setFunnelTokens(data.tokensAfter);
                        setPhase('NARROWED');
                        break;
                    case 'FUNNEL_VERDICT':
                        setFunnelVerdict({
                            shouldExecute: data.shouldExecute,
                            reason: data.reason,
                            candidates: data.candidates || [],
                        });
                        break;
                    case 'TRADE':
                        setTrades(prev => [...prev, {
                            action: data.action,
                            token: data.token,
                            amount: data.amount,
                            pnl: data.pnl,
                        }]);
                        break;
                    case 'RUN_COMPLETE':
                        setFinalResult(data);
                        setIsRunning(false);
                        setPhase('COMPLETE');
                        eventSource.close();
                        break;
                    case 'ERROR':
                        setIsRunning(false);
                        setPhase('ERROR');
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
            if (eventSourceRef.current) eventSourceRef.current.close();
        };
    }, []);

    const getRegimeColor = (r: string) => {
        if (r === 'TREND_UP') return 'text-emerald-400';
        if (r === 'TREND_DOWN') return 'text-red-400';
        if (r === 'RANGE') return 'text-amber-400';
        if (r === 'CHAOS') return 'text-purple-400';
        return 'text-gray-400';
    };

    const getPhaseColor = (p: string) => {
        if (p === 'COMPLETE') return 'bg-emerald-600';
        if (p === 'OBSERVING') return 'bg-amber-600';
        if (p === 'PREDICTING') return 'bg-cyan-600';
        if (p === 'ERROR') return 'bg-red-600';
        return 'bg-gray-700';
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                            🧠 30-Minute Simulation
                        </h1>
                        <p className="text-gray-400 text-sm">Pillar 10: Compounding Prediction Loop</p>
                    </div>
                    <button
                        onClick={startRun}
                        disabled={isRunning}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${isRunning
                                ? 'bg-gray-700 cursor-not-allowed'
                                : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90'
                            }`}
                    >
                        {isRunning ? '⏳ Running...' : '▶ Start Simulation'}
                    </button>
                </div>

                {/* Final Result Banner */}
                {finalResult && (
                    <div className={`${finalResult.verdict === 'PASS' ? 'bg-emerald-900/50 border-emerald-600' : 'bg-red-900/50 border-red-600'} border-2 rounded-xl p-4 mb-4 flex items-center gap-4`}>
                        <div className="text-4xl">{finalResult.verdict === 'PASS' ? '✅' : '❌'}</div>
                        <div>
                            <div className="text-xl font-bold">{finalResult.verdict}</div>
                            <div className="text-gray-300">{finalResult.reason}</div>
                            <div className="text-sm text-gray-400">
                                {finalResult.funnelCycles} cycles • {finalResult.executedTrades} trades • {finalResult.duration}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-6 gap-3 mb-4">
                    <div className={`${getPhaseColor(phase)} rounded-lg p-3 text-center`}>
                        <div className="text-xs opacity-70">Phase</div>
                        <div className="font-bold">{phase}</div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3 text-center border border-gray-800">
                        <div className="text-xs text-gray-400">Cycle</div>
                        <div className="text-xl font-bold">{currentCycle}</div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3 text-center border border-gray-800">
                        <div className="text-xs text-gray-400">Funnel</div>
                        <div className="text-xl font-bold text-amber-400">{funnelTokens}</div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3 text-center border border-gray-800">
                        <div className="text-xs text-gray-400">Regime</div>
                        <div className={`text-lg font-bold ${getRegimeColor(regime)}`}>{regime}</div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3 text-center border border-gray-800">
                        <div className="text-xs text-gray-400">Trust</div>
                        <div className="text-xl font-bold">{trustLevel}</div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3 text-center border border-gray-800">
                        <div className="text-xs text-gray-400">Trades</div>
                        <div className="text-xl font-bold text-cyan-400">{trades.length}</div>
                    </div>
                </div>

                {/* Wait Progress Bar */}
                {phase === 'OBSERVING' && waitProgress.total > 0 && (
                    <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-400 mb-1">
                            <span>⏱ Observing real price movement...</span>
                            <span>{waitProgress.waited}s / {waitProgress.total}s</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 transition-all"
                                style={{ width: `${(waitProgress.waited / waitProgress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Three Column Layout */}
                <div className="grid grid-cols-3 gap-4">
                    {/* Predictions Panel */}
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            🎯 Predictions
                            <span className="text-xs text-gray-500">({predictions.total} tokens)</span>
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center bg-emerald-900/30 rounded-lg p-2">
                                <span className="text-emerald-400">UP</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 bg-emerald-600 rounded" style={{ width: `${predictions.total > 0 ? (predictions.up / predictions.total) * 60 : 0}px` }} />
                                    <span className="font-bold">{predictions.up}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center bg-red-900/30 rounded-lg p-2">
                                <span className="text-red-400">DOWN</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 bg-red-600 rounded" style={{ width: `${predictions.total > 0 ? (predictions.down / predictions.total) * 60 : 0}px` }} />
                                    <span className="font-bold">{predictions.down}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center bg-gray-800/50 rounded-lg p-2">
                                <span className="text-gray-400">FLAT</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 bg-gray-600 rounded" style={{ width: `${predictions.total > 0 ? (predictions.flat / predictions.total) * 60 : 0}px` }} />
                                    <span className="font-bold">{predictions.flat}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Funnel Cycles Panel */}
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 max-h-[300px] overflow-y-auto">
                        <h3 className="font-semibold mb-3">🔻 Funnel Cycles</h3>
                        {cycles.length === 0 ? (
                            <p className="text-gray-500 text-sm">No cycles yet...</p>
                        ) : (
                            <div className="space-y-2">
                                {cycles.map((c, i) => (
                                    <div key={i} className="bg-gray-800/50 rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold">Cycle {c.cycle}</span>
                                            <span className="text-cyan-400">{c.accuracy}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-400">{c.tokensBefore}</span>
                                            <span className="text-gray-600">→</span>
                                            <span className="text-amber-400 font-bold">{c.tokensAfter}</span>
                                            <span className="text-red-400 text-xs">(-{c.eliminated})</span>
                                        </div>
                                        {c.survivors.length > 0 && (
                                            <div className="text-xs text-gray-500 mt-1 truncate">
                                                Top: {c.survivors.slice(0, 3).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Trades Panel */}
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 max-h-[300px] overflow-y-auto">
                        <h3 className="font-semibold mb-3">💰 Trades</h3>
                        {trades.length === 0 ? (
                            <div className="text-center py-4">
                                <div className="text-gray-500 text-sm">No trades yet</div>
                                <div className="text-xs text-gray-600 mt-1">Waiting for funnel to complete...</div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {trades.map((t, i) => (
                                    <div key={i} className={`rounded-lg p-2 ${t.action === 'BUY' ? 'bg-emerald-900/30' : 'bg-purple-900/30'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className={t.action === 'BUY' ? 'text-emerald-400' : 'text-purple-400'}>{t.action}</span>
                                            <span className="font-bold">{t.token}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">{t.amount} SOL</span>
                                            {t.pnl && <span className={parseFloat(t.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{t.pnl} PnL</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Funnel Verdict */}
                {funnelVerdict && (
                    <div className={`mt-4 rounded-xl p-4 ${funnelVerdict.shouldExecute ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-gray-900 border border-gray-700'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{funnelVerdict.shouldExecute ? '✅' : '⏸'}</span>
                            <span className="font-semibold">{funnelVerdict.shouldExecute ? 'EXECUTION AUTHORIZED' : 'NO TRADE'}</span>
                        </div>
                        <p className="text-gray-400 text-sm">{funnelVerdict.reason}</p>
                        {funnelVerdict.candidates.length > 0 && (
                            <div className="mt-2 flex gap-2 flex-wrap">
                                {funnelVerdict.candidates.map((c, i) => (
                                    <span key={i} className="px-2 py-1 bg-emerald-800/50 rounded text-xs">{c}</span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Event Log */}
                <div className="mt-4 bg-gray-900 rounded-xl p-4 border border-gray-800 max-h-[200px] overflow-y-auto">
                    <h3 className="font-semibold mb-3">📜 Event Log</h3>
                    <div className="space-y-1 font-mono text-xs">
                        {events.slice(-20).reverse().map((e, i) => (
                            <div key={i} className="text-gray-400 flex gap-2">
                                <span className="text-purple-400">{e.type}</span>
                                <span className="text-gray-600 truncate">
                                    {e.message || e.reason || (e.seconds ? `${e.seconds}s` : '')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-4 text-center text-gray-600 text-xs">
                    Pillar 10 • Real 5-min observation cycles • PnL is informational only • Discipline = PASS
                </div>
            </div>
        </div>
    );
}
