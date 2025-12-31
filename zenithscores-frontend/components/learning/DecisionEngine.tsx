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
    onDecision: (
        choice: Choice,
        timeMs: number,
        riskPercent: number,
        accountBalance: number,
        stopLossPercent: number,
        takeProfitPercent: number
    ) => Promise<{ pnl: number, newBalance: number }>;
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

    // Risk Management Parameters (Phase 1) - Proper Trading Parameters
    const [riskPercent, setRiskPercent] = useState(1); // Default 1% account risk
    const [stopLossPercent, setStopLossPercent] = useState(2); // Default 2% stop loss
    const [takeProfitPercent, setTakeProfitPercent] = useState(4); // Default 4% take profit

    // Constants
    const SPLIT_INDEX = Math.floor(scenario.chartData.length * 0.8);
    const PLAYBACK_SPEED = 100; // ms per candle

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

        try {
            // Pass all risk parameters for proper position sizing
            const result = await onDecision(choice, timeTaken, riskPercent, balance, stopLossPercent, takeProfitPercent);

            // Logged successfully
            setUserChoice(choice);

            // Only Update PnL/Balance if not STAY_OUT
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
    const formatMoney = (n: number | null | undefined) => {
        if (n === null || n === undefined || !Number.isFinite(n)) return '$0.00';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    };

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
                    <div className="absolute inset-0 z-40 bg-void/40 backdrop-blur-[4px] flex items-center justify-center p-6 overflow-y-auto">
                        <div className="max-w-4xl w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-300 py-8">
                            <div className="space-y-4">
                                <h2 className="text-6xl font-black text-white font-display tracking-tighter italic">ACTION REQUIRED</h2>
                                <p className="text-xl text-text-secondary font-medium inline-block bg-void/80 px-8 py-3 rounded-2xl border border-white/10 backdrop-blur-xl">
                                    {scenario.decisionPrompt || "Setup detected. Commit to execution."}
                                </p>
                            </div>

                            {/* Risk Management Parameters */}
                            <div className="max-w-2xl mx-auto p-6 glass-panel rounded-2xl border-white/10 space-y-6">
                                <div className="text-center mb-4">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Risk Management Setup</span>
                                    <p className="text-xs text-text-secondary mt-2">Define your capital allocation and exit levels</p>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {/* Account Risk % */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Account Risk</span>
                                            <span className="text-sm font-data font-bold text-accent-mint">{riskPercent}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="5"
                                            step="0.5"
                                            value={riskPercent}
                                            onChange={(e) => setRiskPercent(Number(e.target.value))}
                                            className="w-full accent-accent-mint bg-white/5 h-2 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[8px] font-data text-text-muted">
                                            <span>0.5%</span>
                                            <span>5%</span>
                                        </div>
                                        <div className="text-[9px] text-text-secondary text-center mt-1">
                                            Risk: {formatMoney(balance * (riskPercent / 100))}
                                        </div>
                                    </div>

                                    {/* Stop Loss % */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Stop Loss</span>
                                            <span className="text-sm font-data font-bold text-accent-danger">{stopLossPercent}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="10"
                                            step="0.5"
                                            value={stopLossPercent}
                                            onChange={(e) => setStopLossPercent(Number(e.target.value))}
                                            className="w-full accent-accent-danger bg-white/5 h-2 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[8px] font-data text-text-muted">
                                            <span>0.5%</span>
                                            <span>10%</span>
                                        </div>
                                    </div>

                                    {/* Take Profit % */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Take Profit</span>
                                            <span className="text-sm font-data font-bold text-accent-cyan">{takeProfitPercent}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="20"
                                            step="0.5"
                                            value={takeProfitPercent}
                                            onChange={(e) => setTakeProfitPercent(Number(e.target.value))}
                                            className="w-full accent-accent-cyan bg-white/5 h-2 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[8px] font-data text-text-muted">
                                            <span>1%</span>
                                            <span>20%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Risk/Reward Ratio Display */}
                                <div className="pt-4 border-t border-white/5 flex items-center justify-between bg-white/5 p-3 rounded-xl">
                                    <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Risk:Reward Ratio</div>
                                    <div className="text-lg font-data font-bold text-white">
                                        1:{(takeProfitPercent / stopLossPercent).toFixed(2)}
                                    </div>
                                </div>

                                <div className="pt-2 text-center">
                                    <div className="inline-flex gap-2">
                                        {[
                                            { label: '1R (Conservative)', risk: 1, sl: 2, tp: 4 },
                                            { label: '2R (Balanced)', risk: 1.5, sl: 2, tp: 6 },
                                            { label: '3R (Aggressive)', risk: 2, sl: 3, tp: 9 }
                                        ].map((preset) => (
                                            <button
                                                key={preset.label}
                                                onClick={() => {
                                                    setRiskPercent(preset.risk);
                                                    setStopLossPercent(preset.sl);
                                                    setTakeProfitPercent(preset.tp);
                                                }}
                                                className="text-[9px] px-3 py-1.5 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white rounded-lg border border-white/10 hover:border-white/20 transition-all font-bold uppercase tracking-wider"
                                            >
                                                {preset.label.split('(')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <button
                                    onClick={() => handleChoice('BUY')}
                                    disabled={isSubmitting}
                                    className="group relative h-56 glass-panel rounded-sm transition-all active:scale-[0.99] disabled:opacity-50 flex flex-col items-center justify-center gap-2 border-white/5 hover:border-accent-mint/30"
                                >
                                    <div className="font-bold text-3xl text-text-muted group-hover:text-accent-mint tracking-[0.2em] font-display">LONG</div>
                                    <div className="text-[10px] font-medium font-data text-text-muted uppercase tracking-widest group-hover:text-white transition-colors">Net bullish exposure</div>
                                </button>

                                <button
                                    onClick={() => handleChoice('SELL')}
                                    disabled={isSubmitting}
                                    className="group relative h-56 glass-panel rounded-sm transition-all active:scale-[0.99] disabled:opacity-50 flex flex-col items-center justify-center gap-2 border-white/5 hover:border-accent-danger/30"
                                >
                                    <div className="font-bold text-3xl text-text-muted group-hover:text-accent-danger tracking-[0.2em] font-display">SHORT</div>
                                    <div className="text-[10px] font-medium font-data text-text-muted uppercase tracking-widest group-hover:text-white transition-colors">Net bearish exposure</div>
                                </button>

                                <button
                                    onClick={() => handleChoice('STAY_OUT')}
                                    disabled={isSubmitting}
                                    className="group relative h-56 glass-panel rounded-sm transition-all active:scale-[0.99] disabled:opacity-50 flex flex-col items-center justify-center gap-2 border-white/5 hover:border-white/20 hover:bg-white/[0.02]"
                                >
                                    <div className="font-bold text-3xl text-text-muted group-hover:text-white tracking-[0.2em] font-display">FLAT</div>
                                    <div className="text-[10px] font-medium font-data text-text-muted uppercase tracking-widest group-hover:text-white transition-colors">No position</div>
                                </button>
                            </div>
                            <div className="text-text-muted text-xs font-data tracking-[0.2em] uppercase text-center">Position will be sized based on your risk parameters above</div>
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
                                        <div className="text-[10px] text-text-muted font-bold font-data mt-6 tracking-[0.4em] uppercase">REALIZED PERFORMANCE</div>
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
