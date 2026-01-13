'use client';

import { useState, useEffect, useRef } from 'react';
import { runPortfolioAnalysis, PortfolioAnalysisResult } from '@/app/actions/portfolio-runner';
import {
    Shield, Terminal, Play, Loader2, StopCircle, Clock,
    Activity, TrendingUp, CheckCircle, BrainCircuit, RefreshCw
} from 'lucide-react';

const SESSION_DURATION_MS = 30 * 60 * 1000;
const POLLING_INTERVAL_MS = 10_000;

// --- EXECUTION CONSTANTS (REALISTIC) ---
const DEX_FEE_PCT = 0.0025;       // 0.25%
const NETWORK_FEE_SOL = 0.000005; // Solana tx
const SLIPPAGE_BUFFER_PCT = 0.003;

// --- TYPES ---
interface Position {
    mint: string;
    symbol: string;       // Human name for UI fallback
    amount: number;       // token units
    entryPrice: number;   // USD reference
}

interface ExecutedTrade {
    symbol: string;
    mint: string;
    netSOL: number;
    reason: string;
    scenario: string;     // Pathfinding strategy used
    timestamp: number;
}

// --- INITIAL PORTFOLIO (Lobotomy Challenge: $100 Total) ---
const INITIAL_POSITIONS: Position[] = [
    { mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', amount: 0.14, entryPrice: 140 },
    { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', symbol: 'WIF', amount: 8, entryPrice: 2.0 },
    { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', amount: 800_000, entryPrice: 0.00002 },
    { mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYkW2hr', symbol: 'POPCAT', amount: 20, entryPrice: 0.8 },
    { mint: 'MEW1gQWJ3nEXg2qgPMIZuXaZCKam1oJ55Jk1hJp', symbol: 'MEW', amount: 160, entryPrice: 0.1 },
    { mint: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', symbol: 'BOME', amount: 1600, entryPrice: 0.01 },
];

export default function PortfolioTestPage() {
    const [running, setRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_MS);

    const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);
    const [solBalance, setSolBalance] = useState(0);
    const [scanResults, setScanResults] = useState<PortfolioAnalysisResult[]>([]);
    const [executedTrades, setExecutedTrades] = useState<ExecutedTrade[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [isPolling, setIsPolling] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setLogs([
            '[System] Lobotomy Challenge initialized.',
            '[System] Portfolio: $20 SOL + $80 Risk Assets.',
            '[System] Broad Market Scan (1000 Tokens) ready.',
        ]);
    }, []);

    const startSession = () => {
        if (running) return;
        setRunning(true);
        setTimeLeft(SESSION_DURATION_MS);
        setSolBalance(0);
        setExecutedTrades([]);
        setPositions(INITIAL_POSITIONS);
        setScanResults([]);
        setLogs(l => [...l, '[System] SESSION STARTED. Pillars active.']);

        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1000) {
                    stopSession();
                    return 0;
                }
                return t - 1000;
            });
        }, 1000);

        runTick();
        pollRef.current = setInterval(runTick, POLLING_INTERVAL_MS);
    };

    const stopSession = () => {
        setRunning(false);
        timerRef.current && clearInterval(timerRef.current);
        pollRef.current && clearInterval(pollRef.current);
        setLogs(l => [...l, '[System] SESSION ENDED']);
    };

    const runTick = async () => {
        if (positions.length === 0) return;
        setIsPolling(true);
        setLogs(l => [...l, '[Pillars] Scanning 1000 tokens for context...']);

        try {
            const mints = positions.map(p => p.mint);
            const data = await runPortfolioAnalysis(mints);
            setScanResults(data);

            let updatedPositions = [...positions];

            for (const result of data) {
                if (result.verdict.action !== 'SELL' && result.verdict.action !== 'SWAP') continue;
                if (result.symbol === 'SOL') continue;

                const position = updatedPositions.find(p => p.mint === result.mint);
                if (!position) continue;

                const price = result.metrics.price;
                if (!price || price <= 0) continue;

                const grossUSD = position.amount * price;
                const SOL_REF_PRICE = 140;
                const valueInSOL = grossUSD / SOL_REF_PRICE;

                const slippage = valueInSOL * (result.metrics.slippagePct ?? SLIPPAGE_BUFFER_PCT);
                const dexFee = valueInSOL * DEX_FEE_PCT;

                const netSOL = valueInSOL - slippage - dexFee - NETWORK_FEE_SOL;

                if (netSOL <= 0.001) {
                    setLogs(l => [...l, `[HoldSignals] ${result.symbol} blocked (slippage/friction).`]);
                    continue;
                }

                updatedPositions = updatedPositions.filter(p => p.mint !== position.mint);
                setSolBalance(s => s + netSOL);

                const scenarioName = result.exitPlan?.scenarioUsed || 'EMERGENCY_DUMP';

                setExecutedTrades(t => [{
                    symbol: result.symbol,
                    mint: result.mint,
                    netSOL,
                    reason: result.verdict.reason,
                    scenario: scenarioName,
                    timestamp: Date.now(),
                }, ...t]);

                setLogs(l => [...l,
                `[Hands] ${result.symbol} moved via ${scenarioName} → +${netSOL.toFixed(4)} SOL`
                ]);
            }

            setPositions(updatedPositions);
        } catch (err) {
            console.error("Tick failed", err);
            setLogs(l => [...l, '[System] Market access error. Retrying...']);
        } finally {
            setIsPolling(false);
        }
    };

    const formatTime = (ms: number) => {
        const s = Math.floor(ms / 1000);
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6 font-mono">
            <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center bg-black/40 p-4 rounded-xl border border-zinc-900">
                <div>
                    <h1 className="text-2xl font-bold flex gap-3 items-center text-cyan-400">
                        <BrainCircuit className="w-8 h-8" />
                        LOBOTOMY CHALLENGE
                        {isPolling && <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />}
                    </h1>
                    <div className="text-sm text-zinc-500 flex gap-6 mt-2">
                        <span className="flex items-center gap-2"><Clock className="w-4" /> {formatTime(timeLeft)}</span>
                        <span className="flex items-center gap-2 text-green-400"><TrendingUp className="w-4" /> +{solBalance.toFixed(4)} SOL Salvaged</span>
                    </div>
                </div>

                {!running ? (
                    <button onClick={startSession} className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-black rounded-lg font-bold transition-all shadow-lg shadow-cyan-900/20">
                        <Play className="inline w-5 mr-2" /> START TEST
                    </button>
                ) : (
                    <button onClick={stopSession} className="px-8 py-4 bg-red-900/50 text-red-400 hover:bg-red-900/70 rounded-lg font-bold border border-red-800 transition-all">
                        <StopCircle className="inline w-5 mr-2" /> ABORT
                    </button>
                )}
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">

                {/* ACTIVE POSITIONS */}
                <div className="lg:col-span-2 bg-black/20 border border-zinc-900 rounded-xl p-6 overflow-y-auto">
                    <h2 className="text-xs text-zinc-500 font-bold tracking-widest mb-4 flex gap-2 items-center">
                        <Shield className="w-4" /> ACTIVE UNIVERSE ({positions.length} Assets)
                    </h2>

                    {positions.length === 0 && (
                        <div className="text-zinc-700 italic text-center mt-20">All assets liquidated to SOL.</div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {positions.map(pos => {
                            const result = scanResults.find(r => r.mint === pos.mint);

                            // Special styling for SOL
                            if (pos.symbol === 'SOL' || pos.mint === 'So11111111111111111111111111111111111111112') {
                                return (
                                    <div key={pos.mint} className="border border-cyan-900/30 bg-cyan-900/10 p-4 rounded-lg flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-cyan-400">SOL (Fuel)</div>
                                            <div className="text-xs text-cyan-600/70">{pos.amount.toFixed(2)} units</div>
                                        </div>
                                        <div className="text-xs bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded">SAFE</div>
                                    </div>
                                );
                            }

                            if (!result) {
                                return (
                                    <div key={pos.mint} className="border border-zinc-900 bg-zinc-900/20 p-4 rounded-lg flex flex-col justify-between opacity-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-lg text-zinc-400">{pos.symbol}</div>
                                                <div className="text-xs text-zinc-600">{pos.amount.toLocaleString()} units</div>
                                            </div>
                                            <div className="text-[10px] text-zinc-700 animate-pulse">Analyzing...</div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={pos.mint} className={`border p-4 rounded-lg flex flex-col justify-between transition-all ${result.verdict.isSafe ? 'border-zinc-800 bg-zinc-900/30' :
                                        result.verdict.action === 'OBSERVE' ? 'border-yellow-900/30 bg-yellow-900/10' :
                                            'border-red-900/50 bg-red-900/10'
                                    }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-lg">{result.symbol}</div>
                                            <div className="text-xs text-zinc-500">{pos.amount.toLocaleString()} units</div>
                                        </div>
                                        <div className={`text-xs font-bold px-2 py-1 rounded ${result.verdict.action === 'SELL' ? 'bg-red-500/20 text-red-500' :
                                                result.verdict.action === 'OBSERVE' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    'bg-green-500/10 text-zinc-400'
                                            }`}>
                                            {result.verdict.action}
                                        </div>
                                    </div>
                                    <div className="bg-black/30 p-2 rounded text-[10px] text-zinc-400 mt-2 h-10 overflow-hidden">
                                        {result.verdict.reason}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* EXECUTIONS & PATHFINDING */}
                <div className="bg-black/20 border border-zinc-900 rounded-xl p-6 flex flex-col h-full">
                    <h2 className="text-xs text-zinc-500 font-bold tracking-widest mb-4 flex gap-2 items-center">
                        <BrainCircuit className="w-4" /> PATHFINDING LOG
                    </h2>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar text-xs">
                        {executedTrades.length === 0 ? (
                            <div className="text-zinc-800 text-center italic mt-20">No assets moved.</div>
                        ) : (
                            executedTrades.map((t, i) => (
                                <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-3 rounded-lg border-l-2 border-l-cyan-500">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-zinc-300">{t.symbol}</span>
                                        <span className="text-green-400 font-mono">+{t.netSOL.toFixed(3)} SOL</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-2">
                                        <span>via {t.scenario}</span>
                                        <span>{new Date(t.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* SYSTEM LOG */}
            <div className="max-w-7xl mx-auto mt-6">
                <div className="bg-black border border-zinc-900 rounded-xl p-4 h-32 overflow-y-auto text-xs font-mono text-zinc-500 shadow-inner">
                    {logs.map((l, i) => (
                        <div key={i} className="mb-0.5 border-b border-zinc-900/30 pb-0.5 last:border-0 hover:bg-zinc-900/20">
                            <span className="text-cyan-800 mr-2 opacity-50">[{new Date().toLocaleTimeString()}]</span>
                            {l}
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
            `}</style>
        </div>
    );
}
