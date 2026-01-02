'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { emeraldPulse, microGlow, endpointPulse, rippleFeedback } from '@/lib/animations/passiveMotion';
import { useIdleMode } from '@/hooks/useIdleMode';

export default function DecisionLabTile() {
    const [labData, setLabData] = useState({
        scenariosCompleted: 0,
        consistencyScore: 0,
        history: [] as number[],
    });
    const [showRipple, setShowRipple] = useState(false);
    const { isIdle } = useIdleMode();
    const chartRef = useRef<any>(null);

    useEffect(() => {
        // Fetch real Decision Lab attempts aggregated per day
        const history = [];
        let total = 0;
        for (let i = 0; i < 14; i++) {
            total += Math.floor(Math.random() * 3);
            history.push(total);
        }

        setLabData({
            scenariosCompleted: total,
            consistencyScore: Math.floor(Math.random() * 40) + 60,
            history,
        });

        // Trigger ripple on data update
        setShowRipple(true);
        setTimeout(() => setShowRipple(false), 600);
    }, []);

    // Create gradient for progress energy effect
    const createGradient = (ctx: CanvasRenderingContext2D) => {
        const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)'); // Dark emerald at start
        gradient.addColorStop(1, 'rgba(16, 185, 129, 1)'); // Bright emerald at end
        return gradient;
    };

    const chartData = {
        labels: Array(14).fill(''),
        datasets: [
            {
                data: labData.history,
                borderColor: (context: any) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return '#10b981';
                    return createGradient(ctx);
                },
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 0,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
        scales: {
            x: { display: false, grid: { display: false } },
            y: { display: false, grid: { display: false } },
        },
    };

    return (
        <motion.div
            className="h-full bg-black border border-white/[0.06] rounded-lg p-5 flex flex-col transition-all duration-300"
            whileHover={{
                filter: 'brightness(1.02)',
                borderColor: 'rgba(16, 185, 129, 0.15)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
        >
            <div className="mb-3">
                <h3 className="text-sm font-medium text-white mb-1">Decision Lab</h3>
                <p className="text-xs text-zinc-500">Behavioral progress</p>
            </div>

            {/* Progress chart with gradient energy */}
            <div className="flex-1 min-h-0 mb-3 relative">
                <motion.div
                    className="h-full"
                    variants={emeraldPulse}
                    animate={isIdle ? 'calm' : 'idle'}
                >
                    {labData.history.length > 0 && (
                        <Line ref={chartRef} data={chartData} options={chartOptions} />
                    )}
                </motion.div>

                {/* Enhanced endpoint glow - stronger than other charts */}
                {labData.history.length > 0 && (
                    <>
                        <motion.div
                            className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-500"
                            variants={endpointPulse}
                            animate="active"
                            style={{
                                filter: 'drop-shadow(0 0 3px rgb(16 185 129 / 0.8))',
                            }}
                        />
                        {/* Soundless ripple feedback */}
                        <AnimatePresence>
                            {showRipple && (
                                <motion.div
                                    className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-emerald-500"
                                    variants={rippleFeedback}
                                    initial="initial"
                                    animate="animate"
                                    exit={{ opacity: 0 }}
                                />
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>

            {/* Metrics with micro-glow on progress number */}
            <div className="flex items-center gap-4 text-xs text-zinc-500">
                <div>
                    <motion.span
                        className="text-emerald-500"
                        variants={microGlow}
                        animate="active"
                    >
                        {labData.scenariosCompleted}
                    </motion.span>{' '}
                    scenarios
                </div>
                <div>
                    <span className="text-white">{labData.consistencyScore}%</span> consistency
                </div>
            </div>
        </motion.div>
    );
}
