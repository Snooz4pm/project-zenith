'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { emeraldPulse, microGlow, endpointPulse, rippleFeedback } from '@/lib/animations/passiveMotion';
import { useIdleMode } from '@/hooks/useIdleMode';
import { useRegimePolling, MarketType } from '@/hooks/useRegimePolling';
import SegmentedControl from '@/components/ui/SegmentedControl';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

export default function MarketPulseTile() {
    const [marketType, setMarketType] = useState<MarketType>('crypto');
    const { isIdle } = useIdleMode();
    const { regime, chartData, isLive } = useRegimePolling(marketType);

    const marketOptions = [
        { value: 'crypto', label: 'CRYPTO' },
        { value: 'forex', label: 'FOREX' },
        { value: 'stocks', label: 'STOCKS' },
    ];

    const chartDataset = {
        labels: Array(chartData.length).fill(''),
        datasets: [
            {
                data: chartData,
                borderColor: '#10b981', // emerald-500
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 0,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                mode: 'index' as const,
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: '#10b981',
                bodyColor: '#ffffff',
                borderColor: '#10b981',
                borderWidth: 1,
                padding: 8,
                displayColors: false,
                callbacks: {
                    title: () => '',
                    label: (context: any) => {
                        const value = Math.round(context.parsed.y);
                        const index = context.dataIndex;
                        const totalPoints = chartData.length;
                        const secondsAgo = (totalPoints - index - 1) * 2; // ~2s per point

                        const timeLabel = secondsAgo === 0 ? 'Now' :
                                        secondsAgo < 60 ? `${secondsAgo}s ago` :
                                        `${Math.floor(secondsAgo / 60)}m ago`;

                        return `Strength: ${value}/100 • ${timeLabel}`;
                    },
                },
            },
        },
        scales: {
            x: {
                display: false,
                grid: { display: false },
            },
            y: {
                display: false,
                grid: { display: false },
                min: 0,
                max: 100,
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
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
            {/* Header with market selector */}
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h3 className="text-sm font-medium text-white mb-1">Market Pulse</h3>
                    <p className="text-xs text-zinc-500">Regime Strength Index</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <SegmentedControl
                        options={marketOptions}
                        value={marketType}
                        onChange={(value) => setMarketType(value as MarketType)}
                    />
                    {/* Regime info - top right */}
                    <div className="text-right">
                        <div className="text-xs text-zinc-500">
                            Regime:{' '}
                            <span className="text-white font-medium">{regime.label}</span>
                        </div>
                        <div className="text-xs text-zinc-600">
                            Strength:{' '}
                            <span className="text-emerald-500 font-medium">
                                {Math.round(regime.strength)}/100
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart with breathing pulse */}
            <div className="flex-1 min-h-0 relative">
                <motion.div
                    className="h-full"
                    variants={emeraldPulse}
                    animate={isIdle ? 'calm' : 'idle'}
                    key={marketType} // Force re-mount on market change for smooth transition
                >
                    {chartData.length > 0 && (
                        <Line data={chartDataset} options={chartOptions} />
                    )}
                </motion.div>

                {/* Chart endpoint energy indicator */}
                {chartData.length > 0 && (
                    <motion.div
                        className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-emerald-500"
                        variants={endpointPulse}
                        animate="active"
                    />
                )}

                {/* Soundless ripple feedback when data updates */}
                <AnimatePresence>
                    {isLive && (
                        <motion.div
                            className="absolute bottom-2 right-2 w-2 h-2 rounded-full border-2 border-emerald-500"
                            variants={rippleFeedback}
                            initial="initial"
                            animate="animate"
                            exit={{ opacity: 0 }}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom status bar */}
            <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                    {marketType === 'crypto' && 'DexScreener • 30s'}
                    {marketType === 'forex' && 'Alpha Vantage • 45s'}
                    {marketType === 'stocks' && 'Finnhub • 60s'}
                </span>
                <motion.span
                    className={`font-medium ${isLive ? 'text-emerald-500' : 'text-zinc-600'}`}
                    variants={microGlow}
                    animate={isLive ? 'active' : undefined}
                >
                    {isLive ? 'Live' : 'Idle'}
                </motion.span>
            </div>
        </motion.div>
    );
}
