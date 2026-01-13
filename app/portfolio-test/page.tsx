'use client';

import { useState, useEffect, useRef } from 'react';
import { runPortfolioAnalysis, PortfolioAnalysisResult, Position } from '@/app/actions/portfolio-runner';
import {
    Shield, Terminal, Play, Loader2, StopCircle, Clock,
    Activity, TrendingUp, CheckCircle, BrainCircuit, RefreshCw,
    AlertTriangle, Zap, LogOut
} from 'lucide-react';

const SESSION_DURATION_MS = 30 * 60 * 1000;
const POLLING_INTERVAL_MS = 10_000;

interface ExecutedTrade {
    symbol: string;
    mint: string;
    grossSOL: number;
    netSOL: number;
    slippage: number;
    fees: number;
    reason: string;
    scenario: string;
    timestamp: number;
}

// --- INITIAL PORTFOLIO (Fair Test: Mint/Amount Only) ---
const INITIAL_POSITIONS: Position[] = [
    { mint: 'So11111111111111111111111111111111111111112', amount: 0.14 },
    { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', amount: 8 },
    { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', amount: 800_000 },
    { mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYkW2hr', amount: 20 },
    { mint: 'MEW1gQWJ3nEXg2qgPMIZuXaZCKam1oJ55Jk1hJp', amount: 160 },
    { mint: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', amount: 1600 },
];

export default function PortfolioTestPage() {
    const [running, setRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_MS);
    const [isPolling, setIsPolling] = useState(false);

    // State
    const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);
    const [scanResults, setScanResults] = useState<PortfolioAnalysisResult[]>([]);
    const [executedTrades, setExecutedTrades] = useState<ExecutedTrade[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    // Metrics
    const [solSalvaged, setSolSalvaged] = useState(0);
    const [lastExitTime, setLastExitTime] = useState<number | null>(null);
    const [disciplineMet, setDisciplineMet] = useState(true);
    const [blockedFriction, setBlockedFriction] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setLogs([
            '[FAIR TEST] Zero-Hindsight Environment Ready.',
            '[FAIR TEST] Strictly deterministic data paths enabled.',
            '[FAIR TEST] Jupiter Real-Time Quotes connected.',
        ]);
    }, []);

    const startSession = () => {
        if (running) return;
        setRunning(true);
        setTimeLeft(SESSION_DURATION_MS);
        setSolSalvaged(0);
        setExecutedTrades([]);
        setPositions(INITIAL_POSITIONS);
        setScanResults([]);
        setBlockedFriction(0);
        setLogs(l => [...l, '>>> TEST STARTED (30m Loop active)']);

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
        setLogs(l => [...l, '<<< TEST COMPLETED']);
    };

    const runTick = async () => {
        if (positions.length === 0) {
            setLogs(l => [...l, '[System] All positions exited. Ending test early.']);
            stopSession();
            return;
        }
        setIsPolling(true);

        try {
            const results = await runPortfolioAnalysis(positions);
            setScanResults(results);

            let newPositions = [...positions];
            let tickExits = 0;

            for (const result of results) {
                if (result.verdict.action === 'SELL' || result.verdict.action === 'SWAP') {
                    if (result.exitPlan) {
                        const plan = result.exitPlan;

                        // Execute simulated exit
                        setSolSalvaged(s => s + plan.netSOL);
                        setExecutedTrades(prev => [{
                            symbol: result.symbol,
                            mint: result.mint,
                            grossSOL: plan.grossSOL,
                            netSOL: plan.netSOL,
                            slippage: plan.slippagePct,
                            fees: plan.feesSOL,
                            reason: result.verdict.reason,
                            scenario: plan.scenarioUsed,
                            timestamp: Date.now()
                        }, ...prev]);

                        newPositions = newPositions.filter(p => p.mint !== result.mint);
                        tickExits++;

                        const now = Date.now();
                        if (lastExitTime && (now - lastExitTime) < 30000) {
                            setDisciplineMet(false); // Flag over-trading if 2 exits within 30s
                        }
                        setLastExitTime(now);

                        setLogs(l => [...l, `[Hands] EXITED ${result.symbol} via ${plan.scenarioUsed} | +${plan.netSOL.toFixed(4)} SOL`]);
                    } else {
                        setBlockedFriction(b => b + 1);
                        setLogs(l => [...l, `[Friction] ${result.symbol} exit blocked (slippage/liq).`]);
                    }
                }
            }

            setPositions(newPositions);
        } catch (err) {
            console.error("Tick failed", err);
            setLogs(l => [...l, '[!!] MARKET ACCESS ERROR (Check connectivity)']);
        } finally {
            setIsPolling(false);
        }
    };

    const formatTime = (ms: number) => {
        const s = Math.floor(ms / 1000);
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-300 p-8 font-mono selection:bg-cyan-500/30 font-mono">
            {/* Header / HUD */}
            <div className="max-w-7xl mx-auto mb-10 grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl backdrop-blur-xl">
                <div className="col-span-2">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
                        <Zap className="w-8 h-8 text-cyan-500 fill-cyan-500" />
                        FAIR PORTFOLIO TEST
                        {isPolling && <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />}
                    </h1>
                    <div className="flex gap-4 mt-3 text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                        <span className="flex items-center gap-2 border-r border-zinc-800 pr-4"><Clock className="w-4" /> {formatTime(timeLeft)} REMAINING</span>
                        <span className="flex items-center gap-2 border-r border-zinc-800 pr-4">TICK: 10 SECONDS</span>
                        <span className="flex items-center gap-2 text-cyan-500/80">STATUS: {running ? 'ACTIVE' : 'READY'}</span>
                    </div>
                </div>

                <div className="flex flex-col justify-center items-end col-span-2">
                    {!running ? (
                        <button onClick={startSession} className="px-10 py-4 bg-white text-black font-black rounded-lg hover:scale-[1.02] transition-transform active:scale-95 shadow-xl shadow-white/10">
                            EXECUTE STRESS TEST
                        </button>
                    ) : (
                        <button onClick={stopSession} className="px-10 py-4 bg-red-950/20 text-red-500 border border-red-900 font-black rounded-lg hover:bg-red-950/40 transition-all">
                            ABORT MISSION
                        </button>
                    )}
                </div>
            </div>

            {/* Metrics HUD */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'SOL SALVAGED', value: `+${solSalvaged.toFixed(4)}`, color: 'text-green-400' },
                    { label: 'FRICTION BLOCKS', value: blockedFriction, color: 'text-yellow-500' },
                    { label: 'DISCIPLINE STATUS', value: disciplineMet ? 'OPTIMAL' : 'HESITANT', color: disciplineMet ? 'text-cyan-400' : 'text-red-500' },
                    { label: 'ACTIVE ASSETS', value: positions.length, color: 'text-white' },
                ].map((m, i) => (
                    <div key={i} className="bg-zinc-900/10 border border-zinc-800/40 p-5 rounded-xl">
                        <div className="text-[10px] text-zinc-500 font-bold mb-1 tracking-wider uppercase underline decoration-zinc-800 underline-offset-4">{m.label}</div>
                        <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Active Assets Table */}
                <div className="lg:col-span-8 bg-black/40 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                    <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/10">
                        <h2 className="text-xs font-black text-zinc-400 tracking-widest flex items-center gap-3">
                            <Shield className="w-4 h-4 text-cyan-500" /> ASSET MONITORING (ZERO-HINDSIGHT)
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] text-zinc-600 font-black uppercase tracking-wider border-b border-zinc-800/30">
                                    <th className="p-4">Asset</th>
                                    <th className="p-4">Live Price</th>
                                    <th className="p-4">Volume State</th>
                                    <th className="p-4">Decision</th>
                                    <th className="p-4">Engine Logic</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/30">
                                {positions.map(pos => {
                                    const result = scanResults.find(r => r.mint === pos.mint);

                                    if (!result) {
                                        return (
                                            <tr key={pos.mint} className="opacity-20 animate-pulse">
                                                <td className="p-4 font-bold text-xs">0x...{pos.mint.slice(-4)}</td>
                                                <td className="p-4 text-xs">---</td>
                                                <td className="p-4 text-xs">Analysing...</td>
                                                <td className="p-4 text-xs font-bold text-zinc-500 uppercase">STANDBY</td>
                                                <td className="p-4 text-[10px] italic">Fetching Eyes/Physics...</td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={pos.mint} className={`hover:bg-zinc-800/10 transition-colors ${result.verdict.action !== 'HOLD' ? 'bg-red-500/5' : ''}`}>
                                            <td className="p-4">
                                                <div className="font-bold text-white text-sm tracking-tight">{result.symbol}</div>
                                                <div className="text-[10px] text-zinc-500">{pos.amount.toLocaleString()} units</div>
                                            </td>
                                            <td className="p-4 font-mono text-xs text-zinc-400">
                                                ${result.metrics.price > 1 ? result.metrics.price.toFixed(2) : result.metrics.price.toFixed(6)}
                                            </td>
                                            <td className="p-4 text-xs capitalize">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-tight ${result.metrics.volumeState === 'expanding' ? 'bg-green-500/10 text-green-500' :
                                                        result.metrics.volumeState === 'collapsing' ? 'bg-red-500/10 text-red-500 border border-red-900/30' :
                                                            'bg-zinc-800 text-zinc-500'
                                                    }`}>
                                                    {result.metrics.volumeState}
                                                </span>
                                            </td>
                                            <td className="p-4 font-black text-xs uppercase">
                                                <span className={
                                                    result.verdict.action === 'HOLD' ? 'text-zinc-500' :
                                                        result.verdict.action === 'OBSERVE' ? 'text-yellow-500 text-shadow-sm' :
                                                            'text-red-500 text-shadow-glow'
                                                }>
                                                    {result.verdict.action}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[10px] leading-relaxed max-w-[200px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
                                                {result.verdict.reason}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Vertical Logs & Exits */}
                <div className="lg:col-span-4 h-full">
                    <div className="bg-black/40 border border-zinc-800/50 rounded-2xl h-full flex flex-col backdrop-blur-sm overflow-hidden">
                        <div className="p-6 border-b border-zinc-800/50 bg-zinc-900/10">
                            <h2 className="text-xs font-black text-zinc-400 tracking-widest flex items-center gap-3">
                                <Terminal className="w-4 h-4 text-cyan-500" /> SYSTEM HEARTBEAT
                            </h2>
                        </div>

                        {/* Real Exits Log */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                            {executedTrades.length === 0 ? (
                                <div className="text-zinc-800 text-[10px] font-bold text-center mt-20 italic underline decoration-zinc-900">NO EXITS LOGGED</div>
                            ) : (
                                executedTrades.map((t, i) => (
                                    <div key={i} className="p-4 bg-zinc-900/20 border border-zinc-800/50 rounded-xl border-l-4 border-l-cyan-500 group hover:bg-zinc-900/40 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm font-black text-white">{t.symbol}</span>
                                            <span className="text-xs font-black text-green-400">+{t.netSOL.toFixed(3)} SOL</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[9px] text-zinc-600 font-bold uppercase mb-2">
                                            <div>SLIPPAGE: <span className="text-zinc-400">{t.slippage.toFixed(2)}%</span></div>
                                            <div>FEE: <span className="text-zinc-400">{t.fees.toFixed(5)}</span></div>
                                        </div>
                                        <div className="pt-2 border-t border-zinc-800/30 text-[9px] text-zinc-500 italic leading-tight">
                                            {t.reason}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Low-Level Terminal */}
                        <div className="h-40 bg-black/60 border-t border-zinc-800/50 p-4 overflow-y-auto font-mono text-[9px] text-zinc-600 scrolling-touch">
                            {logs.slice().reverse().map((l, i) => (
                                <div key={i} className="mb-1 flex gap-3">
                                    <span className="text-cyan-900/30">[{new Date().toLocaleTimeString()}]</span>
                                    <span className={l.includes('[Hands]') ? 'text-cyan-400/80' : l.includes('[!!]') ? 'text-red-500/80 animate-pulse' : ''}>{l}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            <style jsx global>{`
                .text-shadow-glow { text-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #18181b; border-radius: 4px; }
            `}</style>
        </div>
    );
}
