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
    targetSymbol: string;
    timestamp: number;
}

// --- INITIAL PORTFOLIO (Fair Test: Mint/Amount Only) ---
const INITIAL_POSITIONS: Position[] = [
    { mint: 'So11111111111111111111111111111111111111112', amount: 0.20, entryPriceSOL: 1 },   // SOL
    { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', amount: 3_000_000 },   // BONK
    { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', amount: 60 },   // WIF
    { mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYkW2hr', amount: 180 },   // POPCAT
    { mint: 'MEW1gQWJ3nEXg2qgPMIZuXaZCKam1oJ55Jk1hJp', amount: 25_000 },   // MEW
];

export default function PortfolioTestPage() {
    const [running, setRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_MS);
    const [isPolling, setIsPolling] = useState(false);

    // State
    const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);
    const [availableSol, setAvailableSol] = useState(0.5); // Initial virtual capital (Wallet)
    const [scanResults, setScanResults] = useState<PortfolioAnalysisResult[]>([]);
    const [discoveryGems, setDiscoveryGems] = useState<PortfolioAnalysisResult[]>([]);
    const [executedTrades, setExecutedTrades] = useState<ExecutedTrade[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    // Metrics
    const [solSalvaged, setSolSalvaged] = useState(0);
    const [disciplineMet, setDisciplineMet] = useState(true);
    const [blockedFriction, setBlockedFriction] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const runningRef = useRef(false);
    const isPollingRef = useRef(false);
    const positionsRef = useRef(positions);
    const availableSolRef = useRef(availableSol);

    useEffect(() => {
        setLogs([
            '[FAIR TEST] Zero-Hindsight Environment Ready.',
            '[FAIR TEST] Autonomous Discovery Alpha engaged.',
            '[FAIR TEST] Wallet Capital: 0.50 SOL (Virtual)',
        ]);
    }, []);

    useEffect(() => { positionsRef.current = positions; }, [positions]);
    useEffect(() => { availableSolRef.current = availableSol; }, [availableSol]);

    const startSession = () => {
        if (running) return;
        setRunning(true);
        runningRef.current = true;
        setTimeLeft(SESSION_DURATION_MS);
        setSolSalvaged(0);
        setAvailableSol(0.5);
        setExecutedTrades([]);
        setPositions(INITIAL_POSITIONS);
        setScanResults([]);
        setDiscoveryGems([]);
        setBlockedFriction(0);
        setLogs(l => [...l, '>>> AUTONOMOUS TEST STARTED']);

        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1000) {
                    stopSession();
                    return 0;
                }
                return t - 1000;
            });
        }, 1000);

        const tickLoop = async () => {
            if (!runningRef.current) return;
            await runTick();
            if (runningRef.current) {
                pollRef.current = setTimeout(tickLoop, POLLING_INTERVAL_MS);
            }
        };
        tickLoop();
    };

    const stopSession = () => {
        setRunning(false);
        runningRef.current = false;
        if (timerRef.current) clearInterval(timerRef.current);
        if (pollRef.current) clearTimeout(pollRef.current);
        setLogs(l => [...l, '<<< TEST COMPLETED']);
    };

    const runTick = async () => {
        if (!runningRef.current || isPollingRef.current) return;

        const currentPositions = positionsRef.current;
        const currentCap = availableSolRef.current;

        setIsPolling(true);
        isPollingRef.current = true;

        try {
            const response = await runPortfolioAnalysis(currentPositions);

            if (!response.success) {
                setLogs(l => [...l, `[!!] SERVER ERROR: ${response.error}`]);
                return;
            }

            const results = response.results || [];
            const gems = response.discoveryResults || [];

            setScanResults(results);
            setDiscoveryGems(gems);

            let tempCapital = currentCap;
            const newEntries: Position[] = [];

            // 1. Process Discovery (BUY)
            for (const gem of gems) {
                if (tempCapital >= 0.1 && !currentPositions.some(p => p.mint === gem.mint)) {
                    const entryAmountSOL = 0.1;
                    const tokenPrice = gem.metrics.price;
                    const solPrice = results.find(r => r.symbol === 'SOL')?.metrics.price || 140;

                    newEntries.push({
                        mint: gem.mint,
                        amount: (entryAmountSOL * solPrice) / tokenPrice,
                        entryPriceSOL: tokenPrice / solPrice
                    });

                    tempCapital -= entryAmountSOL;
                    setLogs(l => [...l, `[Discovery] BOUGHT ${gem.symbol} | Cost: 0.10 SOL`]);
                }
            }

            // 2. Process Portfolio (SELL/HOLD)
            setPositions(prev => {
                let updatedPos = [...prev, ...newEntries];
                let solGained = 0;

                for (const result of results) {
                    if (result.verdict.action === 'SELL' || result.verdict.action === 'SWAP') {
                        if (result.exitPlan) {
                            const plan = result.exitPlan;
                            solGained += plan.netSOL;

                            setExecutedTrades(trades => [{
                                symbol: result.symbol,
                                mint: result.mint,
                                grossSOL: plan.grossSOL,
                                netSOL: plan.netSOL,
                                slippage: plan.slippagePct,
                                fees: plan.feesSOL,
                                reason: result.verdict.reason,
                                scenario: plan.scenarioUsed,
                                targetSymbol: plan.targetSymbol,
                                timestamp: Date.now()
                            }, ...trades]);

                            updatedPos = updatedPos.filter(p => p.mint !== result.mint);
                            setLogs(l => [...l, `[Hands] EXITED ${result.symbol} | +${plan.netSOL.toFixed(3)} SOL`]);
                        } else {
                            setBlockedFriction(b => b + 1);
                            setLogs(l => [...l, `[Friction] ${result.symbol} blocked: ${result.frictionReason || 'Unknown'}`]);
                        }
                    }
                }

                setAvailableSol(tempCapital + solGained);
                return updatedPos;
            });

        } catch (err: any) {
            setLogs(l => [...l, `[!!] ERROR: ${err.message}`]);
        } finally {
            setIsPolling(false);
            isPollingRef.current = false;
        }
    };

    const formatTime = (ms: number) => {
        const s = Math.floor(ms / 1000);
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };

    const portfolioValueSOL = positions.reduce((acc, pos) => {
        const res = scanResults.find(r => r.mint === pos.mint);
        if (!res) return acc;
        const solPrice = scanResults.find(r => r.symbol === 'SOL')?.metrics.price || 140;
        return acc + (pos.amount * res.metrics.price) / solPrice;
    }, 0) + availableSol;

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-300 p-8 font-mono selection:bg-cyan-500/30">
            {/* HUD */}
            <div className="max-w-7xl mx-auto mb-10 grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl backdrop-blur-xl">
                <div className="col-span-2">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
                        <Zap className="w-8 h-8 text-cyan-500 fill-cyan-500" />
                        FAIR AUTONOMOUS TEST
                        {isPolling && <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />}
                    </h1>
                    <div className="flex gap-4 mt-3 text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                        <span className="flex items-center gap-2 border-r border-zinc-800 pr-4"><Clock className="w-4" /> {formatTime(timeLeft)}</span>
                        <span className="flex items-center gap-2 border-r border-zinc-800 pr-4">TICK: 10s</span>
                        <span className="flex items-center gap-2 text-cyan-500/80">STATUS: {running ? 'ACTIVE' : 'READY'}</span>
                    </div>
                </div>
                <div className="flex flex-col justify-center items-end col-span-2">
                    {!running ? (
                        <button onClick={startSession} className="px-10 py-4 bg-white text-black font-black rounded-lg hover:brightness-110 shadow-xl shadow-white/5 transition-all">START AUTONOMOUS LOOP</button>
                    ) : (
                        <button onClick={stopSession} className="px-10 py-4 bg-red-950/20 text-red-500 border border-red-900 font-black rounded-lg hover:bg-red-900/20 transition-all">ABORT MISSION</button>
                    )}
                </div>
            </div>

            {/* Metrics */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'TOTAL PORTFOLIO (SOL)', value: portfolioValueSOL.toFixed(3), color: 'text-white' },
                    { label: 'VIRTUAL WALLET', value: `${availableSol.toFixed(3)} SOL`, color: 'text-cyan-400' },
                    { label: 'DISCOVERY GEMS', value: discoveryGems.length, color: 'text-yellow-500' },
                    { label: 'FRICTION BLOCKS', value: blockedFriction, color: 'text-red-500' },
                ].map((m, i) => (
                    <div key={i} className="bg-zinc-900/10 border border-zinc-800/40 p-5 rounded-xl">
                        <div className="text-[10px] text-zinc-500 font-bold mb-1 tracking-widest uppercase">{m.label}</div>
                        <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>
                    </div>
                ))}
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    {/* Active Positions */}
                    <div className="bg-black/40 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="p-6 border-b border-zinc-800/50 bg-zinc-900/10"><h2 className="text-xs font-black text-white tracking-widest flex items-center gap-3"><Shield className="w-4 h-4 text-cyan-500" /> ACTIVE POSITIONS</h2></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[10px] text-zinc-600 font-black uppercase tracking-wider border-b border-zinc-800/30"><tr><th className="p-4">Asset</th><th className="p-4">Price</th><th className="p-4">PnL (SOL)</th><th className="p-4">Decision</th><th className="p-4">Physics Logic</th></tr></thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {positions.map(pos => {
                                        const result = scanResults.find(r => r.mint === pos.mint);
                                        const solPrice = scanResults.find(r => r.symbol === 'SOL')?.metrics.price || 140;
                                        if (!result) return <tr key={pos.mint} className="opacity-20"><td className="p-4 text-xs">...{pos.mint.slice(-4)}</td><td colSpan={4} className="p-4 text-[10px] italic">Waking up Agent...</td></tr>;
                                        const currentValSOL = (pos.amount * result.metrics.price) / solPrice;
                                        const entryValSOL = pos.entryPriceSOL ? (pos.amount * (pos.entryPriceSOL * solPrice)) / solPrice : currentValSOL;
                                        const pnl = currentValSOL - entryValSOL;
                                        return (
                                            <tr key={pos.mint} className={`hover:bg-zinc-800/5 transition-colors ${result.verdict.action !== 'HOLD' ? 'bg-red-500/5' : ''}`}>
                                                <td className="p-4"><div className="font-bold text-sm text-white">{result.symbol}</div><div className="text-[9px] text-zinc-500">{pos.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} units</div></td>
                                                <td className="p-4 text-xs text-zinc-400">${result.metrics.price.toFixed(result.metrics.price > 1 ? 2 : 6)}</td>
                                                <td className={`p-4 text-xs font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(4)} SOL</td>
                                                <td className={`p-4 font-black text-xs uppercase ${result.verdict.action === 'HOLD' ? 'text-zinc-500' : 'text-red-500'}`}>{result.verdict.action}</td>
                                                <td className="p-4 text-[10px] text-zinc-500 max-w-xs">{result.verdict.reason}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Discovery Gems */}
                    <div className="bg-black/40 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="p-6 border-b border-zinc-800/50 bg-cyan-900/10"><h2 className="text-xs font-black text-cyan-400 tracking-widest flex items-center gap-3"><BrainCircuit className="w-4 h-4 text-cyan-500" /> WONDERING (HUNTING GEMS)</h2></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[10px] text-zinc-600 font-black uppercase tracking-wider border-b border-zinc-800/30"><tr><th className="p-4">Asset</th><th className="p-4">Price</th><th className="p-4">Liq (USD)</th><th className="p-4">Target</th><th className="p-4">Physics Logic</th></tr></thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {discoveryGems.map(gem => (
                                        <tr key={gem.mint} className="hover:bg-cyan-500/5 transition-colors border-l-2 border-l-transparent hover:border-l-cyan-500">
                                            <td className="p-4 font-bold text-white text-xs">{gem.symbol}</td>
                                            <td className="p-4 text-xs text-zinc-500">${gem.metrics.price.toFixed(6)}</td>
                                            <td className="p-4 text-xs text-zinc-500 font-bold">${(gem.metrics.liquidityUSD / 1000).toFixed(0)}k</td>
                                            <td className="p-4 font-black text-xs text-cyan-400">BUY</td>
                                            <td className="p-4 text-[10px] italic text-zinc-600">{gem.verdict.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Heartbeat & Logs */}
                <div className="lg:col-span-4 h-full space-y-8">
                    <div className="bg-black/40 border border-zinc-800/50 rounded-2xl flex flex-col backdrop-blur-sm h-[600px] overflow-hidden">
                        <div className="p-6 border-b border-zinc-800/50 bg-zinc-900/10"><h2 className="text-xs font-black text-zinc-400 tracking-widest flex items-center gap-3"><Terminal className="w-4 h-4 text-cyan-500" /> SYSTEM HEARTBEAT</h2></div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-3">
                            {executedTrades.length === 0 ? <div className="text-zinc-800 text-[10px] font-bold text-center mt-20 italic underline decoration-zinc-900">NO EXITS LOGGED</div> :
                                executedTrades.map((t, i) => (
                                    <div key={i} className="p-4 bg-zinc-900/20 border border-zinc-800/50 rounded-xl border-l-4 border-l-cyan-500 group">
                                        <div className="flex justify-between items-start mb-2"><span className="text-sm font-black text-white">{t.symbol}</span><span className="text-xs font-black text-green-400">+{t.netSOL.toFixed(3)} SOL</span></div>
                                        <div className="text-[9px] text-zinc-600 font-bold uppercase mb-2">SLIPPAGE: {t.slippage.toFixed(2)}% | FEE: {t.fees.toFixed(5)}</div>
                                        <div className="pt-2 border-t border-zinc-800/30 text-[9px] text-zinc-500 italic leading-tight">{t.reason}</div>
                                    </div>
                                ))
                            }
                        </div>
                        <div className="h-60 bg-black/60 border-t border-zinc-800/50 p-4 overflow-y-auto font-mono text-[9px] text-zinc-600">
                            {logs.slice().reverse().map((l, i) => (
                                <div key={i} className="mb-1 flex gap-3 text-zinc-500"><span className="text-[8px] opacity-30">[{new Date().toLocaleTimeString([], { hour12: false })}]</span><span className={l.includes('[Discovery]') ? 'text-yellow-400/80' : l.includes('[Hands]') ? 'text-cyan-400/80' : l.includes('[!!]') ? 'text-red-500/80' : ''}>{l}</span></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
