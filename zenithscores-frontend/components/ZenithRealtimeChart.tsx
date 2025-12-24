'use client';

import { createChart, ColorType, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface ChartProps {
    data: { time: Time; value: number }[];
    colors?: {
        backgroundColor?: string;
        lineColor?: string;
        textColor?: string;
        areaTopColor?: string;
        areaBottomColor?: string;
    };
    height?: number;
    showScoreOverlay?: boolean; // Reserve for future score integration
}

export interface ChartRef {
    update: (data: { time: Time; value: number }) => void;
    setData: (data: { time: Time; value: number }[]) => void;
}

const ZenithRealtimeChart = forwardRef<ChartRef, ChartProps>((props, ref) => {
    const {
        data,
        colors: {
            backgroundColor = 'transparent',
            lineColor = '#2563EB', // The specific blue from user request
            textColor = '#9CA3AF',
            areaTopColor = 'rgba(37, 99, 235, 0.28)', // Gradient start
            areaBottomColor = 'rgba(37, 99, 235, 0.0)', // Gradient end
        } = {},
        height = 400,
    } = props;

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
    const dataRef = useRef<{ time: Time; value: number }[]>(data); // Track data internally

    useImperativeHandle(ref, () => ({
        update: (newData) => {
            if (seriesRef.current) {
                seriesRef.current.update(newData);
            }
        },
        setData: (newData) => {
            if (seriesRef.current) {
                seriesRef.current.setData(newData);
                dataRef.current = newData; // Track data internally
                chartRef.current?.timeScale().fitContent();
            }
        }
    }));

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            chartRef.current?.applyOptions({ width: chartContainerRef.current!.clientWidth });
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor,
            },
            width: chartContainerRef.current.clientWidth,
            height,
            grid: {
                vertLines: { color: 'rgba(42, 46, 57, 0)' }, // Hide grid for clean look
                horzLines: { color: 'rgba(42, 46, 57, 0.1)' },
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.1)',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.1)',
                scaleMargins: {
                    top: 0.2, // Leave space at top
                    bottom: 0.1,
                },
            },
            crosshair: {
                vertLine: {
                    color: '#6B7280',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#6B7280',
                },
                horzLine: {
                    color: '#6B7280',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#6B7280',
                },
            },
        });

        chartRef.current = chart;

        const newSeries = chart.addAreaSeries({
            lineColor,
            topColor: areaTopColor,
            bottomColor: areaBottomColor,
            lineWidth: 2,
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01,
            },
        });

        newSeries.setData(data);
        seriesRef.current = newSeries;
        chart.timeScale().fitContent();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor, height]);

    // Handle data changes from prop if re-supplied fully
    useEffect(() => {
        if (seriesRef.current && data.length > 0) {
            // Only reset if completely different data set to avoid jitter on small updates
            // Use dataRef.current instead of the non-existent .data() method in lightweight-charts v4.2+
            const currentData = dataRef.current;
            if (currentData.length === 0 || data[0].time !== currentData[0]?.time) {
                seriesRef.current.setData(data);
                dataRef.current = data; // Update tracked data
                chartRef.current?.timeScale().fitContent();
            }
        }
    }, [data]);

    return (
        <div
            ref={chartContainerRef}
            className="w-full relative"
            style={{ height: `${height}px` }}
        />
    );
});

ZenithRealtimeChart.displayName = 'ZenithRealtimeChart';

export default ZenithRealtimeChart;
