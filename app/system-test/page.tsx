'use client';

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from 'react';
import { startSystemTest, stopSystemTest, getSystemTestStatus } from '@/app/actions/system-test-runner';

// --- Types ---
interface LogEntry {
    id: number;
    timestamp: number;
    type: string;
    data: any;
}

interface TestState {
    status: 'IDLE' | 'RUNNING' | 'COMPLETE' | 'FAILED';
    logs: LogEntry[];
    report: any;
}

// --- Components ---

function Panel({ title, children, color = 'blue' }: { title: string, children: React.ReactNode, color?: string }) {
    const borderColors = {
        blue: 'border-blue-500/30',
        green: 'border-green-500/30',
        purple: 'border-purple-500/30',
        red: 'border-red-500/30',
    };
    const bgColors = {
        blue: 'bg-blue-950/20',
        green: 'bg-green-950/20',
        purple: 'bg-purple-950/20',
        red: 'bg-red-950/20',
    };

    return (
        <div className={`border ${borderColors[color as keyof typeof borderColors]} ${bgColors[color as keyof typeof bgColors]} rounded-lg p-4 flex flex-col h-full`}>
            <h2 className={`text-xl font-bold mb-4 uppercase tracking-wider text-${color}-400`}>{title}</h2>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
                {children}
            </div>
        </div>
    );
}

function StatRow({ label, value, sub }: { label: string, value: string | number, sub?: string }) {
    return (
        <div className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
            <span className="text-gray-400 text-sm">{label}</span>
            <div className="text-right">
                <div className="font-mono text-white">{value}</div>
                {sub && <div className="text-xs text-gray-500">{sub}</div>}
            </div>
        </div>
    );
}

export default function SystemTestPage() {
    const [state, setState] = useState<TestState>({ status: 'IDLE', logs: [], report: null });
    const [polling, setPolling] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Poll for updates
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (polling) {
            interval = setInterval(async () => {
                const data = await getSystemTestStatus();
                setState({
                    status: data.status,
                    logs: data.logs,
                    report: data.report
                });
                if (data.status === 'COMPLETE' || data.status === 'FAILED') {
                    setPolling(false);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [polling]);

    // Auto-scroll logs
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [state.logs.length]);

    const handleStart = async () => {
        setState({ status: 'RUNNING', logs: [], report: null });
        setPolling(true);
        await startSystemTest();
    };

    const handleStop = async () => {
        setPolling(false);
        await stopSystemTest();
        setState(s => ({ ...s, status: 'IDLE' }));
    };

    // --- Derived Metrics ---
    const universeFrozen = state.logs.find(l => l.type === 'UNIVERSE_FROZEN');
    const lastCoverage = [...state.logs].reverse().find(l => l.type === 'COVERAGE_AUDIT');
    const cycles = state.logs.filter(l => l.type === 'CYCLE_START');
    const lastMetrics = [...state.logs].reverse().find(l => l.type === 'CYCLE_COMPLETE');
    const verdict = state.logs.find(l => l.type === 'FUNNEL_VERDICT');
    const finalReport = state.logs.find(l => l.type === 'REPORT');

    return (
        <div className="min-h-screen bg-black text-gray-200 p-8 font-sans">
            <header className="mb-8 flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        System Verification Harness
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Determinism | Physics | Discipline</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-gray-900 rounded border border-gray-800 font-mono text-sm">
                        STATUS: <span className={state.status === 'RUNNING' ? 'text-yellow-400 animate-pulse' : state.status === 'COMPLETE' ? 'text-green-400' : 'text-gray-400'}>
                            {state.status}
                        </span>
                    </div>
                    {state.status === 'IDLE' || state.status === 'COMPLETE' || state.status === 'FAILED' ? (
                        <button onClick={handleStart} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all">
                            RUN TEST
                        </button>
                    ) : (
                        <button onClick={handleStop} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded">
                            ABORT
                        </button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[60vh]">

                {/* PILLAR 1: EYES */}
                <Panel title="Pillar 1: Market Observer" color="blue">
                    <div className="bg-blue-900/10 p-4 rounded mb-4">
                        <h3 className="text-xs font-bold text-blue-300 uppercase mb-2">Universe Status</h3>
                        <StatRow label="Raw Universe (Jupiter)" value={universeFrozen?.data.count || '-'} />
                        <StatRow label="Verified (DexScreener)" value={lastCoverage?.data.successfullyScanned || '-'} />
                        <StatRow label="Rejected" value={lastCoverage ? lastCoverage.data.missingCount : '-'} sub="Strict Volume/Liq Filter" />
                        <StatRow label="Coverage Ratio" value={lastCoverage?.data.coverage || '-'} />
                    </div>
                    <div className="text-xs font-mono text-gray-400 p-2">
                        {state.logs.filter(l => l.type === 'UNIVERSE_FROZEN' || l.type === 'COVERAGE_AUDIT').map(l => (
                            <div key={l.id} className="mb-1">[{new Date(l.timestamp).toLocaleTimeString()}] {JSON.stringify(l.data)}</div>
                        ))}
                    </div>
                </Panel>

                {/* PILLAR 2: PHYSICS */}
                <Panel title="Pillar 2: Physics Engine" color="purple">
                    <div className="bg-purple-900/10 p-4 rounded mb-4">
                        <h3 className="text-xs font-bold text-purple-300 uppercase mb-2">Funnel State</h3>
                        <StatRow label="Active Cycle" value={cycles.length} sub={`Max: 6`} />
                        <StatRow label="Survivors (Narrowing)" value={lastMetrics?.data.survivors || '-'} />
                        <StatRow label="Eliminated" value={lastMetrics ? (lastMetrics.data.tokensBefore - lastMetrics.data.tokensAfter) : '-'} />
                        <StatRow label="Funnel Accuracy" value={lastMetrics?.data.accuracy || '-'} />
                    </div>
                    <div className="space-y-2">
                        {cycles.map((c, i) => (
                            <div key={i} className="bg-black/40 p-2 rounded text-sm flex justify-between">
                                <span>Cycle {c.data.cycle}</span>
                                <span className="text-purple-400">{c.data.tokens} Candidates</span>
                            </div>
                        ))}
                    </div>
                </Panel>

                {/* PILLAR 3: HANDS */}
                <Panel title="Pillar 3: Execution Engine" color="green">
                    <div className="bg-green-900/10 p-4 rounded mb-4">
                        <h3 className="text-xs font-bold text-green-300 uppercase mb-2">Verdict</h3>
                        <div className="text-center py-4">
                            {verdict ? (
                                <>
                                    <div className={`text-2xl font-black ${verdict.data.edgeValidated ? 'text-green-400' : 'text-yellow-500'}`}>
                                        {verdict.data.edgeValidated ? 'EXECUTE' : 'NO TRADE'}
                                    </div>
                                    <div className="text-sm mt-2 text-gray-400">{verdict.data.reason}</div>
                                    {verdict.data.validatedTokens?.length > 0 && (
                                        <div className="mt-2 font-mono text-green-300">{verdict.data.validatedTokens.join(', ')}</div>
                                    )}
                                </>
                            ) : (
                                <div className="text-gray-600 italic">Waiting for funnel...</div>
                            )}
                        </div>
                        {finalReport && (
                            <div className="mt-4 pt-4 border-t border-green-500/20">
                                <StatRow label="Final PnL" value={`${finalReport.data.pnlPct.toFixed(2)}%`} />
                                <StatRow label="Verdict" value={finalReport.data.verdict} />
                            </div>
                        )}
                    </div>
                </Panel>
            </div>

            {/* TIMELINE LOG */}
            <div className="mt-8 border border-white/10 bg-black rounded-lg p-4 h-[300px] flex flex-col">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">System Event Log</h3>
                <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 p-2 bg-gray-900/50 rounded">
                    {state.logs.map((log) => (
                        <div key={log.id} className="grid grid-cols-[100px_150px_1fr] gap-4 hover:bg-white/5 p-1 rounded">
                            <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className={`font-bold ${log.type === 'ERROR' ? 'text-red-500' :
                                    log.type === 'TRADE_OPENED' ? 'text-green-400' :
                                        log.type === 'FUNNEL_VERDICT' ? 'text-yellow-400' :
                                            'text-blue-400'
                                }`}>{log.type}</span>
                            <span className="text-gray-300 whitespace-pre-wrap breaks-all">{JSON.stringify(log.data)}</span>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
            </div>
        </div>
    );
}
