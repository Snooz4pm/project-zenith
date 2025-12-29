'use client';

import { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Play, AlertTriangle, Lock, MonitorPlay, Target, ShieldAlert, ArrowRight, DollarSign, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Types
type Phase = 'IDLE' | 'BRIEFING' | 'OBSERVATION' | 'GATE' | 'OUTCOME' | 'REFLECTION';
type Choice = 'BUY' | 'SELL' | 'STAY_OUT';

interface DecisionEngineProps {
    scenario: {
        id: string;
        title: string;
        symbol: string;
        marketType: string;
        timeframe: string;
        description: string;
        chartData: any[]; // Immutable snapshot
        explanationOutcome?: string;
        decisionPrompt?: string;
        eventName?: string; // "COVID-19 Crash"
        userBalance?: number; // Starting balance
    };
    onDecision: (choice: Choice, timeMs: number, leverage: number) => Promise<{ pnl: number, newBalance: number }>;
    onReflect: (content: string) => Promise<void>;
}

export default function DecisionEngine({ scenario, onDecision, onReflect }: DecisionEngineProps) {
    const router = useRouter();
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

    // State
    const [phase, setPhase] = useState<Phase>('IDLE');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [startTime, setStartTime] = useState<number>(0);
    const [userChoice, setUserChoice] = useState<Choice | null>(null);
    const [reflection, setReflection] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Gamification State
    const [balance, setBalance] = useState(scenario.userBalance || 50000);
    const [pnl, setPnl] = useState<number | null>(null);
    const [leverage, setLeverage] = useState(1);
    const [isShiftHeld, setIsShiftHeld] = useState(false);

    // Constants
    const SPLIT_INDEX = Math.floor(scenario.chartData.length * 0.8);
    const PLAYBACK_SPEED = 100; // ms per candle

    // 0. Keyboard Listeners (Shift for Leverage)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftHeld(true); };
        const handleKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftHeld(false); };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // 1. Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#09090b' },
                textColor: '#71717a',
            },
            grid: {
                vertLines: { color: '#18181b' },
                horzLines: { color: '#18181b' }
            },
            width: chartContainerRef.current.clientWidth,
            height: 500,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 10,
            },
            crosshair: {
                mode: 1,
            }
        });

        const series = chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });

        chartRef.current = chart;
        seriesRef.current = series;

        // Transition to Briefing
        setPhase('BRIEFING');

        return () => chart.remove();
    }, [scenario.id]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 2. Playback Loop
    useEffect(() => {
        if ((phase !== 'OBSERVATION' && phase !== 'OUTCOME') || !seriesRef.current) return;

        const interval = setInterval(() => {
            // Safety check
            if (currentIndex >= scenario.chartData.length) {
                if (phase === 'OUTCOME') setPhase('REFLECTION');
                clearInterval(interval);
                return;
            }

            // Gate Logic
            if (phase === 'OBSERVATION' && currentIndex >= SPLIT_INDEX) {
                setPhase('GATE');
                setStartTime(Date.now()); // Start timer
                clearInterval(interval);
                return;
            }

            // Update Chart
            const candle = scenario.chartData[currentIndex];
            seriesRef.current?.update(candle);

            setCurrentIndex(prev => prev + 1);

        }, PLAYBACK_SPEED);

        return () => clearInterval(interval);
    }, [phase, currentIndex, scenario.chartData, SPLIT_INDEX]);

    // Handlers
    const startSimulation = () => {
        setPhase('OBSERVATION');
        seriesRef.current?.setData([]);
        setCurrentIndex(0);
    };

    const handleChoice = async (choice: Choice) => {
        if (phase !== 'GATE' || isSubmitting) return;

        setIsSubmitting(true);
        const timeTaken = Date.now() - startTime;
        const currentLeverage = isShiftHeld ? 2 : 1;

        try {
            const result = await onDecision(choice, timeTaken, currentLeverage);

            // Logged successfully
            setUserChoice(choice);
            setLeverage(currentLeverage);

            // Only Update PnL/Balance if not STAY_OUT (though STAY_OUT usually pnl=0)
            if (choice !== 'STAY_OUT') {
                setPnl(result.pnl);
                setBalance(result.newBalance);
            }

            setPhase('OUTCOME');
        } catch (error) {
            alert('Failed to log decision. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReflectionSubmit = async () => {
        if (!reflection.trim()) return;
        setIsSubmitting(true);
        try {
            await onReflect(reflection);
            router.push('/learning/decision-lab');
        } catch (error) {
            alert('Failed to save reflection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Formatters
    const formatMoney = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    return (
        <div className="flex flex-col h-full bg-zinc-950 text-white relative overflow-hidden rounded-xl border border-zinc-900 shadow-2xl">

            {/* HUD / Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm z-20">
                <div className="flex items-center gap-6">
                    <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] ${phase === 'OBSERVATION' || phase === 'OUTCOME' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />

                    <div className="flex flex-col">
                        <span className="text-xl font-bold font-display tracking-wide text-white">{scenario.symbol}</span>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                            <span>{scenario.timeframe}</span>
                            <span>•</span>
                            <span>{scenario.marketType.toUpperCase()}</span>
                        </div>
                    </div>

                    {/* Prop Firm Account Widget */}
                    <div className="hidden md:flex flex-col px-4 border-l border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Account Balance</span>
                        <span className={`text-lg font-mono font-bold ${balance < 50000 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {formatMoney(balance)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {phase === 'BRIEFING' && <div className="text-xs font-mono text-zinc-500">STANDBY</div>}
                    {phase === 'OBSERVATION' && <div className="text-xs font-mono text-[var(--accent-mint)] flex items-center gap-2"><ArrowRight size={12} className="animate-pulse" /> LIVE FEED</div>}
                    {phase === 'GATE' && <div className="text-xs font-bold text-amber-500 flex items-center gap-1 animate-pulse"><ShieldAlert size={14} /> DECISION REQUIRED</div>}
                    {phase === 'OUTCOME' && <div className="text-xs font-mono text-blue-400 flex items-center gap-1"><MonitorPlay size={12} /> EXECUTING...</div>}
                    {phase === 'REFLECTION' && <div className="text-xs font-mono text-purple-400 flex items-center gap-1"><Lock size={12} /> DEBRIEF</div>}
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative flex-1 min-h-[500px]" ref={chartContainerRef}>

                {/* Phase 0: Briefing Overlay */}
                {phase === 'BRIEFING' && (
                    <div className="absolute inset-0 z-50 bg-zinc-950/95 flex items-center justify-center p-6">
                        <div className="max-w-xl w-full border border-zinc-800 bg-zinc-900 p-8 rounded-2xl shadow-2xl space-y-8 animate-in zoom-in-95 duration-500">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[var(--accent-mint)] mb-2">
                                    <Target size={20} />
                                    <span className="text-sm font-mono tracking-widest uppercase">Target Identified</span>
                                </div>
                                <h1 className="text-4xl font-bold font-display text-white">{scenario.title}</h1>
                                <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800 text-zinc-400 font-mono text-sm leading-relaxed">
                                    {scenario.description}
                                </div>
                            </div>
                            <button onClick={startSimulation} className="w-full group relative overflow-hidden bg-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/90 text-zinc-950 font-bold py-4 px-8 rounded-xl transition-all active:scale-[0.98]">
                                <span className="relative z-10 flex items-center justify-center gap-2">INITIATE SIMULATION <Play size={16} fill="currentColor" /></span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Phase 2: Decision Gate Overlay */}
                {phase === 'GATE' && (
                    <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-6">
                        <div className="max-w-lg w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
                            <div className="space-y-2 drop-shadow-2xl">
                                <h2 className="text-5xl font-black text-white font-display tracking-tight">ACTION REQUIRED</h2>
                                <p className="text-lg text-zinc-300 font-medium inline-block bg-black/60 px-4 py-2 rounded-lg backdrop-blur-md border border-zinc-800">
                                    {scenario.decisionPrompt || "Setup detected. Commit to execution."}
                                </p>
                            </div>

                            {/* Leverage Indicator */}
                            {isShiftHeld && (
                                <div className="inline-flex items-center gap-2 text-amber-400 font-bold bg-amber-950/50 px-4 py-1 rounded-full border border-amber-500/50 animate-pulse mx-auto">
                                    <Zap size={16} fill="currentColor" /> 2X LEVERAGE ACTIVE
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={() => handleChoice('BUY')}
                                    disabled={isSubmitting}
                                    className={`group relative h-48 bg-zinc-900/90 border-2 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-3 backdrop-blur-md ${isShiftHeld ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-emerald-500/20 hover:border-emerald-500'}`}
                                >
                                    <div className="text-4xl filter grayscale group-hover:grayscale-0 transition-all">🚀</div>
                                    <div className="font-bold text-2xl text-zinc-500 group-hover:text-emerald-400">LONG</div>
                                    {isShiftHeld && <div className="text-xs font-mono text-emerald-500 font-bold">2X SIZE</div>}
                                </button>

                                <button
                                    onClick={() => handleChoice('SELL')}
                                    disabled={isSubmitting}
                                    className={`group relative h-48 bg-zinc-900/90 border-2 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-3 backdrop-blur-md ${isShiftHeld ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.3)]' : 'border-rose-500/20 hover:border-rose-500'}`}
                                >
                                    <div className="text-4xl filter grayscale group-hover:grayscale-0 transition-all">📉</div>
                                    <div className="font-bold text-2xl text-zinc-500 group-hover:text-rose-400">SHORT</div>
                                    {isShiftHeld && <div className="text-xs font-mono text-rose-500 font-bold">2X SIZE</div>}
                                </button>

                                <button
                                    onClick={() => handleChoice('STAY_OUT')}
                                    disabled={isSubmitting}
                                    className="group relative h-48 bg-zinc-900/90 border-2 border-zinc-600/20 hover:border-zinc-500 hover:bg-zinc-900 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-3 backdrop-blur-md"
                                >
                                    <div className="text-4xl filter grayscale group-hover:grayscale-0 transition-all">👀</div>
                                    <div className="font-bold text-2xl text-zinc-500 group-hover:text-zinc-300">FLAT</div>
                                </button>
                            </div>
                            <div className="text-zinc-500 text-xs font-mono">Hold <span className="text-white font-bold border border-zinc-700 px-1 rounded">SHIFT</span> to Double Down (2x Risk)</div>
                        </div>
                    </div>
                )}

                {/* Phase 4: Reflection Overlay */}
                {phase === 'REFLECTION' && (
                    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in slide-in-from-bottom-10 duration-500 overflow-y-auto">
                        <div className="max-w-4xl w-full space-y-8 my-auto">

                            {/* Mission Status Header */}
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-2">
                                    SIMULATION ENDED
                                </div>

                                {/* PnL Result - The "Money Shot" */}
                                {pnl !== null && (
                                    <div className="flex flex-col items-center animate-in zoom-in duration-700 delay-100">
                                        <div className={`text-6xl font-black font-display tracking-tighter ${pnl >= 0 ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]'}`}>
                                            {pnl >= 0 ? '+' : ''}{formatMoney(pnl)}
                                        </div>
                                        <div className="text-sm text-zinc-500 font-mono mt-2">REALIZED PROFIT/LOSS {leverage > 1 && <span className="ml-2 text-amber-500 font-bold">2X LEVERAGE</span>}</div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                                {/* Historical Context - Declassified */}
                                <div className="space-y-6 p-8 bg-zinc-900/30 rounded-2xl border border-zinc-800 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <ShieldAlert size={120} />
                                    </div>

                                    <div>
                                        <div className="text-amber-500 text-xs font-bold tracking-widest uppercase mb-1">DECLASSIFIED EVENT</div>
                                        <h3 className="text-2xl font-bold text-white mb-4">{scenario.eventName || "Historical Market Event"}</h3>
                                        <div className="p-4 bg-black/40 rounded-xl border-l-2 border-amber-500/50">
                                            <p className="text-zinc-300 leading-relaxed text-sm">
                                                {scenario.explanationOutcome || "Market movements driven by high-timeframe liquidity."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-zinc-800/50 flex justify-between items-end">
                                        <div>
                                            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Your Execution</div>
                                            <div className={`text-2xl font-black ${userChoice === 'BUY' ? 'text-emerald-500' : userChoice === 'SELL' ? 'text-rose-500' : 'text-zinc-400'}`}>
                                                {userChoice}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Updated Balance</div>
                                            <div className="text-xl font-mono font-bold text-white">{formatMoney(balance)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rationale Log */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Lock size={16} className="text-[var(--accent-mint)]" />
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Trading Journal</h4>
                                    </div>
                                    <textarea
                                        className="w-full h-48 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-zinc-200 focus:outline-none focus:border-[var(--accent-mint)] resize-none text-sm leading-relaxed"
                                        placeholder="What was your thesis? Why did you size up/down?"
                                        value={reflection}
                                        onChange={(e) => setReflection(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleReflectionSubmit}
                                        disabled={!reflection.trim() || isSubmitting}
                                        className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black text-lg rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                                    >
                                        {isSubmitting ? 'SAVING...' : 'COMPLETE & EXIT'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
