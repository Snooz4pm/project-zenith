'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { emeraldPulse, endpointPulse, rippleFeedback } from '@/lib/animations/passiveMotion';
import { useIdleMode } from '@/hooks/useIdleMode';

export default function ActiveTradesTileNew() {
    const [hasActiveTrades, setHasActiveTrades] = useState(false);
    const [tradeData, setTradeData] = useState<number[]>([]);
    const [showRipple, setShowRipple] = useState(false);
    const { isIdle } = useIdleMode();

    useEffect(() => {
        // Fetch real active trades
        // For now: flat line if no trades, emerald line if active
        const active = Math.random() > 0.5;
        setHasActiveTrades(active);

        if (active) {
            // Generate simple price movement line
            const data = [];
            let price = 100;
            for (let i = 0; i < 20; i++) {
                price += (Math.random() - 0.45) * 2;
                data.push(price);
            }
            setTradeData(data);
        } else {
            // Flat line
            setTradeData(Array(20).fill(100));
        }

        // Trigger ripple on data update
        if (active) {
            setShowRipple(true);
            setTimeout(() => setShowRipple(false), 600);
        }
    }, []);

    const chartData = {
        labels: Array(20).fill(''),
        datasets: [
            {
                data: tradeData,
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

    return (
        <motion.div
            className="h-full bg-black border border-white/[0.06] rounded-lg p-5 flex flex-col transition-all duration-300"
            whileHover={{
                filter: 'brightness(1.02)',
                borderColor: 'rgba(16, 185, 129, 0.15)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
        >
            <div className="mb-4">
                <h3 className="text-sm font-medium text-white mb-1">Active Trades</h3>
                <p className="text-xs text-zinc-500">
                    {hasActiveTrades ? '1 position open' : 'No active trades'}
                </p>
            </div>

            <div className="flex-1 min-h-0 relative">
                <motion.div
                    className="h-full"
                    variants={emeraldPulse}
                    animate={isIdle ? 'calm' : 'idle'}
                >
                    <Line data={chartData} options={chartOptions} />
                </motion.div>

                {/* Chart endpoint energy indicator - only if active trades */}
                {hasActiveTrades && (
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
        </motion.div>
    );
}
