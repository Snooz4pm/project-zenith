'use client';

/**
 * Paper Trading Simulation - 10 Pillars Behavioral Trial
 * 
 * Real-time visualization of the Brain's behavior under CHAOS.
 */

import { useState, useRef, useEffect } from 'react';

interface LogEntry {
    time: string;
    type: 'INFO' | 'PHASE' | 'PREDICTION' | 'SCORE' | 'TRADE' | 'WARNING' | 'ERROR' | 'SUCCESS';
    message: string;
}

export default function PaperTradingPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState({
        tokens: 0,
        cycle: 0,
        accuracy: 0,
        pnl: 0,
        verdict: '',
    });
    const logsEndRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = (type: LogEntry['type'], message: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { time, type, message }]);
    };

    const formatEvent = (type: string, data: any): { logType: LogEntry['type']; message: string } | null => {
        switch (type) {
            case 'INIT':
                return { logType: 'INFO', message: '🚀 ' + data.message };
            case 'START':
                return { logType: 'INFO', message: `💰 Starting with ${data.startSOL} SOL` };
            case 'PHASE':
                return { logType: 'PHASE', message: `━━━ ${data.phase}: ${data.message} ━━━` };
            case 'UNIVERSE_FROZEN':
                setStats(s => ({ ...s, tokens: data.count }));
                return { logType: 'SUCCESS', message: `🌍 Universe frozen: ${data.count} CHAOS tokens loaded (Mode: ${data.mode})` };
            case 'TRUST_DECISION':
                return { logType: 'INFO', message: `🔐 Trust: ${data.level} | Execution: ${data.executionType} | Max Trades: ${data.maxTrades}` };
            case 'CYCLE_START':
                setStats(s => ({ ...s, cycle: data.cycle }));
                return { logType: 'PHASE', message: `\n📊 CYCLE ${data.cycle} | Tokens: ${data.tokens} | Elapsed: ${data.elapsed}` };
            case 'PREDICTIONS':
                return { logType: 'PREDICTION', message: `   Predictions: ⬆️ UP=${data.up} ⬇️ DOWN=${data.down} ➡️ FLAT=${data.flat}` };
            case 'BEHAVIOR_ADJUSTED':
                return { logType: 'WARNING', message: `   🧠 Biases adjusted → UP:${data.biases?.upBias?.toFixed(2)} DOWN:${data.biases?.downBias?.toFixed(2)} FLAT:${data.biases?.flatBias?.toFixed(2)}` };
            case 'WAITING':
                return { logType: 'INFO', message: `   ⏳ ${data.message || `Waiting ${data.seconds}s...`}` };
            case 'TICK':
                return null; // Skip ticks
            case 'SCORING':
                return { logType: 'SCORE', message: `   📈 Scoring ${data.tokens} tokens...` };
            case 'CYCLE_COMPLETE':
                setStats(s => ({ ...s, accuracy: parseFloat(data.accuracy) }));
                return { logType: 'SUCCESS', message: `   ✅ Accuracy: ${data.accuracy} | Survivors: ${data.survivors} | Eliminated: ${data.eliminated}` };
            case 'STOP_NO_EDGE':
                return { logType: 'WARNING', message: `🛑 STOPPED: ${data.reason} (${data.violation})` };
            case 'FUNNEL_VERDICT':
                return { logType: 'PHASE', message: `\n📋 VERDICT: Edge=${data.edgeValidated ? '✅' : '❌'} | Candidates: ${data.validatedTokens?.join(', ') || 'NONE'}` };
            case 'EXECUTION_BLOCKED':
                return { logType: 'WARNING', message: `⛔ Execution blocked: ${data.reason}` };
            case 'TRADE_OPENED':
                return { logType: 'TRADE', message: `💹 OPENED: ${data.token} (${data.amount?.toFixed(4)} SOL, fee: ${data.fee})` };
            case 'HOLDING':
                return { logType: 'INFO', message: `⏳ Holding position for ${data.seconds}s...` };
            case 'TRADE_CLOSED':
                const pnlEmoji = data.pnl >= 0 ? '🟢' : '🔴';
                return { logType: 'TRADE', message: `${pnlEmoji} CLOSED: ${data.token} | PnL: ${data.pnl >= 0 ? '+' : ''}${data.pnl?.toFixed(6)} SOL` };
            case 'REPORT':
                setStats(s => ({ ...s, pnl: data.pnlPct, verdict: data.verdict }));
                return { logType: 'PHASE', message: `\n═══ FINAL: ${data.verdict} | PnL: ${data.pnlPct?.toFixed(2)}% | Cycles: ${data.cycles} ═══` };
            case 'FINAL_REPORT':
                return { logType: 'SUCCESS', message: `🏁 ${data.verdictReason}` };
            case 'ERROR':
                return { logType: 'ERROR', message: `❌ ERROR: ${data.message}` };
            default:
                return null;
        }
    };

    const runSimulation = async () => {
        setIsRunning(true);
        setLogs([]);
        setStats({ tokens: 0, cycle: 0, accuracy: 0, pnl: 0, verdict: '' });

        abortRef.current = new AbortController();

        try {
            addLog('INFO', '🔄 Connecting to simulation engine...');

            const response = await fetch('/api/behavioral-trial', {
                signal: abortRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader');

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
                        const event = JSON.parse(line);
                        const formatted = formatEvent(event.type, event.data);
                        if (formatted) {
                            addLog(formatted.logType, formatted.message);
                        }
                    } catch (e) {
                        console.error('Parse error:', e);
                    }
                }
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                addLog('ERROR', `Simulation failed: ${error.message}`);
            }
        } finally {
            setIsRunning(false);
        }
    };

    const stopSimulation = () => {
        abortRef.current?.abort();
        addLog('WARNING', '🛑 Simulation stopped by user');
        setIsRunning(false);
    };

    const getLogColor = (type: LogEntry['type']) => {
        switch (type) {
            case 'PHASE': return 'text-cyan-400 font-bold';
            case 'PREDICTION': return 'text-purple-400';
            case 'SCORE': return 'text-blue-400';
            case 'TRADE': return 'text-yellow-400 font-semibold';
            case 'WARNING': return 'text-orange-400';
            case 'ERROR': return 'text-red-500 font-bold';
            case 'SUCCESS': return 'text-green-400';
            default: return 'text-zinc-300';
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                            10-Pillar Behavioral Trial
                        </h1>
                        <p className="text-zinc-500 mt-1">
                            CHAOS tokens only • Real-time prediction loop • Paper trading
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {!isRunning ? (
                            <button
                                onClick={runSimulation}
                                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                            >
                                ▶ Run Simulation
                            </button>
                        ) : (
                            <button
                                onClick={stopSimulation}
                                className="px-6 py-3 bg-red-600 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                            >
                                ⏹ Stop
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-5 gap-4 mb-6">
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                        <div className="text-zinc-500 text-sm">Tokens</div>
                        <div className="text-2xl font-bold text-cyan-400">{stats.tokens}</div>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                        <div className="text-zinc-500 text-sm">Cycle</div>
                        <div className="text-2xl font-bold text-purple-400">{stats.cycle}</div>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                        <div className="text-zinc-500 text-sm">Accuracy</div>
                        <div className="text-2xl font-bold text-blue-400">{stats.accuracy}%</div>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                        <div className="text-zinc-500 text-sm">PnL</div>
                        <div className={`text-2xl font-bold ${stats.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(2)}%
                        </div>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                        <div className="text-zinc-500 text-sm">Verdict</div>
                        <div className={`text-2xl font-bold ${stats.verdict === 'PASS' ? 'text-green-400' : stats.verdict === 'FAIL' ? 'text-red-400' : 'text-zinc-600'}`}>
                            {stats.verdict || '—'}
                        </div>
                    </div>
                </div>

                {/* Logs Panel */}
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                    <div className="bg-zinc-800/50 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-400">Live Logs</span>
                        {isRunning && (
                            <span className="flex items-center gap-2 text-sm text-green-400">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                Running
                            </span>
                        )}
                    </div>
                    <div className="h-[500px] overflow-y-auto p-4 font-mono text-sm">
                        {logs.length === 0 ? (
                            <div className="text-zinc-600 text-center py-20">
                                Click "Run Simulation" to start the 10-Pillar behavioral trial
                            </div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className={`py-0.5 ${getLogColor(log.type)}`}>
                                    <span className="text-zinc-600 mr-2">[{log.time}]</span>
                                    {log.message}
                                </div>
                            ))
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
                    <span><span className="text-cyan-400">■</span> Phase</span>
                    <span><span className="text-purple-400">■</span> Prediction</span>
                    <span><span className="text-blue-400">■</span> Scoring</span>
                    <span><span className="text-yellow-400">■</span> Trade</span>
                    <span><span className="text-orange-400">■</span> Warning</span>
                    <span><span className="text-green-400">■</span> Success</span>
                    <span><span className="text-red-400">■</span> Error</span>
                </div>
            </div>
        </div>
    );
}
