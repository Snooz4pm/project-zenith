'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { runPortfolioAnalysis, PortfolioAnalysisResult, Position } from '@/app/actions/portfolio-runner';
import {
    Shield, Terminal, Play, Loader2, StopCircle, Clock,
    Activity, TrendingUp, TrendingDown, CheckCircle, BrainCircuit, RefreshCw,
    AlertTriangle, Zap, LogOut, Skull, Target, Flame, Award, BarChart3
} from 'lucide-react';

// ============================================================================
// FAIR SURVIVAL TEST CONFIGURATION
// ============================================================================
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const POLLING_INTERVAL_MS = 10_000;         // 10 second ticks
const INITIAL_CAPITAL_SOL = 0.35;           // ~$50 starting wallet (10 positions @ $5 each)

// Chaos mode settings
const CHAOS_CONFIG = {
    THREAT_PROBABILITY: 0.15,    // 15% chance per tick for a threat event
    RUG_PROBABILITY: 0.05,       // 5% chance a held token rugs
    PUMP_PROBABILITY: 0.10,      // 10% chance a token pumps
    MAX_POSITIONS: 8,            // Max concurrent positions
    MIN_TRADE_SIZE_SOL: 0.05,    // Minimum trade
    MAX_TRADE_SIZE_SOL: 0.20,    // Maximum trade per position
};

// ============================================================================
// TYPES
// ============================================================================
interface ExecutedTrade {
    id: string;
    type: 'BUY' | 'SELL' | 'RUG' | 'PUMP_EXIT';
    symbol: string;
    mint: string;
    amountSOL: number;
    priceAtTime: number;
    pnlSOL: number;
    reason: string;
    timestamp: number;
}

interface ThreatEvent {
    id: string;
    type: 'RUG_PULL' | 'FLASH_CRASH' | 'PUMP' | 'WHALE_DUMP' | 'LIQUIDITY_DRAIN';
    symbol: string;
    mint: string;
    impactPct: number;
    timestamp: number;
    survived: boolean;
}

interface SurvivalMetrics {
    startingCapitalSOL: number;
    currentCapitalSOL: number;
    peakCapitalSOL: number;
    troughCapitalSOL: number;
    totalTradesExecuted: number;
    winningTrades: number;
    losingTrades: number;
    totalPnLSOL: number;
    winRate: number;
    maxDrawdownPct: number;
    threatsSurvived: number;
    threatsEncountered: number;
    rugsPulled: number;
    successfulExits: number;
    averageHoldTimeMs: number;
}

// --- INITIAL PORTFOLIO (10 Solana Memecoins + 0.1 SOL for Fees) ---
const INITIAL_POSITIONS: Position[] = [
    // SOL reserve for transaction fees
    { mint: 'So11111111111111111111111111111111111111112', amount: 0.1, entryPriceSOL: 1, entryTimestamp: Date.now(), state: 'OBSERVING' },

    // 1. BONK - OG memecoin king
    { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', amount: 500_000, entryTimestamp: Date.now(), state: 'OBSERVING' },

    // 2. WIF - Dog meta leader
    { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', amount: 15, entryTimestamp: Date.now(), state: 'OBSERVING' },

    // 3. POPCAT - Cat meta contender
    { mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYkW2hr', amount: 55, entryTimestamp: Date.now(), state: 'OBSERVING' },

    // 4. MEW - Anti-dog cat play
    { mint: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', amount: 5_500, entryTimestamp: Date.now(), state: 'OBSERVING' },

    // 5. GOAT - AI/viral narrative
    { mint: 'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump', amount: 150, entryTimestamp: Date.now(), state: 'OBSERVING' },

    // 6. PNUT - Squirrel tragedy meme
    { mint: '2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump', amount: 70, entryTimestamp: Date.now(), state: 'OBSERVING' },

    // 7. FARTCOIN - Absurd fart meta
    { mint: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump', amount: 15, entryTimestamp: Date.now(), state: 'OBSERVING' },

    // 8. MAGA - Political Trump pump
    { mint: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN', amount: 90, entryTimestamp: Date.now(), state: 'OBSERVING' },

    // 9. BODEN - Biden satire
    { mint: '3psH1Mj1f7yUfaD5gh6Zj7epE8hhrMkMETgv5TshQA4o', amount: 3_500, entryTimestamp: Date.now(), state: 'OBSERVING' },

    // 10. JUP - Jupiter governance (stable anchor)
    { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', amount: 10, entryTimestamp: Date.now(), state: 'OBSERVING' },
];

export default function SurvivalTestPage() {
    // Session state
    const [running, setRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_MS);
    const [isPolling, setIsPolling] = useState(false);
    const [tick, setTick] = useState(0);

    // Portfolio state
    const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);
    const [availableSol, setAvailableSol] = useState(0.1); // 0.1 SOL for fees
    const [scanResults, setScanResults] = useState<PortfolioAnalysisResult[]>([]);
    const [discoveryGems, setDiscoveryGems] = useState<PortfolioAnalysisResult[]>([]);

    // Trade & Event tracking
    const [executedTrades, setExecutedTrades] = useState<ExecutedTrade[]>([]);
    const [threatEvents, setThreatEvents] = useState<ThreatEvent[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    // Metrics
    const [metrics, setMetrics] = useState<SurvivalMetrics>({
        startingCapitalSOL: INITIAL_CAPITAL_SOL,
        currentCapitalSOL: INITIAL_CAPITAL_SOL,
        peakCapitalSOL: INITIAL_CAPITAL_SOL,
        troughCapitalSOL: INITIAL_CAPITAL_SOL,
        totalTradesExecuted: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalPnLSOL: 0,
        winRate: 0,
        maxDrawdownPct: 0,
        threatsSurvived: 0,
        threatsEncountered: 0,
        rugsPulled: 0,
        successfulExits: 0,
        averageHoldTimeMs: 0,
    });

    // PnL history for chart
    const [pnlHistory, setPnlHistory] = useState<{ tick: number; value: number }[]>([{ tick: 0, value: INITIAL_CAPITAL_SOL }]);

    // Refs
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const runningRef = useRef(false);
    const isPollingRef = useRef(false);
    const positionsRef = useRef(positions);
    const availableSolRef = useRef(availableSol);
    const metricsRef = useRef(metrics);

    useEffect(() => {
        setLogs([
            '[SURVIVAL TEST] === CHAOS MODE INITIALIZED ===',
            '[SURVIVAL TEST] Exposure: Real market chaos enabled',
            '[SURVIVAL TEST] Threats: Rug pulls, flash crashes, whale dumps',
            `[SURVIVAL TEST] Starting Capital: ${INITIAL_CAPITAL_SOL.toFixed(2)} SOL`,
            '[SURVIVAL TEST] Objective: SURVIVE.',
        ]);
    }, []);

    useEffect(() => { positionsRef.current = positions; }, [positions]);
    useEffect(() => { availableSolRef.current = availableSol; }, [availableSol]);
    useEffect(() => { metricsRef.current = metrics; }, [metrics]);

    const addLog = useCallback((message: string) => {
        setLogs(l => [...l.slice(-100), message]);
    }, []);

    const generateId = () => Math.random().toString(36).substring(2, 9);

    // ========================================================================
    // CHAOS ENGINE: Generate random market threats
    // ========================================================================
    const simulateThreat = useCallback((currentPositions: Position[], results: PortfolioAnalysisResult[]): ThreatEvent | null => {
        if (Math.random() > CHAOS_CONFIG.THREAT_PROBABILITY) return null;
        if (currentPositions.length <= 1) return null; // Need positions to threaten

        // Pick a random held token (not SOL)
        const heldTokens = currentPositions.filter(p => p.mint !== 'So11111111111111111111111111111111111111112');
        if (heldTokens.length === 0) return null;

        const victim = heldTokens[Math.floor(Math.random() * heldTokens.length)];
        const result = results.find(r => r.mint === victim.mint);
        const symbol = result?.symbol || victim.mint.slice(0, 6);

        const threatTypes: ThreatEvent['type'][] = ['RUG_PULL', 'FLASH_CRASH', 'WHALE_DUMP', 'LIQUIDITY_DRAIN'];
        const type = threatTypes[Math.floor(Math.random() * threatTypes.length)];

        let impactPct = 0;
        switch (type) {
            case 'RUG_PULL': impactPct = -80 - Math.random() * 15; break;
            case 'FLASH_CRASH': impactPct = -30 - Math.random() * 30; break;
            case 'WHALE_DUMP': impactPct = -20 - Math.random() * 25; break;
            case 'LIQUIDITY_DRAIN': impactPct = -50 - Math.random() * 30; break;
        }

        return {
            id: generateId(),
            type,
            symbol,
            mint: victim.mint,
            impactPct,
            timestamp: Date.now(),
            survived: false, // Will be updated based on agent response
        };
    }, []);

    // ========================================================================
    // SESSION CONTROL
    // ========================================================================
    const startSession = () => {
        if (running) return;
        setRunning(true);
        runningRef.current = true;
        setTimeLeft(SESSION_DURATION_MS);
        setTick(0);

        // Reset everything
        setPositions(INITIAL_POSITIONS);
        setAvailableSol(INITIAL_CAPITAL_SOL - 0.30);
        setScanResults([]);
        setDiscoveryGems([]);
        setExecutedTrades([]);
        setThreatEvents([]);
        setPnlHistory([{ tick: 0, value: INITIAL_CAPITAL_SOL }]);
        setMetrics({
            startingCapitalSOL: INITIAL_CAPITAL_SOL,
            currentCapitalSOL: INITIAL_CAPITAL_SOL,
            peakCapitalSOL: INITIAL_CAPITAL_SOL,
            troughCapitalSOL: INITIAL_CAPITAL_SOL,
            totalTradesExecuted: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalPnLSOL: 0,
            winRate: 0,
            maxDrawdownPct: 0,
            threatsSurvived: 0,
            threatsEncountered: 0,
            rugsPulled: 0,
            successfulExits: 0,
            averageHoldTimeMs: 0,
        });

        addLog('>>> SURVIVAL TEST STARTED <<<');
        addLog('[CHAOS] Agent exposed to real market conditions...');

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

        const finalMetrics = metricsRef.current;
        addLog('<<< SURVIVAL TEST COMPLETED >>>');
        addLog(`[RESULT] Final Capital: ${finalMetrics.currentCapitalSOL.toFixed(4)} SOL`);
        addLog(`[RESULT] Total PnL: ${finalMetrics.totalPnLSOL >= 0 ? '+' : ''}${finalMetrics.totalPnLSOL.toFixed(4)} SOL`);
        addLog(`[RESULT] Win Rate: ${(finalMetrics.winRate * 100).toFixed(1)}%`);
        addLog(`[RESULT] Max Drawdown: ${finalMetrics.maxDrawdownPct.toFixed(1)}%`);
        addLog(`[RESULT] Threats Survived: ${finalMetrics.threatsSurvived}/${finalMetrics.threatsEncountered}`);
    };

    // ========================================================================
    // MAIN TICK LOOP
    // ========================================================================
    const runTick = async () => {
        if (!runningRef.current || isPollingRef.current) return;

        const currentPositions = positionsRef.current;
        const currentCap = availableSolRef.current;
        const currentMetrics = metricsRef.current;

        setIsPolling(true);
        isPollingRef.current = true;
        setTick(t => t + 1);

        try {
            // 1. Fetch market data & physics analysis
            const response = await runPortfolioAnalysis(currentPositions);

            if (!response.success) {
                addLog(`[!!] SERVER ERROR: ${response.error}`);
                return;
            }

            const results = response.results || [];
            const gems = response.discoveryResults || [];

            setScanResults(results);
            setDiscoveryGems(gems);

            // ============================================================================
            // FAIR TEST: Initialize entry prices from FIRST observed market price
            // This ensures zero-hindsight PnL tracking
            // ============================================================================
            const solPrice = results.find(r => r.symbol === 'SOL')?.metrics.price || 140;

            setPositions(prevPos => {
                let updated = false;
                const newPos = prevPos.map(pos => {
                    const marketData = results.find(r => r.mint === pos.mint);
                    if (marketData && pos.entryPriceSOL === undefined) {
                        // First observation - capture live price as entry (FAIR TEST)
                        updated = true;
                        const priceInSOL = marketData.metrics.price / solPrice;
                        addLog(`[FAIR] ${marketData.symbol} entry price set: ${priceInSOL.toFixed(8)} SOL`);
                        return {
                            ...pos,
                            entryPriceSOL: priceInSOL,
                            entryTimestamp: pos.entryTimestamp || Date.now()
                        };
                    }
                    return pos;
                });
                return updated ? newPos : prevPos;
            });

            // 2. CHAOS: Simulate market threats
            const threat = simulateThreat(currentPositions, results);
            if (threat) {
                setThreatEvents(prev => [threat, ...prev]);
                addLog(`[⚠️ THREAT] ${threat.type}: ${threat.symbol} | Impact: ${threat.impactPct.toFixed(1)}%`);

                // Update metrics
                setMetrics(m => ({
                    ...m,
                    threatsEncountered: m.threatsEncountered + 1,
                    rugsPulled: threat.type === 'RUG_PULL' ? m.rugsPulled + 1 : m.rugsPulled,
                }));
            }

            // 3. Process Agent Decisions
            let tempCapital = currentCap;
            let tradesThisTick: ExecutedTrade[] = [];
            let newPositions = [...currentPositions];
            let wins = 0;
            let losses = 0;
            let totalPnL = 0;

            // 3a. Handle SELL/EXIT decisions from physics engine
            for (const result of results) {
                if (result.verdict.action === 'SELL' || result.verdict.action === 'SWAP') {
                    const pos = newPositions.find(p => p.mint === result.mint);
                    if (pos && result.exitPlan) {
                        const plan = result.exitPlan;
                        const entryValue = pos.entryPriceSOL ? pos.amount * pos.entryPriceSOL : 0;
                        const exitValue = plan.netSOL;
                        const pnl = exitValue - entryValue;

                        // Apply threat damage if applicable
                        let finalExitValue = exitValue;
                        if (threat && threat.mint === result.mint) {
                            finalExitValue = exitValue * (1 + threat.impactPct / 100);
                            threat.survived = finalExitValue > 0;
                            addLog(`[SURVIVAL] ${threat.survived ? '✓' : '✗'} Agent ${threat.survived ? 'escaped' : 'caught'} ${threat.type}`);

                            if (threat.survived) {
                                setMetrics(m => ({ ...m, threatsSurvived: m.threatsSurvived + 1 }));
                            }
                        }

                        tempCapital += finalExitValue;
                        newPositions = newPositions.filter(p => p.mint !== result.mint);

                        const trade: ExecutedTrade = {
                            id: generateId(),
                            type: 'SELL',
                            symbol: result.symbol,
                            mint: result.mint,
                            amountSOL: finalExitValue,
                            priceAtTime: result.metrics.price,
                            pnlSOL: pnl,
                            reason: result.verdict.reason,
                            timestamp: Date.now(),
                        };
                        tradesThisTick.push(trade);
                        totalPnL += pnl;

                        if (pnl >= 0) wins++;
                        else losses++;

                        addLog(`[EXIT] ${result.symbol} | ${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)} SOL | ${result.verdict.reason}`);
                    }
                }
            }

            // 3b. Handle BUY decisions (discovery gems)
            const currentHeldCount = newPositions.filter(p => p.mint !== 'So11111111111111111111111111111111111111112').length;

            for (const gem of gems) {
                if (currentHeldCount >= CHAOS_CONFIG.MAX_POSITIONS) break;
                if (tempCapital < CHAOS_CONFIG.MIN_TRADE_SIZE_SOL) break;
                if (newPositions.some(p => p.mint === gem.mint)) continue;

                const tradeSize = Math.min(
                    CHAOS_CONFIG.MAX_TRADE_SIZE_SOL,
                    Math.max(CHAOS_CONFIG.MIN_TRADE_SIZE_SOL, tempCapital * 0.15)
                );

                if (tempCapital >= tradeSize) {
                    const solPrice = results.find(r => r.symbol === 'SOL')?.metrics.price || 140;
                    const tokenPrice = gem.metrics.price;
                    const tokenAmount = (tradeSize * solPrice) / tokenPrice;

                    newPositions.push({
                        mint: gem.mint,
                        amount: tokenAmount,
                        entryPriceSOL: tokenPrice / solPrice,
                    });

                    tempCapital -= tradeSize;

                    const trade: ExecutedTrade = {
                        id: generateId(),
                        type: 'BUY',
                        symbol: gem.symbol,
                        mint: gem.mint,
                        amountSOL: tradeSize,
                        priceAtTime: tokenPrice,
                        pnlSOL: 0, // Unknown until exit
                        reason: gem.verdict.reason,
                        timestamp: Date.now(),
                    };
                    tradesThisTick.push(trade);

                    addLog(`[DISCOVERY] BOUGHT ${gem.symbol} | ${tradeSize.toFixed(4)} SOL | ${gem.verdict.reason}`);
                }
            }

            // 4. Update State
            setPositions(newPositions);
            setAvailableSol(tempCapital);
            setExecutedTrades(prev => [...tradesThisTick, ...prev]);

            // 5. Calculate portfolio value
            const portfolioValue = newPositions.reduce((acc, pos) => {
                const res = results.find(r => r.mint === pos.mint);
                if (!res) return acc;
                const solPrice = results.find(r => r.symbol === 'SOL')?.metrics.price || 140;
                return acc + (pos.amount * res.metrics.price) / solPrice;
            }, 0) + tempCapital;

            // 6. Update Metrics
            setMetrics(m => {
                const newTotalTrades = m.totalTradesExecuted + tradesThisTick.length;
                const newWins = m.winningTrades + wins;
                const newLosses = m.losingTrades + losses;
                const newTotalPnL = m.totalPnLSOL + totalPnL;
                const newPeak = Math.max(m.peakCapitalSOL, portfolioValue);
                const newTrough = Math.min(m.troughCapitalSOL, portfolioValue);
                const drawdown = newPeak > 0 ? ((newPeak - portfolioValue) / newPeak) * 100 : 0;

                return {
                    ...m,
                    currentCapitalSOL: portfolioValue,
                    peakCapitalSOL: newPeak,
                    troughCapitalSOL: newTrough,
                    totalTradesExecuted: newTotalTrades,
                    winningTrades: newWins,
                    losingTrades: newLosses,
                    totalPnLSOL: newTotalPnL,
                    winRate: newTotalTrades > 0 ? newWins / (newWins + newLosses) : 0,
                    maxDrawdownPct: Math.max(m.maxDrawdownPct, drawdown),
                    successfulExits: m.successfulExits + wins,
                };
            });

            // 7. Update PnL chart
            setPnlHistory(prev => [...prev, { tick: prev.length, value: portfolioValue }]);

        } catch (err: any) {
            addLog(`[!!] ERROR: ${err.message}`);
        } finally {
            setIsPolling(false);
            isPollingRef.current = false;
        }
    };

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================
    const formatTime = (ms: number) => {
        const s = Math.floor(ms / 1000);
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };

    const getPnLColor = (value: number) => value >= 0 ? 'text-green-400' : 'text-red-400';
    const getWinRateColor = (rate: number) => rate >= 0.6 ? 'text-green-400' : rate >= 0.4 ? 'text-yellow-400' : 'text-red-400';

    // Calculate current portfolio value
    const portfolioValueSOL = positions.reduce((acc, pos) => {
        const res = scanResults.find(r => r.mint === pos.mint);
        if (!res) return acc;
        const solPrice = scanResults.find(r => r.symbol === 'SOL')?.metrics.price || 140;
        return acc + (pos.amount * res.metrics.price) / solPrice;
    }, 0) + availableSol;

    const totalPnL = portfolioValueSOL - INITIAL_CAPITAL_SOL;
    const pnlPct = (totalPnL / INITIAL_CAPITAL_SOL) * 100;

    // ========================================================================
    // RENDER
    // ========================================================================
    return (
        <div className="min-h-screen bg-[#030303] text-zinc-300 p-4 md:p-8 font-mono selection:bg-red-500/30">
            {/* HEADER */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-red-950/20 via-zinc-900/40 to-red-950/20 border border-red-900/30 rounded-2xl backdrop-blur-xl">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-4">
                            <Skull className="w-8 h-8 text-red-500" />
                            SURVIVAL TEST
                            <span className="text-xs font-bold px-3 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">CHAOS MODE</span>
                            {isPolling && <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />}
                        </h1>
                        <div className="flex gap-4 mt-3 text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                            <span className="flex items-center gap-2"><Clock className="w-4" /> {formatTime(timeLeft)}</span>
                            <span className="flex items-center gap-2">TICK: {tick}</span>
                            <span className={`flex items-center gap-2 ${running ? 'text-red-500' : 'text-zinc-600'}`}>
                                {running ? '⚡ LIVE' : '● READY'}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {!running ? (
                            <button onClick={startSession} className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-black rounded-xl hover:brightness-110 shadow-xl shadow-red-900/30 transition-all flex items-center gap-2">
                                <Flame className="w-5 h-5" /> ENTER THE CHAOS
                            </button>
                        ) : (
                            <button onClick={stopSession} className="px-8 py-4 bg-zinc-900 text-red-500 border border-red-900/50 font-black rounded-xl hover:bg-red-900/20 transition-all flex items-center gap-2">
                                <StopCircle className="w-5 h-5" /> ABORT
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* SURVIVAL METRICS DASHBOARD */}
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                {/* Capital */}
                <div className="bg-zinc-900/30 border border-zinc-800/40 p-4 rounded-xl col-span-2">
                    <div className="text-[9px] text-zinc-600 font-bold mb-1 tracking-widest uppercase">PORTFOLIO VALUE</div>
                    <div className="text-3xl font-black text-white">{portfolioValueSOL.toFixed(4)} <span className="text-zinc-500 text-sm">SOL</span></div>
                    <div className={`text-sm font-bold ${getPnLColor(totalPnL)}`}>
                        {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(4)} SOL ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
                    </div>
                </div>

                {/* Win Rate */}
                <div className="bg-zinc-900/30 border border-zinc-800/40 p-4 rounded-xl">
                    <div className="text-[9px] text-zinc-600 font-bold mb-1 tracking-widest uppercase flex items-center gap-1"><Target className="w-3 h-3" /> WIN RATE</div>
                    <div className={`text-2xl font-black ${getWinRateColor(metrics.winRate)}`}>{(metrics.winRate * 100).toFixed(0)}%</div>
                    <div className="text-[10px] text-zinc-500">{metrics.winningTrades}W / {metrics.losingTrades}L</div>
                </div>

                {/* Total Trades */}
                <div className="bg-zinc-900/30 border border-zinc-800/40 p-4 rounded-xl">
                    <div className="text-[9px] text-zinc-600 font-bold mb-1 tracking-widest uppercase flex items-center gap-1"><Activity className="w-3 h-3" /> TRADES</div>
                    <div className="text-2xl font-black text-white">{metrics.totalTradesExecuted}</div>
                    <div className="text-[10px] text-zinc-500">Executed</div>
                </div>

                {/* Max Drawdown */}
                <div className="bg-zinc-900/30 border border-red-900/30 p-4 rounded-xl">
                    <div className="text-[9px] text-zinc-600 font-bold mb-1 tracking-widest uppercase flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-500" /> DRAWDOWN</div>
                    <div className="text-2xl font-black text-red-400">-{metrics.maxDrawdownPct.toFixed(1)}%</div>
                    <div className="text-[10px] text-zinc-500">Peak to Trough</div>
                </div>

                {/* Threats */}
                <div className="bg-zinc-900/30 border border-orange-900/30 p-4 rounded-xl">
                    <div className="text-[9px] text-zinc-600 font-bold mb-1 tracking-widest uppercase flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-orange-500" /> THREATS</div>
                    <div className="text-2xl font-black text-orange-400">{metrics.threatsSurvived}/{metrics.threatsEncountered}</div>
                    <div className="text-[10px] text-zinc-500">Survived</div>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Positions & Gems */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Active Positions */}
                    <div className="bg-black/40 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/10 flex items-center justify-between">
                            <h2 className="text-xs font-black text-white tracking-widest flex items-center gap-3">
                                <Shield className="w-4 h-4 text-cyan-500" /> ACTIVE POSITIONS ({positions.length})
                            </h2>
                            <span className="text-[9px] text-zinc-500">Real-time exposure</span>
                        </div>
                        <div className="overflow-x-auto max-h-64">
                            <table className="w-full text-left">
                                <thead className="text-[9px] text-zinc-600 font-black uppercase tracking-wider border-b border-zinc-800/30 sticky top-0 bg-zinc-900/80">
                                    <tr><th className="p-3">Asset</th><th className="p-3">Amount</th><th className="p-3">Value (SOL)</th><th className="p-3">Decision</th></tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {positions.map(pos => {
                                        const result = scanResults.find(r => r.mint === pos.mint);
                                        const solPrice = scanResults.find(r => r.symbol === 'SOL')?.metrics.price || 140;
                                        const valueSOL = result ? (pos.amount * result.metrics.price) / solPrice : 0;
                                        const isSOL = pos.mint === 'So11111111111111111111111111111111111111112';

                                        return (
                                            <tr key={pos.mint} className="hover:bg-zinc-800/10 transition-colors">
                                                <td className="p-3">
                                                    <div className="font-bold text-sm text-white">{result?.symbol || (isSOL ? 'SOL' : pos.mint.slice(0, 6))}</div>
                                                    <div className="text-[8px] text-zinc-600">{pos.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                                </td>
                                                <td className="p-3 text-xs text-zinc-400">{pos.amount.toFixed(4)}</td>
                                                <td className="p-3 text-xs font-bold text-cyan-400">{valueSOL.toFixed(4)}</td>
                                                <td className="p-3">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${result?.verdict.action === 'HOLD' ? 'bg-green-900/20 text-green-500' :
                                                        result?.verdict.action === 'SELL' ? 'bg-red-900/20 text-red-500' :
                                                            'bg-zinc-800 text-zinc-500'
                                                        }`}>
                                                        {result?.verdict.action || 'LOADING'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Discovery Gems */}
                    <div className="bg-black/40 border border-cyan-900/30 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="p-4 border-b border-zinc-800/50 bg-cyan-900/10 flex items-center justify-between">
                            <h2 className="text-xs font-black text-cyan-400 tracking-widest flex items-center gap-3">
                                <BrainCircuit className="w-4 h-4 text-cyan-500" /> WONDERING (HUNTING GEMS)
                            </h2>
                            <span className="text-[9px] text-cyan-600">{discoveryGems.length} opportunities</span>
                        </div>
                        <div className="overflow-x-auto max-h-48">
                            <table className="w-full text-left">
                                <thead className="text-[9px] text-zinc-600 font-black uppercase tracking-wider border-b border-zinc-800/30 sticky top-0 bg-zinc-900/80">
                                    <tr><th className="p-3">Asset</th><th className="p-3">Price</th><th className="p-3">Liq (USD)</th><th className="p-3">Signal</th></tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {discoveryGems.length === 0 ? (
                                        <tr><td colSpan={4} className="p-6 text-center text-zinc-700 italic">Agent scanning for opportunities...</td></tr>
                                    ) : discoveryGems.map(gem => (
                                        <tr key={gem.mint} className="hover:bg-cyan-500/5 transition-colors border-l-2 border-l-transparent hover:border-l-cyan-500">
                                            <td className="p-3 font-bold text-white text-xs">{gem.symbol}</td>
                                            <td className="p-3 text-xs text-zinc-500">${gem.metrics.price.toFixed(6)}</td>
                                            <td className="p-3 text-xs text-zinc-500 font-bold">${(gem.metrics.liquidityUSD / 1000).toFixed(0)}k</td>
                                            <td className="p-3">
                                                <span className="text-[10px] font-black text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded">BUY</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Threat Events */}
                    <div className="bg-black/40 border border-red-900/30 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="p-4 border-b border-zinc-800/50 bg-red-900/10 flex items-center justify-between">
                            <h2 className="text-xs font-black text-red-400 tracking-widest flex items-center gap-3">
                                <Skull className="w-4 h-4 text-red-500" /> THREAT EVENTS
                            </h2>
                            <span className="text-[9px] text-red-600">{threatEvents.length} encountered</span>
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                            {threatEvents.length === 0 ? (
                                <div className="p-6 text-center text-zinc-700 italic">No threats... yet.</div>
                            ) : (
                                <div className="p-2 space-y-2">
                                    {threatEvents.slice(0, 10).map(threat => (
                                        <div key={threat.id} className={`p-3 rounded-lg border ${threat.survived ? 'bg-green-900/10 border-green-900/30' : 'bg-red-900/10 border-red-900/30'}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-xs text-white">{threat.type.replace('_', ' ')}</span>
                                                <span className={`text-[10px] font-black ${threat.survived ? 'text-green-400' : 'text-red-400'}`}>
                                                    {threat.survived ? '✓ SURVIVED' : '✗ CAUGHT'}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-zinc-500 mt-1">{threat.symbol} | Impact: {threat.impactPct.toFixed(1)}%</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Trades & Logs */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Trade History */}
                    <div className="bg-black/40 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/10">
                            <h2 className="text-xs font-black text-white tracking-widest flex items-center gap-3">
                                <BarChart3 className="w-4 h-4 text-cyan-500" /> TRADE HISTORY
                            </h2>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                            {executedTrades.length === 0 ? (
                                <div className="p-6 text-center text-zinc-700 italic">No trades executed</div>
                            ) : executedTrades.slice(0, 15).map(trade => (
                                <div key={trade.id} className={`p-3 rounded-lg border ${trade.type === 'BUY' ? 'bg-cyan-900/10 border-cyan-900/30' : 'bg-zinc-900/20 border-zinc-800/30'}`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${trade.type === 'BUY' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-700 text-zinc-300'
                                                }`}>{trade.type}</span>
                                            <span className="font-bold text-sm text-white">{trade.symbol}</span>
                                        </div>
                                        <span className={`text-xs font-bold ${getPnLColor(trade.pnlSOL)}`}>
                                            {trade.pnlSOL !== 0 && (trade.pnlSOL >= 0 ? '+' : '')}{trade.pnlSOL.toFixed(4)} SOL
                                        </span>
                                    </div>
                                    <div className="text-[9px] text-zinc-600 mt-1 truncate">{trade.reason}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* System Logs */}
                    <div className="bg-black/60 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm h-80">
                        <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/10 flex justify-between items-center">
                            <h2 className="text-xs font-black text-zinc-400 tracking-widest flex items-center gap-3">
                                <Terminal className="w-4 h-4 text-cyan-500" /> SYSTEM HEARTBEAT
                            </h2>
                            <button
                                onClick={() => {
                                    const logText = logs.join('\n');
                                    navigator.clipboard.writeText(logText);
                                    addLog('[SYSTEM] Log copied to clipboard');
                                }}
                                className="text-[9px] text-cyan-500 hover:text-cyan-400 border border-cyan-800 px-2 py-1 rounded hover:bg-cyan-900/20 transition-all"
                            >
                                📋 COPY LOG
                            </button>
                        </div>
                        <div className="h-[calc(100%-52px)] overflow-y-auto p-3 font-mono text-[9px] space-y-1">
                            {logs.slice().reverse().map((l, i) => (
                                <div key={i} className={`flex gap-2 ${l.includes('[DISCOVERY]') ? 'text-cyan-400/80' :
                                    l.includes('[EXIT]') ? 'text-green-400/80' :
                                        l.includes('[!!]') || l.includes('[THREAT]') ? 'text-red-400/80' :
                                            l.includes('[SURVIVAL]') ? 'text-yellow-400/80' :
                                                l.includes('[RESULT]') ? 'text-white' :
                                                    'text-zinc-500'
                                    }`}>
                                    <span className="text-zinc-700">{new Date().toLocaleTimeString([], { hour12: false })}</span>
                                    <span>{l}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
