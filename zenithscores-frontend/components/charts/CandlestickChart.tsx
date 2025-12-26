'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import type { OHLCV, RegimeType } from '@/lib/types/market';

interface CandlestickChartProps {
    data: OHLCV[];
    regime?: RegimeType;
    height?: number;
    showVolume?: boolean;
    className?: string;
}

/**
 * Convert OHLCV to lightweight-charts format
 */
function formatCandleData(data: OHLCV[]): CandlestickData[] {
    return data.map(d => ({
        time: (d.timestamp / 1000) as Time, // Convert ms to seconds
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
    }));
}

/**
 * Get regime-based colors
 */
function getRegimeColors(regime?: RegimeType) {
    switch (regime) {
        case 'trend':
            return { up: '#22c55e', down: '#16a34a', wick: '#15803d' };
        case 'breakout':
            return { up: '#3b82f6', down: '#2563eb', wick: '#1d4ed8' };
        case 'range':
            return { up: '#f59e0b', down: '#d97706', wick: '#b45309' };
        case 'breakdown':
            return { up: '#ef4444', down: '#dc2626', wick: '#b91c1c' };
        default:
            return { up: '#26a69a', down: '#ef5350', wick: '#737373' };
    }
}

export default function CandlestickChart({
    data,
    regime,
    height = 300,
    showVolume = false,
    className = ''
}: CandlestickChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const colors = getRegimeColors(regime);

        // Create chart
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: height,
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: 'rgba(255, 255, 255, 0.2)',
                    labelBackgroundColor: '#0a0a12',
                },
                horzLine: {
                    color: 'rgba(255, 255, 255, 0.2)',
                    labelBackgroundColor: '#0a0a12',
                },
            },
        });

        chartRef.current = chart;

        // Add candlestick series
        const candleSeries = chart.addCandlestickSeries({
            upColor: colors.up,
            downColor: colors.down,
            borderUpColor: colors.up,
            borderDownColor: colors.down,
            wickUpColor: colors.wick,
            wickDownColor: colors.wick,
        });

        candleSeries.setData(formatCandleData(data));
        candleSeriesRef.current = candleSeries;

        // Add volume if enabled
        if (showVolume) {
            const volumeSeries = chart.addHistogramSeries({
                color: 'rgba(59, 130, 246, 0.3)',
                priceFormat: {
                    type: 'volume',
                },
                priceScaleId: '',
            });

            volumeSeries.priceScale().applyOptions({
                scaleMargins: {
                    top: 0.8,
                    bottom: 0,
                },
            });

            const volumeData = data.map(d => ({
                time: (d.timestamp / 1000) as Time,
                value: d.volume,
                color: d.close >= d.open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            }));

            volumeSeries.setData(volumeData);
            volumeSeriesRef.current = volumeSeries;
        }

        // Fit content
        chart.timeScale().fitContent();

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, regime, height, showVolume]);

    return (
        <div
            ref={chartContainerRef}
            className={`w-full ${className}`}
            style={{ minHeight: height }}
        />
    );
}
