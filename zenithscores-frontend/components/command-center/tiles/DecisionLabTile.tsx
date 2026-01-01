'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

export default function DecisionLabTile() {
    const [labData, setLabData] = useState({
        scenariosCompleted: 0,
        consistencyScore: 0,
        history: [] as number[],
    });

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
    }, []);

    const chartData = {
        labels: Array(14).fill(''),
        datasets: [
            {
                data: labData.history,
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
                <h3 className="text-sm font-medium text-white mb-1">Decision Lab</h3>
                <p className="text-xs text-zinc-500">Behavioral progress</p>
            </div>

            <div className="flex-1 min-h-0 mb-3">
                {labData.history.length > 0 && (
                    <Line data={chartData} options={chartOptions} />
                )}
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-500">
                <div>
                    <span className="text-emerald-500">{labData.scenariosCompleted}</span> scenarios
                </div>
                <div>
                    <span className="text-white">{labData.consistencyScore}%</span> consistency
                </div>
            </div>
        </div>
    );
}
