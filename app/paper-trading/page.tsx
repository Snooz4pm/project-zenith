'use client';

export const dynamic = "force-dynamic";

/**
 * Brain V2 Portfolio Simulation
 * 30-minute portfolio manager with multi-asset support
 */

import { useState, useRef, useEffect } from 'react';

interface Decision {
    timestamp: number;
    action: string;
    token?: string;
    amount?: number;
    pnl?: number;
    reason: string;
}

export default function PaperTradingPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [stats, setStats] = useState({
        positions: 0,
        liquidSOL: 0.2,
        totalValue: 0.2,
        totalValueUSD: 30,
        decisionsCount: 0,
        penaltyPts: 0,
        realizedPnL: 0,
        realizedPnLUSD: 0,
        feesPaid: 0,
        pnlPercent: 0,
        cycle: 0,
        tokens: 0,
    });
    const [logs, setLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const logsContainerRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    // Only auto-scroll if user hasn't scrolled up (instantly to avoid fighting)
    useEffect(() => {
        if (autoScroll && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
    }, [logs, autoScroll]);

    // Detect if user scrolled away from bottom
    const handleLogsScroll = () => {
        if (!logsContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

        if (isNearBottom !== autoScroll) {
            setAutoScroll(isNearBottom);
        }
    };

    const addLog = (message: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${time}] ${message}`]);
    };

    const addDecision = (decision: Decision) => {
        setDecisions(prev => [decision, ...prev].slice(0, 50));
    };

    const runSimulation = async () => {
        setIsRunning(true);
        setDecisions([]);
        setLogs([]);
        setStats({
            positions: 0,
            liquidSOL: 0.2,
            totalValue: 0.2,
            totalValueUSD: 30,
            decisionsCount: 0,
            penaltyPts: 0,
            realizedPnL: 0,
            realizedPnLUSD: 0,
            feesPaid: 0,
            pnlPercent: 0,
            cycle: 0,
            tokens: 0,
        });

        abortRef.current = new AbortController();

        try {
            addLog('🚀 Starting Brain V2 simulation...');

            const response = await fetch('/api/behavioral-trial', {
                signal: abortRef.current.signal,
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

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
                        handleEvent(event.type, event.data);
                    } catch (e) {
                        console.error('Parse error:', e);
                    }
                }
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                addLog(`❌ Error: ${error.message}`);
            }
        } finally {
            setIsRunning(false);
        }
    };

    const handleEvent = (type: string, data: any) => {
        switch (type) {
            case 'START':
                addLog(`💰 Starting with ${data.startSOL} SOL`);
                setStats(s => ({ ...s, liquidSOL: data.startSOL, totalValue: data.startSOL }));
                break;
            case 'UNIVERSE_FROZEN':
                addLog(`🌍 Loaded ${data.count} CHAOS tokens`);
                setStats(s => ({ ...s, tokens: data.count }));
                break;
            case 'TRUST_DECISION':
                addLog(`� Trust: ${data.level} | Max ${data.maxTrades} trades`);
                break;
            case 'CYCLE_START':
                addLog(`� Cycle ${data.cycle} | ${data.tokens} tokens`);
                setStats(s => ({ ...s, cycle: data.cycle }));
                break;
            case 'PREDICTIONS':
                addLog(`   ⬆️ UP=${data.up} ⬇️ DOWN=${data.down} ➡️ FLAT=${data.flat}`);
                break;
            case 'OBSERVATION_ONLY':
                addLog(`⚠️ OBSERVATION_ONLY: ${data.reason}`);
                addDecision({
                    timestamp: Date.now(),
                    action: 'OBSERVE',
                    reason: data.reason,
                });
                setStats(s => ({ ...s, decisionsCount: s.decisionsCount + 1 }));
                break;
            case 'WAITING':
                addLog(`⏳ ${data.message}`);
                break;
            case 'CYCLE_COMPLETE':
                addLog(`✅ Accuracy: ${data.accuracy} | Survivors: ${data.survivors}`);
                break;
            case 'TRADE_OPENED':
                addLog(`💹 OPENED: ${data.token} (${data.amount?.toFixed(4)} SOL)`);
                addDecision({
                    timestamp: Date.now(),
                    action: 'BUY',
                    token: data.token,
                    amount: data.amount,
                    reason: 'Edge validated',
                });
                setStats(s => ({
                    ...s,
                    positions: s.positions + 1,
                    liquidSOL: s.liquidSOL - (data.amount || 0),
                    feesPaid: s.feesPaid + (data.fee || 0),
                    decisionsCount: s.decisionsCount + 1,
                }));
                break;
            case 'TRADE_CLOSED':
                const pnlEmoji = data.pnl >= 0 ? '🟢' : '🔴';
                addLog(`${pnlEmoji} CLOSED: ${data.token} | PnL: ${data.pnl >= 0 ? '+' : ''}${data.pnl?.toFixed(6)} SOL`);
                addDecision({
                    timestamp: Date.now(),
                    action: 'SELL',
                    token: data.token,
                    pnl: data.pnl,
                    reason: data.pnl >= 0 ? 'Take profit' : 'Cut loss',
                });
                setStats(s => ({
                    ...s,
                    positions: Math.max(0, s.positions - 1),
                    liquidSOL: s.liquidSOL + (data.exitValue || 0),
                    realizedPnL: s.realizedPnL + (data.pnl || 0),
                    decisionsCount: s.decisionsCount + 1,
                }));
                break;
            case 'REPORT':
                setStats(s => ({
                    ...s,
                    totalValue: data.endSOL,
                    pnlPercent: data.pnlPct,
                    penaltyPts: data.penaltyScore || 0,
                }));
                break;
            case 'FINAL_REPORT':
                addLog(`🏁 ${data.verdictReason}`);
                addLog(`━━━ ${data.verdict}: ${data.pnlPct?.toFixed(2)}% PnL ━━━`);
                break;
            case 'ERROR':
                addLog(`❌ ${data.message}`);
                break;
            case 'TICK':
                addLog(`⏳ ... ${data.total - data.waited}s remaining`);
                break;
            case 'SCORING':
                addLog(`📊 Scoring ${data.tokens} tokens... (Mode: ${data.mode})`);
                break;
            // Phase transitions
            case 'PHASE':
                addLog(`🔄 ${data.phase}: ${data.message}`);
                break;
            // Pillar 10.9: Perceptual Seeding
            case 'PILLAR_10_9_START':
                addLog(`🧠 SEEDING: ${data.message}`);
                break;
            case 'PILLAR_10_9_LABELED':
                addLog(`   🏷️ UP=${data.upCount} DOWN=${data.downCount} FLAT=${data.flatCount}`);
                addLog(`   ${data.message}`);
                break;
            case 'PILLAR_10_9_OBSERVING':
                addLog(`👁️ Observing labeled data (${data.seconds}s)...`);
                break;
            case 'PILLAR_10_9_COMPLETE':
                addLog(`✅ Calibration complete. Now predicting.`);
                break;
            case 'BEHAVIOR_ADJUSTED':
                addLog(`🧠 Bias: UP=${data.changes.upBias.toFixed(2)} DOWN=${data.changes.downBias.toFixed(2)} FLAT=${data.changes.flatBias.toFixed(2)}`);
                if (data.profile.correctUpReward > 0 || data.profile.correctDownReward > 0) {
                    addLog(`   ✨ Reward: +${(data.profile.correctUpReward * 0.05).toFixed(2)} UP / +${(data.profile.correctDownReward * 0.05).toFixed(2)} DOWN`);
                }
                break;
            // Pillar X: Anti-Stall
            case 'PILLAR_X_QUOTA_VIOLATION':
                addLog(`⚠️ Pillar X: Quota ${data.actual} < ${data.required}`);
                break;
            case 'PILLAR_X_FLAT_ELIMINATION':
                addLog(`🗑️ Eliminated ${data.token}: ${data.reason}`);
                break;
            case 'PILLAR_X_ELIMINATIONS':
                addLog(`🗑️ Pillar X eliminated ${data.count} tokens (${data.remaining} left)`);
                break;
            case 'PILLAR_X_STALL_DETECTED':
                addLog(`❌ STALL DETECTED: ${data.reason}`);
                break;
            // Exposure-gated accuracy
            case 'ACCURACY_BLOCKED':
                addLog(`🚫 No accuracy credit (${data.mode})`);
                break;
            // Pillar 11: Agency Accountability
            case 'PILLAR_11_AGENCY_DETECTED':
                addLog(`💪 Agency detected: ${data.directionalCount} directional`);
                break;
            case 'PILLAR_11_EGO_DEBT':
                addLog(`⚠️ Ego Debt: ${data.debt}/${data.maxDebt} (${data.flatRatio} FLAT)`);
                break;
            case 'PILLAR_11_EGO_DEBT_EXCEEDED':
                addLog(`❌ IDENTITY FAILURE: ${data.message}`);
                break;
            case 'PILLAR_11_EGO_CLOCK_EXPIRED':
                addLog(`⏰ EGO CLOCK EXPIRED: ${data.message}`);
                break;
            case 'PILLAR_11_RECOVERY_MODE':
                addLog(`🩹 ${data.message}`);
                break;
            case 'PILLAR_12_ALLOCATION':
                addLog(`⚖️ Allocation: ${data.distribution.up} UP / ${data.distribution.down} DOWN / ${data.distribution.flat} FLAT`);
                break;
            case 'BRAIN_ACTIVITY':
                addLog(`🧠 Memory: ${data.message}`);
                data.picks?.forEach((pick: string) => addLog(`   ➤ Bias: ${pick}`));
                break;
            case 'PILLAR_14_EMOTIONS':
                addLog(`🎭 ${data.message}`);
                break;
            // Memory events
            case 'MEMORY_INIT':
                addLog(`🧠 ${data.message}`);
                addLog(`   Loaded Biases: UP=${data.biases.up} DOWN=${data.biases.down} FLAT=${data.biases.flat}`);
                break;
            case 'MEMORY_RUN_COMPLETE':
                addLog(`🏁 Run Complete. Teaching events recorded.`);
                addLog(`   Adjusted Biases: UP=${data.biasAdjustments.upBias.toFixed(2)} DOWN=${data.biasAdjustments.downBias.toFixed(2)} FLAT=${data.biasAdjustments.flatBias.toFixed(2)}`);
                break;
            case 'MEMORY_TEACHING':
                addLog(`📚 ${data.lesson}`);
                break;
            case 'MEMORY_ARCHIVED':
                addLog(`💾 Archived ${data.count} tokens for learning`);
                break;
            // Pillar 13: Voluntary Attention & Accountability
            case 'ATTENTION_SELECTED':
                addLog(`👁️ Attention: ${data.attentionSetSize}/${data.totalAvailable} tokens (${(data.focusRatio * 100).toFixed(1)}%)`);
                if (data.ignoredCount > 0) {
                    addLog(`   ⏭️ Voluntarily ignored ${data.ignoredCount} tokens`);
                }
                if (data.avoidancePressure > 0) {
                    addLog(`   ⚠️ Avoidance pressure: ${data.avoidancePressure.toFixed(2)} (${data.repeatedAvoidance} repeated)`);
                }
                break;
            case 'REGRET_TEACHING':
                if (data.missedMoves > 0) {
                    addLog(`😢 Regret: Missed ${data.missedMoves} opportunities (Total: ${data.totalRegret.toFixed(2)})`);
                    if (data.teachingEvents && data.teachingEvents.length > 0) {
                        data.teachingEvents.forEach((event: string) => {
                            addLog(`   💭 ${event}`);
                        });
                    }
                }
                break;
            // Default: log any unhandled events
            default:
                if (data?.message) {
                    addLog(`📋 ${type}: ${data.message}`);
                }
                break;
        }
    };

    const stopSimulation = () => {
        abortRef.current?.abort();
        addLog('🛑 Stopped by user');
        setIsRunning(false);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="border-b border-zinc-800 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🧠</span>
                        <h1 className="text-2xl font-bold">Brain v2 Portfolio Simulation</h1>
                    </div>
                    <p className="text-zinc-500 text-sm mb-3">
                        30-minute portfolio manager with multi-asset support. Can hold up to 4 positions simultaneously.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">📊 Multi-Asset Portfolio</span>
                        <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded text-xs">🔒 0.2 SOL Paper Money</span>
                        <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded text-xs">📡 Live Jupiter Quotes</span>
                        <span className="px-3 py-1 bg-orange-600/20 text-orange-400 rounded text-xs">📈 Up to 4 Positions</span>
                        <span className="px-3 py-1 bg-pink-600/20 text-pink-400 rounded text-xs">💸 Fees Deducted from Wallet</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Start Button */}
                <div>
                    {!isRunning ? (
                        <button
                            onClick={runSimulation}
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            🚀 START SIMULATION
                        </button>
                    ) : (
                        <button
                            onClick={stopSimulation}
                            className="px-6 py-3 bg-red-600 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                        >
                            ⏹ STOP
                        </button>
                    )}
                </div>

                {/* Stats Grid - Row 1 */}
                <div className="grid grid-cols-5 gap-4">
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                        <div className="text-zinc-500 text-xs mb-1">Positions</div>
                        <div className="text-2xl font-bold text-cyan-400">{stats.positions}</div>
                        <div className="text-zinc-600 text-xs">{stats.positions === 0 ? 'All cash' : `${stats.positions} active`}</div>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                        <div className="text-zinc-500 text-xs mb-1">Liquid SOL</div>
                        <div className="text-2xl font-bold text-green-400">{stats.liquidSOL.toFixed(4)}</div>
                        <div className="text-zinc-600 text-xs">≈ ${(stats.liquidSOL * 150).toFixed(2)}</div>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                        <div className="text-zinc-500 text-xs mb-1">Total Value</div>
                        <div className="text-2xl font-bold text-white">{stats.totalValue.toFixed(4)} SOL</div>
                        <div className="text-zinc-600 text-xs">≈ ${(stats.totalValue * 150).toFixed(2)}</div>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                        <div className="text-zinc-500 text-xs mb-1">Decisions / Penalty</div>
                        <div className="text-2xl font-bold">
                            <span className="text-white">{stats.decisionsCount}</span>
                            <span className="text-zinc-600 text-lg ml-2">({stats.penaltyPts} pts)</span>
                        </div>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                        <div className="text-zinc-500 text-xs mb-1">Realized PnL</div>
                        <div className={`text-2xl font-bold ${stats.realizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stats.realizedPnL >= 0 ? '+' : ''}{stats.realizedPnL.toFixed(6)} SOL
                        </div>
                        <div className="text-zinc-600 text-xs">≈ ${(stats.realizedPnL * 150).toFixed(2)}</div>
                    </div>
                </div>

                {/* Stats Grid - Row 2 */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                        <div className="text-zinc-500 text-xs mb-1">Fees Paid</div>
                        <div className="text-2xl font-bold text-orange-400">{stats.feesPaid.toFixed(5)} SOL</div>
                        <div className="text-zinc-600 text-xs">≈ ${(stats.feesPaid * 150).toFixed(2)}</div>
                    </div>
                    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                        <div className="text-zinc-500 text-xs mb-1">PnL %</div>
                        <div className={`text-2xl font-bold ${stats.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stats.pnlPercent === 0 ? '—' : `${stats.pnlPercent >= 0 ? '+' : ''}${stats.pnlPercent.toFixed(2)}%`}
                        </div>
                    </div>
                </div>

                {/* Decision Timeline */}
                <div className="bg-zinc-900 rounded-lg border border-zinc-800">
                    <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h2 className="font-semibold">Decision Timeline</h2>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(logs.join('\n'));
                                    alert('Logs copied to clipboard');
                                }}
                                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-400 transition-colors"
                            >
                                📋 Copy
                            </button>
                        </div>
                        <span className="text-xs text-zinc-500">{autoScroll ? '📍 Following' : '🔓 Paused - scroll to bottom to resume'}</span>
                    </div>
                    <div
                        ref={logsContainerRef}
                        onScroll={handleLogsScroll}
                        className="h-[300px] overflow-y-auto p-4 font-mono text-sm"
                    >
                        {logs.length === 0 ? (
                            <div className="text-zinc-600 text-center py-12">
                                No decisions yet. Start a simulation to see brain activity.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {logs.map((log, i) => (
                                    <div key={i} className="text-zinc-300">{log}</div>
                                ))}
                                <div ref={logsEndRef} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
