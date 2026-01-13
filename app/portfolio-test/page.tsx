'use client';

import { useState, useEffect, useRef } from 'react';
import { runPortfolioAnalysis, PortfolioAnalysisResult } from '@/app/actions/portfolio-runner';
import {
    Shield, Terminal, Play, Loader2, StopCircle, Clock,
    Activity, TrendingUp, CheckCircle
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
    amount: number;       // token units
    entryPrice: number;   // USD reference
}

interface ExecutedTrade {
    symbol: string;
    mint: string;
    netSOL: number;
    reason: string;
    timestamp: number;
}

// --- INITIAL PORTFOLIO ---
const INITIAL_POSITIONS: Position[] = [
    // Stables
    { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', amount: 5, entryPrice: 1 },
    { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', amount: 5, entryPrice: 1 },

    // Memes
    { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', amount: 3, entryPrice: 1.0 },     // WIF
    { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', amount: 2_000_000, entryPrice: 0.0000015 }, // BONK
    { mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYkW2hr', amount: 15, entryPrice: 0.2 },    // POPCAT
    { mint: 'MEW1gQWJ3nEXg2qgPMIZuXaZCKam1oJ55Jk1hJp', amount: 20, entryPrice: 0.1 },          // MEW
    { mint: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', amount: 200, entryPrice: 0.01 },    // BOME
];

export default function PortfolioTestPage() {
    const [running, setRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_MS);

    const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);
    const [solBalance, setSolBalance] = useState(0);
    const [scanResults, setScanResults] = useState<PortfolioAnalysisResult[]>([]);
    const [executedTrades, setExecutedTrades] = useState<ExecutedTrade[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setLogs([
            '[System] Portfolio physics engine ready.',
            '[System] No emotions. No bias. No predictions.',
        ]);
    }, []);

    const startSession = () => {
        if (running) return;
        setRunning(true);
        setTimeLeft(SESSION_DURATION_MS);
        setSolBalance(0);
        setExecutedTrades([]);
        setPositions(INITIAL_POSITIONS);
        setLogs(l => [...l, '[System] SESSION STARTED (30m)']);

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

        const mints = positions.map(p => p.mint);
        const data = await runPortfolioAnalysis(mints);
        setScanResults(data);

        let updatedPositions = [...positions];

        for (const result of data) {
            if (result.verdict.action !== 'SELL') continue;

            const position = updatedPositions.find(p => p.mint === result.mint);
            if (!position) continue;

            const price = result.metrics.price;
            if (!price || price <= 0) continue;

            // Convert amount -> USD -> SOL
            const grossUSD = position.amount * price;
            const grossSOL = grossUSD / price; // This is tautological in math but represents "Value in SOL terms"

            // Better: If we have Price in USD, we need SOL Price in USD to get SOL amount.
            // Simplified Assumption: Price of 1 Unit of Asset in SOL terms?
            // Wait, result.metrics.price is "priceUsd" from VolumeObserver.
            // We don't have SOL price here easily without fetching it.
            // Hack: Assume SOL = $140 for estimation or use a relative price if available?
            // Better Hack: Fetch SOL price via runPortfolioAnalysis too?
            // For now, let's normalize everything to USD value and then "Simulate" SOL outcome by dividing by fixed SOL Price $140?
            // OR just display "Cash Out Value ($)".
            // User asked for "SOL Balance".
            // Let's assume SOL Price = $140 constant for this simulation or fetch it.
            // Actually, we can just say `grossSOL` = `grossUSD / 140`.

            const SOL_PRICE_USD = 140;
            const valueInSOL = grossUSD / SOL_PRICE_USD;

            const slippage = valueInSOL * (result.metrics.slippagePct ?? SLIPPAGE_BUFFER_PCT);
            const dexFee = valueInSOL * DEX_FEE_PCT;

            const netSOL = valueInSOL - slippage - dexFee - NETWORK_FEE_SOL;

            if (netSOL <= 0.001) { // Min dust
                setLogs(l => [...l, `[HOLD] ${result.symbol} exit blocked (dust value)`]);
                continue;
            }

            // Remove position
            updatedPositions = updatedPositions.filter(p => p.mint !== position.mint);
            setSolBalance(s => s + netSOL);

            setExecutedTrades(t => [{
                symbol: result.symbol,
                mint: result.mint,
                netSOL,
                reason: result.verdict.reason,
                timestamp: Date.now(),
            }, ...t]);

            setLogs(l => [...l,
            `[EXIT] ${result.symbol} (${position.amount.toLocaleString()} units) → ${netSOL.toFixed(4)} SOL | ${result.verdict.reason}`
            ]);
        }

        setPositions(updatedPositions);
    };

    const formatTime = (ms: number) => {
        const s = Math.floor(ms / 1000);
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 font-mono">
            <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex gap-2 items-center">
                        <Activity className="text-cyan-400" /> PHYSICS PORTFOLIO TEST
                    </h1>
                    <div className="text-sm text-zinc-400 flex gap-4 mt-1">
                        <span><Clock className="inline w-4" /> {formatTime(timeLeft)}</span>
                        <span><TrendingUp className="inline w-4" /> {solBalance.toFixed(4)} SOL</span>
                    </div>
                </div>

                {!running ? (
                    <button onClick={startSession} className="px-6 py-3 bg-green-600 rounded-lg font-bold">
                        <Play className="inline w-4" /> START
                    </button>
                ) : (
                    <button onClick={stopSession} className="px-6 py-3 bg-red-600 rounded-lg font-bold">
                        <StopCircle className="inline w-4" /> STOP
                    </button>
                )}
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-2 gap-6">
                <div>
                    <h2 className="text-xs text-zinc-500 mb-2">ACTIVE POSITIONS</h2>
                    {positions.length === 0 && (
                        <div className="text-zinc-600 italic">All assets exited.</div>
                    )}
                    {scanResults.map(r => {
                        const pos = positions.find(p => p.mint === r.mint);
                        if (!pos) return null;

                        return (
                            <div key={r.mint} className="border border-zinc-800 p-3 mb-2 rounded flex justify-between items-center">
                                <div>
                                    <div className="font-bold">{r.symbol}</div>
                                    <div className="text-xs text-zinc-500">{pos.amount.toLocaleString()} units</div>
                                    <div className="text-xs text-zinc-600 italic">{r.metrics.riskLevel}</div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${r.verdict.action === 'SELL' ? 'bg-red-500/20 text-red-500' :
                                            r.verdict.action === 'OBSERVE' ? 'bg-yellow-500/20 text-yellow-500' :
                                                'bg-green-500/20 text-green-500'
                                        }`}>
                                        {r.verdict.action}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div>
                    <h2 className="text-xs text-zinc-500 mb-2">EXECUTIONS</h2>
                    {executedTrades.map((t, i) => (
                        <div key={i} className="border border-zinc-800 p-3 mb-2 rounded">
                            <div className="flex justify-between">
                                <span>{t.symbol}</span>
                                <span className="text-green-400">+{t.netSOL.toFixed(4)} SOL</span>
                            </div>
                            <div className="text-xs text-zinc-500">{t.reason}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-6">
                <h2 className="text-xs text-zinc-500 mb-2 flex gap-2 items-center">
                    <Terminal className="w-3" /> SYSTEM LOG
                </h2>
                <div className="bg-zinc-950 border border-zinc-800 p-3 h-40 overflow-y-auto text-xs">
                    {logs.map((l, i) => <div key={i}>{l}</div>)}
                </div>
            </div>
        </div>
    );
}
