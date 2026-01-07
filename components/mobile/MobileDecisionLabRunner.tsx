'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { ArrowLeft, Play, ShieldAlert, Zap, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Choice = 'BUY' | 'SELL' | 'STAY_OUT';
type Phase = 'IDLE' | 'BRIEFING' | 'OBSERVATION' | 'GATE' | 'OUTCOME' | 'REFLECTION';

interface MobileDecisionLabRunnerProps {
    scenario: any;
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

export default function MobileDecisionLabRunner({ scenario, onDecision, onReflect }: MobileDecisionLabRunnerProps) {
    const router = useRouter();
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

    // Core State
    const [phase, setPhase] = useState<Phase>('BRIEFING');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [startTime, setStartTime] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userChoice, setUserChoice] = useState<Choice | null>(null);
    const [pnl, setPnl] = useState<number | null>(null);
    const [balance, setBalance] = useState(50000);

    // Safe defaults for mobile "One-Tap" trading
    const riskPercent = 1;
    const stopLossPercent = 2;
    const takeProfitPercent = 4;

    const SPLIT_INDEX = Math.floor(scenario.chartData.length * 0.8);
    const PLAYBACK_SPEED = 80;

    // 1. Chart Initialization (Mobile Optimized: Line/Area only)
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: { background: { type: ColorType.Solid, color: '#000000' }, textColor: '#52525b' },
            grid: { vertLines: { visible: false }, horzLines: { color: '#18181b' } },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: { timeVisible: false, secondsVisible: false, rightOffset: 5 },
            crosshair: { mode: 0 }, // Disable crosshair on mobile for cleaner look
            handleScale: { axisDoubleClickReset: true },
            handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
        });

        const series = chart.addAreaSeries({
            lineColor: '#14F195',
            topColor: 'rgba(20, 241, 149, 0.4)',
            bottomColor: 'rgba(20, 241, 149, 0.0)',
            lineWidth: 2,
        });

        chartRef.current = chart;
        seriesRef.current = series;

        // Handle Resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight
                });
            }
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    // 2. Playback Loop
    useEffect(() => {
        if ((phase !== 'OBSERVATION' && phase !== 'OUTCOME') || !seriesRef.current) return;

        const interval = setInterval(() => {
            if (currentIndex >= scenario.chartData.length) {
                if (phase === 'OUTCOME') setPhase('REFLECTION');
                clearInterval(interval);
                return;
            }

            if (phase === 'OBSERVATION' && currentIndex >= SPLIT_INDEX) {
                setPhase('GATE');
                setStartTime(Date.now());
                clearInterval(interval);
                return;
            }

            const candle = scenario.chartData[currentIndex];
            // Convert candle to line data { time, value }
            seriesRef.current?.update({ time: candle.time, value: candle.close });

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
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const timeTaken = Date.now() - startTime;
            const result = await onDecision(choice, timeTaken, riskPercent, balance, stopLossPercent, takeProfitPercent);

            setUserChoice(choice);
            if (choice !== 'STAY_OUT') {
                setPnl(result.pnl);
                setBalance(result.newBalance);
            }
            setPhase('OUTCOME');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden relative">

            {/* Top Navbar */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-4 pt-safe-top bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <button onClick={() => router.back()} className="pointer-events-auto p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 active:scale-95 transition-transform touch-target">
                    <ArrowLeft size={20} />
                </button>
                <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-xs font-bold font-mono">
                    {scenario.symbol} <span className="text-white/30">|</span> {scenario.timeframe}
                </div>
            </div>

            {/* Chart View */}
            <div className="flex-1 w-full h-full relative" ref={chartContainerRef}>
                {/* Chart renders here */}
            </div>

            {/* Phase Overlays */}
            <AnimatePresence>
                {/* 1. Briefing Phase */}
                {phase === 'BRIEFING' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col justify-end pb-10 px-6"
                    >
                        <div className="space-y-6 mb-10">
                            <div className="inline-flex items-center gap-2 text-[var(--accent-mint)]">
                                <Zap size={16} fill="currentColor" />
                                <span className="text-xs font-bold uppercase tracking-widest">Incoming Data Feed</span>
                            </div>
                            <h1 className="text-4xl font-bold font-display leading-tight">{scenario.title}</h1>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                {scenario.description}
                            </p>
                        </div>
                        <button
                            onClick={startSimulation}
                            className="w-full py-4 bg-[var(--accent-mint)] text-black font-bold uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(20,241,149,0.4)] flex items-center justify-center gap-2 touch-target"
                        >
                            Start Simulation <Play size={18} fill="currentColor" />
                        </button>
                    </motion.div>
                )}

                {/* 2. Gate Phase (Controls) */}
                {phase === 'GATE' && (
                    <motion.div
                        initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
                        className="absolute bottom-0 left-0 right-0 z-40 pb-safe-bottom bg-gradient-to-t from-black via-black/90 to-transparent pt-20 px-4"
                    >
                        <div className="flex gap-3 mb-6">
                            <ActionButton
                                choice="BUY"
                                label="Buy"
                                icon={<TrendingUp size={24} />}
                                color="bg-[var(--accent-mint)]"
                                textColor="text-black"
                                onClick={() => handleChoice('BUY')}
                                disabled={isSubmitting}
                            />
                            <ActionButton
                                choice="STAY_OUT"
                                label="Flat"
                                icon={<Minus size={24} />}
                                color="bg-white/10"
                                textColor="text-white"
                                onClick={() => handleChoice('STAY_OUT')}
                                disabled={isSubmitting}
                            />
                            <ActionButton
                                choice="SELL"
                                label="Sell"
                                icon={<TrendingDown size={24} />}
                                color="bg-[var(--accent-danger)]"
                                textColor="text-white"
                                onClick={() => handleChoice('SELL')}
                                disabled={isSubmitting}
                            />
                        </div>
                    </motion.div>
                )}

                {/* 3. Reflection Phase (Outcome) */}
                {phase === 'REFLECTION' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-6"
                    >
                        <div className="w-full max-w-sm space-y-8 text-center">
                            <div>
                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2 font-bold">Result</div>
                                {pnl !== null ? (
                                    <div className={`text-6xl font-black font-display tracking-tighter ${pnl >= 0 ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'}`}>
                                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(0)}
                                    </div>
                                ) : (
                                    <div className="text-4xl font-bold text-white">No Trade</div>
                                )}
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-left">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                                    <ShieldAlert size={16} className="text-[var(--accent-gold)]" />
                                    {scenario.eventName || 'Analysis'}
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                    {scenario.explanationOutcome}
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    onReflect('Mobile quick play'); // Auto-submit simplified reflection
                                    router.push('/decision-lab');
                                }} // simplified exit for mobile
                                className="w-full py-4 bg-white text-black font-bold rounded-2xl active:scale-[0.98] transition-transform"
                            >
                                Continue
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading Indicator */}
            {isSubmitting && (
                <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="animate-spin text-white" size={32} />
                </div>
            )}
        </div>
    );
}

function ActionButton({ choice, label, icon, color, textColor, onClick, disabled }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 rounded-2xl ${color} ${textColor} active:scale-95 transition-transform touch-target shadow-lg`}
        >
            {icon}
            <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </button>
    )
}
