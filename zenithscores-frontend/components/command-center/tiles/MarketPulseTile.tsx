'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

export default function MarketPulseTile() {
    const [pulseData, setPulseData] = useState<number[]>([]);

    useEffect(() => {
        // Generate aggregated platform activity (user progress × system activity)
        // This represents: signal frequency + user activity + trade attempts + Decision Lab usage
        const generatePulseData = () => {
            const data = [];
            for (let i = 0; i < 30; i++) {
                // Simulate aggregated activity score (0-100)
                const base = 50 + Math.sin(i / 5) * 20;
                const noise = (Math.random() - 0.5) * 10;
                data.push(Math.max(10, Math.min(90, base + noise)));
            }
            return data;
        };

        setPulseData(generatePulseData());
    }, []);

    const chartData = {
        labels: Array(30).fill(''),
        datasets: [
            {
                data: pulseData,
                borderColor: '#10b981', // emerald-500
                backgroundColor: 'transparent',
                borderWidth: 2,
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
            tooltip: { enabled: false },
        },
        scales: {
            x: {
                display: false,
                grid: { display: false },
            },
            y: {
                display: false,
                grid: { display: false },
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
    };

    return (
        <div className="h-full bg-black border border-white/[0.06] rounded-lg p-5 flex flex-col hover:border-emerald-500/20 transition-colors">
            <div className="mb-4">
                <h3 className="text-sm font-medium text-white mb-1">Market Pulse</h3>
                <p className="text-xs text-zinc-500">Platform Momentum</p>
            </div>

            {/* Pure emerald line chart - NO axes, NO labels */}
            <div className="flex-1 min-h-0">
                {pulseData.length > 0 && (
                    <Line data={{
                        ...chartData,
                        datasets: [{
                            ...chartData.datasets[0],
                            borderWidth: 1.5,
                        }]
                    }} options={chartOptions} />
                )}
            </div>

            {/* Minimal status indicator */}
            <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Activity</span>
                <span className="text-emerald-500 font-medium">Active</span>
            </div>
        </div>
    );
}
