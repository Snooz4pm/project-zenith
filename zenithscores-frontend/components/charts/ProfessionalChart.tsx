'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Plugin,
} from 'chart.js';
import { OHLCPoint, ChartMode, DataFreshness } from '@/lib/charts/types';
import { calculatePriceBounds } from '@/lib/charts/slidingWindow';
import { shouldDimChart } from '@/lib/charts/dataFreshness';
import DataStatusBadge from './DataStatusBadge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip
);

// NOW Line Plugin
const nowLinePlugin: Plugin = {
  id: 'nowLine',
  afterDraw: (chart) => {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    if (!chartArea) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(chartArea.right, chartArea.top);
    ctx.lineTo(chartArea.right, chartArea.bottom);
    ctx.stroke();

    ctx.font = '10px monospace';
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'right';
    ctx.fillText('NOW', chartArea.right - 5, chartArea.top + 12);
    ctx.restore();
  },
};

// Live Dot Plugin
const liveDotPlugin: Plugin = {
  id: 'liveDot',
  afterDatasetsDraw: (chart) => {
    const ctx = chart.ctx;
    const meta = chart.getDatasetMeta(0);
    if (!meta || meta.data.length === 0) return;

    const lastPoint = meta.data[meta.data.length - 1];
    if (!lastPoint) return;

    const x = lastPoint.x;
    const y = lastPoint.y;
    const time = Date.now() / 1000;
    const pulse = 0.5 + Math.sin(time * 2) * 0.3;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(16, 185, 129, ${pulse * 0.2})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(16, 185, 129, ${pulse})`;
    ctx.fill();
    ctx.restore();
  },
};

ChartJS.register(nowLinePlugin, liveDotPlugin);

interface ProfessionalChartProps {
  symbol: string;
  data: OHLCPoint[];
  mode: ChartMode;
  freshness: DataFreshness;
  onModeChange: (mode: ChartMode) => void;
}

export default function ProfessionalChart({
  symbol,
  data,
  mode,
  freshness,
  onModeChange,
}: ProfessionalChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const animationRef = useRef<number>();
  const isDimmed = shouldDimChart(freshness.status);
  const bounds = calculatePriceBounds(data);

  // Prepare chart data based on mode
  const chartData = {
    labels: data.map((d) => {
      const date = new Date(d.timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }),
    datasets: [
      {
        data: data.map((d) => d.close),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderWidth: mode === 'line' ? 2 : 1,
        tension: mode === 'line' ? 0.3 : 0,
        pointRadius: 0,
        pointHoverRadius: mode === 'line' ? 4 : 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 400,
      easing: 'easeOutCubic' as const,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        titleColor: '#10b981',
        bodyColor: '#ffffff',
        borderColor: '#10b981',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            const point = data[index];
            return new Date(point.timestamp).toLocaleString();
          },
          label: (context: any) => {
            const index = context.dataIndex;
            const point = data[index];

            const formatPrice = (price: number) => {
              if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              if (price >= 1) return `$${price.toFixed(2)}`;
              if (price >= 0.01) return `$${price.toFixed(4)}`;
              return `$${price.toFixed(8)}`;
            };

            if (mode === 'candlestick') {
              return [
                `Open:  ${formatPrice(point.open)}`,
                `High:  ${formatPrice(point.high)}`,
                `Low:   ${formatPrice(point.low)}`,
                `Close: ${formatPrice(point.close)}`,
              ];
            } else {
              return `Price: ${formatPrice(point.close)}`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.03)',
        },
        ticks: {
          color: '#6b7280',
          font: { size: 10, family: 'monospace' },
          maxRotation: 0,
        },
      },
      y: {
        display: true,
        position: 'right' as const,
        min: bounds.min,
        max: bounds.max,
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.03)',
        },
        ticks: {
          color: '#6b7280',
          font: { size: 10, family: 'monospace' },
          callback: (value: any) => {
            const num = parseFloat(value);
            if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
            if (num >= 1) return `$${num.toFixed(2)}`;
            if (num >= 0.01) return `$${num.toFixed(4)}`;
            return `$${num.toFixed(6)}`;
          },
        },
      },
    },
  };

  // Animate live dot pulse (only when live)
  useEffect(() => {
    if (freshness.status !== 'live') return;

    const animate = () => {
      if (chartRef.current) {
        chartRef.current.update('none');
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [freshness.status]);

  return (
    <div className="h-full bg-black border border-white/[0.06] rounded-lg p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white">{symbol}</h3>
          <p className="text-xs text-zinc-500">Live Chart</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <div className="flex bg-zinc-900/50 rounded p-0.5 gap-0.5">
            <button
              onClick={() => onModeChange('line')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                mode === 'line'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                  : 'text-zinc-500 hover:text-zinc-400'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => onModeChange('candlestick')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                mode === 'candlestick'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                  : 'text-zinc-500 hover:text-zinc-400'
              }`}
            >
              Candles
            </button>
          </div>

          {/* Status Badge */}
          <DataStatusBadge freshness={freshness} />
        </div>
      </div>

      {/* Chart */}
      <motion.div
        className="flex-1 min-h-0 relative"
        animate={{ opacity: isDimmed ? 0.5 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {data.length > 0 ? (
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
            No data available
          </div>
        )}
      </motion.div>
    </div>
  );
}
