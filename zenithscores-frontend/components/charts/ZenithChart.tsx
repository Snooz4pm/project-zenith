'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RegimeType } from '@/lib/types/market';

// ═══════════════════════════════════════════════════════════════════════════════
// ZENITH CHART - 100% Custom Canvas Candlestick Chart
// No external libraries, no TradingView, pure ZenithScores
// ═══════════════════════════════════════════════════════════════════════════════

interface OHLCV {
    time?: number;
    timestamp?: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface ZenithChartProps {
    data: OHLCV[];
    regime?: RegimeType;
    height?: number;
    showVolume?: boolean;
    showEMA?: boolean;
    showGrid?: boolean;
    showCrosshair?: boolean;
    showWatermark?: boolean;
    className?: string;
}

// Color schemes based on regime
const REGIME_COLORS: Record<string, { up: string; down: string; wick: string; bg: string }> = {
    trend: { up: '#22c55e', down: '#16a34a', wick: '#15803d', bg: 'rgba(34, 197, 94, 0.05)' },
    breakout: { up: '#3b82f6', down: '#2563eb', wick: '#1d4ed8', bg: 'rgba(59, 130, 246, 0.05)' },
    range: { up: '#f59e0b', down: '#d97706', wick: '#b45309', bg: 'rgba(245, 158, 11, 0.05)' },
    breakdown: { up: '#ef4444', down: '#dc2626', wick: '#b91c1c', bg: 'rgba(239, 68, 68, 0.05)' },
    chaos: { up: '#8b5cf6', down: '#7c3aed', wick: '#6d28d9', bg: 'rgba(139, 92, 246, 0.05)' },
    default: { up: '#00d4aa', down: '#ff6b6b', wick: '#666', bg: 'transparent' },
};

// Calculate EMA
function calculateEMA(data: OHLCV[], period: number): number[] {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);
    let ema = 0;

    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            ema = data[i].close;
        } else {
            ema = (data[i].close - ema) * multiplier + ema;
        }
        result.push(i >= period - 1 ? ema : NaN);
    }

    return result;
}

// Format price for display
function formatPrice(price: number): string {
    if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(6);
}

// Format volume
function formatVolume(vol: number): string {
    if (vol >= 1e9) return (vol / 1e9).toFixed(1) + 'B';
    if (vol >= 1e6) return (vol / 1e6).toFixed(1) + 'M';
    if (vol >= 1e3) return (vol / 1e3).toFixed(1) + 'K';
    return vol.toFixed(0);
}

export default function ZenithChart({
    data,
    regime,
    height = 400,
    showVolume = true,
    showEMA = true,
    showGrid = true,
    showCrosshair = true,
    showWatermark = true,
    className = '',
}: ZenithChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height });

    // Get colors based on regime
    const regimeKey = regime || 'default';
    const colors = REGIME_COLORS[regimeKey as keyof typeof REGIME_COLORS] || REGIME_COLORS.default;

    // Calculate chart dimensions
    const padding = { top: 20, right: 80, bottom: showVolume ? 80 : 40, left: 10 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const volumeHeight = showVolume ? 60 : 0;
    const chartHeight = dimensions.height - padding.top - padding.bottom - volumeHeight;

    // Main render function
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data || data.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas resolution for retina displays
        const dpr = window.devicePixelRatio || 1;
        canvas.width = dimensions.width * dpr;
        canvas.height = dimensions.height * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);

        // Calculate price range
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        let maxVolume = 0;

        for (const candle of data) {
            minPrice = Math.min(minPrice, candle.low);
            maxPrice = Math.max(maxPrice, candle.high);
            maxVolume = Math.max(maxVolume, candle.volume);
        }

        // Add padding to price range
        const priceRange = maxPrice - minPrice;
        minPrice -= priceRange * 0.05;
        maxPrice += priceRange * 0.05;

        // Calculate scales
        const candleWidth = Math.max(2, (chartWidth / data.length) * 0.8);
        const candleGap = (chartWidth / data.length) * 0.2;

        const priceToY = (price: number) => {
            return padding.top + chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
        };

        const indexToX = (i: number) => {
            return padding.left + (i * (candleWidth + candleGap)) + candleWidth / 2;
        };

        // ─────────────────────────────────────────────────────────────────────
        // Draw Grid
        // ─────────────────────────────────────────────────────────────────────
        if (showGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.lineWidth = 1;

            // Horizontal lines
            const priceSteps = 5;
            for (let i = 0; i <= priceSteps; i++) {
                const price = minPrice + (priceRange / priceSteps) * i;
                const y = priceToY(price);
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(dimensions.width - padding.right, y);
                ctx.stroke();

                // Price labels
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.font = '10px Inter, system-ui, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(formatPrice(price), dimensions.width - padding.right + 5, y + 3);
            }

            // Vertical lines (time)
            const timeSteps = Math.min(6, Math.floor(data.length / 10));
            for (let i = 0; i <= timeSteps; i++) {
                const index = Math.floor((i / timeSteps) * (data.length - 1));
                const x = indexToX(index);
                ctx.beginPath();
                ctx.moveTo(x, padding.top);
                ctx.lineTo(x, padding.top + chartHeight);
                ctx.stroke();
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Draw Candlesticks
        // ─────────────────────────────────────────────────────────────────────
        for (let i = 0; i < data.length; i++) {
            const candle = data[i];
            const x = indexToX(i);
            const isUp = candle.close >= candle.open;

            const openY = priceToY(candle.open);
            const closeY = priceToY(candle.close);
            const highY = priceToY(candle.high);
            const lowY = priceToY(candle.low);

            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(1, Math.abs(closeY - openY));

            // Wick
            ctx.strokeStyle = isUp ? colors.up : colors.down;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, highY);
            ctx.lineTo(x, lowY);
            ctx.stroke();

            // Body
            ctx.fillStyle = isUp ? colors.up : colors.down;
            ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

            // Highlight hovered candle
            if (hoveredCandle === i) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(x - candleWidth / 2 - 2, padding.top, candleWidth + 4, chartHeight);
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Draw EMA Lines
        // ─────────────────────────────────────────────────────────────────────
        if (showEMA && data.length >= 50) {
            const ema20 = calculateEMA(data, 20);
            const ema50 = calculateEMA(data, 50);

            // EMA 20 (cyan)
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            let started = false;
            for (let i = 0; i < ema20.length; i++) {
                if (!isNaN(ema20[i])) {
                    const x = indexToX(i);
                    const y = priceToY(ema20[i]);
                    if (!started) {
                        ctx.moveTo(x, y);
                        started = true;
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            }
            ctx.stroke();

            // EMA 50 (orange)
            ctx.strokeStyle = '#ff6b35';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            started = false;
            for (let i = 0; i < ema50.length; i++) {
                if (!isNaN(ema50[i])) {
                    const x = indexToX(i);
                    const y = priceToY(ema50[i]);
                    if (!started) {
                        ctx.moveTo(x, y);
                        started = true;
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            }
            ctx.stroke();
        }

        // ─────────────────────────────────────────────────────────────────────
        // Draw Volume Bars
        // ─────────────────────────────────────────────────────────────────────
        if (showVolume && maxVolume > 0) {
            const volumeTop = padding.top + chartHeight + 10;

            for (let i = 0; i < data.length; i++) {
                const candle = data[i];
                const x = indexToX(i);
                const isUp = candle.close >= candle.open;
                const barHeight = (candle.volume / maxVolume) * volumeHeight;

                ctx.fillStyle = isUp ? 'rgba(0, 212, 170, 0.3)' : 'rgba(255, 107, 107, 0.3)';
                ctx.fillRect(
                    x - candleWidth / 2,
                    volumeTop + volumeHeight - barHeight,
                    candleWidth,
                    barHeight
                );
            }

            // Volume label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '9px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Vol', dimensions.width - padding.right + 5, volumeTop + 10);
        }

        // ─────────────────────────────────────────────────────────────────────
        // Draw Crosshair
        // ─────────────────────────────────────────────────────────────────────
        if (showCrosshair && mousePos && hoveredCandle !== null) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;

            // Vertical line
            ctx.beginPath();
            ctx.moveTo(mousePos.x, padding.top);
            ctx.lineTo(mousePos.x, padding.top + chartHeight);
            ctx.stroke();

            // Horizontal line
            ctx.beginPath();
            ctx.moveTo(padding.left, mousePos.y);
            ctx.lineTo(dimensions.width - padding.right, mousePos.y);
            ctx.stroke();

            ctx.setLineDash([]);

            // Price label at crosshair
            const price = minPrice + ((padding.top + chartHeight - mousePos.y) / chartHeight) * (maxPrice - minPrice);
            if (price >= minPrice && price <= maxPrice) {
                ctx.fillStyle = '#0a0a12';
                ctx.fillRect(dimensions.width - padding.right, mousePos.y - 10, 75, 20);
                ctx.fillStyle = '#fff';
                ctx.font = '10px Inter, system-ui, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(formatPrice(price), dimensions.width - padding.right + 5, mousePos.y + 3);
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Draw Watermark
        // ─────────────────────────────────────────────────────────────────────
        if (showWatermark) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.font = 'bold 24px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ZENITHSCORES', dimensions.width / 2, dimensions.height / 2);
        }

        // ─────────────────────────────────────────────────────────────────────
        // Draw Tooltip
        // ─────────────────────────────────────────────────────────────────────
        if (hoveredCandle !== null && data[hoveredCandle]) {
            const candle = data[hoveredCandle];
            const x = indexToX(hoveredCandle);
            const tooltipWidth = 130;
            const tooltipHeight = 90;
            let tooltipX = x + 15;
            let tooltipY = padding.top + 10;

            // Keep tooltip in bounds
            if (tooltipX + tooltipWidth > dimensions.width - padding.right) {
                tooltipX = x - tooltipWidth - 15;
            }

            // Background
            ctx.fillStyle = 'rgba(10, 10, 18, 0.95)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
            ctx.fill();
            ctx.stroke();

            // Content
            ctx.fillStyle = '#fff';
            ctx.font = '11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';

            const isUp = candle.close >= candle.open;
            const changePercent = ((candle.close - candle.open) / candle.open * 100).toFixed(2);

            ctx.fillText(`O: ${formatPrice(candle.open)}`, tooltipX + 10, tooltipY + 20);
            ctx.fillText(`H: ${formatPrice(candle.high)}`, tooltipX + 10, tooltipY + 35);
            ctx.fillText(`L: ${formatPrice(candle.low)}`, tooltipX + 10, tooltipY + 50);
            ctx.fillText(`C: ${formatPrice(candle.close)}`, tooltipX + 10, tooltipY + 65);

            ctx.fillStyle = isUp ? '#00d4aa' : '#ff6b6b';
            ctx.fillText(`${isUp ? '+' : ''}${changePercent}%`, tooltipX + 10, tooltipY + 80);
        }

    }, [data, dimensions, colors, hoveredCandle, mousePos, showVolume, showEMA, showGrid, showCrosshair, showWatermark, chartHeight, chartWidth, padding]);

    // Handle mouse move
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setMousePos({ x, y });

        // Find hovered candle
        const candleWidth = chartWidth / data.length;
        const index = Math.floor((x - padding.left) / candleWidth);

        if (index >= 0 && index < data.length) {
            setHoveredCandle(index);
        } else {
            setHoveredCandle(null);
        }
    }, [data.length, chartWidth, padding.left]);

    const handleMouseLeave = useCallback(() => {
        setMousePos(null);
        setHoveredCandle(null);
    }, []);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: height,
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [height]);

    // Render on data/dimension change
    useEffect(() => {
        render();
    }, [render]);

    return (
        <div
            ref={containerRef}
            className={`relative w-full ${className}`}
            style={{ height }}
        >
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            />

            {/* EMA Legend */}
            {showEMA && data.length >= 50 && (
                <div className="absolute top-2 left-2 flex items-center gap-3 text-[10px]">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-0.5 bg-[#00d4ff]" />
                        <span className="text-gray-400">EMA 20</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-0.5 bg-[#ff6b35]" />
                        <span className="text-gray-400">EMA 50</span>
                    </div>
                </div>
            )}
        </div>
    );
}
