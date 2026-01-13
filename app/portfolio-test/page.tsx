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

const INITIAL_PORTFOLIO: Record<string, number> = {
    // mint -> USD allocation
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 5,   // USDC
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 5,   // USDT
    EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm: 3,   // WIF
    DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: 3,   // BONK
    ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82: 3,
};

interface ExecutedTrade {
    symbol: string;
    mint: string;
    netSOL: number;
    reason: string;
    timestamp: number;
}

export default function PortfolioTestPage() {
    const [running, setRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_MS);

    const [portfolio, setPortfolio] = useState(INITIAL_PORTFOLIO);
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
        setPortfolio(INITIAL_PORTFOLIO);
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
        const mints = Object.keys(portfolio);
        if (!mints.length) return;

        const data = await runPortfolioAnalysis(mints);
        setScanResults(data);

        const updatedPortfolio = { ...portfolio };

        for (const result of data) {
            if (result.verdict.action !== 'SELL') continue;

            const usdValue = portfolio[result.mint];
            if (!usdValue) continue;

            const price = result.metrics.price;
            const grossSOL = usdValue / price;

            const slippage = grossSOL * (result.metrics.slippagePct ?? SLIPPAGE_BUFFER_PCT);
            const dexFee = grossSOL * DEX_FEE_PCT;

            const netSOL = grossSOL - slippage - dexFee - NETWORK_FEE_SOL;

            if (netSOL <= 0) {
                setLogs(l => [...l, `[HOLD] ${result.symbol} exit blocked (fees > value)`]);
                continue;
            }

            delete updatedPortfolio[result.mint];
            setSolBalance(s => s + netSOL);

            setExecutedTrades(t => [{
                symbol: result.symbol,
                mint: result.mint,
                netSOL,
                reason: result.verdict.reason,
                timestamp: Date.now(),
            }, ...t]);

            setLogs(l => [...l,
            `[EXIT] ${result.symbol} → ${netSOL.toFixed(4)} SOL | ${result.verdict.reason}`
            ]);
        }

        setPortfolio(updatedPortfolio);
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
                    {Object.keys(portfolio).length === 0 && (
                        <div className="text-zinc-600 italic">All assets exited.</div>
                    )}
                    {scanResults.map(r => (
                        <div key={r.mint} className="border border-zinc-800 p-3 mb-2 rounded">
                            <div className="flex justify-between">
                                <span className="font-bold">{r.symbol}</span>
                                <span className="text-xs">{r.verdict.action}</span>
                            </div>
                            <div className="text-xs text-zinc-500">{r.verdict.reason}</div>
                        </div>
                    ))}
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
