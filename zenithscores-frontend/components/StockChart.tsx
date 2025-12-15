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

export default function StockChart({ symbol, currentPrice, currentScore }: StockChartProps) {
    const [chartData, setChartData] = useState<any>(null);

    useEffect(() => {
        // Generate mock historical data
        const labels = [];
        const priceData = [];
        const scoreData = [];

        let price = currentPrice * 0.9;
        // Start score relative to current but with some variance
        let score = Math.max(0, Math.min(100, currentScore + (Math.random() * 20 - 10)));

        const days = 30;
        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

            // Random walk for price
            const volatility = price * 0.02;
            price = price + (Math.random() * volatility * 2 - volatility);

            // Correlate score slightly with price moves for visual "proof"
            // If price goes up, score likely went up previously or stays high
            const scoreChange = (Math.random() * 10 - 5) + (price > priceData[priceData.length - 1] ? 2 : -2);
            score = Math.max(20, Math.min(99, score + scoreChange));

            priceData.push(price);
            scoreData.push(score);
        }

        // Force last point to match current
        priceData[priceData.length - 1] = currentPrice;
        scoreData[scoreData.length - 1] = currentScore;

        setChartData({
            labels,
            datasets: [
                {
                    label: 'Price ($)',
                    data: priceData,
                    borderColor: '#10B981', // Emerald 500
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    yAxisID: 'y',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                },
                {
                    label: 'Zenith Score',
                    data: scoreData,
                    borderColor: '#3B82F6', // Blue 500
                    backgroundColor: 'rgba(59, 130, 246, 0.0)',
                    yAxisID: 'y1',
                    tension: 0.4,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    pointHoverRadius: 4,
                },
            ],
        });
    }, [currentPrice, currentScore]);

    if (!chartData) return <div className="h-64 w-full bg-gray-900/50 animate-pulse rounded-xl" />;

    const options = {
        responsive: true,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#9ca3af', // gray-400
                    font: {
                        family: 'monospace'
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#6b7280'
                }
            },
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
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
    };

    return (
        <div className="w-full h-[400px] bg-gray-900/30 border border-gray-800 rounded-xl p-4">
            <Line options={options} data={chartData} />
        </div>
    );
}
