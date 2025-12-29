'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Play, Pause, AlertTriangle, CheckCircle, XCircle, Lock, MonitorPlay } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Types
type Phase = 'FROZEN' | 'GATE' | 'OUTCOME' | 'REFLECTION';
type Choice = 'BUY' | 'SELL' | 'STAY_OUT';

interface DecisionEngineProps {
    scenario: {
        id: string;
        title: string;
        symbol: string;
        marketType: string;
        timeframe: string;
        chartData: any[]; // Immutable snapshot
        pausedIndex?: number; // Optional override, otherwise calculates from split
        explanationOutcome?: string;
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
    const [phase, setPhase] = useState<Phase>('FROZEN');
    const [startTime, setStartTime] = useState<number>(0);
    const [userChoice, setUserChoice] = useState<Choice | null>(null);
    const [reflection, setReflection] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(100); // ms per candle

    // 1. Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#09090b' },
                textColor: '#d4d4d8'
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
            },
            crosshair: {
                mode: 1, // CrosshairMode.Normal
            }
        });

        const series = chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });

        // Initial load: Only show data UP TO the pause point
        // We assume the snapshot contains ALL data. 
        // We need to find the split point. 
        // For MVP, let's assume the last 20% is the "outcome" if not specified.
        const splitIndex = Math.floor(scenario.chartData.length * 0.8);
        const initialData = scenario.chartData.slice(0, splitIndex);

        series.setData(initialData);
        chart.timeScale().fitContent();

        // Lock interactions initially
        chart.timeScale().applyOptions({
            shiftVisibleRangeOnNewBar: true,
            rightOffset: 10,
        });

        chartRef.current = chart;
        seriesRef.current = series;

        // Start tracking decision time immediately upon mount
        setStartTime(Date.now());
        setPhase('GATE'); // Immediately enter GATE phase, but maybe show FROZEN context first?
        // User requested: "Chart is paused before a key move. 1-2 lines setup." -> Then GATE.
        // Let's stick to GATE immediately overlaying the FROZEN chart.

        return () => chart.remove();
    }, [scenario.chartData]);

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

    // Handler: Decision Made
    const handleChoice = async (choice: Choice) => {
        if (phase !== 'GATE' || isSubmitting) return;

        setIsSubmitting(true);
        const timeTaken = Date.now() - startTime;

        try {
            await onDecision(choice, timeTaken);
            setUserChoice(choice);
            setPhase('OUTCOME');
            playOutcome(); // Start replay
        } catch (error) {
            alert('Failed to log decision. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Replay Logic
    const playOutcome = () => {
        if (!seriesRef.current || !scenario.chartData) return;

        const splitIndex = Math.floor(scenario.chartData.length * 0.8);
        const outcomeData = scenario.chartData.slice(splitIndex);
        let currentIndex = 0;

        const interval = setInterval(() => {
            if (currentIndex >= outcomeData.length) {
                clearInterval(interval);
                setPhase('REFLECTION');
                return;
            }

            const candle = outcomeData[currentIndex];
            seriesRef.current?.update(candle);
            currentIndex++;
        }, playbackSpeed);
    };

    // Handler: Reflection Submit
    const handleReflectionSubmit = async () => {
        if (!reflection.trim()) return;
        setIsSubmitting(true);
        try {
            await onReflect(reflection);
            router.push('/learning/decision-lab'); // Or show success/next
        } catch (error) {
            alert('Failed to save reflection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950 text-white relative overflow-hidden rounded-xl border border-zinc-900">

            {/* HUD / Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-xl font-bold font-display tracking-wide">{scenario.symbol}</span>
                        <span className="text-xs text-zinc-400 font-mono">{scenario.timeframe} • {scenario.marketType.toUpperCase()}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {phase === 'GATE' && <div className="text-xs text-amber-500 flex items-center gap-1 animate-pulse"><AlertTriangle size={12} /> Decision Required</div>}
                    {phase === 'OUTCOME' && <div className="text-xs text-blue-400 flex items-center gap-1"><MonitorPlay size={12} /> Replay Active</div>}
                    {phase === 'REFLECTION' && <div className="text-xs text-purple-400 flex items-center gap-1"><Lock size={12} /> Reflection Mode</div>}
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative flex-1 min-h-[500px]" ref={chartContainerRef}>

                {/* Phase 2: Decision Gate Overlay */}
                {phase === 'GATE' && (
                    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-300">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-white font-display">Make Your Call</h2>
                                <p className="text-zinc-400">Ignore the noise. Trust your setup.</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={() => handleChoice('BUY')}
                                    disabled={isSubmitting}
                                    className="group relative p-6 bg-zinc-900 border border-emerald-500/30 rounded-xl hover:border-emerald-500 hover:bg-emerald-500/10 transition-all active:scale-95 disabled:opacity-50"
                                    onMouseEnter={() => document.body.style.cursor = 'pointer'} // Force cursor
                                >
                                    <div className="text-2xl mb-2">🚀</div>
                                    <div className="font-bold text-emerald-400 group-hover:text-emerald-300">BUY</div>
                                </button>

                                <button
                                    onClick={() => handleChoice('SELL')}
                                    disabled={isSubmitting}
                                    className="group relative p-6 bg-zinc-900 border border-rose-500/30 rounded-xl hover:border-rose-500 hover:bg-rose-500/10 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <div className="text-2xl mb-2">📉</div>
                                    <div className="font-bold text-rose-400 group-hover:text-rose-300">SELL</div>
                                </button>

                                <button
                                    onClick={() => handleChoice('STAY_OUT')}
                                    disabled={isSubmitting}
                                    className="group relative p-6 bg-zinc-900 border border-zinc-700 rounded-xl hover:border-zinc-500 hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <div className="text-2xl mb-2">👀</div>
                                    <div className="font-bold text-zinc-400 group-hover:text-zinc-300">WAIT</div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Phase 4: Reflection Overlay */}
                {phase === 'REFLECTION' && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-between p-8 animate-in slide-in-from-right duration-500">
                        <div className="w-1/2 pr-8 border-r border-zinc-800 space-y-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Outcome Review</h3>
                                <p className="text-zinc-400 leading-relaxed">
                                    {scenario.explanationOutcome || "The market moved based on liquidity grabs at the previous low."}
                                </p>
                            </div>

                            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                                <div className="text-sm text-zinc-500 mb-1">You Chose</div>
                                <div className={`text-xl font-bold ${userChoice === 'BUY' ? 'text-emerald-400' : userChoice === 'SELL' ? 'text-rose-400' : 'text-zinc-400'}`}>
                                    {userChoice}
                                </div>
                            </div>
                        </div>

                        <div className="w-1/2 pl-8 flex flex-col h-full justify-center">
                            <h3 className="text-xl font-bold text-white mb-4">Why did you make this choice?</h3>
                            <textarea
                                className="w-full h-40 bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-zinc-300 focus:outline-none focus:border-mint-500 resize-none mb-4"
                                placeholder="I saw..."
                                value={reflection}
                                onChange={(e) => setReflection(e.target.value)}
                                defaultValue={`I chose ${userChoice} because...`}
                            />
                            <button
                                onClick={handleReflectionSubmit}
                                disabled={!reflection.trim() || isSubmitting}
                                className="w-full py-3 bg-[var(--accent-mint)] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Saving...' : 'Save to Notebook'}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
