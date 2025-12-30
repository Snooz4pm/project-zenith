'use client';

import { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Play, AlertTriangle, Lock, MonitorPlay, Target, ShieldAlert, ArrowRight, DollarSign, Zap, BookOpen } from 'lucide-react';
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
                background: { type: ColorType.Solid, color: '#000000' },
                textColor: '#71717a',
            },
            grid: {
                vertLines: { color: '#0A0A0F' },
                horzLines: { color: '#0A0A0F' }
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
                vertLine: {
                    color: '#14F195',
                    labelBackgroundColor: '#14F195',
                },
                horzLine: {
                    color: '#14F195',
                    labelBackgroundColor: '#14F195',
                },
            }
        });

        const series = chart.addCandlestickSeries({
            upColor: '#14F195',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#14F195',
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
            router.push('/decision-lab');
        } catch (error) {
            alert('Failed to save reflection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Formatters
    const formatMoney = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    return (
        <div className="flex flex-col h-full bg-void text-white relative overflow-hidden rounded-2xl border border-white/5 shadow-2xl">

            {/* HUD / Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-surface-1/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-8">
                    <div className={`w-3.5 h-3.5 rounded-full shadow-[0_0_15px_var(--glow-mint)] ${phase === 'OBSERVATION' || phase === 'OUTCOME' ? 'bg-accent-mint animate-pulse' : 'bg-surface-3'}`} />

                    <div className="flex flex-col">
                        <span className="text-2xl font-bold font-display tracking-tight text-white">{scenario.symbol}</span>
                        <div className="flex items-center gap-2 text-[10px] text-text-muted font-data uppercase tracking-widest mt-0.5">
                            <span>{scenario.timeframe}</span>
                            <span className="opacity-30">•</span>
                            <span>{scenario.marketType}</span>
                        </div>
                    </div>

                    {/* Prop Firm Account Widget */}
                    <div className="hidden lg:flex flex-col px-6 border-l border-white/5">
                        <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-1">Portfolio Value</span>
                        <span className={`text-xl font-data font-bold ${balance < 50000 ? 'text-accent-danger' : 'text-accent-mint'}`}>
                            {formatMoney(balance)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {phase === 'BRIEFING' && <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold font-data text-text-muted tracking-widest border border-white/5">STANDBY</div>}
                    {phase === 'OBSERVATION' && <div className="px-3 py-1 rounded-full bg-accent-mint/10 text-[10px] font-bold font-data text-accent-mint tracking-widest border border-accent-mint/20 flex items-center gap-2 animate-pulse"><ArrowRight size={10} /> LIVE FEED</div>}
                    {phase === 'GATE' && <div className="px-3 py-1 rounded-full bg-accent-gold/10 text-[10px] font-bold font-data text-accent-gold tracking-widest border border-accent-gold/20 flex items-center gap-1 animate-pulse"><ShieldAlert size={12} /> ACTION REQUIRED</div>}
                    {phase === 'OUTCOME' && <div className="px-3 py-1 rounded-full bg-accent-cyan/10 text-[10px] font-bold font-data text-accent-cyan tracking-widest border border-accent-cyan/20 flex items-center gap-1"><MonitorPlay size={10} /> EXECUTING...</div>}
                    {phase === 'REFLECTION' && <div className="px-3 py-1 rounded-full bg-purple-500/10 text-[10px] font-bold font-data text-purple-400 tracking-widest border border-purple-500/20 flex items-center gap-1"><Lock size={10} /> DEBRIEF</div>}
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative flex-1 min-h-[500px]" ref={chartContainerRef}>

                {/* Phase 0: Briefing Overlay */}
                {phase === 'BRIEFING' && (
                    <div className="absolute inset-0 z-50 bg-void/95 flex items-center justify-center p-6">
                        <div className="max-w-xl w-full glass-panel p-10 rounded-3xl space-y-8 animate-in zoom-in-95 duration-700">
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-accent-mint mb-2">
                                    <Target size={20} />
                                    <span className="text-[10px] font-bold font-data tracking-[0.3em] uppercase">Target Identified</span>
                                </div>
                                <h1 className="text-5xl font-bold font-display text-white italic tracking-tighter">{scenario.title}</h1>
                                <div className="p-6 bg-surface-1 rounded-2xl border border-white/5 text-text-secondary font-body text-base leading-relaxed">
                                    {scenario.description}
                                </div>
                            </div>
                            <button onClick={startSimulation} className="w-full group relative overflow-hidden bg-accent-mint hover:bg-accent-mint/90 text-void font-bold py-5 px-8 rounded-2xl transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(20,241,149,0.3)]">
                                <span className="relative z-10 flex items-center justify-center gap-3 text-lg">INITIATE SIMULATION <Play size={20} fill="currentColor" /></span>
                                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                            </button>
                        </div>
                    </div>
                )}


                {/* Phase 2: Decision Gate Overlay */}
                {phase === 'GATE' && (
                    <div className="absolute inset-0 z-40 bg-void/40 backdrop-blur-[4px] flex items-center justify-center p-6">
                        <div className="max-w-3xl w-full text-center space-y-12 animate-in fade-in zoom-in-95 duration-300">
                            <div className="space-y-4">
                                <h2 className="text-6xl font-black text-white font-display tracking-tighter italic">ACTION REQUIRED</h2>
                                <p className="text-xl text-text-secondary font-medium inline-block bg-void/80 px-8 py-3 rounded-2xl border border-white/10 backdrop-blur-xl">
                                    {scenario.decisionPrompt || "Setup detected. Commit to execution."}
                                </p>
                            </div>

                            {/* Leverage Indicator */}
                            {isShiftHeld && (
                                <div className="inline-flex items-center gap-2 text-accent-gold font-bold bg-accent-gold/10 px-6 py-2 rounded-full border border-accent-gold/30 animate-pulse mx-auto shadow-[0_0_20px_var(--glow-gold)]">
                                    <Zap size={18} fill="currentColor" /> 2X RISK PROFILE ACTIVE
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-6">
                                <button
                                    onClick={() => handleChoice('BUY')}
                                    disabled={isSubmitting}
                                    className={`group relative h-56 glass-panel rounded-3xl transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-4 ${isShiftHeld ? 'border-accent-mint shadow-[0_0_40px_rgba(20,241,149,0.3)]' : 'border-white/5 hover:border-accent-mint/50'}`}
                                >
                                    <div className="text-5xl filter grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110 duration-500">🚀</div>
                                    <div className="font-bold text-2xl text-text-muted group-hover:text-accent-mint tracking-widest font-display">LONG</div>
                                    {isShiftHeld && <div className="text-[10px] font-bold font-data text-accent-mint uppercase tracking-widest">Double Size</div>}
                                </button>

                                <button
                                    onClick={() => handleChoice('SELL')}
                                    disabled={isSubmitting}
                                    className={`group relative h-56 glass-panel rounded-3xl transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-4 ${isShiftHeld ? 'border-accent-danger shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'border-white/5 hover:border-accent-danger/50'}`}
                                >
                                    <div className="text-5xl filter grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110 duration-500">📉</div>
                                    <div className="font-bold text-2xl text-text-muted group-hover:text-accent-danger tracking-widest font-display">SHORT</div>
                                    {isShiftHeld && <div className="text-[10px] font-bold font-data text-accent-danger uppercase tracking-widest">Double Size</div>}
                                </button>

                                <button
                                    onClick={() => handleChoice('STAY_OUT')}
                                    disabled={isSubmitting}
                                    className="group relative h-56 glass-panel rounded-3xl transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-4 border-white/5 hover:border-text-muted hover:bg-surface-2"
                                >
                                    <div className="text-5xl filter grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110 duration-500">👀</div>
                                    <div className="font-bold text-2xl text-text-muted group-hover:text-text-primary tracking-widest font-display">FLAT</div>
                                    <div className="text-[10px] font-bold font-data text-text-muted uppercase tracking-widest">Wait</div>
                                </button>
                            </div>
                            <div className="text-text-muted text-xs font-data tracking-[0.2em] uppercase">Hold <span className="text-white font-bold border border-white/10 px-2 py-0.5 rounded-lg bg-white/5">SHIFT</span> to Scale Position (2x Leverage)</div>
                        </div>
                    </div>
                )}


                {/* Phase 4: Reflection Overlay */}
                {phase === 'REFLECTION' && (
                    <div className="absolute inset-0 z-50 bg-void/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 animate-in slide-in-from-bottom-20 duration-700 overflow-y-auto">
                        <div className="max-w-5xl w-full space-y-12 my-auto">

                            {/* Mission Status Header */}
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-surface-1 border border-white/5 text-[10px] font-bold font-data text-text-muted tracking-[0.3em] mb-4 uppercase">
                                    Simulation Outcome Finalized
                                </div>

                                {/* PnL Result - The "Money Shot" */}
                                {pnl !== null && (
                                    <div className="flex flex-col items-center animate-in zoom-in duration-1000 delay-200">
                                        <div className={`text-8xl font-black font-display tracking-tighter ${pnl >= 0 ? 'text-accent-mint text-glow' : 'text-accent-danger drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]'}`}>
                                            {pnl >= 0 ? '+' : ''}{formatMoney(pnl)}
                                        </div>
                                        <div className="text-[10px] text-text-muted font-bold font-data mt-6 tracking-[0.4em] uppercase">REALIZED PERFORMANCE {leverage > 1 && <span className="ml-4 text-accent-gold italic">(High Leverage Execution)</span>}</div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">

                                {/* Historical Context - Declassified */}
                                <div className="space-y-8 p-10 glass-panel rounded-3xl relative overflow-hidden group border-white/10">
                                    <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-1000 transform group-hover:scale-110 group-hover:rotate-12">
                                        <ShieldAlert size={240} />
                                    </div>

                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-bold uppercase tracking-widest mb-4">
                                            <Zap size={10} fill="currentColor" /> Market Pulse Analysis
                                        </div>
                                        <h3 className="text-3xl font-bold text-white mb-6 font-display italic tracking-tight">{scenario.eventName || "Historical Context"}</h3>
                                        <div className="p-6 bg-void/60 rounded-2xl border border-white/5 leading-relaxed text-text-secondary">
                                            <p className="text-sm">
                                                {scenario.explanationOutcome || "Market movements driven by high-timeframe liquidity and sentiment exhaustion."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-white/5 flex justify-between items-center">
                                        <div className="space-y-1">
                                            <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Execution Order</div>
                                            <div className={`text-3xl font-black font-display tracking-tight ${userChoice === 'BUY' ? 'text-accent-mint' : userChoice === 'SELL' ? 'text-accent-danger' : 'text-text-secondary'}`}>
                                                {userChoice}
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Final Portfolio</div>
                                            <div className="text-2xl font-data font-bold text-white tracking-tight">{formatMoney(balance)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rationale Log */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-accent-mint/10 flex items-center justify-center">
                                            <BookOpen size={16} className="text-accent-mint" />
                                        </div>
                                        <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] font-data">Pilot Flight Log</h4>
                                    </div>
                                    <textarea
                                        className="w-full h-56 bg-surface-1 border border-white/10 rounded-3xl p-6 text-text-primary focus:outline-none focus:border-accent-mint/50 focus:ring-1 focus:ring-accent-mint/20 transition-all resize-none text-base font-body shadow-inner leading-relaxed"
                                        placeholder="Document your thesis. What were the signals? Where was the uncertainty?"
                                        value={reflection}
                                        onChange={(e) => setReflection(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleReflectionSubmit}
                                        disabled={!reflection.trim() || isSubmitting}
                                        className="w-full group relative overflow-hidden py-5 bg-white hover:bg-zinc-100 text-void font-black text-xl rounded-3xl transition-all active:scale-[0.98] shadow-2xl disabled:opacity-50"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">ARCHIVE DECISION <ArrowRight size={20} /></span>
                                        <div className="absolute inset-0 bg-accent-mint/10 opacity-0 group-hover:opacity-100 transition-opacity" />
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
