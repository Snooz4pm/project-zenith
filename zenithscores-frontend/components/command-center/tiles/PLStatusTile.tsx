'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { emeraldPulse, endpointPulse, rippleFeedback } from '@/lib/animations/passiveMotion';
import { useIdleMode } from '@/hooks/useIdleMode';

export default function PLStatusTile() {
    const [plData, setPlData] = useState({
        current: 0,
        history: [] as number[],
        winRate: 0,
        streak: 0,
    });
    const [showRipple, setShowRipple] = useState(false);
    const { isIdle } = useIdleMode();

    useEffect(() => {
        // Fetch real P&L data
        // For now: generate sample
        const history = [];
        let value = 0;
        for (let i = 0; i < 15; i++) {
            value += (Math.random() - 0.4) * 50;
            history.push(value);
        }

        setPlData({
            current: value,
            history,
            winRate: Math.random() * 100,
            streak: Math.floor(Math.random() * 10),
        });

        // Trigger ripple on data update
        setShowRipple(true);
        setTimeout(() => setShowRipple(false), 600);
    }, []);

    const chartData = {
        labels: Array(15).fill(''),
        datasets: [
            {
                data: plData.history,
                borderColor: '#10b981',
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

    const isPositive = plData.current >= 0;

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
                <h3 className="text-sm font-medium text-white mb-1">P&L</h3>
                {/* P&L value - NO animations (as per requirements) */}
                <p className={`text-2xl font-medium ${isPositive ? 'text-emerald-500' : 'text-zinc-400'}`}>
                    {isPositive ? '+' : ''}{plData.current >= 0 ? '$' : '-$'}{Math.abs(plData.current).toFixed(2)}
                </p>
            </div>

            <div className="flex-1 min-h-0 mb-3 relative">
                <motion.div
                    className="h-full"
                    variants={emeraldPulse}
                    animate={isIdle ? 'calm' : 'idle'}
                >
                    {plData.history.length > 0 && (
                        <Line data={chartData} options={chartOptions} />
                    )}
                </motion.div>

                {/* Chart endpoint energy indicator */}
                {plData.history.length > 0 && (
                    <>
                        <motion.div
                            className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-emerald-500"
                            variants={endpointPulse}
                            animate="active"
                        />
                        {/* Soundless ripple feedback */}
                        <AnimatePresence>
                            {showRipple && (
                                <motion.div
                                    className="absolute bottom-2 right-2 w-2 h-2 rounded-full border-2 border-emerald-500"
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

            <div className="flex items-center gap-4 text-xs text-zinc-500">
                <div>
                    <span className="text-white">{plData.winRate.toFixed(0)}%</span> win rate
                </div>
                <div>
                    <span className="text-emerald-500">{plData.streak}</span> streak
                </div>
            </div>
        </motion.div>
    );
}
