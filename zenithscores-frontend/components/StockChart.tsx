'use client';

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
import { Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw } from 'lucide-react';

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

interface StockChartProps {
    symbol: string;
    currentPrice: number;
    currentScore: number;
}

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y';

const TIME_RANGES: { value: TimeRange; label: string; days: number }[] = [
    { value: '1D', label: '1D', days: 1 },
    { value: '1W', label: '1W', days: 7 },
    { value: '1M', label: '1M', days: 30 },
    { value: '3M', label: '3M', days: 90 },
    { value: '1Y', label: '1Y', days: 365 },
];

export default function StockChart({ symbol, currentPrice, currentScore }: StockChartProps) {
    const [chartData, setChartData] = useState<any>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('1M');
    const [isLoading, setIsLoading] = useState(false);

    const generateChartData = (days: number) => {
        setIsLoading(true);

        const labels: string[] = [];
        const priceData: number[] = [];
        const scoreData: number[] = [];

        let price = currentPrice * (0.85 + Math.random() * 0.1); // Start 5-15% below current
        let score = Math.max(0, Math.min(100, currentScore + (Math.random() * 20 - 10)));

        // Determine data points and formatting based on time range
        const numPoints = days <= 1 ? 24 : days <= 7 ? days * 4 : Math.min(days, 60);

        for (let i = numPoints; i >= 0; i--) {
            const date = new Date();

            if (days === 1) {
                date.setHours(date.getHours() - i);
                labels.push(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
            } else if (days <= 7) {
                date.setHours(date.getHours() - (i * 6));
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' }));
            } else if (days <= 30) {
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            } else {
                const interval = Math.floor(days / numPoints);
                date.setDate(date.getDate() - (i * interval));
                labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            }

            // Volatility scales with time range
            const volatility = price * (0.01 + days * 0.0001);
            price = price + (Math.random() * volatility * 2 - volatility);

            // Trend towards current price
            if (i < numPoints / 2) {
                price = price + (currentPrice - price) * 0.05;
            }

            const scoreChange = (Math.random() * 8 - 4) + (price > priceData[priceData.length - 1] ? 1.5 : -1.5);
            score = Math.max(20, Math.min(99, score + scoreChange));

            priceData.push(price);
            scoreData.push(score);
        }

        // Force last point to match current
        priceData[priceData.length - 1] = currentPrice;
        scoreData[scoreData.length - 1] = currentScore;

        setTimeout(() => {
            setChartData({
                labels,
                datasets: [
                    {
                        label: 'Price ($)',
                        data: priceData,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        yAxisID: 'y',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        borderWidth: 2,
                    },
                    {
                        label: 'Zenith Score',
                        data: scoreData,
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.0)',
                        yAxisID: 'y1',
                        tension: 0.4,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        borderWidth: 2,
                    },
                ],
            });
            setIsLoading(false);
        }, 300);
    };

    useEffect(() => {
        const days = TIME_RANGES.find(r => r.value === timeRange)?.days || 30;
        generateChartData(days);
    }, [currentPrice, currentScore, timeRange]);

    const handleTimeRangeChange = (range: TimeRange) => {
        setTimeRange(range);
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#9ca3af',
                    font: {
                        family: 'monospace'
                    },
                    usePointStyle: true,
                    pointStyle: 'circle',
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(0,240,255,0.2)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.03)',
                },
                ticks: {
                    color: '#6b7280',
                    maxTicksLimit: 8,
                }
            },
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                grid: {
                    color: 'rgba(255, 255, 255, 0.03)',
                },
                ticks: {
                    color: '#10B981',
                    callback: (value: any) => '$' + value.toFixed(0)
                }
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                grid: {
                    drawOnChartArea: false,
                },
                min: 0,
                max: 100,
                ticks: {
                    color: '#3B82F6'
                }
            },
        },
        animation: {
            duration: 750,
            easing: 'easeOutQuart' as const,
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-gradient-to-br from-gray-900/50 to-black border border-white/10 rounded-xl p-4"
        >
            {/* Header with Time Range Selector */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Activity className="text-cyan-400" size={18} />
                    <span className="text-sm text-gray-400 font-medium">{symbol} Price History</span>
                </div>

                {/* Time Range Buttons */}
                <div className="flex gap-1 bg-black/40 rounded-lg p-1 border border-white/5">
                    {TIME_RANGES.map(option => (
                        <button
                            key={option.value}
                            onClick={() => handleTimeRangeChange(option.value)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${timeRange === option.value
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="h-[350px] relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-lg">
                        <RefreshCw className="animate-spin text-cyan-400" size={24} />
                    </div>
                )}
                {chartData ? (
                    <Line options={options} data={chartData} />
                ) : (
                    <div className="h-full w-full bg-gray-900/50 animate-pulse rounded-xl flex items-center justify-center">
                        <Activity className="text-gray-600 animate-pulse" size={32} />
                    </div>
                )}
            </div>

            {/* Legend explanation */}
            <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-white/5 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-emerald-500 rounded" />
                    <span>Price</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-blue-500 rounded border-dashed" style={{ borderTop: '2px dashed #3B82F6', height: 0 }} />
                    <span>Zenith Score</span>
                </div>
            </div>
        </motion.div>
    );
}
