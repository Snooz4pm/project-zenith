'use client';

import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface RegimeData {
    regime: string;
    date: string;
    vix_used: number;
    sma_200: number;
    updated_at: string;
}

interface Props {
    data: RegimeData | null;
}

export default function MarketRegimeMonitor({ data }: Props) {
    if (!data) return null;

    const isBullish = data.regime === 'BULLISH';
    const isBearish = data.regime === 'BEARISH';
    const isConsolidation = data.regime === 'CONSOLIDATION';

    // Mock chart data (replace with historical API data later)
    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'SPY Price',
                data: [680, 678, 682, 681, 681.76, 682, 683],
                borderColor: isBullish ? '#10b981' : isBearish ? '#ef4444' : '#f59e0b',
                backgroundColor: isBullish ? 'rgba(16, 185, 129, 0.1)' : isBearish ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: '200-Day SMA',
                data: [600, 600.2, 600.3, 600.4, 600.45, 600.5, 600.6],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderDash: [5, 5],
                fill: false,
                tension: 0.4,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#9ca3af',
                    font: {
                        family: 'monospace'
                    }
                }
            },
            tooltip: {
                backgroundColor: '#1f2937',
                titleColor: '#f3f4f6',
                bodyColor: '#d1d5db',
                borderColor: '#374151',
                borderWidth: 1
            }
        },
        scales: {
            x: {
                grid: {
                    color: '#1f2937',
                },
                ticks: {
                    color: '#6b7280'
                }
            },
            y: {
                grid: {
                    color: '#1f2937',
                },
                ticks: {
                    color: '#6b7280'
                }
            }
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Market Regime Monitor</h2>
                    <p className="text-sm text-gray-400">Real-time market condition analysis</p>
                </div>

                <div className={`px-6 py-3 rounded-xl font-bold text-lg ${isBullish
                    ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50 shadow-lg shadow-green-500/20'
                    : isBearish
                        ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 shadow-lg shadow-red-500/20'
                        : 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                    }`}>
                    {data.regime}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* VIX */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">VIX Index</div>
                    <div className="text-3xl font-bold font-mono">{data.vix_used.toFixed(2)}</div>
                    <div className="text-xs mt-2">
                        <span className={data.vix_used < 20 ? 'text-green-400' : 'text-red-400'}>
                            {data.vix_used < 20 ? '● Low Volatility' : '● High Volatility'}
                        </span>
                    </div>
                </div>

                {/* SMA */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">200-Day SMA</div>
                    <div className="text-3xl font-bold font-mono">${data.sma_200.toFixed(2)}</div>
                    <div className="text-xs mt-2 text-indigo-400">
                        ● Trend Indicator
                    </div>
                </div>

                {/* Date */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Analysis Date</div>
                    <div className="text-2xl font-bold font-mono">{data.date}</div>
                    <div className="text-xs mt-2 text-gray-400">
                        {new Date(data.updated_at).toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                <div className="h-[300px]">
                    <Line data={chartData} options={chartOptions} />
                </div>
            </div>

            {/* Regime Explanation */}
            <div className="mt-6 p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                <h3 className="text-sm font-semibold mb-2 text-gray-300">Current Regime Analysis</h3>
                <p className="text-sm text-gray-400">
                    {isBullish && (
                        <>
                            <span className="text-green-400 font-semibold">BULLISH:</span> SPY is trading above its 200-day SMA ({data.sma_200.toFixed(2)})
                            and VIX is below 20 ({data.vix_used.toFixed(2)}), indicating strong upward momentum with low volatility.
                        </>
                    )}
                    {isBearish && (
                        <>
                            <span className="text-red-400 font-semibold">BEARISH:</span> SPY is trading below its 200-day SMA ({data.sma_200.toFixed(2)})
                            and VIX is above 20 ({data.vix_used.toFixed(2)}), signaling downward pressure with elevated volatility.
                        </>
                    )}
                    {isConsolidation && (
                        <>
                            <span className="text-yellow-400 font-semibold">CONSOLIDATION:</span> Mixed signals detected.
                            Market is in a transitional phase with VIX at {data.vix_used.toFixed(2)} and price action near the 200-day SMA.
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}
