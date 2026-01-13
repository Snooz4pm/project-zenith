'use client';

import { useState, useEffect, useRef } from 'react';
import { runPortfolioAnalysis, PortfolioAnalysisResult } from '@/app/actions/portfolio-runner';
import { Shield, AlertTriangle, Zap, Terminal, Play, Loader2, StopCircle, Clock, Activity } from 'lucide-react';

// The "Virtual Wallet" of 10 Real Tokens
const VIRTUAL_WALLET = [
    // --- STABLE (Safe Havens) ---
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo', // PYUSD

    // --- MEME (Volatile) ---
    'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYkW2hr', // POPCAT
    'MEW1gQWJ3nEXg2qgPMIZuXaZCKam1oJ55Jk1hJp',       // MEW
    'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82',   // BOME
    '6p6xgHyF54SJsqLvKqM39KG2W5Hk3b7b2h3J8h2J8h2J',  // TRUMP
    'ED5nyyWEzpPPiWimP8vPAz72K2k4kk4k4k4k4k4k4k4k',  // MOODENG
];

const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const POLLING_INTERVAL_MS = 10000; // 10 seconds

export default function PortfolioTestPage() {
    const [running, setRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_MS);
    const [results, setResults] = useState<PortfolioAnalysisResult[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [tick, setTick] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    // Initial log message
    useEffect(() => {
        setLogs(['[System] Dashboard initialized.', '[System] Ready to start 30m physics monitoring session.']);
    }, []);

    const startSession = () => {
        if (running) return;
        setRunning(true);
        setTimeLeft(SESSION_DURATION_MS);
        setLogs(prev => [...prev, `[System] STARTED 30-MINUTE MONITORING SESSION.`]);

        // Timer countdown
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1000) {
                    stopSession();
                    return 0;
                }
                return prev - 1000;
            });
        }, 1000);

        // Immediate first run
        runTick(0);

        // Polling loop
        pollRef.current = setInterval(() => {
            setTick(t => t + 1);
            runTick(tick + 1);
        }, POLLING_INTERVAL_MS);
    };

    const stopSession = () => {
        setRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
        if (pollRef.current) clearInterval(pollRef.current);
        setLogs(prev => [...prev, `[System] SESSION STOPPED via User/Timer.`]);
    };

    const runTick = async (currentTick: number) => {
        // Optimistic log
        // setLogs(prev => [...prev, `[Tick #${currentTick}] Scanning markets...`]);

        try {
            const data = await runPortfolioAnalysis(VIRTUAL_WALLET);
            setResults(prev => {
                // Check for changes to log them
                data.forEach(newItem => {
                    const oldItem = prev.find(p => p.mint === newItem.mint);
                    if (oldItem && oldItem.verdict.action !== newItem.verdict.action) {
                        setLogs(oldLog => [
                            ...oldLog,
                            `[ALERT] ${newItem.symbol} changed: ${oldItem.verdict.action} -> ${newItem.verdict.action} (Risk: ${newItem.metrics.riskLevel})`
                        ]);
                    }
                });
                return data;
            });

            // Only verbose logs on tick 0 or errors
            if (currentTick === 0) {
                setLogs(prev => [...prev, `[System] Initial scan complete. Logic active.`]);
            }

        } catch (error: any) {
            console.error(error);
            setLogs(prev => [...prev, `[Error] Tick failed: ${error.message}`]);
        }
    };

    // Format time mm:ss
    const formatTime = (ms: number) => {
        const totalSec = Math.floor(ms / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-mono">

            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
                        <Activity className="w-8 h-8 text-cyan-400" />
                        PHYSICS MONITOR
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Clock className="w-4 h-4" />
                            SESSION: {formatTime(timeLeft)}
                        </div>
                        {running && (
                            <div className="flex items-center gap-2 text-green-400 text-sm animate-pulse">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                LIVE FEED ACTIVE
                            </div>
                        )}
                    </div>
                </div>

                {!running ? (
                    <button
                        onClick={startSession}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-bold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        START 30m SESSION
                    </button>
                ) : (
                    <button
                        onClick={stopSession}
                        className="flex items-center gap-2 px-8 py-4 bg-red-600/20 border border-red-500/50 text-red-400 rounded-xl font-bold hover:bg-red-600/30 transition-all"
                    >
                        <StopCircle className="w-5 h-5" />
                        STOP MONITORING
                    </button>
                )}
            </div>

            {/* Main Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {VIRTUAL_WALLET.map((mint, idx) => {
                    const result = results.find(r => r.mint === mint);

                    if (!result) {
                        return (
                            <div key={mint} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex items-center justify-center min-h-[200px] opacity-60">
                                {running ? (
                                    <div className="text-center">
                                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-2" />
                                        <div className="text-xs text-cyan-400">Connecting...</div>
                                    </div>
                                ) : (
                                    <div className="text-zinc-600 italic">Waiting to start</div>
                                )}
                            </div>
                        );
                    }

                    const isSafe = result.verdict.isSafe;
                    const borderColor = isSafe
                        ? 'border-green-500/30'
                        : result.verdict.action === 'OBSERVE' ? 'border-yellow-500/30' : 'border-red-500/50';

                    const bgGradient = isSafe
                        ? 'bg-gradient-to-b from-green-900/10 to-transparent'
                        : result.verdict.action === 'OBSERVE' ? 'bg-gradient-to-b from-yellow-900/10 to-transparent' : 'bg-gradient-to-b from-red-900/10 to-transparent';

                    return (
                        <div key={mint} className={`${bgGradient} ${borderColor} border rounded-xl p-6 transition-all duration-500`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold font-sans tracking-tight">{result.symbol}</h3>
                                    <div className="text-[10px] text-zinc-500 font-mono">{mint.slice(0, 8)}...</div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${isSafe ? 'bg-green-500/20 text-green-400' :
                                        result.verdict.action === 'OBSERVE' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {result.verdict.action}
                                </div>
                            </div>

                            {/* Physics Metrics */}
                            <div className="space-y-2 mb-4 text-xs font-mono text-zinc-300">
                                <div className="flex justify-between">
                                    <span className="text-zinc-600">Liquidity</span>
                                    <span>${(result.metrics.liquidityUSD || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-600">Volume (5m)</span>
                                    <span>${(result.metrics.volume5m || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-600">Risk Level</span>
                                    <span className={result.metrics.riskLevel === 'LOW' ? 'text-green-400' : 'text-red-400'}>
                                        {result.metrics.riskLevel}
                                    </span>
                                </div>
                            </div>

                            {/* Verdict Reason */}
                            <div className="text-xs text-zinc-500 border-t border-zinc-800 pt-3 mb-3 h-10 overflow-hidden text-ellipsis">
                                {result.verdict.reason}
                            </div>

                            {/* Exit Plan (If needed) */}
                            {result.exitPlan && (
                                <div className="bg-red-950/30 border border-red-500/20 rounded p-2 text-[10px] animate-pulse">
                                    <div className="flex items-center gap-1 mb-1 text-red-400 font-bold">
                                        <Zap className="w-3 h-3" />
                                        EXIT PLAN FOUND
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Target: {result.exitPlan.targetToken}</span>
                                        <span>ROI: {result.exitPlan.expectedROI.toFixed(1)}%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Terminal Log */}
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-2 mb-2 text-zinc-500 text-xs tracking-widest font-bold">
                    <Terminal className="w-3 h-3" />
                    SYSTEM EVENT STREAM
                </div>
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 h-48 overflow-y-auto font-mono text-xs text-zinc-400 shadow-inner custom-scrollbar">
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-zinc-900/50 pb-1 last:border-0 last:pb-0">
                            <span className="text-cyan-600 mr-2 opacity-50">{new Date().toLocaleTimeString()}</span>
                            {log}
                        </div>
                    ))}
                    <div className="h-4" /> {/* spacer */}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #09090b; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a; 
                    border-radius: 3px;
                }
            `}</style>

        </div>
    );
}
