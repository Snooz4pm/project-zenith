'use client';

import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PriceChartProps {
    symbol: string;
    currentPrice: number;
    priceHistory: number[];
}

export default function PriceChart({ symbol, currentPrice, priceHistory }: PriceChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Track price history for the chart
    const historyRef = useRef<number[]>(priceHistory.length > 0 ? priceHistory : [currentPrice]);

    useEffect(() => {
        if (currentPrice > 0) {
            historyRef.current = [...historyRef.current.slice(-99), currentPrice];
        }
    }, [currentPrice]);

    // Handle resize
    useEffect(() => {
        const updateDimensions = () => {
            if (canvasRef.current?.parentElement) {
                const { clientWidth, clientHeight } = canvasRef.current.parentElement;
                setDimensions({ width: clientWidth, height: clientHeight });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Draw chart
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || dimensions.width === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = historyRef.current;
        if (data.length < 2) return;

        const { width, height } = dimensions;
        const padding = 20;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Calculate min/max for scaling
        const min = Math.min(...data) * 0.999;
        const max = Math.max(...data) * 1.001;
        const range = max - min || 1;

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Determine if price is up or down
        const isUp = data[data.length - 1] >= data[0];
        const lineColor = isUp ? '#10b981' : '#ef4444';
        const fillColor = isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);

        data.forEach((price, i) => {
            const x = padding + (i / (data.length - 1)) * chartWidth;
            const y = height - padding - ((price - min) / range) * chartHeight;
            ctx.lineTo(x, y);
        });

        ctx.lineTo(width - padding, height - padding);
        ctx.closePath();
        ctx.fill();

        // Draw line
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        data.forEach((price, i) => {
            const x = padding + (i / (data.length - 1)) * chartWidth;
            const y = height - padding - ((price - min) / range) * chartHeight;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw current price dot
        const lastX = width - padding;
        const lastY = height - padding - ((data[data.length - 1] - min) / range) * chartHeight;

        // Glow effect
        ctx.shadowColor = lineColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

    }, [dimensions, currentPrice]);

    const priceChange = historyRef.current.length >= 2
        ? ((historyRef.current[historyRef.current.length - 1] - historyRef.current[0]) / historyRef.current[0]) * 100
        : 0;
    const isUp = priceChange >= 0;

    return (
        <div className="bg-[#111116] border border-white/10 rounded-xl p-4 h-[300px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-zinc-500" />
                    <span className="text-sm text-zinc-500">Price Chart</span>
                </div>
                <div className={`flex items-center gap-1 text-sm ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{isUp ? '+' : ''}{priceChange.toFixed(2)}%</span>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                {historyRef.current.length < 2 && (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                        <span className="text-sm">Collecting price data...</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center mt-2 text-xs text-zinc-600">
                <span>Live</span>
                <span>{symbol}/USD</span>
            </div>
        </div>
    );
}
