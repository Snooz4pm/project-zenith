'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

export default function PLStatusTile() {
    const [plData, setPlData] = useState({
        current: 0,
        history: [] as number[],
        winRate: 0,
        streak: 0,
    });

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
        <div className="h-full bg-black border border-white/[0.06] rounded-lg p-5 flex flex-col hover:border-emerald-500/20 transition-colors">
            <div className="mb-3">
                <h3 className="text-sm font-medium text-white mb-1">P&L</h3>
                <p className={`text-2xl font-medium ${isPositive ? 'text-emerald-500' : 'text-zinc-400'}`}>
                    {isPositive ? '+' : ''}{plData.current >= 0 ? '$' : '-$'}{Math.abs(plData.current).toFixed(2)}
                </p>
            </div>

            <div className="flex-1 min-h-0 mb-3">
                {plData.history.length > 0 && (
                    <Line data={chartData} options={chartOptions} />
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
        </div>
    );
}
