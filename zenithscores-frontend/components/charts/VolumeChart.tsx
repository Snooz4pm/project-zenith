'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, Time } from 'lightweight-charts';
import type { OHLCV } from '@/lib/types/market';

interface VolumeChartProps {
    data: OHLCV[];
    height?: number;
    className?: string;
}

export default function VolumeChart({
    data,
    height = 100,
    className = ''
}: VolumeChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;

        // Calculate average volume
        const avgVolume = data.reduce((sum, d) => sum + d.volume, 0) / data.length;

        // Create chart
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#6b7280',
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: height,
            timeScale: {
                visible: false,
            },
            rightPriceScale: {
                visible: false,
            },
            leftPriceScale: {
                visible: false,
            },
            crosshair: {
                mode: 0,
            },
            handleScroll: false,
            handleScale: false,
        });

        chartRef.current = chart;

        // Add histogram series
        const histogramSeries = chart.addHistogramSeries({
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
        });

        // Color bars based on price action and volume vs average
        const volumeData = data.map(d => {
            const isUp = d.close >= d.open;
            const isHighVolume = d.volume > avgVolume * 1.5;

            let color: string;
            if (isHighVolume) {
                color = isUp ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)';
            } else {
                color = isUp ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
            }

            return {
                time: (d.timestamp / 1000) as Time,
                value: d.volume,
                color,
            };
        });

        histogramSeries.setData(volumeData);
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
    }, [data, height]);

    return (
        <div
            ref={chartContainerRef}
            className={`w-full ${className}`}
            style={{ minHeight: height }}
        />
    );
}
