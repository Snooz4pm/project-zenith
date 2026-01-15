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
const INITIAL_CAPITAL_SOL = 0.71;           // ~$100 starting wallet

// Chaos mode settings: RUTHLESS EDITION
const CHAOS_CONFIG = {
    THREAT_PROBABILITY: 0.40,    // 40% chance per tick for a threat event (Aggressive)
    RUG_PROBABILITY: 0.15,       // 15% chance a held token rugs (Lethal)
    PUMP_PROBABILITY: 0.05,      // 5% chance a token pumps
    MAX_POSITIONS: 10,           // More targets
    MIN_TRADE_SIZE_SOL: 0.05,
    MAX_TRADE_SIZE_SOL: 0.15,
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

// ============================================================================
// LIFECYCLE PHASE TYPES (5-Phase Capital Lifecycle)
// ============================================================================
type LifecyclePhase = 'OBSERVING' | 'SEEDING' | 'SCALING' | 'HARVESTING' | 'RECYCLE';

interface LifecycleOpportunity {
    mint: string;
    symbol: string;
    phase: LifecyclePhase;
    shadowPnl: number;
    seedSize: number;
    currentSize: number;
    entryPrice: number;
    currentPrice: number;
    unrealizedPnl: number;
    slippage: number;
    blacklisted: boolean;
    cooldownUntil: number | null;
    createdAt: number;
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

// --- INITIAL PORTFOLIO (10 Solana Trash/Meme Coins) ---
const INITIAL_POSITIONS: Position[] = [
    // ☠️ High Volatility Trash Net
    { mint: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump', amount: 3500, state: 'OBSERVING' },  // TRASH 1
    { mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', amount: 18000, state: 'OBSERVING' }, // TRASH 2
    { mint: 'METvsvVRapdj9cFLzq4Tr43xK4tAjQfwX76z3n6mWQL', amount: 1400, state: 'OBSERVING' },   // TRASH 3
    { mint: 'Cm6fNnMk7NfzStP9CZpsQA2v3jjzbcYGAxdJySmHpump', amount: 450, state: 'OBSERVING' },    // TRASH 4
    { mint: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', amount: 9000, state: 'OBSERVING' },   // TRASH 5
    { mint: 'HeLp6SST7VSc3L81pXLbS188oYAKy3fF2p8yqYq6N6Q6', amount: 100000, state: 'OBSERVING' },// TRASH 6
    { mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', amount: 250, state: 'OBSERVING' },    // TRASH 7
    { mint: '6ogEbwwy9zAr37m3Ggn78J8Mv99Xm73C2C5xT8b5pump', amount: 1500, state: 'OBSERVING' },   // TRASH 8
    { mint: 'A8C3Ar3X4HrkpU4Wp6mG4oP9KqK3m6Wp6oP9KqK3mWp', amount: 800, state: 'OBSERVING' },     // TRASH 9
    { mint: 'B2oW2hMKZKpRV1VP8toiFbvcM1ZMoGNhJJxjEf1nvT4A', amount: 60, state: 'OBSERVING' },     // TRASH 10
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
    const [activeSimulationThreats, setActiveSimulationThreats] = useState<{ mint: string, impactPct: number }[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    // Lifecycle tracking (5-Phase Capital Lifecycle)
    const [lifecycleOpportunities, setLifecycleOpportunities] = useState<LifecycleOpportunity[]>([]);
    const [freeCapital, setFreeCapital] = useState(INITIAL_CAPITAL_SOL * 0.85); // 85% available for trading
    const [allocatedCapital, setAllocatedCapital] = useState(INITIAL_CAPITAL_SOL * 0.15); // 15% initially allocated

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

    const triggerManualRug = useCallback((mint: string, symbol: string) => {
        const impactPct = -90 - Math.random() * 8;
        addLog(`[SIM] Manual Rug Triggered: ${symbol} | Impact: ${impactPct.toFixed(1)}%`);

        setActiveSimulationThreats(prev => [
            ...prev.filter(t => t.mint !== mint),
            { mint, impactPct }
        ]);

        // Also add a threat event so the UI shows the red alert
        const threat: ThreatEvent = {
            id: generateId(),
            type: 'RUG_PULL',
            symbol,
            mint,
            impactPct,
            timestamp: Date.now(),
            survived: false
        };
        setThreatEvents(prev => [threat, ...prev]);

        setMetrics(m => ({
            ...m,
            threatsEncountered: m.threatsEncountered + 1,
            rugsPulled: m.rugsPulled + 1,
        }));
    }, [addLog, setThreatEvents, setMetrics]);

    // ========================================================================
    // LIFECYCLE PHASE TOGGLE (Manual Override for Testing)
    // ========================================================================
    const PHASE_ORDER: LifecyclePhase[] = ['OBSERVING', 'SEEDING', 'SCALING', 'HARVESTING', 'RECYCLE'];

    const toggleLifecyclePhase = useCallback((mint: string) => {
        setLifecycleOpportunities(prev => prev.map(opp => {
            if (opp.mint !== mint) return opp;
            const currentIndex = PHASE_ORDER.indexOf(opp.phase);
            const nextPhase = PHASE_ORDER[(currentIndex + 1) % PHASE_ORDER.length];
            addLog(`[LIFECYCLE] ${opp.symbol}: ${opp.phase} → ${nextPhase} (Manual Toggle)`);
            return { ...opp, phase: nextPhase };
        }));
    }, [addLog]);

    const promoteToLifecycle = useCallback((mint: string, symbol: string, price: number) => {
        if (lifecycleOpportunities.some(o => o.mint === mint)) return;

        const seedSize = Math.min(freeCapital * 0.15, INITIAL_CAPITAL_SOL * 0.02);
        const newOpp: LifecycleOpportunity = {
            mint,
            symbol,
            phase: 'OBSERVING',
            shadowPnl: 0,
            seedSize,
            currentSize: 0,
            entryPrice: price,
            currentPrice: price,
            unrealizedPnl: 0,
            slippage: 0,
            blacklisted: false,
            cooldownUntil: null,
            createdAt: Date.now()
        };

        setLifecycleOpportunities(prev => [...prev, newOpp]);
        addLog(`[LIFECYCLE] NEW: ${symbol} → OBSERVING phase | Seed ready: ${seedSize.toFixed(4)} SOL`);
    }, [lifecycleOpportunities, freeCapital, addLog]);

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
        setActiveSimulationThreats([]);
        setPnlHistory([{ tick: 0, value: INITIAL_CAPITAL_SOL }]);

        // Reset lifecycle state
        setLifecycleOpportunities([]);
        setFreeCapital(INITIAL_CAPITAL_SOL * 0.85);
        setAllocatedCapital(INITIAL_CAPITAL_SOL * 0.15);

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
            // 1. Fetch market data & physics analysis (Pass persistent threats)
            const response = await runPortfolioAnalysis(currentPositions, activeSimulationThreats);

            if (!response.success) {
                addLog(`[!!] SERVER ERROR: ${response.error}`);
                return;
            }

            const results = response.results || [];
            const gems = response.discoveryResults || [];
            const serverLogs = response.logs || [];

            setScanResults(results);
            setDiscoveryGems(gems);

            // Display state machine logs in UI
            serverLogs.forEach(log => addLog(log));

            // Log scan summary
            if (gems.length > 0) {
                addLog(`[SCAN] Found ${gems.length} discovery opportunities`);
            } else {
                addLog(`[SCAN] No opportunities found this tick`);
            }

            // ============================================================================
            // FIXED: Initialize entry prices exactly ONCE
            // ============================================================================
            const solData = results.find(r => r.symbol === 'SOL');
            const solPrice = solData?.metrics.price || 140;

            let workingPositions = positionsRef.current.map(pos => {
                const marketData = results.find(r => r.mint === pos.mint);

                // If we don't have an entry price yet, lock it now
                if (marketData && pos.entryPriceSOL === undefined) {
                    const priceInSOL = marketData.metrics.price / solPrice;
                    addLog(`[FAIR] ${marketData.symbol} entry price locked: ${priceInSOL.toFixed(8)} SOL`);
                    return {
                        ...pos,
                        entryPriceSOL: priceInSOL,
                        entryTimestamp: pos.entryTimestamp || Date.now()
                    };
                }

                // If held, SYNC the state and loss from the server analysis
                if (marketData) {
                    return {
                        ...pos,
                        state: marketData.verdict.state || pos.state,
                        accumulatedLossPct: marketData.verdict.accumulatedLossPct ?? pos.accumulatedLossPct
                    };
                }

                return pos;
            });

            // Log debug for "exploded" tokens to verify damage propagation
            workingPositions.forEach(pos => {
                if (pos.accumulatedLossPct && pos.accumulatedLossPct > 1 && Math.random() < 0.2) {
                    // console.log(`[DEBUG] ${pos.symbol} loss: ${pos.accumulatedLossPct.toFixed(1)}% | State: ${pos.state}`);
                }
            });

            // CRITICAL: Update the ref immediately so entry prices persist
            positionsRef.current = workingPositions;

            // 2. CHAOS: Simulate market threats (use workingPositions, not currentPositions)
            const threat = simulateThreat(workingPositions, results);
            if (threat) {
                setThreatEvents(prev => [threat, ...prev]);
                addLog(`[⚠️ THREAT] ${threat.type}: ${threat.symbol} | Impact: ${threat.impactPct.toFixed(1)}%`);

                // PERSIST the threat damage so future ticks see it
                setActiveSimulationThreats(prev => [
                    ...prev.filter(t => t.mint !== threat.mint),
                    { mint: threat.mint, impactPct: threat.impactPct }
                ]);

                // Update metrics
                setMetrics(m => ({
                    ...m,
                    threatsEncountered: m.threatsEncountered + 1,
                    rugsPulled: threat.type === 'RUG_PULL' ? m.rugsPulled + 1 : m.rugsPulled,
                }));
            }

            // 3. Process Agent Decisions (use workingPositions which has entry prices)
            let tempCapital = currentCap;
            let tradesThisTick: ExecutedTrade[] = [];
            let newPositions = [...workingPositions]; // NOW using positions WITH entry prices
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

            // 4. Update State - CRITICAL: Update BOTH state and ref for persistence
            positionsRef.current = newPositions;
            setPositions(newPositions);
            setAvailableSol(tempCapital);
            setExecutedTrades(prev => [...tradesThisTick, ...prev]);

            // 5. Calculate portfolio value (Deterministic SOL mapping)
            const portfolioValue = newPositions.reduce((acc, pos) => {
                const res = results.find(r => r.mint === pos.mint);
                if (!res) return acc;
                const tokenValSOL = (pos.amount * res.metrics.price) / solPrice;
                return acc + tokenValSOL;
            }, 0) + tempCapital;

            // Update PnL history with clean valuation
            setPnlHistory(prev => [...prev, { tick: prev.length, value: portfolioValue }]);

            // 6. Update Metrics
            setMetrics(m => {
                const newTotalTrades = m.totalTradesExecuted + tradesThisTick.length;
                const newWins = m.winningTrades + wins;
                const newLosses = m.losingTrades + losses;
                const newTotalPnL = portfolioValue - INITIAL_CAPITAL_SOL; // Global accounting
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
                <div className="bg-zinc-900/30 border border-zinc-800/40 p-4 rounded-xl">
                    <div className="text-[9px] text-zinc-600 font-bold mb-1 tracking-widest uppercase flex items-center gap-1"><BarChart3 className="w-3 h-3" /> MAX DD</div>
                    <div className={`text-2xl font-black ${metrics.maxDrawdownPct > 15 ? 'text-red-500' : metrics.maxDrawdownPct > 5 ? 'text-orange-400' : 'text-green-500'}`}>
                        -{metrics.maxDrawdownPct.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-zinc-500">Peak to Trough</div>
                </div>
            </div>

            {/* 5-PHASE LIFECYCLE PANEL */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="bg-zinc-900/40 border border-purple-900/30 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between">
                        <h2 className="text-sm font-black text-purple-400 flex items-center gap-2">
                            <Award className="w-4 h-4" /> 5-PHASE LIFECYCLE ({lifecycleOpportunities.length} Opportunities)
                        </h2>
                        <div className="text-[10px] text-zinc-500 flex gap-4">
                            <span>Free: <span className="text-cyan-400 font-bold">{freeCapital.toFixed(4)} SOL</span></span>
                            <span>Allocated: <span className="text-orange-400 font-bold">{allocatedCapital.toFixed(4)} SOL</span></span>
                        </div>
                    </div>

                    {lifecycleOpportunities.length === 0 ? (
                        <div className="p-8 text-center text-zinc-600 text-sm">
                            No opportunities tracked yet. Founded gems will appear here.
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800/30">
                            {lifecycleOpportunities.map(opp => {
                                const phases: LifecyclePhase[] = ['OBSERVING', 'SEEDING', 'SCALING', 'HARVESTING', 'RECYCLE'];
                                const phaseIcons: Record<LifecyclePhase, string> = {
                                    'OBSERVING': '👁️',
                                    'SEEDING': '🌱',
                                    'SCALING': '📈',
                                    'HARVESTING': '🌾',
                                    'RECYCLE': '♻️'
                                };
                                const phaseColors: Record<LifecyclePhase, { bg: string, text: string, border: string }> = {
                                    'OBSERVING': { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' },
                                    'SEEDING': { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500' },
                                    'SCALING': { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500' },
                                    'HARVESTING': { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500' },
                                    'RECYCLE': { bg: 'bg-zinc-500', text: 'text-zinc-400', border: 'border-zinc-500' }
                                };
                                const currentPhaseIndex = phases.indexOf(opp.phase);

                                return (
                                    <div key={opp.mint} className="px-4 py-4 hover:bg-zinc-800/20 transition-all">
                                        {/* Header Row */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                                    {phaseIcons[opp.phase]} {opp.symbol}
                                                    {opp.blacklisted && <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded">BLACKLISTED</span>}
                                                </div>
                                                <div className="text-[9px] text-zinc-600 font-mono">{opp.mint.slice(0, 12)}...</div>
                                            </div>
                                            <div className="flex gap-4 text-xs">
                                                <div className="text-right">
                                                    <div className="text-zinc-500">Shadow PnL</div>
                                                    <div className={`font-bold ${opp.shadowPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {opp.shadowPnl >= 0 ? '+' : ''}{opp.shadowPnl.toFixed(2)}%
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-zinc-500">Seed</div>
                                                    <div className="font-bold text-cyan-400">{opp.seedSize.toFixed(4)} SOL</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 5-Phase Pipeline */}
                                        <div className="flex items-center justify-between">
                                            {phases.map((phase, idx) => {
                                                const isActive = phase === opp.phase;
                                                const isPast = idx < currentPhaseIndex;
                                                const colors = phaseColors[phase];

                                                return (
                                                    <div key={phase} className="flex items-center flex-1">
                                                        <button
                                                            onClick={() => toggleLifecyclePhase(opp.mint)}
                                                            className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-all ${isActive
                                                                    ? `${colors.bg}/30 border-2 ${colors.border} shadow-lg shadow-${phase.toLowerCase()}-500/20`
                                                                    : isPast
                                                                        ? 'bg-zinc-800/50 border border-zinc-700/50 opacity-60'
                                                                        : 'bg-zinc-900/30 border border-zinc-800/30 opacity-40'
                                                                } hover:opacity-100 hover:scale-105`}
                                                            title={`Click to advance phase`}
                                                        >
                                                            <span className="text-lg">{phaseIcons[phase]}</span>
                                                            <span className={`text-[8px] font-bold uppercase ${isActive ? colors.text : 'text-zinc-500'}`}>
                                                                {phase.slice(0, 3)}
                                                            </span>
                                                        </button>
                                                        {idx < phases.length - 1 && (
                                                            <div className={`flex-1 h-0.5 mx-1 ${idx < currentPhaseIndex ? colors.bg : 'bg-zinc-800'}`}></div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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
                                            <tr key={pos.mint} className="border-b border-zinc-900/50">
                                                <td colSpan={4} className="p-0">
                                                    <div className="hover:bg-zinc-800/10 transition-colors p-3 grid grid-cols-4 items-center">
                                                        <div className="flex items-center gap-3">
                                                            <div>
                                                                <div className="font-bold text-sm text-white">{result?.symbol || (isSOL ? 'SOL' : pos.mint.slice(0, 6))}</div>
                                                                <div className="text-[8px] text-zinc-600">{pos.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-zinc-400">
                                                            <div>{pos.amount.toFixed(4)}</div>
                                                            <div className="text-[9px] text-zinc-500 italic">{pos.state || 'INITIALIZING'}</div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-cyan-400">{valueSOL.toFixed(4)} SOL</span>
                                                            <span className={`text-[9px] font-black ${result?.verdict.riskScore && result.verdict.riskScore > 70 ? 'text-red-500' : 'text-zinc-500'}`}>
                                                                RISK: {result?.verdict.riskScore || 0}/100
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col gap-1 items-end">
                                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded w-fit ${result?.verdict.action === 'HOLD' ? 'bg-green-900/20 text-green-500' :
                                                                result?.verdict.action === 'SELL' ? 'bg-red-900/20 text-red-500' :
                                                                    'bg-zinc-800 text-zinc-500'
                                                                }`}>
                                                                {result?.verdict.action || 'LOADING'}
                                                            </span>
                                                            {pos.amount > 0 && !isSOL && (
                                                                <button
                                                                    onClick={() => triggerManualRug(pos.mint, result?.symbol || '???')}
                                                                    className="text-white bg-red-600 hover:bg-red-700 font-bold py-1 px-3 rounded-md text-[10px] transition-all flex items-center gap-1 mt-1"
                                                                    title="Simulate Rug Pull"
                                                                >
                                                                    <Skull className="w-3 h-3" /> EXPLODE
                                                                </button>
                                                            )}
                                                            {pos.snapPool?.bestCandidate && (
                                                                <span className="text-[8px] font-bold text-cyan-500 flex items-center gap-1">
                                                                    <Zap className="w-2 h-2" /> SNAP READY
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* SURVIVAL TELEMETRY SUB-ROW */}
                                                    {(pos.state === 'SCOUTING' || pos.state === 'OBSERVING') && (
                                                        <div className="px-3 pb-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="bg-zinc-900/30 rounded-lg p-2 border border-zinc-800/40">
                                                                <div className="text-[8px] text-zinc-600 font-bold uppercase mb-1 tracking-widest flex items-center gap-1">
                                                                    <BrainCircuit className="w-2 h-2" /> Scouting Progress
                                                                </div>
                                                                <div className="flex items-center justify-between text-[9px] text-zinc-400">
                                                                    <span>State: {pos.state}</span>
                                                                    <span>{result?.verdict.observationRemaining || 'Analyzing...'}</span>
                                                                </div>
                                                                <div className="mt-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full transition-all duration-1000 ${pos.state === 'SCOUTING' ? 'bg-orange-500 w-[75%]' : 'bg-green-500 w-[30%]'}`}
                                                                    ></div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-cyan-950/10 rounded-lg p-2 border border-cyan-900/20">
                                                                <div className="text-[8px] text-cyan-600 font-bold uppercase mb-1 tracking-widest flex items-center gap-1">
                                                                    <Shield className="w-2 h-2" /> Survival Pool (Top Candidates)
                                                                </div>
                                                                <div className="space-y-1">
                                                                    {pos.snapPool?.candidates?.length ? pos.snapPool.candidates.slice(0, 2).map((cand: any, idx: number) => (
                                                                        <div key={idx} className="flex items-center justify-between text-[8px]">
                                                                            <span className="text-white font-bold">{cand.symbol}</span>
                                                                            <div className="flex gap-2">
                                                                                <span className="text-zinc-500">Liq: ${Math.round(cand.liquidityUSD / 1000)}k</span>
                                                                                <span className={cand.riskScore < 20 ? 'text-green-500' : 'text-orange-500'}>Score: {cand.riskScore}</span>
                                                                            </div>
                                                                        </div>
                                                                    )) : (
                                                                        <div className="text-[8px] text-zinc-600 italic">No safe havens identified yet...</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
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
                        <div className="overflow-x-auto max-h-64">
                            <table className="w-full text-left">
                                <thead className="text-[9px] text-zinc-600 font-black uppercase tracking-wider border-b border-zinc-800/30 sticky top-0 bg-zinc-900/80">
                                    <tr>
                                        <th className="p-3">Asset</th>
                                        <th className="p-3">Price</th>
                                        <th className="p-3">Liq (USD)</th>
                                        <th className="p-3">Risk/Score</th>
                                        <th className="p-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {discoveryGems.length === 0 ? (
                                        <tr><td colSpan={5} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-cyan-800" />
                                                <span className="text-zinc-700 text-[10px] italic">Agent scanning broad universe for opportunities...</span>
                                            </div>
                                        </td></tr>
                                    ) : discoveryGems.map(gem => (
                                        <tr key={gem.mint} className="hover:bg-cyan-500/5 transition-colors border-l-2 border-l-transparent hover:border-l-cyan-500">
                                            <td className="p-3">
                                                <div className="font-bold text-white text-xs">{gem.symbol}</div>
                                                <div className="text-[8px] text-zinc-600">{gem.mint.slice(0, 4)}...{gem.mint.slice(-4)}</div>
                                            </td>
                                            <td className="p-3 text-xs text-zinc-400 font-mono">${gem.metrics.price.toFixed(6)}</td>
                                            <td className="p-3 text-xs text-zinc-500 font-bold">${(gem.metrics.liquidityUSD / 1000).toFixed(0)}k</td>
                                            <td className="p-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`text-[9px] font-bold ${gem.verdict.riskScore > 50 ? 'text-red-500' : 'text-green-500'}`}>
                                                        R: {gem.verdict.riskScore}/100
                                                    </span>
                                                    <span className="text-[8px] text-zinc-600">PHY: VETTED</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className={`text-[10px] font-black px-2 py-1 rounded ${gem.verdict.action === 'BUY' ? 'bg-cyan-900/20 text-cyan-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                                    {gem.verdict.action}
                                                </span>
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
                                        l.includes('[!! BUG]') || l.includes('[THREAT]') ? 'text-red-500 font-bold' :
                                            l.includes('[SNAP]') ? 'text-cyan-400 font-bold' :
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
        </div >
    );
}
