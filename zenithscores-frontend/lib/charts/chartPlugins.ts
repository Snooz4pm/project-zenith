/**
 * Custom Chart.js Plugins
 *
 * - NOW Line: Vertical line at right edge
 * - Live Dot: Pulsing dot on latest data point
 */

import { Plugin } from 'chart.js';

/**
 * NOW Line Plugin
 * Draws a vertical emerald line at the right edge with "NOW" label
 */
export const nowLinePlugin: Plugin = {
  id: 'nowLine',
  afterDraw: (chart) => {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;

    if (!chartArea) return;

    // Draw vertical line at right edge
    ctx.save();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)'; // emerald with transparency
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(chartArea.right, chartArea.top);
    ctx.lineTo(chartArea.right, chartArea.bottom);
    ctx.stroke();

    // Draw "NOW" label
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'right';
    ctx.fillText('NOW', chartArea.right - 5, chartArea.top + 12);

    ctx.restore();
  },
};

/**
 * Live Dot Plugin
 * Draws a pulsing emerald dot on the latest data point
 */
export const liveDotPlugin: Plugin = {
  id: 'liveDot',
  afterDatasetsDraw: (chart) => {
    const ctx = chart.ctx;
    const meta = chart.getDatasetMeta(0);

    if (!meta || meta.data.length === 0) return;

    // Get the last data point
    const lastPoint = meta.data[meta.data.length - 1];

    if (!lastPoint) return;

    const x = lastPoint.x;
    const y = lastPoint.y;

    // Animated pulse effect (handled by re-rendering)
    const time = Date.now() / 1000;
    const pulse = 0.5 + Math.sin(time * 2) * 0.2; // 0.3 to 0.7

    ctx.save();

    // Outer glow
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(16, 185, 129, ${pulse * 0.3})`;
    ctx.fill();

    // Inner dot
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(16, 185, 129, ${pulse})`;
    ctx.fill();

    ctx.restore();
  },
};
