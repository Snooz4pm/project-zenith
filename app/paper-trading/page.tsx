'use client';

import { useState, useEffect, useRef } from 'react';

interface Event {
    type: string;
    tick?: number;
    timestamp?: number;
    [key: string]: any;
}

export default function PaperTradingPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [portfolio, setPortfolio] = useState({ liquidSOL: '0.1', positions: 0, totalSOL: '0.1', pnl: '0%' });
    const [regime, setRegime] = useState<string>('—');
    const [verdict, setVerdict] = useState<string>('—');
    const [trustLevel, setTrustLevel] = useState<number>(0);
    const [tick, setTick] = useState<number>(0);
    const [finalResult, setFinalResult] = useState<any>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    const startRun = () => {
        setIsRunning(true);
        setEvents([]);
        setFinalResult(null);
        setTick(0);

        const eventSource = new EventSource('/api/paper-trading/run');
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setEvents(prev => [...prev.slice(-100), data]); // Keep last 100

                if (data.tick !== undefined) setTick(data.tick);
                if (data.type === 'REGIME') setRegime(data.regime);
                if (data.type === 'TRUST') setTrustLevel(data.level);
                if (data.type === 'PORTFOLIO') {
                    setPortfolio({
                        liquidSOL: data.liquidSOL,
                        positions: data.positions,
                        totalSOL: data.totalSOL,
                        pnl: data.pnl,
                    });
                }
                if (data.type === 'BLOCKED' || data.type === 'LEARNING') {
                    if (data.reason) setVerdict(data.reason);
                    if (data.hasEdge !== undefined) setVerdict(data.hasEdge ? 'EDGE ✓' : 'NO EDGE');
                }
                if (data.type === 'RUN_COMPLETE') {
                    setFinalResult(data);
                    setIsRunning(false);
                    eventSource.close();
                }
                if (data.type === 'ERROR') {
                    setIsRunning(false);
                    eventSource.close();
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

    const getTrustColor = (level: number) => {
        if (level === 0) return 'bg-gray-700';
        if (level === 1) return 'bg-blue-700';
        if (level === 2) return 'bg-cyan-700';
        if (level >= 3) return 'bg-emerald-700';
        return 'bg-gray-700';
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                            📈 Paper Trading
                        </h1>
                        <p className="text-gray-400 mt-1">Learning → Trust → Brain → Simulation • Live</p>
                    </div>
                    <button
                        onClick={startRun}
                        disabled={isRunning}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${isRunning
                                ? 'bg-gray-700 cursor-not-allowed'
                                : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90'
                            }`}
                    >
                        {isRunning ? `⏳ Tick ${tick}...` : '▶ Start 30-min Run'}
                    </button>
                </div>

                {/* Final Result Banner */}
                {finalResult && (
                    <div className={`${finalResult.verdict === 'PASS' ? 'bg-emerald-900/50 border-emerald-700' : 'bg-red-900/50 border-red-700'} border-2 rounded-2xl p-6 mb-6 text-center`}>
                        <div className="text-4xl mb-2">{finalResult.verdict === 'PASS' ? '✅' : '❌'}</div>
                        <h2 className="text-2xl font-bold">{finalResult.verdict}</h2>
                        <p className="text-lg mt-2">{finalResult.reason}</p>
                        <p className="text-gray-400 mt-1">Final: {finalResult.finalSOL} SOL • PnL: {finalResult.pnl} (info only)</p>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-5 gap-4 mb-6">
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                        <div className="text-gray-400 text-sm">Tick</div>
                        <div className="text-2xl font-bold">{tick}</div>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                        <div className="text-gray-400 text-sm">Regime</div>
                        <div className={`text-2xl font-bold ${getRegimeColor(regime)}`}>{regime}</div>
                    </div>
                    <div className={`${getTrustColor(trustLevel)} rounded-xl p-4`}>
                        <div className="text-white/70 text-sm">Trust Level</div>
                        <div className="text-2xl font-bold">{trustLevel}</div>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                        <div className="text-gray-400 text-sm">Positions</div>
                        <div className="text-2xl font-bold">{portfolio.positions}</div>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                        <div className="text-gray-400 text-sm">Portfolio</div>
                        <div className="text-2xl font-bold text-cyan-400">{portfolio.totalSOL} SOL</div>
                        <div className="text-sm text-gray-500">{portfolio.pnl}</div>
                    </div>
                </div>

                {/* Two Column */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Event Stream */}
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 max-h-[500px] overflow-y-auto">
                        <h3 className="text-xl font-semibold mb-4">📡 Live Stream</h3>
                        {events.length === 0 ? (
                            <p className="text-gray-500">Waiting...</p>
                        ) : (
                            <div className="space-y-2 font-mono text-xs">
                                {events.slice(-30).reverse().map((e, i) => (
                                    <div key={i} className={`px-3 py-2 rounded ${e.type === 'TRADE' ? 'bg-emerald-900/50' :
                                            e.type === 'BLOCKED' ? 'bg-red-900/50' :
                                                e.type === 'REGIME' ? 'bg-purple-900/50' :
                                                    'bg-gray-800/50'
                                        }`}>
                                        <span className="text-cyan-400">[{e.tick ?? '-'}]</span>{' '}
                                        <span className="text-purple-400">{e.type}</span>
                                        {e.reason && <span className="text-gray-400 ml-2">{e.reason}</span>}
                                        {e.token && <span className="text-amber-400 ml-2">{e.token}</span>}
                                        {e.amount && <span className="text-emerald-400 ml-2">{e.amount} SOL</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Layer Status */}
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <h3 className="text-xl font-semibold mb-4">🧠 Layer Stack</h3>
                        <div className="space-y-4">
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">1. Learning</span>
                                    <span className={verdict.includes('EDGE') ? 'text-emerald-400' : 'text-red-400'}>
                                        {verdict}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mt-1">8 pillars • Regime + Accuracy + Baselines</p>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">2. Trust</span>
                                    <span className={trustLevel > 0 ? 'text-emerald-400' : 'text-gray-400'}>
                                        Level {trustLevel}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mt-1">Pillar 9 • Permission by discipline</p>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">3. Brain</span>
                                    <span className="text-gray-400">Waiting for edge...</span>
                                </div>
                                <p className="text-gray-500 text-sm mt-1">Decisions only when authorized</p>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">4. Simulation</span>
                                    <span className="text-cyan-400">{portfolio.positions} positions</span>
                                </div>
                                <p className="text-gray-500 text-sm mt-1">Paper execution with 0.1 SOL</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-gray-600 text-sm">
                    Read-only dashboard • PnL is informational only • Discipline = PASS
                </div>
            </div>
        </div>
    );
}
