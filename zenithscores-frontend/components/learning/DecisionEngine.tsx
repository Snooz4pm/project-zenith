'use client';

import { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Play, AlertTriangle, Lock, MonitorPlay, Target, ShieldAlert, ArrowRight } from 'lucide-react';
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
    };
    onDecision: (choice: Choice, timeMs: number) => Promise<void>;
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

    // Constants
    const SPLIT_INDEX = Math.floor(scenario.chartData.length * 0.8);
    const PLAYBACK_SPEED = 100; // ms per candle

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

        // Transition to Briefing once loaded
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

            // Auto scroll to latest
            // OPTIONAL: chartRef.current?.timeScale().scrollToPosition(0, true);

            setCurrentIndex(prev => prev + 1);

        }, PLAYBACK_SPEED);

        return () => clearInterval(interval);
    }, [phase, currentIndex, scenario.chartData, SPLIT_INDEX]);

    // Handlers
    const startSimulation = () => {
        setPhase('OBSERVATION');
        // Clear chart before starting?
        // Actually, we should probably start empty or with very little history.
        // Let's assume we start empty.
        seriesRef.current?.setData([]);
        setCurrentIndex(0);
    };

    const handleChoice = async (choice: Choice) => {
        if (phase !== 'GATE' || isSubmitting) return;

        setIsSubmitting(true);
        const timeTaken = Date.now() - startTime;

        try {
            await onDecision(choice, timeTaken);
            setUserChoice(choice);
            setPhase('OUTCOME');
            // Playback will auto-resume due to useEffect observing phase='OUTCOME'
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

    return (
        <div className="flex flex-col h-full bg-zinc-950 text-white relative overflow-hidden rounded-xl border border-zinc-900 shadow-2xl">

            {/* HUD / Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm z-20">
                <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${phase === 'OBSERVATION' || phase === 'OUTCOME' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                    <div className="flex flex-col">
                        <span className="text-xl font-bold font-display tracking-wide text-white">{scenario.symbol}</span>
                        <span className="text-xs text-zinc-400 font-mono">{scenario.timeframe} • {scenario.marketType.toUpperCase()}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {phase === 'BRIEFING' && <div className="text-xs font-mono text-zinc-500">STANDBY</div>}
                    {phase === 'OBSERVATION' && <div className="text-xs font-mono text-[var(--accent-mint)] flex items-center gap-2"><ArrowRight size={12} className="animate-pulse" /> INCOMING FEED</div>}
                    {phase === 'GATE' && <div className="text-xs font-bold text-amber-500 flex items-center gap-1 animate-pulse"><ShieldAlert size={14} /> SIGNAL ACQUIRED</div>}
                    {phase === 'OUTCOME' && <div className="text-xs font-mono text-blue-400 flex items-center gap-1"><MonitorPlay size={12} /> EXECUTING ORDER...</div>}
                    {phase === 'REFLECTION' && <div className="text-xs font-mono text-purple-400 flex items-center gap-1"><Lock size={12} /> MISSION COMPLETE</div>}
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

                            <button
                                onClick={startSimulation}
                                className="w-full group relative overflow-hidden bg-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/90 text-zinc-950 font-bold py-4 px-8 rounded-xl transition-all active:scale-[0.98]"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    INITIATE SIMULATION <Play size={16} fill="currentColor" />
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Phase 2: Decision Gate Overlay */}
                {phase === 'GATE' && (
                    <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-6">
                        {/* We allow partial visibility of the chart behind */}
                        <div className="max-w-lg w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
                            <div className="space-y-2 drop-shadow-2xl">
                                <h2 className="text-4xl font-black text-white font-display tracking-tight">DECISION REQUIRED</h2>
                                <p className="text-zinc-300 font-medium text-lg bg-black/50 inline-block px-3 py-1 rounded">
                                    {scenario.decisionPrompt || "Confirm entry direction."}
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={() => handleChoice('BUY')}
                                    disabled={isSubmitting}
                                    className="group relative h-40 bg-zinc-900/90 border-2 border-emerald-500/20 hover:border-emerald-500/100 hover:bg-zinc-900 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-3 backdrop-blur-md"
                                >
                                    <div className="text-3xl filter grayscale group-hover:grayscale-0 transition-all">🚀</div>
                                    <div className="font-bold text-xl text-zinc-500 group-hover:text-emerald-400">LONG</div>
                                </button>

                                <button
                                    onClick={() => handleChoice('SELL')}
                                    disabled={isSubmitting}
                                    className="group relative h-40 bg-zinc-900/90 border-2 border-rose-500/20 hover:border-rose-500/100 hover:bg-zinc-900 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-3 backdrop-blur-md"
                                >
                                    <div className="text-3xl filter grayscale group-hover:grayscale-0 transition-all">📉</div>
                                    <div className="font-bold text-xl text-zinc-500 group-hover:text-rose-400">SHORT</div>
                                </button>

                                <button
                                    onClick={() => handleChoice('STAY_OUT')}
                                    disabled={isSubmitting}
                                    className="group relative h-40 bg-zinc-900/90 border-2 border-zinc-600/20 hover:border-zinc-500/100 hover:bg-zinc-900 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-3 backdrop-blur-md"
                                >
                                    <div className="text-3xl filter grayscale group-hover:grayscale-0 transition-all">👀</div>
                                    <div className="font-bold text-xl text-zinc-500 group-hover:text-zinc-300">FLAT</div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Phase 4: Reflection Overlay */}
                {phase === 'REFLECTION' && (
                    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in slide-in-from-bottom-10 duration-500">
                        <div className="max-w-2xl w-full space-y-8">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-4">
                                    SIMULATION ENDED
                                </div>
                                <h3 className="text-3xl font-bold text-white">Debrief</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-8 items-start">
                                <div className="space-y-4 p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
                                    <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Outcome</h4>
                                    <p className="text-zinc-300 leading-relaxed text-sm">
                                        {scenario.explanationOutcome || "Market movements are driven by liquidity and sentiment."}
                                    </p>
                                    <div className="pt-4 border-t border-zinc-800">
                                        <div className="text-xs text-zinc-500">You Executed</div>
                                        <div className={`text-2xl font-black ${userChoice === 'BUY' ? 'text-emerald-500' : userChoice === 'SELL' ? 'text-rose-500' : 'text-zinc-400'}`}>
                                            {userChoice}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Rationale Log</h4>
                                    <textarea
                                        className="w-full h-40 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-zinc-200 focus:outline-none focus:border-[var(--accent-mint)] resize-none text-sm leading-relaxed"
                                        placeholder="Record your observation..."
                                        value={reflection}
                                        onChange={(e) => setReflection(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleReflectionSubmit}
                                        disabled={!reflection.trim() || isSubmitting}
                                        className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'SAVING...' : 'COMPLETE MISSION'}
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
