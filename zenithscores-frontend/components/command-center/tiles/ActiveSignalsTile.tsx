'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

export default function ActiveSignalsTile() {
    const [signalData, setSignalData] = useState({
        count: 0,
        confidence: 'Medium' as 'High' | 'Medium' | 'Low',
        frequency: [] as number[],
    });

    useEffect(() => {
        // Generate signal frequency data
        const frequency = [];
        for (let i = 0; i < 20; i++) {
            frequency.push(Math.floor(Math.random() * 15) + 5);
        }

        const avgFreq = frequency.reduce((a, b) => a + b, 0) / frequency.length;
        const confidence = avgFreq > 12 ? 'High' : avgFreq > 8 ? 'Medium' : 'Low';

        setSignalData({
            count: Math.floor(avgFreq),
            confidence,
            frequency,
        });
    }, []);

    const chartData = {
        labels: Array(20).fill(''),
        datasets: [
            {
                data: signalData.frequency,
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
            <div className="mb-3">
                <h3 className="text-sm font-medium text-white mb-1">Active Signals</h3>
                <p className="text-xs text-zinc-500">
                    {signalData.count} signals • {signalData.confidence} confidence
                </p>
            </div>

            <div className="flex-1 min-h-0">
                {signalData.frequency.length > 0 && (
                    <Line data={chartData} options={chartOptions} />
                )}
            </div>
        </div>
    );
}
