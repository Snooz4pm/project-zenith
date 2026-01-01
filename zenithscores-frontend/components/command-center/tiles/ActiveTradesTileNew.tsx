'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

export default function ActiveTradesTileNew() {
    const [hasActiveTrades, setHasActiveTrades] = useState(false);
    const [tradeData, setTradeData] = useState<number[]>([]);

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
        <div className="h-full bg-black border border-white/[0.06] rounded-lg p-5 flex flex-col hover:border-emerald-500/20 transition-colors">
            <div className="mb-4">
                <h3 className="text-sm font-medium text-white mb-1">Active Trades</h3>
                <p className="text-xs text-zinc-500">
                    {hasActiveTrades ? '1 position open' : 'No active trades'}
                </p>
            </div>

            <div className="flex-1 min-h-0">
                <Line data={chartData} options={chartOptions} />
            </div>
        </div>
    );
}
